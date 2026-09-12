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
    # simulate bureau 38 days stale flat, AA live drawdown
    bureau = 760
    aa_health_series = [twin.health_score+8, twin.health_score+5, twin.health_score+2, twin.health_score, twin.health_score-4]
    # corresponds to T-90d ... T-0
    return {
        "persona_id": persona_id,
        "bureau_score": bureau,
        "bureau_last_updated_days_ago": 38,
        "aa_live_health": twin.health_score,
        "delinquency_multiplier": 3.4 if twin.stress_score>60 else 1.2,
        "series": [
            {"label": "T-90d", "bureau": bureau, "aa": aa_health_series[0]},
            {"label": "T-60d", "bureau": bureau, "aa": aa_health_series[1]},
            {"label": "T-38d", "bureau": bureau, "aa": aa_health_series[2]},
            {"label": "T-21d", "bureau": bureau, "aa": aa_health_series[3]},
            {"label": "Today", "bureau": bureau, "aa": aa_health_series[4]},
        ],
        "insight": "Bureau flat at 760 while AA live shows -38% drawdown velocity over trailing 21 days."
    }
