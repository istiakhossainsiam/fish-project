from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="worker") # 'superadmin', 'manager', 'worker'
    pin = Column(String(10), default="1234") # Quick PIN for mobile worker login
    password = Column(String(100), default="admin123")
    created_at = Column(DateTime, default=datetime.utcnow)

class Pond(Base):
    __tablename__ = "ponds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # "Pond 1", "Pond 2", etc.
    size_acres = Column(Float, default=5.0)
    depth_feet = Column(Float, default=6.0)
    status = Column(String(20), default="active") # "active", "empty", "preparing"
    notes = Column(Text, nullable=True)

    stockings = relationship("StockingEvent", back_populates="pond", cascade="all, delete-orphan")
    feedings = relationship("DailyFeeding", back_populates="pond", cascade="all, delete-orphan")
    samplings = relationship("GrowthSampling", back_populates="pond", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="pond")
    harvests = relationship("HarvestSale", back_populates="pond")

class StockingEvent(Base):
    __tablename__ = "stocking_events"

    id = Column(Integer, primary_key=True, index=True)
    pond_id = Column(Integer, ForeignKey("ponds.id"), nullable=False)
    date = Column(String(20), nullable=False) # e.g. "2026-09-18"
    fish_type = Column(String(50), nullable=False) # "Pangash", "Carp / Curf", etc.
    count_pcs = Column(Integer, nullable=False) # e.g. 14500, 40500, 1500, 10870
    pcs_per_kg = Column(Float, nullable=True) # e.g. 23.0, 20.0, 10.0
    initial_weight_kg = Column(Float, default=0.0) # count_pcs / pcs_per_kg
    cost_bdt = Column(Float, default=0.0) # purchase cost of fingerlings
    supplier = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    pond = relationship("Pond", back_populates="stockings")

class FeedInventory(Base):
    __tablename__ = "feed_inventory"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20), nullable=False)
    brand_name = Column(String(100), nullable=False) # e.g. "CP Fish Feed", "Mega Feed", "Aftab"
    feed_type = Column(String(50), default="Floating Pellet 28%") # "Starter", "Grower", "Finisher"
    bag_count = Column(Integer, nullable=False) # 50, 60, 100, 100 bags
    bag_weight_kg = Column(Float, default=25.0) # standard 25 kg bag in Bangladesh
    rate_per_bag = Column(Float, nullable=False) # in BDT
    total_cost = Column(Float, nullable=False)
    supplier = Column(String(100), nullable=True)
    invoice_no = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

class DailyFeeding(Base):
    __tablename__ = "daily_feedings"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20), nullable=False)
    pond_id = Column(Integer, ForeignKey("ponds.id"), nullable=False)
    commercial_feed_bags = Column(Float, default=0.0) # in bags (e.g. 2 bags)
    commercial_feed_kg = Column(Float, default=0.0) # in kg (e.g. 50 kg)
    vaat_kg = Column(Float, default=0.0) # Cooked Rice given (ভাত)
    feeding_time = Column(String(20), default="Morning") # "Morning", "Afternoon", "Evening", "Both"
    weather_condition = Column(String(50), nullable=True) # "Sunny", "Cloudy", "Rainy"
    logged_by = Column(String(50), default="Worker")
    notes = Column(Text, nullable=True)

    pond = relationship("Pond", back_populates="feedings")

class VaatSupply(Base):
    """Tracking raw rice bags, cooking expenses & bulk preparation for Vaat feeding"""
    __tablename__ = "vaat_supplies"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20), nullable=False)
    raw_rice_kg = Column(Float, default=0.0)
    rice_cost_bdt = Column(Float, default=0.0)
    cooking_fuel_cost_bdt = Column(Float, default=0.0)
    total_cooked_vaat_kg = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

class GrowthSampling(Base):
    """Growth checks every 15-18 days"""
    __tablename__ = "growth_samplings"

    id = Column(Integer, primary_key=True, index=True)
    pond_id = Column(Integer, ForeignKey("ponds.id"), nullable=False)
    date = Column(String(20), nullable=False)
    fish_type = Column(String(50), nullable=False) # "Pangash", "Carp"
    sample_count_pcs = Column(Integer, nullable=False) # e.g. 50 pieces
    total_sample_weight_kg = Column(Float, nullable=False) # e.g. 15.5 kg
    calculated_pcs_per_kg = Column(Float, nullable=False) # sample_count / weight
    avg_weight_grams = Column(Float, nullable=False) # total_sample_weight_kg * 1000 / sample_count
    estimated_survival_pct = Column(Float, default=95.0)
    estimated_biomass_kg = Column(Float, default=0.0)
    calculated_fcr = Column(Float, default=0.0) # Feed Conversion Ratio
    next_check_date = Column(String(20), nullable=True) # Auto-calculated ~16 days later
    remarks = Column(Text, nullable=True)

    pond = relationship("Pond", back_populates="samplings")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20), nullable=False)
    pond_id = Column(Integer, ForeignKey("ponds.id"), nullable=True) # Null if general farm cost
    category = Column(String(50), nullable=False) 
    # Categories: "Feed Purchase", "Rice / Vaat", "Pona / Stocking", "Medicine & Lime", "Electricity & Fuel", "Labor Wages", "Pond Lease", "Maintenance", "Transport", "Misc"
    amount_bdt = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)
    voucher_no = Column(String(50), nullable=True)
    recorded_by = Column(String(50), default="Manager")

    pond = relationship("Pond", back_populates="expenses")

