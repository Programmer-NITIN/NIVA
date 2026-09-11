"""NIVA — Pydantic schemas for Financial Twin and intelligence."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class IncomeMetrics(BaseModel):
    monthly_income: float
    stability: float  # 0-100
    growth_rate: float  # % change MoM
    sources: list[str] = []


class ExpenseMetrics(BaseModel):
    total: float
    essential: float
    discretionary: float
    essential_ratio: float
    trend: float  # % change from baseline


class SavingsMetrics(BaseModel):
    rate: float  # savings as % of income
    trend: float  # % change from baseline
    months_of_expenses: float  # emergency fund runway


class DebtMetrics(BaseModel):
    total_emi: float
    emi_to_income: float
    debt_to_income: float
    credit_utilization: Optional[float] = None
    credit_utilization_change: Optional[float] = None


class LiquidityMetrics(BaseModel):
    available_balance: float
    emergency_months: float


class SpendingCategory(BaseModel):
    category: str
    amount: float
    percentage: float
    trend: float  # % change from baseline
    is_essential: bool


class ChangeSignal(BaseModel):
    metric: str
    direction: str  # "up" | "down"
    magnitude: float  # % change
    description: str
    severity: str  # "info" | "warning" | "critical"


class StressFactor(BaseModel):
    factor: str
    value: float
    threshold: float
    contribution: int  # points added to stress score
    description: str


class FinancialTwinResponse(BaseModel):
    user_id: str
    persona_id: Optional[str] = None
    
    # Core metrics
    income: IncomeMetrics
    expenses: ExpenseMetrics
    savings: SavingsMetrics
    debt: DebtMetrics
    liquidity: LiquidityMetrics
    
    # Composite scores
    health_score: int  # 0-100
    stress_score: int  # 0-100
    stress_level: str  # "low" | "moderate" | "elevated" | "high" | "critical"
    anomaly_score: int  # 0-100
    
    # Spending breakdown
    spending_by_category: list[SpendingCategory]
    
    # What Changed
    changes: list[ChangeSignal]
    
    # Stress factors
    stress_factors: list[StressFactor]
    
    # Metadata
    window_days: int = 30
    computed_at: datetime
    data_source: str = "RBI Account Aggregator (Sandbox)"


class AffordabilityRequest(BaseModel):
    target_amount: float
    description: Optional[str] = None
    delay_months: int = 0
    emi_months: Optional[int] = None  # None = outright purchase


class AffordabilityResponse(BaseModel):
    target_amount: float
    affordable: str  # "YES" | "CONDITIONALLY" | "NO"
    
    # Balance analysis
    current_balance: float
    post_purchase_balance: float
    shortfall: Optional[float] = None
    
    # Buffer analysis
    current_emergency_months: float
    post_purchase_emergency_months: float
    target_emergency_months: float
    buffer_status: str  # "safe" | "warning" | "critical"
    
    # EMI analysis (if applicable)
    proposed_emi: Optional[float] = None
    new_emi_burden: Optional[float] = None
    emi_burden_status: Optional[str] = None
    
    # Recommendation
    safer_range_low: Optional[float] = None
    safer_range_high: Optional[float] = None
    recommended_delay_months: Optional[int] = None
    reasoning: str
