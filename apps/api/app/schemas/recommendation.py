"""NIVA — Pydantic schemas for Recommendations and Gate decisions."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GateVerdictResponse(BaseModel):
    product_type: str
    product_name: str
    decision: str  # "RECOMMEND" | "SUPPRESS" | "ESCALATE"
    
    # Eligibility
    is_eligible: bool
    eligibility_factors: list[dict]
    
    # Suitability
    is_suitable: bool
    suitability_factors: list[dict]
    
    # Gate reasoning
    gate_reason: str
    policy_id: Optional[str] = None
    
    # Alternative
    alternative_action: Optional[str] = None
    alternative_product: Optional[str] = None
    
    # Impact projections
    risk_shift: Optional[str] = None
    interest_saved: Optional[float] = None
    recovery_time_days: Optional[int] = None
    
    # Metadata
    model_version: str = "v1.0"
    created_at: datetime


class RecommendationListResponse(BaseModel):
    user_id: str
    recommendations: list[GateVerdictResponse]
    suppressed_count: int
    recommended_count: int


class BankCustomerSummary(BaseModel):
    user_id: str
    name: str
    persona_id: Optional[str] = None
    health_score: int
    stress_score: int
    stress_level: str
    anomaly_score: int
    gate_verdict: Optional[str] = None
    gate_policy: Optional[str] = None
    monthly_income: float
    available_balance: float
    emi_to_income: float
    accounts_linked: int
    last_synced: Optional[datetime] = None


class AuditLogEntry(BaseModel):
    id: str
    timestamp: datetime
    actor: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    result: str
    details: Optional[dict] = None
    policy_id: Optional[str] = None
    integrity_hash: Optional[str] = None
