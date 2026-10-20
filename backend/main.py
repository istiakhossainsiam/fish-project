from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta
import csv
import io
import requests

from fastapi.staticfiles import StaticFiles
import os

from database import engine, Base, get_db
import models
from seed import seed_database

# Ensure tables and seed exist
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="Shah Amanat Fishery and Agro Project - Management System",
    description="Cloud-based Fisheries Management Software for Shah Amanat Airport, Chittagong. Features: Growth Tracking, Feed Batches #202 & #204, Vaat Readiness, FCR, Financials & Live Coastal Weather",
    version="1.0.0"
)

# Enable CORS for local Vite dev and any cloud host
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= AUTHENTICATION =================

@app.post("/api/auth/login")
def login(payload: dict, db: Session = Depends(get_db)):
    """Support login via username + 4-digit PIN or password"""
    pin = payload.get("pin")
    username = payload.get("username")
    password = payload.get("password")

    user = None
    if username and pin:
        user = db.query(models.User).filter(
            models.User.username == username.strip().lower(),
            models.User.pin == str(pin).strip()
        ).first()
    elif pin and not username:
        user = db.query(models.User).filter(models.User.pin == str(pin).strip()).first()
    elif username and password:
        user = db.query(models.User).filter(
            models.User.username == username.strip().lower(),
            models.User.password == password
        ).first()

    if not user:
        raise HTTPException(status_code=401, detail="ভুল ইউজারনেম অথবা পিন (Invalid credentials)")

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "token": f"token-{user.id}-{user.role}"
    }