class HarvestSale(Base):
    __tablename__ = "harvest_sales"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20), nullable=False)
    pond_id = Column(Integer, ForeignKey("ponds.id"), nullable=False)
    fish_type = Column(String(50), nullable=False)
    total_weight_kg = Column(Float, nullable=False)
    pcs_count = Column(Integer, nullable=True)
    rate_per_kg_bdt = Column(Float, nullable=False)
    total_income_bdt = Column(Float, nullable=False)
    buyer_name = Column(String(100), nullable=True) # Arat / Wholesaler name
    challan_no = Column(String(50), nullable=True)
    payment_status = Column(String(20), default="Paid") # "Paid", "Due", "Partial"
    payment_received_bdt = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

    pond = relationship("Pond", back_populates="harvests")

class FarmSetting(Base):
    __tablename__ = "farm_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(String(255), nullable=False)


# ================= 6-MONTH CULTURE CYCLES & INVESTOR PROFIT MODULE =================

class PondCycle(Base):
    """
    6-Month Aquaculture Cycle per pond or farm-wide.
    Can be started, ended, and renewed anytime after harvesting.
    """
    __tablename__ = "pond_cycles"

    id = Column(Integer, primary_key=True, index=True)
    pond_id = Column(Integer, ForeignKey("ponds.id"), nullable=False)
    cycle_number = Column(Integer, default=1)
    cycle_name = Column(String(100), nullable=False) # e.g. "পুকুর ১ - সাইকেল ১ (৬ মাস)"
    start_date = Column(String(20), nullable=False) # e.g. "2026-09-18"
    expected_end_date = Column(String(20), nullable=True) # e.g. "2027-03-18" (~6 months)
    actual_end_date = Column(String(20), nullable=True)
    status = Column(String(20), default="active") # "active", "harvested", "archived"
    
    # Stock and target
    initial_fish_count = Column(Integer, default=0)
    initial_stock_weight_kg = Column(Float, default=0.0)
    target_harvest_biomass_kg = Column(Float, default=0.0)
    
    # Financial metrics at close
    total_feed_bags_used = Column(Float, default=0.0)
    total_feed_cost_bdt = Column(Float, default=0.0)
    total_expenses_bdt = Column(Float, default=0.0) # fingerling, medicine, electricity, labor
    final_harvest_weight_kg = Column(Float, default=0.0)
    total_revenue_bdt = Column(Float, default=0.0)
    net_profit_bdt = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

    pond = relationship("Pond", backref="cycles")
    investments = relationship("Investment", back_populates="cycle")


class Investor(Base):
    """
    Investors who invest in pond cycles or the farm.
    """
    __tablename__ = "investors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # e.g. "রহিম চৌধুরী"
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    nid = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    investments = relationship("Investment", back_populates="investor", cascade="all, delete-orphan")


class Investment(Base):
    """
    Investments linked to an investor and cycle/pond with profit share calculation.
    """
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(Integer, ForeignKey("investors.id"), nullable=False)
    cycle_id = Column(Integer, ForeignKey("pond_cycles.id"), nullable=True)
    pond_id = Column(Integer, ForeignKey("ponds.id"), nullable=True)
    amount_bdt = Column(Float, nullable=False) # e.g. 5,00,000
    investment_date = Column(String(20), nullable=False) # e.g. "2026-09-20"
    share_percentage = Column(Float, default=0.0) # Agreed % of net profit or capital share
    profit_share_type = Column(String(30), default="profit_share") # "profit_share", "capital_ratio", "fixed_roi"
    fixed_roi_rate = Column(Float, default=0.0)
    payout_status = Column(String(20), default="active") # "active", "completed", "partial"
    payout_date = Column(String(20), nullable=True)
    paid_profit_bdt = Column(Float, default=0.0)
    returned_capital_bdt = Column(Float, default=0.0)
    voucher_no = Column(String(50), nullable=True)
    agreement_terms = Column(Text, nullable=True)

    investor = relationship("Investor", back_populates="investments")
    cycle = relationship("PondCycle", back_populates="investments")
