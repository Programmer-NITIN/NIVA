"""NIVA — Pydantic schemas for Recommendations and Gate decisions."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GateVerdictResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

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


class BankSchemeCreateRequest(BaseModel):
    scheme_id: str
    name: str
    category: str = "credit"  # "credit" | "business_credit" | "savings" | "protection" | "recovery"
    interest_rate_pct: float = 8.5
    max_amount: float = 50000.0
    tenure_months: int = 12
    min_income: float = 15000.0
    target_life_stage: str = "ALL"  # "MSME_KIRANA_SEASONAL" | "RURAL_AGRI_ALLIED" | "EARLY_CAREER_GIG" | "EARLY_CAREER_SALARIED" | "ESTABLISHED_FAMILY_HIGH_DEBT" | "ALL"
    max_stress_score: float = 50.0
    max_dti: float = 0.45
    risk_weight: float = 0.35
    is_active: bool = True
    description: str = ""
    originator_bank: str = "State Bank of India"
    subsidized: bool = False


class BankSchemeResponse(BaseModel):
    scheme_id: str
    name: str
    category: str
    interest_rate_pct: float
    max_amount: float
    tenure_months: int
    min_income: float
    target_life_stage: str
    max_stress_score: float
    max_dti: float
    risk_weight: float
    is_active: bool
    description: str
    originator_bank: str
    subsidized: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