@app.get("/api/auth/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.id.asc()).all()
    return [{"id": u.id, "username": u.username, "full_name": u.full_name, "role": u.role, "pin": u.pin} for u in users]

@app.post("/api/auth/users")
def create_user(payload: dict, db: Session = Depends(get_db)):
    username = payload.get("username", "").strip().lower()
    full_name = payload.get("full_name", "").strip()
    role = payload.get("role", "worker")
    pin = payload.get("pin", "1234").strip()
    password = payload.get("password", "farm123").strip()

    if not username or not full_name:
        raise HTTPException(status_code=400, detail="Username এবং পূর্ণ নাম আবশ্যক")

    existing = db.query(models.User).filter(models.User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে। নতুন ইউজারনেম দিন।")

    user = models.User(
        username=username,
        full_name=full_name,
        role=role,
        pin=pin,
        password=password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "full_name": user.full_name, "role": user.role, "pin": user.pin}

@app.put("/api/auth/users/{user_id}")
def update_user(user_id: int, payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "full_name" in payload and payload["full_name"]:
        user.full_name = payload["full_name"].strip()
    if "role" in payload and payload["role"]:
        user.role = payload["role"]
    if "pin" in payload and payload["pin"]:
        user.pin = payload["pin"].strip()
    if "password" in payload and payload["password"]:
        user.password = payload["password"].strip()

    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "full_name": user.full_name, "role": user.role, "pin": user.pin}

@app.delete("/api/auth/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.username == "superadmin":
        raise HTTPException(status_code=400, detail="ডিফল্ট সুপারএডমিন মুছে ফেলা সম্ভব নয়")

    db.delete(user)
    db.commit()
    return {"status": "success", "message": "ইউজার সফলভাবে মুছে ফেলা হয়েছে"}


# ================= DASHBOARD & OVERVIEW =================

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    ponds = db.query(models.Pond).all()
    stockings = db.query(models.StockingEvent).all()
    feed_inventory = db.query(models.FeedInventory).all()
    feedings = db.query(models.DailyFeeding).all()
    expenses = db.query(models.Expense).all()
    harvests = db.query(models.HarvestSale).all()
    samplings = db.query(models.GrowthSampling).all()
    vaat_records = db.query(models.VaatSupply).all()

    total_ponds = len(ponds)
    active_ponds = sum(1 for p in ponds if p.status == "active")
    total_acres = sum(p.size_acres for p in ponds)

    # Total fish count
    total_fish_count = sum(s.count_pcs for s in stockings)
    total_initial_biomass_kg = sum(s.initial_weight_kg for s in stockings)

    # Feed calculations
    total_feed_bags_received = sum(b.bag_count for b in feed_inventory)
    total_feed_bags_consumed = sum(f.commercial_feed_bags for f in feedings)
    remaining_feed_bags = max(0, total_feed_bags_received - total_feed_bags_consumed)
    total_feed_kg_consumed = sum(f.commercial_feed_kg for f in feedings)
    total_vaat_kg_consumed = sum(f.vaat_kg for f in feedings)

    # Total cooked vaat produced
    total_vaat_kg_prepared = sum(v.total_cooked_vaat_kg for v in vaat_records)

    # Financials
    total_feed_purchase_cost = sum(b.total_cost for b in feed_inventory)
    total_pona_purchase_cost = sum(s.cost_bdt for s in stockings)
    total_vaat_cost = sum((v.rice_cost_bdt + v.cooking_fuel_cost_bdt) for v in vaat_records)
    other_expenses = sum(e.amount_bdt for e in expenses)
    total_investment_bdt = total_feed_purchase_cost + total_pona_purchase_cost + total_vaat_cost + other_expenses

    total_harvest_revenue = sum(h.total_income_bdt for h in harvests)
    total_harvest_kg = sum(h.total_weight_kg for h in harvests)

    # Estimated current biomass
    # Look at latest samplings or estimate based on stocking + days
    latest_samplings = {}
    for sm in samplings:
        latest_samplings[sm.pond_id] = sm.estimated_biomass_kg

    current_estimated_biomass_kg = sum(latest_samplings.values())
    if current_estimated_biomass_kg == 0:
        # fallback approximation
        current_estimated_biomass_kg = total_initial_biomass_kg + (total_feed_kg_consumed * 0.7)

    # Projected revenue at harvest (average 150 BDT / kg for Pangash, 250 BDT for Carp)
    # Target harvest size: ~1.2kg per Pangash, ~1.0kg Carp with 92% survival
    projected_harvest_biomass_kg = sum(
        (s.count_pcs * 0.92) * (1.2 if "Pangash" in s.fish_type else 1.0)
        for s in stockings
    )
    projected_harvest_revenue_bdt = sum(
        (s.count_pcs * 0.92) * (1.2 if "Pangash" in s.fish_type else 1.0) * (155.0 if "Pangash" in s.fish_type else 260.0)
        for s in stockings
    )
    projected_net_profit_bdt = projected_harvest_revenue_bdt - total_investment_bdt

    # Growth Check Reminders (Every 15-18 days)
    # Check each active pond's latest sampling date or stocking date
    sampling_alerts = []
    today = datetime.now().date()
    for pond in ponds:
        if pond.status == "active":
            pond_samplings = [s for s in samplings if s.pond_id == pond.id]
            pond_stockings = [s for s in stockings if s.pond_id == pond.id]
            
            ref_date = None
            if pond_samplings:
                last_sample = max(pond_samplings, key=lambda x: x.date)
                ref_date = datetime.strptime(last_sample.date, "%Y-%m-%d").date()
                label = f"Last growth check on {last_sample.date}"
            elif pond_stockings:
                first_stock = min(pond_stockings, key=lambda x: x.date)
                ref_date = datetime.strptime(first_stock.date, "%Y-%m-%d").date()
                label = f"Stocked on {first_stock.date}"
            
            if ref_date:
                days_elapsed = (today - ref_date).days
                next_due = ref_date + timedelta(days=16)
                days_remaining = (next_due - today).days
                is_overdue = days_remaining < 0
                is_due_soon = 0 <= days_remaining <= 3

                sampling_alerts.append({
                    "pond_id": pond.id,
                    "pond_name": pond.name,
                    "ref_date": str(ref_date),
                    "days_elapsed": days_elapsed,
                    "next_due_date": str(next_due),
                    "days_remaining": days_remaining,
                    "is_overdue": is_overdue,
                    "is_due_soon": is_due_soon,
                    "status_text": "Overdue for Growth Check (জরুরি ওজন মাপুন!)" if is_overdue else (
                        f"Growth Check Due in {days_remaining} days" if is_due_soon else f"Next check in {days_remaining} days"
                    )
                })

    return {
        "project_overview": {
            "total_ponds": total_ponds,
            "active_ponds": active_ponds,
            "total_acres": total_acres,
            "total_fish_count": total_fish_count,
            "current_estimated_biomass_kg": round(current_estimated_biomass_kg, 1),
            "projected_harvest_biomass_kg": round(projected_harvest_biomass_kg, 1),
        },
        "feed_summary": {
            "total_feed_bags_received": total_feed_bags_received,
            "total_feed_bags_consumed": round(total_feed_bags_consumed, 1),
            "remaining_feed_bags": round(remaining_feed_bags, 1),
            "total_feed_kg_consumed": round(total_feed_kg_consumed, 1),
            "total_vaat_kg_consumed": round(total_vaat_kg_consumed, 1),
            "total_vaat_kg_prepared": round(total_vaat_kg_prepared, 1),
            "feed_stock_warning": remaining_feed_bags < 40
        },
        "financial_summary": {
            "total_investment_bdt": round(total_investment_bdt, 2),
            "feed_cost_bdt": round(total_feed_purchase_cost, 2),
            "pona_cost_bdt": round(total_pona_purchase_cost, 2),
            "vaat_cost_bdt": round(total_vaat_cost, 2),
            "other_expenses_bdt": round(other_expenses, 2),
            "actual_sales_income_bdt": round(total_harvest_revenue, 2),
            "projected_harvest_revenue_bdt": round(projected_harvest_revenue_bdt, 2),
            "projected_net_profit_bdt": round(projected_net_profit_bdt, 2),
            "estimated_roi_pct": round((projected_net_profit_bdt / max(1, total_investment_bdt)) * 100, 1)
        },
        "sampling_alerts": sampling_alerts
    }


# ================= PONDS =================

@app.get("/api/ponds")
def get_ponds(db: Session = Depends(get_db)):
    ponds = db.query(models.Pond).all()
    results = []
    for p in ponds:
        stockings = db.query(models.StockingEvent).filter(models.StockingEvent.pond_id == p.id).all()
        feedings = db.query(models.DailyFeeding).filter(models.DailyFeeding.pond_id == p.id).all()
        samplings = db.query(models.GrowthSampling).filter(models.GrowthSampling.pond_id == p.id).order_by(desc(models.GrowthSampling.date)).all()
        
        total_fish = sum(s.count_pcs for s in stockings)
        feed_bags_used = sum(f.commercial_feed_bags for f in feedings)
        vaat_kg_used = sum(f.vaat_kg for f in feedings)
        
        latest_sampling = samplings[0] if samplings else None

        results.append({
            "id": p.id,
            "name": p.name,
            "size_acres": p.size_acres,
            "depth_feet": p.depth_feet,
            "status": p.status,
            "notes": p.notes,
            "total_fish": total_fish,
            "feed_bags_used": round(feed_bags_used, 1),
            "vaat_kg_used": round(vaat_kg_used, 1),
            "stockings": [
                {
                    "id": s.id,
                    "date": s.date,
                    "fish_type": s.fish_type,
                    "count_pcs": s.count_pcs,
                    "pcs_per_kg": s.pcs_per_kg,
                    "initial_weight_kg": s.initial_weight_kg,
                    "cost_bdt": s.cost_bdt,
                    "notes": s.notes
                } for s in stockings
            ],
            "latest_sampling": {
                "date": latest_sampling.date,
                "calculated_pcs_per_kg": latest_sampling.calculated_pcs_per_kg,
                "avg_weight_grams": latest_sampling.avg_weight_grams,
                "estimated_biomass_kg": latest_sampling.estimated_biomass_kg,
                "fcr": latest_sampling.calculated_fcr,
                "next_check_date": latest_sampling.next_check_date
            } if latest_sampling else None
        })
    return results

@app.post("/api/ponds")
def create_pond(payload: dict, db: Session = Depends(get_db)):
    pond = models.Pond(
        name=payload["name"],
        size_acres=payload.get("size_acres", 5.0),
        depth_feet=payload.get("depth_feet", 6.0),
        status=payload.get("status", "active"),
        notes=payload.get("notes", "")
    )
    db.add(pond)
    db.commit()
    db.refresh(pond)
    return pond

@app.put("/api/ponds/{pond_id}")
def update_pond(pond_id: int, payload: dict, db: Session = Depends(get_db)):
    pond = db.query(models.Pond).filter(models.Pond.id == pond_id).first()
    if not pond:
        raise HTTPException(status_code=404, detail="Pond not found")
    
    pond.name = payload.get("name", pond.name)
    pond.size_acres = payload.get("size_acres", pond.size_acres)
    pond.depth_feet = payload.get("depth_feet", pond.depth_feet)
    pond.status = payload.get("status", pond.status)
    pond.notes = payload.get("notes", pond.notes)
    
    db.commit()
    return pond


# ================= STOCKING EVENTS =================

@app.get("/api/stocking")
def get_stocking_events(db: Session = Depends(get_db)):
    events = db.query(models.StockingEvent).order_by(desc(models.StockingEvent.date)).all()
    results = []
    for e in events:
        pond = db.query(models.Pond).filter(models.Pond.id == e.pond_id).first()
        results.append({
            "id": e.id,
            "pond_id": e.pond_id,
            "pond_name": pond.name if pond else "Unknown",
            "date": e.date,
            "fish_type": e.fish_type,
            "count_pcs": e.count_pcs,
            "pcs_per_kg": e.pcs_per_kg,
            "initial_weight_kg": e.initial_weight_kg,
            "cost_bdt": e.cost_bdt,
            "supplier": e.supplier,
            "notes": e.notes
        })
    return results

@app.post("/api/stocking")
def add_stocking_event(payload: dict, db: Session = Depends(get_db)):
    count = int(payload["count_pcs"])
    pcs_per_kg = float(payload.get("pcs_per_kg") or 1.0)
    initial_weight = round(count / pcs_per_kg, 2) if pcs_per_kg > 0 else 0.0

    event = models.StockingEvent(
        pond_id=payload["pond_id"],
        date=payload["date"],
        fish_type=payload["fish_type"],
        count_pcs=count,
        pcs_per_kg=pcs_per_kg,
        initial_weight_kg=initial_weight,
        cost_bdt=float(payload.get("cost_bdt", 0.0)),
        supplier=payload.get("supplier"),
        notes=payload.get("notes")
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@app.put("/api/stocking/{event_id}")
def update_stocking_event(event_id: int, payload: dict, db: Session = Depends(get_db)):
    event = db.query(models.StockingEvent).filter(models.StockingEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Stocking event not found")
    
    if "pond_id" in payload:
        event.pond_id = int(payload["pond_id"])
    if "date" in payload:
        event.date = payload["date"]
    if "fish_type" in payload:
        event.fish_type = payload["fish_type"]
    if "count_pcs" in payload:
        event.count_pcs = int(payload["count_pcs"])
    if "pcs_per_kg" in payload:
        event.pcs_per_kg = float(payload["pcs_per_kg"])
    if "initial_weight_kg" in payload:
        event.initial_weight_kg = float(payload["initial_weight_kg"])
    elif event.pcs_per_kg and event.pcs_per_kg > 0:
        event.initial_weight_kg = round(event.count_pcs / event.pcs_per_kg, 2)
    if "cost_bdt" in payload:
        event.cost_bdt = float(payload["cost_bdt"])
    if "supplier" in payload:
        event.supplier = payload["supplier"]
    if "notes" in payload:
        event.notes = payload["notes"]
        
    db.commit()
    db.refresh(event)
    return event

@app.delete("/api/stocking/{event_id}")
def delete_stocking_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.StockingEvent).filter(models.StockingEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Stocking event not found")
    db.delete(event)
    db.commit()
    return {"status": "success", "message": "Stocking record deleted successfully"}


# ================= FEED & FOOD STOCK MANAGEMENT =================

@app.get("/api/feed/inventory")
def get_feed_inventory(db: Session = Depends(get_db)):
    batches = db.query(models.FeedInventory).order_by(desc(models.FeedInventory.date)).all()
    total_bags = sum(b.bag_count for b in batches)
    total_spent = sum(b.total_cost for b in batches)
    avg_price = total_spent / max(1, total_bags)
    total_consumed = db.query(func.sum(models.DailyFeeding.commercial_feed_bags)).scalar() or 0.0
    remaining_bags = max(0.0, total_bags - total_consumed)
    return {
        "batches": batches,
        "total_bags_received": total_bags,
        "total_feed_spent_bdt": round(total_spent, 2),
        "avg_cost_per_bag": round(avg_price, 2),
        "total_bags_consumed": round(total_consumed, 1),
        "remaining_bags": round(remaining_bags, 1)
    }

@app.post("/api/feed/inventory")
def add_feed_batch(payload: dict, db: Session = Depends(get_db)):
    bag_count = int(payload["bag_count"])
    rate_per_bag = float(payload["rate_per_bag"])
    total_cost = float(payload.get("total_cost") or (bag_count * rate_per_bag))

    batch = models.FeedInventory(
        date=payload["date"],
        brand_name=payload["brand_name"],
        feed_type=payload.get("feed_type", "Floating Pellet"),
        bag_count=bag_count,
        bag_weight_kg=float(payload.get("bag_weight_kg", 25.0)),
        rate_per_bag=rate_per_bag,
        total_cost=total_cost,
        supplier=payload.get("supplier"),
        invoice_no=payload.get("invoice_no"),
        notes=payload.get("notes")
    )
    db.add(batch)
    
    # Also log as feed expense automatically
    expense = models.Expense(
        date=payload["date"],
        category="Feed Purchase",
        amount_bdt=total_cost,
        description=f"Feed purchase: {bag_count} bags {payload['brand_name']} @ {rate_per_bag} BDT",
        voucher_no=payload.get("invoice_no") or "FEED-AUTO",
        recorded_by="manager"
    )
    db.add(expense)

    db.commit()
    db.refresh(batch)
    return batch

@app.put("/api/feed/inventory/{batch_id}")
def update_feed_batch(batch_id: int, payload: dict, db: Session = Depends(get_db)):
    batch = db.query(models.FeedInventory).filter(models.FeedInventory.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Feed batch not found")
    
    if "date" in payload:
        batch.date = payload["date"]
    if "brand_name" in payload:
        batch.brand_name = payload["brand_name"]
    if "feed_type" in payload:
        batch.feed_type = payload["feed_type"]
    if "bag_count" in payload:
        batch.bag_count = int(payload["bag_count"])
    if "bag_weight_kg" in payload:
        batch.bag_weight_kg = float(payload["bag_weight_kg"])
    if "rate_per_bag" in payload:
        batch.rate_per_bag = float(payload["rate_per_bag"])
    batch.total_cost = float(payload.get("total_cost") or (batch.bag_count * batch.rate_per_bag))
    if "supplier" in payload:
        batch.supplier = payload["supplier"]
    if "invoice_no" in payload:
        batch.invoice_no = payload["invoice_no"]
    if "notes" in payload:
        batch.notes = payload["notes"]
        
    db.commit()
    db.refresh(batch)
    return batch

@app.delete("/api/feed/inventory/{batch_id}")
def delete_feed_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(models.FeedInventory).filter(models.FeedInventory.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Feed batch not found")
    db.delete(batch)
    db.commit()
    return {"status": "success", "message": "Feed batch deleted successfully"}

@app.get("/api/feed/daily")
def get_daily_feedings(pond_id: Optional[int] = None, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.DailyFeeding)
    if pond_id:
        query = query.filter(models.DailyFeeding.pond_id == pond_id)
    feedings = query.order_by(desc(models.DailyFeeding.date)).limit(limit).all()
    
    results = []
    for f in feedings:
        pond = db.query(models.Pond).filter(models.Pond.id == f.pond_id).first()
        results.append({
            "id": f.id,
            "date": f.date,
            "pond_id": f.pond_id,
            "pond_name": pond.name if pond else "Unknown",
            "commercial_feed_bags": f.commercial_feed_bags,
            "commercial_feed_kg": f.commercial_feed_kg,
            "vaat_kg": f.vaat_kg,
            "feeding_time": f.feeding_time,
            "weather_condition": f.weather_condition,
            "logged_by": f.logged_by,
            "notes": f.notes
        })
    return results

@app.post("/api/feed/daily")
def record_daily_feeding(payload: dict, db: Session = Depends(get_db)):
    bags = float(payload.get("commercial_feed_bags") or 0.0)
    kg = float(payload.get("commercial_feed_kg") or (bags * 25.0))
    vaat = float(payload.get("vaat_kg") or 0.0)

    feeding = models.DailyFeeding(
        date=payload.get("date") or datetime.now().strftime("%Y-%m-%d"),
        pond_id=int(payload["pond_id"]),
        commercial_feed_bags=bags,
        commercial_feed_kg=kg,
        vaat_kg=vaat,
        feeding_time=payload.get("feeding_time", "Morning"),
        weather_condition=payload.get("weather_condition", "Normal"),
        logged_by=payload.get("logged_by", "worker"),
        notes=payload.get("notes", "")
    )
    db.add(feeding)
    db.commit()
    db.refresh(feeding)
    return feeding

@app.put("/api/feed/daily/{feeding_id}")
def update_daily_feeding(feeding_id: int, payload: dict, db: Session = Depends(get_db)):
    feeding = db.query(models.DailyFeeding).filter(models.DailyFeeding.id == feeding_id).first()
    if not feeding:
        raise HTTPException(status_code=404, detail="Feeding record not found")
    
    if "date" in payload:
        feeding.date = payload["date"]
    if "pond_id" in payload:
        feeding.pond_id = int(payload["pond_id"])
    if "commercial_feed_bags" in payload:
        feeding.commercial_feed_bags = float(payload["commercial_feed_bags"])
        feeding.commercial_feed_kg = float(payload.get("commercial_feed_kg") or (feeding.commercial_feed_bags * 25.0))
    if "commercial_feed_kg" in payload and "commercial_feed_bags" not in payload:
        feeding.commercial_feed_kg = float(payload["commercial_feed_kg"])
    if "vaat_kg" in payload:
        feeding.vaat_kg = float(payload["vaat_kg"])
    if "feeding_time" in payload:
        feeding.feeding_time = payload["feeding_time"]
    if "weather_condition" in payload:
        feeding.weather_condition = payload["weather_condition"]
    if "notes" in payload:
        feeding.notes = payload["notes"]
        
    db.commit()
    db.refresh(feeding)
    return feeding

@app.delete("/api/feed/daily/{feeding_id}")
def delete_daily_feeding(feeding_id: int, db: Session = Depends(get_db)):
    feeding = db.query(models.DailyFeeding).filter(models.DailyFeeding.id == feeding_id).first()
    if not feeding:
        raise HTTPException(status_code=404, detail="Feeding record not found")
    db.delete(feeding)
    db.commit()
    return {"status": "success", "message": "Feeding record deleted successfully"}

# Vaat (Rice) tracking
@app.get("/api/feed/vaat")
def get_vaat_supplies(db: Session = Depends(get_db)):
    records = db.query(models.VaatSupply).order_by(desc(models.VaatSupply.date)).all()
    total_raw_rice = sum(r.raw_rice_kg for r in records)
    total_cooked = sum(r.total_cooked_vaat_kg for r in records)
    total_cost = sum((r.rice_cost_bdt + r.cooking_fuel_cost_bdt) for r in records)
    return {
        "records": records,
        "total_raw_rice_kg": total_raw_rice,
        "total_cooked_vaat_kg": total_cooked,
        "total_vaat_cost_bdt": round(total_cost, 2)
    }

@app.post("/api/feed/vaat")
def add_vaat_prep(payload: dict, db: Session = Depends(get_db)):
    raw_rice = float(payload.get("raw_rice_kg") or 0.0)
    rice_cost = float(payload.get("rice_cost_bdt") or 0.0)
    fuel_cost = float(payload.get("cooking_fuel_cost_bdt") or 0.0)
    cooked_kg = float(payload.get("total_cooked_vaat_kg") or (raw_rice * 2.5)) # rice expands ~2.5x

    rec = models.VaatSupply(
        date=payload.get("date") or datetime.now().strftime("%Y-%m-%d"),
        raw_rice_kg=raw_rice,
        rice_cost_bdt=rice_cost,
        cooking_fuel_cost_bdt=fuel_cost,
        total_cooked_vaat_kg=cooked_kg,
        notes=payload.get("notes")
    )
    db.add(rec)
    
    # Also log as expense
    if (rice_cost + fuel_cost) > 0:
        db.add(models.Expense(
            date=rec.date,
            category="Rice / Vaat",
            amount_bdt=rice_cost + fuel_cost,
            description=f"Vaat preparation: {raw_rice} kg rice + cooking gas/wood",
            voucher_no="VAAT-AUTO",
            recorded_by="manager"
        ))

    db.commit()
    db.refresh(rec)
    return rec


# ================= GROWTH SAMPLING (EVERY 15-18 DAYS) =================

@app.get("/api/growth")
def get_growth_samplings(pond_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.GrowthSampling)
    if pond_id:
        query = query.filter(models.GrowthSampling.pond_id == pond_id)
    samplings = query.order_by(desc(models.GrowthSampling.date)).all()
    
    results = []
    for s in samplings:
        pond = db.query(models.Pond).filter(models.Pond.id == s.pond_id).first()
        results.append({
            "id": s.id,
            "pond_id": s.pond_id,
            "pond_name": pond.name if pond else "Unknown",
            "date": s.date,
            "fish_type": s.fish_type,
            "sample_count_pcs": s.sample_count_pcs,
            "total_sample_weight_kg": s.total_sample_weight_kg,
            "calculated_pcs_per_kg": round(s.calculated_pcs_per_kg, 2),
            "avg_weight_grams": round(s.avg_weight_grams, 1),
            "estimated_survival_pct": s.estimated_survival_pct,
            "estimated_biomass_kg": round(s.estimated_biomass_kg, 1),
            "calculated_fcr": round(s.calculated_fcr, 2),
            "next_check_date": s.next_check_date,
            "remarks": s.remarks
        })
    return results

@app.post("/api/growth")
def record_growth_sampling(payload: dict, db: Session = Depends(get_db)):
    sample_count = int(payload["sample_count_pcs"])
    sample_weight = float(payload["total_sample_weight_kg"])
    pond_id = int(payload["pond_id"])
    
    if sample_weight <= 0 or sample_count <= 0:
        raise HTTPException(status_code=400, detail="Sample count and weight must be greater than zero")

    pcs_per_kg = sample_count / sample_weight
    avg_weight_grams = (sample_weight * 1000.0) / sample_count
    
    # Calculate total surviving fish and total biomass
    stockings = db.query(models.StockingEvent).filter(models.StockingEvent.pond_id == pond_id).all()
    total_stocked = sum(st.count_pcs for st in stockings)
    survival_pct = float(payload.get("estimated_survival_pct") or 95.0)
    surviving_fish = total_stocked * (survival_pct / 100.0)
    estimated_biomass_kg = surviving_fish * (avg_weight_grams / 1000.0)

    # Calculate FCR = Total Feed Consumed (kg) / Biomass Gained (kg)
    feedings = db.query(models.DailyFeeding).filter(models.DailyFeeding.pond_id == pond_id).all()
    total_feed_kg = sum(f.commercial_feed_kg for f in feedings)
    initial_biomass = sum(st.initial_weight_kg for st in stockings)
    biomass_gain = max(1.0, estimated_biomass_kg - initial_biomass)
    fcr = round(total_feed_kg / biomass_gain, 2) if biomass_gain > 0 and total_feed_kg > 0 else 1.35

    # Schedule next check in 16 days (15-18 day cycle)
    sample_date = datetime.strptime(payload["date"], "%Y-%m-%d").date()
    next_check = sample_date + timedelta(days=16)

    sampling = models.GrowthSampling(
        pond_id=pond_id,
        date=payload["date"],
        fish_type=payload.get("fish_type", "Pangash"),
        sample_count_pcs=sample_count,
        total_sample_weight_kg=sample_weight,
        calculated_pcs_per_kg=pcs_per_kg,
        avg_weight_grams=avg_weight_grams,
        estimated_survival_pct=survival_pct,
        estimated_biomass_kg=estimated_biomass_kg,
        calculated_fcr=fcr,
        next_check_date=str(next_check),
        remarks=payload.get("remarks")
    )
    db.add(sampling)
    db.commit()
    db.refresh(sampling)
    return sampling

@app.put("/api/growth/{sampling_id}")
def update_growth_sampling(sampling_id: int, payload: dict, db: Session = Depends(get_db)):
    sampling = db.query(models.GrowthSampling).filter(models.GrowthSampling.id == sampling_id).first()
    if not sampling:
        raise HTTPException(status_code=404, detail="Sampling record not found")
    
    if "date" in payload:
        sampling.date = payload["date"]
    if "pond_id" in payload:
        sampling.pond_id = int(payload["pond_id"])
    if "fish_type" in payload:
        sampling.fish_type = payload["fish_type"]
    if "sample_count_pcs" in payload:
        sampling.sample_count_pcs = int(payload["sample_count_pcs"])
    if "total_sample_weight_kg" in payload:
        sampling.total_sample_weight_kg = float(payload["total_sample_weight_kg"])
    if sampling.total_sample_weight_kg > 0 and sampling.sample_count_pcs > 0:
        sampling.calculated_pcs_per_kg = sampling.sample_count_pcs / sampling.total_sample_weight_kg
        sampling.avg_weight_grams = (sampling.total_sample_weight_kg * 1000.0) / sampling.sample_count_pcs
    if "estimated_survival_pct" in payload:
        sampling.estimated_survival_pct = float(payload["estimated_survival_pct"])
    if "remarks" in payload:
        sampling.remarks = payload["remarks"]
        
    db.commit()
    db.refresh(sampling)
    return sampling

@app.delete("/api/growth/{sampling_id}")
def delete_growth_sampling(sampling_id: int, db: Session = Depends(get_db)):
    sampling = db.query(models.GrowthSampling).filter(models.GrowthSampling.id == sampling_id).first()
    if not sampling:
        raise HTTPException(status_code=404, detail="Sampling record not found")
    db.delete(sampling)
    db.commit()
    return {"status": "success", "message": "Growth sampling record deleted successfully"}


# ================= EXPENSES & PROFIT CALCULATIONS =================

@app.get("/api/expenses")
def get_expenses(pond_id: Optional[int] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Expense)
    if pond_id:
        query = query.filter(models.Expense.pond_id == pond_id)
    if category:
        query = query.filter(models.Expense.category == category)
    expenses = query.order_by(desc(models.Expense.date)).all()
    
    total = sum(e.amount_bdt for e in expenses)
    # Group by category
    categories = {}
    for e in expenses:
        categories[e.category] = categories.get(e.category, 0) + e.amount_bdt
        
    return {
        "expenses": expenses,
        "total_amount_bdt": round(total, 2),
        "by_category": categories
    }

@app.post("/api/expenses")
def create_expense(payload: dict, db: Session = Depends(get_db)):
    expense = models.Expense(
        date=payload.get("date") or datetime.now().strftime("%Y-%m-%d"),
        pond_id=payload.get("pond_id"),
        category=payload["category"],
        amount_bdt=float(payload["amount_bdt"]),
        description=payload["description"],
        voucher_no=payload.get("voucher_no"),
        recorded_by=payload.get("recorded_by", "manager")
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@app.put("/api/expenses/{expense_id}")
def update_expense(expense_id: int, payload: dict, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")
    if "date" in payload:
        expense.date = payload["date"]
    if "pond_id" in payload:
        expense.pond_id = payload["pond_id"]
    if "category" in payload:
        expense.category = payload["category"]
    if "amount_bdt" in payload:
        expense.amount_bdt = float(payload["amount_bdt"])
    if "description" in payload:
        expense.description = payload["description"]
    if "voucher_no" in payload:
        expense.voucher_no = payload["voucher_no"]
    db.commit()
    db.refresh(expense)
    return expense

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")
    db.delete(expense)
    db.commit()
    return {"status": "success", "message": "Expense record deleted successfully"}

@app.get("/api/harvest")
def get_harvest_sales(db: Session = Depends(get_db)):
    harvests = db.query(models.HarvestSale).order_by(desc(models.HarvestSale.date)).all()
    total_kg = sum(h.total_weight_kg for h in harvests)
    total_rev = sum(h.total_income_bdt for h in harvests)
    return {
        "sales": harvests,
        "total_harvest_kg": round(total_kg, 2),
        "total_revenue_bdt": round(total_rev, 2)
    }

@app.post("/api/harvest")
def record_harvest_sale(payload: dict, db: Session = Depends(get_db)):
    kg = float(payload["total_weight_kg"])
    rate = float(payload["rate_per_kg_bdt"])
    total_income = float(payload.get("total_income_bdt") or (kg * rate))

    harvest = models.HarvestSale(
        date=payload["date"],
        pond_id=int(payload["pond_id"]),
        fish_type=payload["fish_type"],
        total_weight_kg=kg,
        pcs_count=payload.get("pcs_count"),
        rate_per_kg_bdt=rate,
        total_income_bdt=total_income,
        buyer_name=payload.get("buyer_name"),
        challan_no=payload.get("challan_no"),
        payment_status=payload.get("payment_status", "Paid"),
        payment_received_bdt=float(payload.get("payment_received_bdt") or total_income),
        notes=payload.get("notes")
    )
    db.add(harvest)
    db.commit()
    db.refresh(harvest)
    return harvest

@app.put("/api/harvest/{harvest_id}")
def update_harvest_sale(harvest_id: int, payload: dict, db: Session = Depends(get_db)):
    harvest = db.query(models.HarvestSale).filter(models.HarvestSale.id == harvest_id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="Harvest record not found")
    if "date" in payload:
        harvest.date = payload["date"]
    if "pond_id" in payload:
        harvest.pond_id = int(payload["pond_id"])
    if "fish_type" in payload:
        harvest.fish_type = payload["fish_type"]
    if "total_weight_kg" in payload:
        harvest.total_weight_kg = float(payload["total_weight_kg"])
    if "rate_per_kg_bdt" in payload:
        harvest.rate_per_kg_bdt = float(payload["rate_per_kg_bdt"])
    harvest.total_income_bdt = float(payload.get("total_income_bdt") or (harvest.total_weight_kg * harvest.rate_per_kg_bdt))
    if "buyer_name" in payload:
        harvest.buyer_name = payload["buyer_name"]
    if "notes" in payload:
        harvest.notes = payload["notes"]
    db.commit()
    db.refresh(harvest)
    return harvest

@app.delete("/api/harvest/{harvest_id}")
def delete_harvest_sale(harvest_id: int, db: Session = Depends(get_db)):
    harvest = db.query(models.HarvestSale).filter(models.HarvestSale.id == harvest_id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="Harvest record not found")
    db.delete(harvest)
    db.commit()
    return {"status": "success", "message": "Harvest record deleted successfully"}



@app.get("/api/financials/profit-analysis")
def get_profit_analysis(target_weight_kg: float = 1.2, selling_price_bdt: float = 155.0, db: Session = Depends(get_db)):
    """Comprehensive costing and profit simulator for the farm"""
    stockings = db.query(models.StockingEvent).all()
    feed_inventory = db.query(models.FeedInventory).all()
    feedings = db.query(models.DailyFeeding).all()
    expenses = db.query(models.Expense).all()
    vaat_records = db.query(models.VaatSupply).all()
    ponds = db.query(models.Pond).all()

    total_feed_cost = sum(b.total_cost for b in feed_inventory)
    total_pona_cost = sum(s.cost_bdt for s in stockings)
    total_vaat_cost = sum(v.rice_cost_bdt + v.cooking_fuel_cost_bdt for v in vaat_records)
    total_other_expenses = sum(e.amount_bdt for e in expenses)
    total_cost_invested = total_feed_cost + total_pona_cost + total_vaat_cost + total_other_expenses

    # Fish count breakdown
    pangash_count = sum(s.count_pcs for s in stockings if "Pangash" in s.fish_type)
    carp_count = sum(s.count_pcs for s in stockings if "Carp" in s.fish_type or "Curf" in s.fish_type)
    
    # 92% survival assumption
    est_surviving_pangash = pangash_count * 0.92
    est_surviving_carp = carp_count * 0.90

    # Harvest biomass projections
    est_pangash_harvest_kg = est_surviving_pangash * target_weight_kg
    est_carp_harvest_kg = est_surviving_carp * 1.5 # Carps grow to ~1.5kg

    total_projected_harvest_kg = est_pangash_harvest_kg + est_carp_harvest_kg

    # Projected feed requirement: FCR 1.4 for remaining growth
    # Total feed needed for target weight
    est_total_feed_bags_needed = (total_projected_harvest_kg * 1.35) / 25.0
    remaining_feed_bags_to_buy = max(0, est_total_feed_bags_needed - sum(b.bag_count for b in feed_inventory))
    additional_feed_cost = remaining_feed_bags_to_buy * 2200.0

    total_projected_cycle_cost = total_cost_invested + additional_feed_cost

    # Projected Gross Income
    pangash_revenue = est_pangash_harvest_kg * selling_price_bdt
    carp_revenue = est_carp_harvest_kg * 260.0 # Market rate for Carps
    total_projected_revenue = pangash_revenue + carp_revenue

    projected_net_profit = total_projected_revenue - total_projected_cycle_cost
    profit_margin_pct = (projected_net_profit / max(1, total_projected_revenue)) * 100
    roi_pct = (projected_net_profit / max(1, total_projected_cycle_cost)) * 100
    cost_per_kg_produced = total_projected_cycle_cost / max(1, total_projected_harvest_kg)

    return {
        "current_investment": {
            "total_invested_so_far": round(total_cost_invested, 2),
            "feed_cost": round(total_feed_cost, 2),
            "pona_cost": round(total_pona_cost, 2),
            "vaat_cost": round(total_vaat_cost, 2),
            "other_expenses": round(total_other_expenses, 2),
        },
        "fish_projections": {
            "total_pangash_stocked": pangash_count,
            "total_carp_stocked": carp_count,
            "est_surviving_pangash": int(est_surviving_pangash),
            "est_surviving_carp": int(est_surviving_carp),
            "target_pangash_weight_kg": target_weight_kg,
            "est_pangash_biomass_kg": round(est_pangash_harvest_kg, 1),
            "est_carp_biomass_kg": round(est_carp_harvest_kg, 1),
            "total_projected_biomass_kg": round(total_projected_harvest_kg, 1),
        },
        "profit_forecast": {
            "assumed_pangash_price_per_kg": selling_price_bdt,
            "assumed_carp_price_per_kg": 260.0,
            "projected_pangash_revenue": round(pangash_revenue, 2),
            "projected_carp_revenue": round(carp_revenue, 2),
            "total_projected_revenue": round(total_projected_revenue, 2),
            "total_projected_cycle_cost": round(total_projected_cycle_cost, 2),
            "projected_net_profit": round(projected_net_profit, 2),
            "profit_margin_pct": round(profit_margin_pct, 1),
            "roi_pct": round(roi_pct, 1),
            "cost_per_kg_produced": round(cost_per_kg_produced, 2),
            "break_even_price_per_kg": round(cost_per_kg_produced, 2)
        }
    }


# ================= 6-MONTH CULTURE CYCLES MANAGEMENT =================

@app.get("/api/cycles")
def get_cycles(pond_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve all aquaculture cycles with live progress, feed tracking, and financial status"""
    q = db.query(models.PondCycle)
    if pond_id:
        q = q.filter(models.PondCycle.pond_id == pond_id)
    if status:
        q = q.filter(models.PondCycle.status == status)
    cycles = q.order_by(models.PondCycle.start_date.desc()).all()

    # Get average feed price
    inventory = db.query(models.FeedInventory).all()
    avg_feed_rate = round(sum(b.total_cost for b in inventory) / max(1, sum(b.bag_count for b in inventory)), 2)

    results = []
    today_dt = datetime.now().date()

    for c in cycles:
        pond = db.query(models.Pond).filter(models.Pond.id == c.pond_id).first()
        start_dt = datetime.strptime(c.start_date, "%Y-%m-%d").date()
        end_ref = datetime.strptime(c.actual_end_date, "%Y-%m-%d").date() if c.actual_end_date else today_dt
        days_elapsed = max(0, (end_ref - start_dt).days)
        progress_pct = min(100.0, round((days_elapsed / 180.0) * 100.0, 1))

        # Feed consumed in this cycle
        feeding_q = db.query(models.DailyFeeding).filter(
            models.DailyFeeding.pond_id == c.pond_id,
            models.DailyFeeding.date >= c.start_date
        )
        if c.actual_end_date:
            feeding_q = feeding_q.filter(models.DailyFeeding.date <= c.actual_end_date)
        feedings = feeding_q.all()
        feed_bags = sum(f.commercial_feed_bags for f in feedings)
        feed_kg = sum(f.commercial_feed_kg for f in feedings)
        feed_cost = round(feed_bags * avg_feed_rate, 2)

        # Stockings in this cycle
        stockings = db.query(models.StockingEvent).filter(
            models.StockingEvent.pond_id == c.pond_id,
            models.StockingEvent.date >= c.start_date
        ).all()
        total_stocked_pcs = sum(s.count_pcs for s in stockings) or c.initial_fish_count
        pona_cost = sum(s.cost_bdt for s in stockings)

        # Harvests in this cycle
        harvest_q = db.query(models.HarvestSale).filter(
            models.HarvestSale.pond_id == c.pond_id,
            models.HarvestSale.date >= c.start_date
        )
        if c.actual_end_date:
            harvest_q = harvest_q.filter(models.HarvestSale.date <= c.actual_end_date)
        harvests = harvest_q.all()
        harvest_kg = sum(h.total_weight_kg for h in harvests) or c.final_harvest_weight_kg
        harvest_revenue = sum(h.total_income_bdt for h in harvests) or c.total_revenue_bdt

        # Projected revenue if active
        if c.status == "active":
            projected_biomass = c.target_harvest_biomass_kg or (total_stocked_pcs * 0.92 * 1.2)
            projected_revenue = round(projected_biomass * 155.0, 2)
            est_total_feed_bags = round((projected_biomass * 1.35) / 25.0, 0)
            est_total_cost = round((est_total_feed_bags * avg_feed_rate) + pona_cost + 45000.0, 2)
            projected_profit = round(projected_revenue - est_total_cost, 2)
        else:
            projected_biomass = harvest_kg
            projected_revenue = harvest_revenue
            projected_profit = round(harvest_revenue - (feed_cost + pona_cost + 40000.0), 2)

        # Investments in this cycle
        investments = db.query(models.Investment).filter(models.Investment.cycle_id == c.id).all()
        investors_list = []
        total_cycle_invested = 0.0
        for inv in investments:
            investor = db.query(models.Investor).filter(models.Investor.id == inv.investor_id).first()
            total_cycle_invested += inv.amount_bdt
            # Calculate investor's profit share
            if inv.profit_share_type == "profit_share":
                inv_profit = round((projected_profit * inv.share_percentage) / 100.0, 2)
            elif inv.profit_share_type == "fixed_roi":
                inv_profit = round((inv.amount_bdt * inv.fixed_roi_rate) / 100.0, 2)
            else:
                inv_profit = round((projected_profit * (inv.share_percentage or 10.0)) / 100.0, 2)
            
            investors_list.append({
                "id": inv.id,
                "investor_name": investor.name if investor else "Partner",
                "phone": investor.phone if investor else "",
                "amount_bdt": inv.amount_bdt,
                "share_percentage": inv.share_percentage,
                "projected_profit_bdt": inv_profit,
                "total_expected_payout_bdt": round(inv.amount_bdt + inv_profit, 2),
                "payout_status": inv.payout_status
            })

        results.append({
            "id": c.id,
            "pond_id": c.pond_id,
            "pond_name": pond.name if pond else f"পুকুর {c.pond_id}",
            "cycle_number": c.cycle_number,
            "cycle_name": c.cycle_name,
            "start_date": c.start_date,
            "expected_end_date": c.expected_end_date,
            "actual_end_date": c.actual_end_date,
            "status": c.status,
            "days_elapsed": days_elapsed,
            "progress_pct": progress_pct,
            "initial_fish_count": total_stocked_pcs,
            "initial_stock_weight_kg": c.initial_stock_weight_kg,
            "target_harvest_biomass_kg": c.target_harvest_biomass_kg,
            "feed_bags_consumed": round(feed_bags, 1),
            "feed_kg_consumed": round(feed_kg, 1),
            "feed_cost_bdt": feed_cost,
            "pona_cost_bdt": pona_cost,
            "harvest_biomass_kg": harvest_kg,
            "projected_revenue_bdt": projected_revenue,
            "projected_net_profit_bdt": projected_profit,
            "total_investors_count": len(investors_list),
            "total_external_investment_bdt": total_cycle_invested,
            "investors": investors_list,
            "notes": c.notes
        })

    return results

@app.post("/api/cycles")
def create_cycle(payload: dict, db: Session = Depends(get_db)):
    """Start a new 6-month cycle for a pond"""
    pond_id = int(payload["pond_id"])
    pond = db.query(models.Pond).filter(models.Pond.id == pond_id).first()
    if not pond:
        raise HTTPException(status_code=404, detail="Pond not found")

    # Count existing cycles for this pond to determine next cycle number
    existing_count = db.query(models.PondCycle).filter(models.PondCycle.pond_id == pond_id).count()
    cycle_num = existing_count + 1

    start_date = payload.get("start_date") or datetime.now().strftime("%Y-%m-%d")
    start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
    expected_end = payload.get("expected_end_date") or (start_dt + timedelta(days=180)).strftime("%Y-%m-%d")

    cycle = models.PondCycle(
        pond_id=pond_id,
        cycle_number=cycle_num,
        cycle_name=payload.get("cycle_name") or f"{pond.name} - সাইকেল {cycle_num} (৬ মাস)",
        start_date=start_date,
        expected_end_date=expected_end,
        status="active",
        initial_fish_count=int(payload.get("initial_fish_count") or 0),
        initial_stock_weight_kg=float(payload.get("initial_stock_weight_kg") or 0.0),
        target_harvest_biomass_kg=float(payload.get("target_harvest_biomass_kg") or 20000.0),
        notes=payload.get("notes") or f"{cycle_num}ম বাণিজ্যিক কালচার সাইকেল শুরু।"
    )
    db.add(cycle)
    # Also update pond status to active
    pond.status = "active"
    db.commit()
    db.refresh(cycle)
    return cycle

@app.put("/api/cycles/{cycle_id}/end")
def end_cycle(cycle_id: int, payload: dict, db: Session = Depends(get_db)):
    """Complete and close a 6-month cycle after harvesting fish"""
    cycle = db.query(models.PondCycle).filter(models.PondCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    actual_end_date = payload.get("actual_end_date") or datetime.now().strftime("%Y-%m-%d")
    final_weight = float(payload.get("final_harvest_weight_kg") or 0.0)
    total_revenue = float(payload.get("total_revenue_bdt") or 0.0)

    # Calculate actual feed consumed and costs
    inventory = db.query(models.FeedInventory).all()
    avg_feed_rate = round(sum(b.total_cost for b in inventory) / max(1, sum(b.bag_count for b in inventory)), 2)

    feedings = db.query(models.DailyFeeding).filter(
        models.DailyFeeding.pond_id == cycle.pond_id,
        models.DailyFeeding.date >= cycle.start_date,
        models.DailyFeeding.date <= actual_end_date
    ).all()
    feed_bags = sum(f.commercial_feed_bags for f in feedings)
    feed_cost = round(feed_bags * avg_feed_rate, 2)

    stockings = db.query(models.StockingEvent).filter(
        models.StockingEvent.pond_id == cycle.pond_id,
        models.StockingEvent.date >= cycle.start_date,
        models.StockingEvent.date <= actual_end_date
    ).all()
    pona_cost = sum(s.cost_bdt for s in stockings)

    total_exp = feed_cost + pona_cost + float(payload.get("other_expenses_bdt") or 45000.0)
    net_profit = round(total_revenue - total_exp, 2)

    cycle.actual_end_date = actual_end_date
    cycle.status = "harvested"
    cycle.final_harvest_weight_kg = final_weight
    cycle.total_revenue_bdt = total_revenue
    cycle.total_feed_bags_used = feed_bags
    cycle.total_feed_cost_bdt = feed_cost
    cycle.total_expenses_bdt = total_exp
    cycle.net_profit_bdt = net_profit
    cycle.notes = (cycle.notes or "") + f" • সমাপ্তি: {actual_end_date} (বিক্রয়: ৳{total_revenue:,.0f}, লাভ: ৳{net_profit:,.0f})"

    # Update pond status to preparing for next cycle
    pond = db.query(models.Pond).filter(models.Pond.id == cycle.pond_id).first()
    if pond:
        pond.status = "preparing"

    db.commit()
    db.refresh(cycle)
    return {"status": "success", "message": "সাইকেল সফলভাবে সম্পন্ন ও সংরক্ষিত হয়েছে!", "cycle": cycle}

@app.put("/api/cycles/{cycle_id}")
def update_cycle(cycle_id: int, payload: dict, db: Session = Depends(get_db)):
    cycle = db.query(models.PondCycle).filter(models.PondCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    if "cycle_name" in payload:
        cycle.cycle_name = payload["cycle_name"]
    if "start_date" in payload:
        cycle.start_date = payload["start_date"]
    if "expected_end_date" in payload:
        cycle.expected_end_date = payload["expected_end_date"]
    if "status" in payload:
        cycle.status = payload["status"]
    if "initial_fish_count" in payload:
        cycle.initial_fish_count = int(payload["initial_fish_count"])
    if "target_harvest_biomass_kg" in payload:
        cycle.target_harvest_biomass_kg = float(payload["target_harvest_biomass_kg"])
    if "notes" in payload:
        cycle.notes = payload["notes"]

    db.commit()
    db.refresh(cycle)
    return cycle

@app.delete("/api/cycles/{cycle_id}")
def delete_cycle(cycle_id: int, db: Session = Depends(get_db)):
    cycle = db.query(models.PondCycle).filter(models.PondCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    db.delete(cycle)
    db.commit()
    return {"status": "success", "message": "Cycle deleted successfully"}


# ================= INVESTORS & PROFIT SHARING MODULE =================

@app.get("/api/investors")
def get_investors(db: Session = Depends(get_db)):
    """Retrieve all investors with their investments, capital, and profit share"""
    investors = db.query(models.Investor).order_by(models.Investor.name.asc()).all()
    results = []

    for inv in investors:
        investments = db.query(models.Investment).filter(models.Investment.investor_id == inv.id).all()
        total_invested = sum(i.amount_bdt for i in investments)
        total_paid_profit = sum(i.paid_profit_bdt for i in investments)
        total_returned_capital = sum(i.returned_capital_bdt for i in investments)

        # Calculate projected profit from linked cycles
        total_projected_profit = 0.0
        for i in investments:
            if i.cycle_id:
                cycle = db.query(models.PondCycle).filter(models.PondCycle.id == i.cycle_id).first()
                if cycle:
                    c_profit = cycle.net_profit_bdt or 1500000.0 # fallback live projection ~15L
                    if i.profit_share_type == "profit_share":
                        total_projected_profit += (c_profit * i.share_percentage) / 100.0
                    else:
                        total_projected_profit += (i.amount_bdt * (i.fixed_roi_rate or 20.0)) / 100.0

        results.append({
            "id": inv.id,
            "name": inv.name,
            "phone": inv.phone,
            "email": inv.email,
            "nid": inv.nid,
            "address": inv.address,
            "notes": inv.notes,
            "total_invested_bdt": round(total_invested, 2),
            "total_paid_profit_bdt": round(total_paid_profit, 2),
            "total_returned_capital_bdt": round(total_returned_capital, 2),
            "total_projected_profit_bdt": round(total_projected_profit, 2),
            "total_expected_return_bdt": round(total_invested + total_projected_profit, 2),
            "investments_count": len(investments),
            "investments": [
                {
                    "id": i.id,
                    "cycle_id": i.cycle_id,
                    "pond_id": i.pond_id,
                    "amount_bdt": i.amount_bdt,
                    "investment_date": i.investment_date,
                    "share_percentage": i.share_percentage,
                    "profit_share_type": i.profit_share_type,
                    "payout_status": i.payout_status,
                    "paid_profit_bdt": i.paid_profit_bdt,
                    "agreement_terms": i.agreement_terms
                } for i in investments
            ]
        })

    return results

@app.post("/api/investors")
def create_investor(payload: dict, db: Session = Depends(get_db)):
    investor = models.Investor(
        name=payload["name"],
        phone=payload["phone"],
        email=payload.get("email"),
        nid=payload.get("nid"),
        address=payload.get("address"),
        notes=payload.get("notes")
    )
    db.add(investor)
    db.commit()
    db.refresh(investor)
    return investor

@app.put("/api/investors/{investor_id}")
def update_investor(investor_id: int, payload: dict, db: Session = Depends(get_db)):
    investor = db.query(models.Investor).filter(models.Investor.id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    if "name" in payload:
        investor.name = payload["name"]
    if "phone" in payload:
        investor.phone = payload["phone"]
    if "email" in payload:
        investor.email = payload["email"]
    if "nid" in payload:
        investor.nid = payload["nid"]
    if "address" in payload:
        investor.address = payload["address"]
    if "notes" in payload:
        investor.notes = payload["notes"]
    db.commit()
    db.refresh(investor)
    return investor

@app.delete("/api/investors/{investor_id}")
def delete_investor(investor_id: int, db: Session = Depends(get_db)):
    investor = db.query(models.Investor).filter(models.Investor.id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    db.delete(investor)
    db.commit()
    return {"status": "success", "message": "Investor deleted successfully"}


@app.get("/api/investments")
def get_investments(db: Session = Depends(get_db)):
    investments = db.query(models.Investment).order_by(models.Investment.investment_date.desc()).all()
    results = []
    for inv in investments:
        investor = db.query(models.Investor).filter(models.Investor.id == inv.investor_id).first()
        cycle = db.query(models.PondCycle).filter(models.PondCycle.id == inv.cycle_id).first() if inv.cycle_id else None
        pond = db.query(models.Pond).filter(models.Pond.id == inv.pond_id).first() if inv.pond_id else None

        # Estimated profit calculation
        cycle_profit = cycle.net_profit_bdt if (cycle and cycle.net_profit_bdt) else 1800000.0
        if inv.profit_share_type == "profit_share":
            est_profit = round((cycle_profit * inv.share_percentage) / 100.0, 2)
        elif inv.profit_share_type == "fixed_roi":
            est_profit = round((inv.amount_bdt * (inv.fixed_roi_rate or 20.0)) / 100.0, 2)
        else:
            est_profit = round((cycle_profit * (inv.share_percentage or 10.0)) / 100.0, 2)

        results.append({
            "id": inv.id,
            "investor_id": inv.investor_id,
            "investor_name": investor.name if investor else "Unknown",
            "investor_phone": investor.phone if investor else "",
            "cycle_id": inv.cycle_id,
            "cycle_name": cycle.cycle_name if cycle else "সমগ্র খামার (All Ponds)",
            "pond_id": inv.pond_id,
            "pond_name": pond.name if pond else "খামার সম্মিলিত",
            "amount_bdt": inv.amount_bdt,
            "investment_date": inv.investment_date,
            "share_percentage": inv.share_percentage,
            "profit_share_type": inv.profit_share_type,
            "fixed_roi_rate": inv.fixed_roi_rate,
            "estimated_profit_bdt": est_profit,
            "total_expected_payout_bdt": round(inv.amount_bdt + est_profit, 2),
            "payout_status": inv.payout_status,
            "payout_date": inv.payout_date,
            "paid_profit_bdt": inv.paid_profit_bdt,
            "returned_capital_bdt": inv.returned_capital_bdt,
            "voucher_no": inv.voucher_no,
            "agreement_terms": inv.agreement_terms
        })
    return results

@app.post("/api/investments")
def create_investment(payload: dict, db: Session = Depends(get_db)):
    inv = models.Investment(
        investor_id=int(payload["investor_id"]),
        cycle_id=int(payload["cycle_id"]) if payload.get("cycle_id") else None,
        pond_id=int(payload["pond_id"]) if payload.get("pond_id") else None,
        amount_bdt=float(payload["amount_bdt"]),
        investment_date=payload.get("investment_date") or datetime.now().strftime("%Y-%m-%d"),
        share_percentage=float(payload.get("share_percentage") or 10.0),
        profit_share_type=payload.get("profit_share_type", "profit_share"),
        fixed_roi_rate=float(payload.get("fixed_roi_rate") or 0.0),
        payout_status="active",
        agreement_terms=payload.get("agreement_terms", "")
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv

@app.put("/api/investments/{investment_id}")
def update_investment(investment_id: int, payload: dict, db: Session = Depends(get_db)):
    inv = db.query(models.Investment).filter(models.Investment.id == investment_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    if "amount_bdt" in payload:
        inv.amount_bdt = float(payload["amount_bdt"])
    if "investment_date" in payload:
        inv.investment_date = payload["investment_date"]
    if "share_percentage" in payload:
        inv.share_percentage = float(payload["share_percentage"])
    if "profit_share_type" in payload:
        inv.profit_share_type = payload["profit_share_type"]
    if "payout_status" in payload:
        inv.payout_status = payload["payout_status"]
    if "agreement_terms" in payload:
        inv.agreement_terms = payload["agreement_terms"]
    db.commit()
    db.refresh(inv)
    return inv

@app.post("/api/investments/{investment_id}/payout")
def record_investment_payout(investment_id: int, payload: dict, db: Session = Depends(get_db)):
    """Record payment of profit / capital back to investor"""
    inv = db.query(models.Investment).filter(models.Investment.id == investment_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")

    paid_profit = float(payload.get("paid_profit_bdt") or 0.0)
    returned_capital = float(payload.get("returned_capital_bdt") or 0.0)
    payout_date = payload.get("payout_date") or datetime.now().strftime("%Y-%m-%d")
    voucher = payload.get("voucher_no") or f"INV-PAY-{inv.id}"

    inv.paid_profit_bdt += paid_profit
    inv.returned_capital_bdt += returned_capital
    inv.payout_date = payout_date
    inv.voucher_no = voucher
    inv.payout_status = "completed" if inv.returned_capital_bdt >= inv.amount_bdt else "partial"

    # Also record in expenses as investor dividend payout
    db.add(models.Expense(
        date=payout_date,
        pond_id=inv.pond_id,
        category="Misc",
        amount_bdt=paid_profit,
        description=f"Investor profit distribution to {inv.investor.name if inv.investor else 'Partner'} (Voucher: {voucher})",
        voucher_no=voucher,
        recorded_by="superadmin"
    ))

    db.commit()
    db.refresh(inv)
    return {"status": "success", "message": "লভ্যাংশ ও মূলধন পরিশোধ সফলভাবে রেকর্ড হয়েছে!", "investment": inv}

@app.delete("/api/investments/{investment_id}")
def delete_investment(investment_id: int, db: Session = Depends(get_db)):
    inv = db.query(models.Investment).filter(models.Investment.id == investment_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    db.delete(inv)
    db.commit()
    return {"status": "success", "message": "Investment deleted successfully"}

@app.get("/api/investors/simulator")
def simulate_investor_returns(
    investment_amount: float = 500000.0,
    cycle_id: Optional[int] = None,
    pond_id: Optional[int] = None,
    share_pct: float = 15.0,
    pangash_price_bdt: float = 155.0,
    db: Session = Depends(get_db)
):
    """Interactive What-if simulator for investors and farm owner"""
    # Total cycle production assumptions
    target_biomass_kg = 56000.0 if pond_id == 2 else (19000.0 if pond_id == 1 else 75000.0)
    gross_revenue = target_biomass_kg * pangash_price_bdt
    
    # Estimated cost: FCR 1.35 + fingerlings + operations (~65% of revenue)
    est_total_cost = gross_revenue * 0.65
    projected_net_profit = max(0, gross_revenue - est_total_cost)

    investor_profit_share = round((projected_net_profit * share_pct) / 100.0, 2)
    investor_total_return = round(investment_amount + investor_profit_share, 2)
    investor_roi = round((investor_profit_share / max(1, investment_amount)) * 100.0, 1)

    return {
        "investment_amount": investment_amount,
        "share_percentage": share_pct,
        "assumed_selling_price": pangash_price_bdt,
        "target_biomass_kg": target_biomass_kg,
        "target_maund": round(target_biomass_kg / 40.0, 1),
        "projected_cycle_revenue_bdt": round(gross_revenue, 2),
        "projected_cycle_cost_bdt": round(est_total_cost, 2),
        "projected_cycle_net_profit_bdt": round(projected_net_profit, 2),
        "investor_profit_payout_bdt": investor_profit_share,
        "investor_total_payout_bdt": investor_total_return,
        "investor_roi_pct": investor_roi,
        "monthly_profit_equivalent": round(investor_profit_share / 6.0, 2)
    }


# ================= LIVE WEATHER API WITH AQUACULTURE ADVISOR =================

@app.get("/api/weather")
def get_weather(lat: float = 22.2496, lon: float = 91.8133):
    """
    Fetches real-time weather and 7-day forecast from Open-Meteo API for Shah Amanat Airport, Patenga, Chittagong.
    Includes Aquaculture Intelligence Advisor for coastal weather, DO (Dissolved Oxygen) drops, and rain pH shifts.
    """
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&hourly=temperature_2m,cloud_cover,relative_humidity_2m&timezone=Asia/Dhaka"
    
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            current = data.get("current", {})
            daily = data.get("daily", {})
            hourly = data.get("hourly", {})
            
            temp = current.get("temperature_2m", 28.0)
            precip = current.get("precipitation", 0.0)
            humidity = current.get("relative_humidity_2m", 75)
            wind = current.get("wind_speed_10m", 8.0)
            
            # Aquaculture Risk Assessment (Coastal & Estuary zone)
            advisor_alerts = []
            
            # 1. Cloud cover / Photosynthesis / DO Risk
            recent_clouds = hourly.get("cloud_cover", [50])[:12]
            avg_cloud = sum(recent_clouds) / len(recent_clouds) if recent_clouds else 50
            if avg_cloud > 75:
                advisor_alerts.append({
                    "severity": "warning",
                    "title": "Low Oxygen / DO Warning (অক্সিজেন সতর্কবার্তা)",
                    "message": "চট্টগ্রাম উপকূলবর্তী মেঘলা আবহাওয়া। ভোররাতে দ্রবীভূত অক্সিজেন (DO) কমে যাওয়ার ঝুঁকি রয়েছে। রাত ৩:০০টা থেকে এরেটর চালু রাখুন।"
                })
            
            # 2. Rain / pH Drop Risk
            daily_rain_prob = daily.get("precipitation_probability_max", [0])[0] if daily.get("precipitation_probability_max") else 0
            if precip > 5 or daily_rain_prob > 60:
                advisor_alerts.append({
                    "severity": "info",
                    "title": "Rainfall & Water Quality Alert (বৃষ্টি ও পিএইচ সতর্কতা)",
                    "message": "পতেঙ্গা ও বিমানবন্দর এলাকায় বৃষ্টির সম্ভাবনা। পুকুরের পানির পিএইচ ও লবণাক্ততা ব্যালেন্স রাখতে বৃষ্টির পর প্রতি শতাংশে ১-২ কেজি চুন প্রয়োগ করুন।"
                })
                
            # 3. Temperature / Feeding Adjustment
            if temp < 22:
                advisor_alerts.append({
                    "severity": "warning",
                    "title": "Cooler Temperature - Reduce Feed (খাবার কমানোর পরামর্শ)",
                    "message": f"বর্তমান তাপমাত্রা {temp}°C। মাছের হজম প্রক্রিয়া ধীর থাকে। দৈনিক ফিড ২৫% কমিয়ে দিন।"
                })
            elif temp > 33:
                advisor_alerts.append({
                    "severity": "info",
                    "title": "High Heat - Aeration & Feeding (অতিরিক্ত তাপমাত্রা)",
                    "message": f"তাপমাত্রা {temp}°C। সকালের শীতল সময়ে ও শেষ বিকালে খাবার দিন। দুপুরের রোদে অতিরিক্ত খাবার পরিহার করুন।"
                })
            else:
                advisor_alerts.append({
                    "severity": "success",
                    "title": "Optimal Coastal Aquaculture Weather (অনুকূল আবহাওয়া)",
                    "message": f"তাপমাত্রা {temp}°C এবং আর্দ্রতা {humidity}%। মাছের খাবারের রুচি ও বৃদ্ধির জন্য চমৎকার পরিবেশ।"
                })

            return {
                "source": "Open-Meteo Real-time Forecast",
                "location": "Shah Amanat Airport, Patenga, Chittagong",
                "timezone": "Asia/Dhaka (GMT+6)",
                "coordinates": {"lat": lat, "lon": lon},
                "current": {
                    "temperature": temp,
                    "humidity": humidity,
                    "wind_speed": wind,
                    "precipitation": precip,
                    "weather_code": current.get("weather_code", 0)
                },
                "daily": daily,
                "aquaculture_advisor": advisor_alerts
            }
    except Exception as e:
        # Fallback offline mock in case internet or firewall limits external calls
        return {
            "source": "Fallback Offline Data",
            "location": "Shah Amanat Airport, Chittagong",
            "timezone": "Asia/Dhaka",
            "current": {
                "temperature": 27.5,
                "humidity": 85,
                "wind_speed": 6.5,
                "precipitation": 0.0,
                "weather_code": 1
            },
            "aquaculture_advisor": [
                {
                    "severity": "success",
                    "title": "Optimal Fish Weather (অনুকূল আবহাওয়া)",
                    "message": "Favorable coastal temperature for Pangash and Carp. Run regular aerators during late night."
                }
            ]
        }


# ================= WORKER MANUAL DATA ENTRY & BULK SHEET IMPORT/EXPORT =================

@app.post("/api/sync/worker-quick-entry")
def worker_quick_entry(payload: dict, db: Session = Depends(get_db)):
    """Ultra-simplified single endpoint designed for field workers on mobile"""
    pond_id = int(payload["pond_id"])
    feed_bags = float(payload.get("commercial_feed_bags") or 0.0)
    feed_kg = float(payload.get("commercial_feed_kg") or (feed_bags * 25.0))
    vaat_kg = float(payload.get("vaat_kg") or 0.0)
    notes = payload.get("notes", "")

    feeding = models.DailyFeeding(
        date=payload.get("date") or datetime.now().strftime("%Y-%m-%d"),
        pond_id=pond_id,
        commercial_feed_bags=feed_bags,
        commercial_feed_kg=feed_kg,
        vaat_kg=vaat_kg,
        feeding_time=payload.get("feeding_time", "Morning"),
        weather_condition=payload.get("weather_condition", "Clear"),
        logged_by=payload.get("logged_by", "Worker Mobile Form"),
        notes=notes
    )
    db.add(feeding)
    db.commit()
    db.refresh(feeding)
    return {"status": "success", "message": "দৈনিক খাবার ও তথ্য সফলভাবে সংরক্ষিত হয়েছে!", "entry_id": feeding.id}

@app.post("/api/sync/bulk-import")
def bulk_import_from_sheet(payload: dict, db: Session = Depends(get_db)):
    """
    Accepts tabular rows from Excel / Google Sheets / Paper log copy-paste:
    type: 'feeding' or 'expenses' or 'growth'
    rows: [ { ... } ]
    """
    import_type = payload.get("type", "feeding")
    rows = payload.get("rows", [])
    imported_count = 0

    if import_type == "feeding":
        for r in rows:
            pond_id = int(r.get("pond_id", 1))
            f = models.DailyFeeding(
                date=r.get("date") or datetime.now().strftime("%Y-%m-%d"),
                pond_id=pond_id,
                commercial_feed_bags=float(r.get("commercial_feed_bags") or 0.0),
                commercial_feed_kg=float(r.get("commercial_feed_kg") or (float(r.get("commercial_feed_bags") or 0.0) * 25.0)),
                vaat_kg=float(r.get("vaat_kg") or 0.0),
                feeding_time=r.get("feeding_time", "Morning"),
                weather_condition=r.get("weather_condition", "Normal"),
                logged_by="Sheet Bulk Import",
                notes=r.get("notes", "")
            )
            db.add(f)
            imported_count += 1
            
    elif import_type == "expenses":
        for r in rows:
            e = models.Expense(
                date=r.get("date") or datetime.now().strftime("%Y-%m-%d"),
                pond_id=int(r.get("pond_id")) if r.get("pond_id") else None,
                category=r.get("category", "Misc"),
                amount_bdt=float(r.get("amount_bdt", 0.0)),
                description=r.get("description", "Sheet import"),
                voucher_no=r.get("voucher_no", ""),
                recorded_by="Sheet Bulk Import"
            )
            db.add(e)
            imported_count += 1

    db.commit()
    return {"status": "success", "imported_count": imported_count, "message": f"{imported_count} rows imported successfully into database."}

@app.get("/api/sync/printable-sheet-template")
def get_printable_sheet_template():
    """Generates markdown / text template for physical paper printing or Excel copy-paste"""
    template = [
        {"Date (তারিখ)": "2026-10-15", "Pond (পুকুর)": "Pond 1", "Commercial Feed Bags": "2.5", "Feed Kg": "62.5", "Vaat Kg (ভাত)": "30", "Time": "Morning", "Weather": "Sunny", "Notes": "Good response"},
        {"Date (তারিখ)": "2026-10-15", "Pond (পুকুর)": "Pond 2", "Commercial Feed Bags": "6.0", "Feed Kg": "150.0", "Vaat Kg (ভাত)": "75", "Time": "Morning & Afternoon", "Weather": "Sunny", "Notes": "Healthy"}
    ]
    return {
        "columns": ["date", "pond_id", "commercial_feed_bags", "commercial_feed_kg", "vaat_kg", "feeding_time", "weather_condition", "notes"],
        "sample_data": template,
        "instructions": "Copy rows from Excel or fill paper sheet and paste JSON/CSV into bulk import."
    }

# ================= COMPREHENSIVE COSTING REPORT (DAILY, WEEKLY, MONTHLY, 6-MONTH CYCLE) =================

@app.get("/api/reports/costing")
def get_costing_report(
    period: str = "cycle", # "daily", "weekly", "monthly", "cycle", "custom"
    target_date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    pond_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    today_dt = datetime.now().date()
    if target_date:
        try:
            ref_dt = datetime.strptime(target_date, "%Y-%m-%d").date()
        except Exception:
            ref_dt = today_dt
    else:
        ref_dt = today_dt

    if period == "daily":
        s_date = ref_dt.strftime("%Y-%m-%d")
        e_date = s_date
        period_label = f"দৈনিক খরচ ও খাদ্য রিপোর্ট ({s_date})"
    elif period == "weekly":
        start_dt = ref_dt - timedelta(days=6)
        s_date = start_dt.strftime("%Y-%m-%d")
        e_date = ref_dt.strftime("%Y-%m-%d")
        period_label = f"সাপ্তাহিক রিপোর্ট ({s_date} হতে {e_date})"
    elif period == "monthly":
        start_dt = ref_dt.replace(day=1)
        next_month = ref_dt.replace(day=28) + timedelta(days=4)
        end_dt = next_month - timedelta(days=next_month.day)
        s_date = start_dt.strftime("%Y-%m-%d")
        e_date = end_dt.strftime("%Y-%m-%d")
        period_label = f"মাসিক রিপোর্ট ({ref_dt.strftime('%B %Y')})"
    elif period == "cycle":
        s_date = "2026-09-18"
        e_date = "2027-03-18"
        period_label = "সম্পূর্ণ ৬ মাসের কালচার সাইকেল (Full 6-Month Culture Cycle: ১৮/০৯/২০২৬ - ১৮/০৩/২০২৭)"
    elif period == "custom":
        s_date = start_date or "2026-09-18"
        e_date = end_date or today_dt.strftime("%Y-%m-%d")
        period_label = f"কাস্টম তারিখ রিপোর্ট ({s_date} হতে {e_date})"
    else:
        s_date = "2026-09-18"
        e_date = today_dt.strftime("%Y-%m-%d")
        period_label = f"রিপোর্ট ({s_date} হতে {e_date})"

    # 1. Average feed cost per bag from inventory
    inventory = db.query(models.FeedInventory).all()
    total_feed_bags_bought = sum(b.bag_count for b in inventory)
    total_feed_spent = sum(b.total_cost for b in inventory)
    avg_feed_rate_per_bag = round(total_feed_spent / max(1, total_feed_bags_bought), 2)

    # 2. Feed consumption in range
    feeding_q = db.query(models.DailyFeeding).filter(
        models.DailyFeeding.date >= s_date,
        models.DailyFeeding.date <= e_date
    )
    if pond_id:
        feeding_q = feeding_q.filter(models.DailyFeeding.pond_id == pond_id)
    feedings = feeding_q.order_by(models.DailyFeeding.date.desc()).all()

    feed_bags_consumed = sum(f.commercial_feed_bags for f in feedings)
    feed_kg_consumed = sum(f.commercial_feed_kg for f in feedings)
    vaat_kg_consumed = sum(f.vaat_kg for f in feedings)
    feed_consumed_cost_bdt = round(feed_bags_consumed * avg_feed_rate_per_bag, 2)

    # 3. Vaat supplies / Rice preparation in range
    vaat_q = db.query(models.VaatSupply).filter(
        models.VaatSupply.date >= s_date,
        models.VaatSupply.date <= e_date
    )
    vaat_records = vaat_q.order_by(models.VaatSupply.date.desc()).all()
    vaat_raw_rice_kg = sum(v.raw_rice_kg for v in vaat_records)
    vaat_cost_bdt = sum((v.rice_cost_bdt + v.cooking_fuel_cost_bdt) for v in vaat_records)

    # 4. Other Expenses in range
    exp_q = db.query(models.Expense).filter(
        models.Expense.date >= s_date,
        models.Expense.date <= e_date
    )
    if pond_id:
        exp_q = exp_q.filter((models.Expense.pond_id == pond_id) | (models.Expense.pond_id == None))
    expenses = exp_q.order_by(models.Expense.date.desc()).all()

    cost_categories = {
        "Medicine & Lime": 0.0,
        "Electricity & Fuel": 0.0,
        "Labor Wages": 0.0,
        "Maintenance": 0.0,
        "Misc": 0.0
    }
    for e in expenses:
        cat = e.category
        if cat in cost_categories:
            cost_categories[cat] += e.amount_bdt
        else:
            cost_categories[cat] = cost_categories.get(cat, 0.0) + e.amount_bdt

    # 5. Stockings in range
    stock_q = db.query(models.StockingEvent).filter(
        models.StockingEvent.date >= s_date,
        models.StockingEvent.date <= e_date
    )
    if pond_id:
        stock_q = stock_q.filter(models.StockingEvent.pond_id == pond_id)
    stockings = stock_q.order_by(models.StockingEvent.date.desc()).all()
    pona_stocking_cost = sum(s.cost_bdt for s in stockings)

    # 6. Feed inventory purchased in range
    inv_q = db.query(models.FeedInventory).filter(
        models.FeedInventory.date >= s_date,
        models.FeedInventory.date <= e_date
    )
    inv_batches = inv_q.order_by(models.FeedInventory.date.desc()).all()
    feed_purchased_bags = sum(b.bag_count for b in inv_batches)
    feed_purchased_cost_bdt = sum(b.total_cost for b in inv_batches)

    # 7. Harvest / Sales in range
    harv_q = db.query(models.HarvestSale).filter(
        models.HarvestSale.date >= s_date,
        models.HarvestSale.date <= e_date
    )
    if pond_id:
        harv_q = harv_q.filter(models.HarvestSale.pond_id == pond_id)
    harvests = harv_q.order_by(models.HarvestSale.date.desc()).all()
    harvest_revenue_bdt = sum(h.total_income_bdt for h in harvests)
    harvest_weight_kg = sum(h.total_weight_kg for h in harvests)

    # 8. Total Costing Summary for Period
    total_other_expenses = sum(cost_categories.values())
    total_period_cost_bdt = round(
        feed_consumed_cost_bdt + vaat_cost_bdt + total_other_expenses + pona_stocking_cost,
        2
    )

    # 9. Itemized Chronological Ledger
    ledger = []
    # Feedings
    for f in feedings:
        pond_label = f"পুকুর {f.pond_id}"
        f_cost = round(f.commercial_feed_bags * avg_feed_rate_per_bag, 2)
        ledger.append({
            "date": f.date,
            "type": "খাবার প্রদান (Commercial Feed)",
            "pond": pond_label,
            "description": f"{f.commercial_feed_bags} ব্যাগ ({f.commercial_feed_kg} কেজি) • সময়: {f.feeding_time}",
            "quantity": f"{f.commercial_feed_bags} ব্যাগ",
            "amount_bdt": f_cost,
            "badge_color": "cyan"
        })
        if f.vaat_kg > 0:
            ledger.append({
                "date": f.date,
                "type": "ভাত প্রদান (Cooked Vaat)",
                "pond": pond_label,
                "description": f"{f.vaat_kg} কেজি সিদ্ধ ভাত সরবরাহ",
                "quantity": f"{f.vaat_kg} কেজি",
                "amount_bdt": 0.0,
                "badge_color": "amber"
            })

    # Expenses
    for e in expenses:
        pond_label = f"পুকুর {e.pond_id}" if e.pond_id else "সমগ্র খামার"
        ledger.append({
            "date": e.date,
            "type": f"{e.category}",
            "pond": pond_label,
            "description": f"{e.description} • ভাউচার: {e.voucher_no or '-'}",
            "quantity": "১ টি বিল",
            "amount_bdt": e.amount_bdt,
            "badge_color": "rose"
        })

    # Stockings
    for s in stockings:
        pond_label = f"পুকুর {s.pond_id}"
        ledger.append({
            "date": s.date,
            "type": "পোনা ছাড়করণ (Stocking)",
            "pond": pond_label,
            "description": f"{s.fish_type} — {s.count_pcs:,} পিস ({s.pcs_per_kg} pc/kg, মোট {s.initial_weight_kg} কেজি)",
            "quantity": f"{s.count_pcs:,} পিস",
            "amount_bdt": s.cost_bdt,
            "badge_color": "emerald"
        })

    # Sort ledger by date descending
    ledger.sort(key=lambda x: x["date"], reverse=True)

    # 10. 6-Month Full Cycle Projections
    cycle_total_fish = sum(s.count_pcs for s in db.query(models.StockingEvent).all())
    cycle_projected_biomass_kg = 75480.0
    cycle_est_feed_bags = round((cycle_projected_biomass_kg * 1.35) / 25.0, 0)
    cycle_est_feed_cost = round(cycle_est_feed_bags * avg_feed_rate_per_bag, 2)
    cycle_est_revenue = round(cycle_projected_biomass_kg * 155.0, 2)
    cycle_est_net_profit = round(cycle_est_revenue - (cycle_est_feed_cost + total_feed_spent + total_other_expenses + 287355.0 - total_feed_spent), 2)

    return {
        "period": period,
        "period_label": period_label,
        "start_date": s_date,
        "end_date": e_date,
        "pond_id": pond_id,
        "summary": {
            "feed_bags_consumed": round(feed_bags_consumed, 1),
            "feed_kg_consumed": round(feed_kg_consumed, 1),
            "avg_feed_rate_per_bag": avg_feed_rate_per_bag,
            "feed_consumed_cost_bdt": feed_consumed_cost_bdt,
            "vaat_kg_consumed": round(vaat_kg_consumed, 1),
            "vaat_cost_bdt": round(vaat_cost_bdt, 2),
            "medicine_lime_cost_bdt": round(cost_categories.get("Medicine & Lime", 0.0), 2),
            "electricity_fuel_cost_bdt": round(cost_categories.get("Electricity & Fuel", 0.0), 2),
            "labor_wages_cost_bdt": round(cost_categories.get("Labor Wages", 0.0), 2),
            "maintenance_cost_bdt": round(cost_categories.get("Maintenance", 0.0), 2),
            "misc_cost_bdt": round(cost_categories.get("Misc", 0.0), 2),
            "pona_stocking_cost_bdt": round(pona_stocking_cost, 2),
            "total_other_expenses_bdt": round(total_other_expenses, 2),
            "total_period_cost_bdt": total_period_cost_bdt,
            "feed_purchased_bags": feed_purchased_bags,
            "feed_purchased_cost_bdt": feed_purchased_cost_bdt,
            "harvest_revenue_bdt": round(harvest_revenue_bdt, 2),
            "harvest_weight_kg": round(harvest_weight_kg, 2),
            "net_cashflow_bdt": round(harvest_revenue_bdt - total_period_cost_bdt, 2)
        },
        "by_category": {
            "বাণিজ্যিক ফিড খরচ (Commercial Feed)": feed_consumed_cost_bdt,
            "ওষুধ ও চুন (Medicine & Lime)": round(cost_categories.get("Medicine & Lime", 0.0), 2),
            "বিদ্যুৎ ও ডিজেল (Electricity & Fuel)": round(cost_categories.get("Electricity & Fuel", 0.0), 2),
            "শ্রমিক মজুরি (Labor Wages)": round(cost_categories.get("Labor Wages", 0.0), 2),
            "ভাত ও চাল (Rice / Vaat)": round(vaat_cost_bdt, 2),
            "পোনা ক্রয় (Fingerlings)": round(pona_stocking_cost, 2),
            "মেরামত ও অন্যান্য (Maintenance & Misc)": round(cost_categories.get("Maintenance", 0.0) + cost_categories.get("Misc", 0.0), 2)
        },
        "six_month_cycle": {
            "cycle_start_date": "2026-09-18",
            "cycle_end_date": "2027-03-18",
            "total_duration_days": 181,
            "total_stocked_pcs": cycle_total_fish,
            "projected_harvest_biomass_kg": cycle_projected_biomass_kg,
            "projected_harvest_maund": round(cycle_projected_biomass_kg / 40, 1),
            "estimated_total_feed_bags": cycle_est_feed_bags,
            "estimated_total_feed_cost_bdt": cycle_est_feed_cost,
            "projected_gross_revenue_bdt": cycle_est_revenue,
            "projected_net_profit_bdt": cycle_est_net_profit,
            "actual_feed_bags_consumed_to_date": round(sum(f.commercial_feed_bags for f in db.query(models.DailyFeeding).all()), 1),
            "actual_feed_cost_spent_to_date": total_feed_spent,
            "actual_total_spent_to_date": round(total_feed_spent + 287355.0 + sum(e.amount_bdt for e in db.query(models.Expense).all()), 2)
        },
        "ledger": ledger
    }

# Mount frontend static build if exists
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
