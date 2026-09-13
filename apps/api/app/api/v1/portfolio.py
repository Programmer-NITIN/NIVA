from fastapi import APIRouter
from app.services.twin import FinancialTwinService
from app.services.gate import ResponsibleGateService

router = APIRouter()
twin_service = FinancialTwinService()
gate_service = ResponsibleGateService()

@router.get("/overview")
async def portfolio_overview():
    from app.services.twin import _uploaded_twins
    personas = ["rajesh_sharma", "anita_desai", "vikram_patel"] + list(_uploaded_twins.keys())
    rows=[]
    blocked=0
    saved_interest=0
    for pid in personas:
        try:
            twin = await twin_service.compute_twin(pid)
            recs = await gate_service.evaluate_all_products(pid)
            suppressed = [r for r in recs.recommendations if r.decision=="SUPPRESS"]
            blocked += len(suppressed)
            # sum interest saved from suppressed personal loans
            for r in suppressed:
                if r.product_type=="personal_loan" and r.interest_saved:
                    saved_interest+=r.interest_saved
            rows.append({
                "persona_id": pid,
                "name": twin.persona_id or pid,
                "health": twin.health_score,
                "stress": twin.stress_score,
                "dti": twin.debt.emi_to_income,
                "buffer": twin.liquidity.emergency_months,
                "suppressed": len(suppressed),
                "gate": "HOLD" if suppressed else "CLEAR"
            })
        except Exception:
            continue
    return {"customers": rows, "kpis": {"blocked_today": blocked, "interest_saved": saved_interest, "npa_avoided": int(saved_interest*1.8)}}

@router.get("/bureau-lag/{persona_id}")
async def bureau_lag(persona_id: str):
    # returns Bureau stale vs AA live series for chart
    twin = await twin_service.compute_twin(persona_id)
    bureau = 760
    hs = twin.health_score
    is_stressed = twin.stress_score > 55 or hs < 60

    if is_stressed:
        aa_series = [
            min(100, hs + 14),
            min(100, hs + 10),
            min(100, hs + 6),
            min(100, hs + 2),
            max(15, hs),
        ]
        insight = f"Traditional Bureau is flat at {bureau} due to 38-day reporting lag, but live AA cashflow captures recent drawdown ({hs}/100). NIVA alerts early before defaults occur."
        delinquency_multiplier = 3.4
        status = "stressed"
    else:
        aa_series = [
            max(10, hs - 4),
            max(10, hs - 2),
            max(10, hs - 1),
            hs,
            hs,
        ]
        insight = f"CIBIL score updates every 38-45 days and lags behind. NIVA's Account Aggregator proves your real-time liquidity is healthy ({hs}/100), qualifying you for low-interest credit lines today."
        delinquency_multiplier = 1.0
        status = "healthy"

    return {
        "persona_id": persona_id,
        "bureau_score": bureau,
        "bureau_last_updated_days_ago": 38,
        "aa_live_health": hs,
        "status": status,
        "delinquency_multiplier": delinquency_multiplier,
        "series": [
            {"label": "T-90d", "bureau": bureau, "aa": aa_series[0]},
            {"label": "T-60d", "bureau": bureau, "aa": aa_series[1]},
            {"label": "T-38d", "bureau": bureau, "aa": aa_series[2]},
            {"label": "T-21d", "bureau": bureau, "aa": aa_series[3]},
            {"label": "Today", "bureau": bureau, "aa": aa_series[4]},
        ],
        "insight": insight,
    }
