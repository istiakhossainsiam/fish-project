from database import SessionLocal, engine, Base
import models
import os

def seed_database(force=False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if force:
        print("Clearing old data for fresh reseed with exact project parameters...")
        db.query(models.DailyFeeding).delete()
        db.query(models.GrowthSampling).delete()
        db.query(models.StockingEvent).delete()
        db.query(models.FeedInventory).delete()
        db.query(models.VaatSupply).delete()
        db.query(models.Expense).delete()
        db.query(models.HarvestSale).delete()
        db.query(models.FarmSetting).delete()
        db.query(models.Pond).delete()
        db.query(models.User).delete()
        db.commit()
    elif db.query(models.Pond).first():
        print("Database already contains data, skipping seed.")
        db.close()
        return

    print("Seeding Shah Amanat Fishery and Agro Project data...")

    # 1. Users
    users = [
        models.User(
            username="superadmin",
            full_name="Farm Owner (Shah Amanat Project Super Admin)",
            role="superadmin",
            pin="4023",
            password="admin123"
        ),
        models.User(
            username="manager",
            full_name="Farm Manager (শাহ আমানত খামার ইন-চার্জ)",
            role="manager",
            pin="1122",
            password="farm123"
        ),
        models.User(
            username="worker",
            full_name="Pond Field Worker (মাঠ কর্মী)",
            role="worker",
            pin="1234",
            password="work123"
        )
    ]
    db.add_all(users)
    db.commit()

    # 2. Ponds (4 Ponds)
    ponds = [
        models.Pond(
            name="Pond 1 (পুকুর ১)",
            size_acres=5.0,
            depth_feet=6.0,
            status="active",
            notes="Commercial pond. Stocked on 18/09/2026 with 14,500 Pangash (23pcs/kg) + 1,500 Carp."
        ),
        models.Pond(
            name="Pond 2 (পুকুর ২)",
            size_acres=5.0,
            depth_feet=6.5,
            status="active",
            notes="High density pond. Stocked in 3 phases (Pangash 40.5k + Carp 1.5k + Pangash 10.87k)."
        ),
        models.Pond(
            name="Pond 3 (পুকুর ৩)",
            size_acres=5.0,
            depth_feet=6.0,
            status="preparing",
            notes="Pond currently being treated with lime and cow dung for next batch."
        ),
        models.Pond(
            name="Pond 4 (পুকুর ৪)",
            size_acres=5.0,
            depth_feet=6.0,
            status="empty",
            notes="Pond under maintenance and desiltation."
        )
    ]
    db.add_all(ponds)
    db.commit()

    p1 = db.query(models.Pond).filter(models.Pond.name.like("%Pond 1%")).first()
    p2 = db.query(models.Pond).filter(models.Pond.name.like("%Pond 2%")).first()

    # 3. Stocking Events (From User's Prompt)
    # Pond 1:
    # 18/09/2026: 14500 pcs pangash pona @ 23 pcs/kg
    # 1500 pcs curf (carp)
    stockings = [
        models.StockingEvent(
            pond_id=p1.id,
            date="2026-09-18",
            fish_type="Pangash (পাঙ্গাশ পোনা)",
            count_pcs=14500,
            pcs_per_kg=23.0,
            initial_weight_kg=675.0, # 675 kg = 23 pc/kg = +-14,500 pcs
            cost_bdt=14500 * 2.80, # 40,600 BDT
            supplier="Hatchery Supplier",
            notes="৬৭৫ কেজি পোনা @ ২৩ পিস/কেজি = +-১৪,৫০০ পিস"
        ),
        models.StockingEvent(
            pond_id=p1.id,
            date="2026-09-19",
            fish_type="Carp / Curf (রুই, কাতলা, মৃগেল কার্প)",
            count_pcs=1500,
            pcs_per_kg=8.0,
            initial_weight_kg=round(1500 / 8.0, 2), # ~187.5 kg
            cost_bdt=1500 * 15.0, # 22,500 BDT
            supplier="Local Nursery",
            notes="Polyculture ecological balance carps."
        ),
        # Pond 2:
        # 21/09/2026: 40500 pcs pangash pona @ 20 pcs/kg
        # 26/09/2026: 1500 pcs curf
        # 13/10/2026: 10870 pcs pangash pona @ 10 pcs/kg
        models.StockingEvent(
            pond_id=p2.id,
            date="2026-09-21",
            fish_type="Pangash (পাঙ্গাশ পোনা - ১ম চালান)",
            count_pcs=40500,
            pcs_per_kg=20.0,
            initial_weight_kg=round(40500 / 20.0, 2), # 2025.0 kg
            cost_bdt=40500 * 3.20, # 129,600 BDT
            supplier="Seed Nursery",
            notes="First major stocking at 20 pcs/kg (50g each)."
        ),
        models.StockingEvent(
            pond_id=p2.id,
            date="2026-09-26",
            fish_type="Carp / Curf (কার্প মিশ্র)",
            count_pcs=1500,
            pcs_per_kg=7.5,
            initial_weight_kg=round(1500 / 7.5, 2), # 200.0 kg
            cost_bdt=1500 * 16.0, # 24,000 BDT
            supplier="Local Nursery",
            notes="Carp added for pond bottom aeration & algae control."
        ),
        models.StockingEvent(
            pond_id=p2.id,
            date="2026-10-13",
            fish_type="Pangash (পাঙ্গাশ পোনা - ২য় চালান)",
            count_pcs=10870,
            pcs_per_kg=10.0,
            initial_weight_kg=round(10870 / 10.0, 2), # 1087.0 kg
            cost_bdt=10870 * 6.50, # 70,655 BDT
            supplier="Nursery Supplier",
            notes="Larger fingerlings at 10 pcs/kg (100g each)."
        )
    ]
    db.add_all(stockings)
    db.commit()

    # 4. Feed Inventory: Exactly as requested by user
    # 21/09/2026 batch no 202 50 bags in 1825tk/bag
    # 29/09/2026 batch no 202 60 bags in 1875tk/bag
    # 05/10/2026 batch no 202 100 bags in 1875tk/bag
    # 13/10/2026 batch no 204 100 bags in 1775tk/bag
    feed_batches = [
        models.FeedInventory(
            date="2026-09-21",
            brand_name="Fish Feed (Batch #202)",
            feed_type="Pellet Feed - Batch 202",
            bag_count=50,
            bag_weight_kg=25.0,
            rate_per_bag=1825.0,
            total_cost=50 * 1825.0, # 91,250 BDT
            supplier="Feed Distributor, Chittagong",
            invoice_no="BATCH-202-A",
            notes="21/09/2026: Batch 202 (50 bags @ 1825 tk/bag)"
        ),
        models.FeedInventory(
            date="2026-09-29",
            brand_name="Fish Feed (Batch #202)",
            feed_type="Pellet Feed - Batch 202",
            bag_count=60,
            bag_weight_kg=25.0,
            rate_per_bag=1875.0,
            total_cost=60 * 1875.0, # 112,500 BDT
            supplier="Feed Distributor, Chittagong",
            invoice_no="BATCH-202-B",
            notes="29/09/2026: Batch 202 (60 bags @ 1875 tk/bag)"
        ),
        models.FeedInventory(
            date="2026-10-05",
            brand_name="Fish Feed (Batch #202)",
            feed_type="Pellet Feed - Batch 202",
            bag_count=100,
            bag_weight_kg=25.0,
            rate_per_bag=1875.0,
            total_cost=100 * 1875.0, # 187,500 BDT
            supplier="Feed Distributor, Chittagong",
            invoice_no="BATCH-202-C",
            notes="05/10/2026: Batch 202 (100 bags @ 1875 tk/bag)"
        ),
        models.FeedInventory(
            date="2026-10-13",
            brand_name="Fish Feed (Batch #204)",
            feed_type="Pellet Feed - Batch 204",
            bag_count=100,
            bag_weight_kg=25.0,
            rate_per_bag=1775.0,
            total_cost=100 * 1775.0, # 177,500 BDT
            supplier="Feed Distributor, Chittagong",
            invoice_no="BATCH-204-A",
            notes="13/10/2026: Batch 204 (100 bags @ 1775 tk/bag)"
        )
    ]
    db.add_all(feed_batches)
    db.commit()

    # 5. Vaat (Cooked Rice): User stated: "ekhono porjonoto kono vaat dewa hoy ni pore dewa hbe"
    # No vaat consumed yet! Table is empty and ready for future logs.

    # 6. Daily Feedings (Commercial Feed only, started officially on 21/09/2026)
    daily_feedings = [
        # 21/09/2026 - First feeding day
        models.DailyFeeding(date="2026-09-21", pond_id=p1.id, commercial_feed_bags=1.5, commercial_feed_kg=37.5, vaat_kg=0.0, feeding_time="Morning", weather_condition="Sunny", logged_by="manager", notes="Feeding officially started. Batch 202 nursery feed."),
        models.DailyFeeding(date="2026-09-21", pond_id=p2.id, commercial_feed_bags=3.0, commercial_feed_kg=75.0, vaat_kg=0.0, feeding_time="Afternoon", weather_condition="Sunny", logged_by="worker", notes="First feeding after stocking Pond 2."),
        
        # 24/09/2026
        models.DailyFeeding(date="2026-09-24", pond_id=p1.id, commercial_feed_bags=1.5, commercial_feed_kg=37.5, vaat_kg=0.0, feeding_time="Morning", weather_condition="Normal", logged_by="worker", notes="Active feeding on surface."),
        models.DailyFeeding(date="2026-09-24", pond_id=p2.id, commercial_feed_bags=3.5, commercial_feed_kg=87.5, vaat_kg=0.0, feeding_time="Morning & Afternoon", weather_condition="Normal", logged_by="worker", notes="Cleaned feeding trays in 30 mins."),
        
        # 28/09/2026
        models.DailyFeeding(date="2026-09-28", pond_id=p1.id, commercial_feed_bags=2.0, commercial_feed_kg=50.0, vaat_kg=0.0, feeding_time="Morning", weather_condition="Clear", logged_by="worker", notes="Feed increased as fish grew."),
        models.DailyFeeding(date="2026-09-28", pond_id=p2.id, commercial_feed_bags=4.0, commercial_feed_kg=100.0, vaat_kg=0.0, feeding_time="Morning & Afternoon", weather_condition="Clear", logged_by="worker", notes="Good appetite after carp added."),

        # 02/10/2026
        models.DailyFeeding(date="2026-10-02", pond_id=p1.id, commercial_feed_bags=2.0, commercial_feed_kg=50.0, vaat_kg=0.0, feeding_time="Morning", weather_condition="Partly Cloudy", logged_by="worker", notes="Feed intake regular."),
        models.DailyFeeding(date="2026-10-02", pond_id=p2.id, commercial_feed_bags=4.5, commercial_feed_kg=112.5, vaat_kg=0.0, feeding_time="Morning & Afternoon", weather_condition="Partly Cloudy", logged_by="worker", notes="Fish very responsive."),

        # 06/10/2026
        models.DailyFeeding(date="2026-10-06", pond_id=p1.id, commercial_feed_bags=2.0, commercial_feed_kg=50.0, vaat_kg=0.0, feeding_time="Morning", weather_condition="Sunny", logged_by="worker", notes="Feed checked during sampling week."),
        models.DailyFeeding(date="2026-10-06", pond_id=p2.id, commercial_feed_bags=5.0, commercial_feed_kg=125.0, vaat_kg=0.0, feeding_time="Morning & Afternoon", weather_condition="Sunny", logged_by="worker", notes="Batch 202 grower feed."),

        # 11/10/2026
        models.DailyFeeding(date="2026-10-11", pond_id=p1.id, commercial_feed_bags=2.5, commercial_feed_kg=62.5, vaat_kg=0.0, feeding_time="Morning", weather_condition="Sunny", logged_by="worker", notes="Batch 202 feed used."),
        models.DailyFeeding(date="2026-10-11", pond_id=p2.id, commercial_feed_bags=5.5, commercial_feed_kg=137.5, vaat_kg=0.0, feeding_time="Morning & Afternoon", weather_condition="Sunny", logged_by="worker", notes="Aggressive surface feeding."),

        # 14/10/2026
        models.DailyFeeding(date="2026-10-14", pond_id=p1.id, commercial_feed_bags=2.5, commercial_feed_kg=62.5, vaat_kg=0.0, feeding_time="Morning", weather_condition="Coastal Breeze", logged_by="manager", notes="All feed consumed in 20 minutes."),
        models.DailyFeeding(date="2026-10-14", pond_id=p2.id, commercial_feed_bags=6.5, commercial_feed_kg=162.5, vaat_kg=0.0, feeding_time="Morning & Afternoon", weather_condition="Coastal Breeze", logged_by="worker", notes="New Batch 204 feed added for bigger fish."),

        # 15/10/2026 (Today)
        models.DailyFeeding(date="2026-10-15", pond_id=p1.id, commercial_feed_bags=2.5, commercial_feed_kg=62.5, vaat_kg=0.0, feeding_time="Morning", weather_condition="Clear", logged_by="worker", notes="Healthy activity observed."),
        models.DailyFeeding(date="2026-10-15", pond_id=p2.id, commercial_feed_bags=6.5, commercial_feed_kg=162.5, vaat_kg=0.0, feeding_time="Morning & Afternoon", weather_condition="Clear", logged_by="worker", notes="Feed bags logged on time.")
    ]
    db.add_all(daily_feedings)
    db.commit()

    # 7. Growth Sampling (Every 15-18 Days)
    samplings = [
        models.GrowthSampling(
            pond_id=p1.id,
            date="2026-10-05",
            fish_type="Pangash",
            sample_count_pcs=50,
            total_sample_weight_kg=3.57, # 14 pcs/kg
            calculated_pcs_per_kg=14.0,
            avg_weight_grams=71.4,
            estimated_survival_pct=96.0,
            estimated_biomass_kg=round((14500 * 0.96) * 0.0714, 2), # ~993 kg
            calculated_fcr=1.35,
            next_check_date="2026-10-21",
            remarks="Excellent growth from 43.5g (23/kg) to 71.4g (14/kg) in 17 days."
        ),
        models.GrowthSampling(
            pond_id=p2.id,
            date="2026-10-08",
            fish_type="Pangash (১ম চালান)",
            sample_count_pcs=60,
            total_sample_weight_kg=4.44, # 13.5 pcs/kg
            calculated_pcs_per_kg=13.5,
            avg_weight_grams=74.0,
            estimated_survival_pct=95.0,
            estimated_biomass_kg=round((40500 * 0.95) * 0.074, 2), # ~2847 kg
            calculated_fcr=1.38,
            next_check_date="2026-10-24",
            remarks="Pond 2 sampling shows good uniform growth. Healthy fins and body."
        )
    ]
    db.add_all(samplings)
    db.commit()

    # 8. Operational Expenses - Including 21/09/2026 Medicine 4L @ 2,730 tk
    expenses = [
        models.Expense(
            date="2026-09-21",
            pond_id=None,
            category="Medicine & Lime",
            amount_bdt=2730.0,
            description="Medicine (ওষুধ) 4 Litres for fish health & water conditioning",
            voucher_no="MED-2109",
            recorded_by="manager"
        ),
        models.Expense(
            date="2026-09-15",
            pond_id=p1.id,
            category="Medicine & Lime",
            amount_bdt=12500.0,
            description="Quick lime (চুন) 250 kg + Geolite for pond soil & water preparation",
            voucher_no="V-0101",
            recorded_by="manager"
        ),
        models.Expense(
            date="2026-09-16",
            pond_id=p2.id,
            category="Medicine & Lime",
            amount_bdt=15000.0,
            description="Lime 300 kg + Disinfectant application",
            voucher_no="V-0102",
            recorded_by="manager"
        ),
        models.Expense(
            date="2026-09-30",
            pond_id=None,
            category="Electricity & Fuel",
            amount_bdt=18500.0,
            description="Diesel for pump and electricity for pond aeration",
            voucher_no="V-0118",
            recorded_by="superadmin"
        ),
        models.Expense(
            date="2026-10-01",
            pond_id=None,
            category="Labor Wages",
            amount_bdt=24000.0,
            description="Monthly wages for 2 full-time caretakers & night security",
            voucher_no="V-0125",
            recorded_by="superadmin"
        )
    ]
    db.add_all(expenses)

    # 9. Farm Settings - Exact location: Shah Amanat International Airport, Chittagong
    settings = [
        models.FarmSetting(key="farm_name", value="Shah Amanat Fishery and Agro Project"),
        models.FarmSetting(key="total_ponds", value="4"),
        models.FarmSetting(key="pond_size_acres", value="5"),
        models.FarmSetting(key="latitude", value="22.2496"), # Shah Amanat Airport, Chittagong
        models.FarmSetting(key="longitude", value="91.8133"),
        models.FarmSetting(key="location_name", value="Shah Amanat Airport, Patenga, Chattogram"),
        models.FarmSetting(key="timezone", value="Asia/Dhaka"),
        models.FarmSetting(key="target_harvest_pangash_kg", value="1.2"),
        models.FarmSetting(key="est_pangash_sale_price_bdt", value="155.0"),
        models.FarmSetting(key="est_carp_sale_price_bdt", value="260.0"),
    ]
    # 10. Initial 6-Month Culture Cycles for Pond 1 & Pond 2
    cycles = [
        models.PondCycle(
            pond_id=p1.id,
            cycle_number=1,
            cycle_name="পুকুর ১ - ১ম সাইকেল (পাঙ্গাশ ও কার্প ৬ মাস)",
            start_date="2026-09-18",
            expected_end_date="2027-03-18",
            status="active",
            initial_fish_count=16000,
            initial_stock_weight_kg=862.5,
            target_harvest_biomass_kg=19000.0,
            total_feed_bags_used=13.0,
            total_feed_cost_bdt=23850.84,
            total_expenses_bdt=75600.0,
            notes="পুকুর ১ এর প্রথম ৬ মাসের বাণিজ্যিক কালচার। ১৮/০৯/২০২৬ এ পোনা ছাড়া হয়েছে।"
        ),
        models.PondCycle(
            pond_id=p2.id,
            cycle_number=1,
            cycle_name="পুকুর ২ - ১ম সাইকেল (পাঙ্গাশ উচ্চঘনত্ব ৬ মাস)",
            start_date="2026-09-21",
            expected_end_date="2027-03-21",
            status="active",
            initial_fish_count=52870,
            initial_stock_weight_kg=3312.0,
            target_harvest_biomass_kg=56000.0,
            total_feed_bags_used=42.0,
            total_feed_cost_bdt=77056.56,
            total_expenses_bdt=188600.0,
            notes="পুকুর ২ এর উচ্চঘনত্ব পাঙ্গাশ ও কার্প সাইকেল। ২১/০৯/২০২৬ থেকে শুরু।"
        )
    ]
    db.add_all(cycles)
    db.commit()

    c1 = db.query(models.PondCycle).filter(models.PondCycle.pond_id == p1.id).first()
    c2 = db.query(models.PondCycle).filter(models.PondCycle.pond_id == p2.id).first()

    # 11. Sample Investors
    investors = [
        models.Investor(
            name="আলহাজ্ব রফিক উদ্দিন (Haji Rafiq Uddin)",
            phone="01819-234567",
            email="rafiq.ctg@example.com",
            nid="1982736152890",
            address="পতেঙ্গা সি বিচ রোড, চট্টগ্রাম",
            notes="লোকাল পার্টনার ইনভেস্টর • পুকুর ১ সাইকেল ইনভেস্টমেন্ট"
        ),
        models.Investor(
            name="ইঞ্জিনিয়ার জহিরুল ইসলাম (Engr. Zahirul Islam)",
            phone="01712-890123",
            email="zahirul.agro@example.com",
            nid="1978263541234",
            address="জিইসি মোড়, চট্টগ্রাম",
            notes="প্রকল্প পার্টনার • পুকুর ২ উচ্চঘনত্ব সাইকেল ইনভেস্টমেন্ট"
        )
    ]
    db.add_all(investors)
    db.commit()

    inv1 = db.query(models.Investor).filter(models.Investor.phone == "01819-234567").first()
    inv2 = db.query(models.Investor).filter(models.Investor.phone == "01712-890123").first()

    # 12. Investments with Profit Share Percentage
    investments = [
        models.Investment(
            investor_id=inv1.id,
            cycle_id=c1.id if c1 else None,
            pond_id=p1.id,
            amount_bdt=300000.0,
            investment_date="2026-09-20",
            share_percentage=10.0, # 10% of cycle net profit
            profit_share_type="profit_share",
            payout_status="active",
            agreement_terms="পুকুর ১ এর ১ম সাইকেল (১৮/০৯/২০২৬ - ১৮/০৩/২০২৭) এর বিক্রয়োত্তর মোট নিট মুনাফার ১০% লভ্যাংশ প্রদান।"
        ),
        models.Investment(
            investor_id=inv2.id,
            cycle_id=c2.id if c2 else None,
            pond_id=p2.id,
            amount_bdt=500000.0,
            investment_date="2026-09-25",
            share_percentage=15.0, # 15% of cycle net profit
            profit_share_type="profit_share",
            payout_status="active",
            agreement_terms="পুকুর ২ এর ১ম সাইকেল এর মোট নিট মুনাফার ১৫% লভ্যাংশ ও মূলধন ফেরত চুক্তি।"
        )
    ]
    db.add_all(investments)
    db.commit()

    print("Database seeding completed with Shah Amanat Fishery and Agro Project data, Cycles & Investors!")
    db.close()

if __name__ == "__main__":
    seed_database(force=True)
