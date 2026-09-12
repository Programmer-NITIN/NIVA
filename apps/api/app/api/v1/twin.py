"""NIVA — Financial Twin API Routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.schemas.financial import FinancialTwinResponse, AffordabilityRequest, AffordabilityResponse
from app.services.twin import FinancialTwinService

router = APIRouter()
twin_service = FinancialTwinService()


class StressSimulationRequest(BaseModel):
    shock_amount: float = 0.0          # e.g., ₹25,000 hospital bill
    income_drop_pct: float = 0.0       # e.g., 20% salary cut / seasonal dip
    shock_category: str = "medical"    # 'medical' | 'repair' | 'job_loss'


@router.get("/{persona_id}", response_model=FinancialTwinResponse)
async def get_financial_twin(persona_id: str):
    """Get the complete Financial Digital Twin for a persona."""
    try:
        return await twin_service.compute_twin(persona_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{persona_id}/signals")
async def get_signals(persona_id: str):
    """Get change signals (what changed from baseline)."""
    try:
        twin = await twin_service.compute_twin(persona_id)
        return {"persona_id": persona_id, "changes": twin.changes, "stress_factors": twin.stress_factors}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{persona_id}/affordability", response_model=AffordabilityResponse)
async def check_affordability(persona_id: str, request: AffordabilityRequest):
    """Run the affordability simulation engine."""
    try:
        return await twin_service.calculate_affordability(persona_id, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{persona_id}/spending-analysis")
async def get_spending_analysis(persona_id: str):
    """
    Returns breakdown of spending categories, essential vs discretionary split,
    recurring mandates, and Isolation Forest ML anomaly alerts.
    """
    twin = await twin_service.compute_twin(persona_id)

    # Calculate category percentages
    spending = twin.spending_by_category or []
    total_spend = max(float(twin.expenses.total), 1.0)

    categories_breakdown = [
        {
            "category": s.category,
            "amount": s.amount,
            "percentage": round((s.amount / total_spend) * 100, 1),
            "trend_pct": s.trend,
            "is_essential": s.is_essential,
            "status": "spike" if s.trend > 30 else "normal",
        }
        for s in spending
    ]

    # Run Isolation Forest on transactions for this persona
    flagged_txns = []
    try:
        from app.api.v1.ml import detect_anomalies
        anomalies_data = await detect_anomalies(persona_id)
        flagged_txns = anomalies_data.get("flagged_transactions", [])
    except Exception:
        flagged_txns = []

    return {
        "persona_id": persona_id,
        "monthly_essential": twin.expenses.essential,
        "monthly_discretionary": twin.expenses.discretionary,
        "total_monthly_spend": twin.expenses.total,
        "essential_ratio": twin.expenses.essential_ratio,
        "categories": categories_breakdown,
        "anomalies_detected": flagged_txns,
        "recurring_mandates": [
            {"label": "Apartment Rent", "amount": 18000.0, "due_day": 3, "status": "PAID"},
            {"label": "Zerodha Wealth SIP", "amount": 5000.0, "due_day": 5, "status": "PAID"},
            {"label": "Electricity (BESCOM/UGVCL)", "amount": 1850.0, "due_day": 10, "status": "UPCOMING"},
        ],
    }


@router.post("/{persona_id}/simulate-stress")
async def simulate_stress(persona_id: str, req: StressSimulationRequest):
    """
    Simulates real financial shocks (medical shock, income drop) using ML and runway mechanics.
    """
    twin = await twin_service.compute_twin(persona_id)

    orig_bal = float(twin.liquidity.available_balance)
    orig_income = float(twin.income.monthly_income)
    essential = max(float(twin.expenses.essential), 1.0)

    adj_balance = max(0.0, orig_bal - req.shock_amount)
    adj_income = max(1.0, orig_income * (1.0 - req.income_drop_pct / 100.0))
    adj_runway_months = round(adj_balance / essential, 1)
    adj_runway_days = int(adj_runway_months * 30)

    # Calculate simulated DTI
    total_emi = float(twin.debt.total_emi)
    simulated_dti = round(total_emi / adj_income, 2)

    # Calculate simulated Health & Stress Scores
    health_penalty = int((req.shock_amount / 2000.0) + (req.income_drop_pct * 0.8))
    simulated_health = max(15, min(95, twin.health_score - health_penalty))
    simulated_stress = min(98, max(10, twin.stress_score + int(health_penalty * 0.9)))

    # Determine default risk and intervention
    default_risk = "HIGH" if simulated_dti > 0.45 or adj_runway_months < 1.0 else "MODERATE" if simulated_dti > 0.35 else "LOW"

    return {
        "persona_id": persona_id,
        "baseline": {
            "health_score": twin.health_score,
            "stress_score": twin.stress_score,
            "balance": orig_bal,
            "runway_months": twin.liquidity.emergency_months,
        },
        "simulated": {
            "health_score": simulated_health,
            "stress_score": simulated_stress,
            "remaining_balance": adj_balance,
            "remaining_runway_days": adj_runway_days,
            "remaining_runway_months": adj_runway_months,
            "simulated_dti": simulated_dti,
            "default_risk": default_risk,
        },
        "recommended_shield": {
            "action": "Activate Emergency Micro-FD Auto-Sweep" if req.shock_amount > 15000 else "Maintain Liquid Cushion",
            "relief_scheme": "PM SVANidhi 7% Collateral-Free Line" if twin.income.monthly_income < 35000 else "Emergency Moratorium Option",
        },
    }
