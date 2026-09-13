from fastapi import APIRouter
from app.services.twin import FinancialTwinService, _uploaded_statements
from app.providers.aa.mock_rebit import RebitMockAAProvider

router = APIRouter()
twin_service = FinancialTwinService()
aa_provider = RebitMockAAProvider()

@router.get("/{persona_id}")
async def subscriptions(persona_id: str):
    twin = await twin_service.compute_twin(persona_id)
    
    # 1. Fetch real transactions for the persona
    txns = []
    if persona_id in _uploaded_statements:
        txns = getattr(_uploaded_statements[persona_id], "transactions", [])
    else:
        try:
            fi_data = await aa_provider.fetch_fi_data(consent_id="CNST-DEMO", persona_id=persona_id)
            txns = fi_data.transactions
        except Exception:
            txns = []
            
    # 2. Dynamically detect recurring mandates from actual transaction patterns
    detected = twin_service._detect_recurring_mandates(txns)
    mandates = []
    for d in detected:
        mandates.append({
            "label": d["label"],
            "category": "recurring",
            "amount": d["amount"],
            "due_day": d.get("due_day", 5),
            "status": d.get("status", "PAID"),
            "autopay": True,
        })
        
    total = sum(m["amount"] for m in mandates)
    runway_saved = round(total / max(twin.expenses.essential, 1) * 30, 1) if twin.expenses.essential > 0 else 0.0
    insight = (
        f"₹{total:,.0f}/mo in auto-debits = {runway_saved} days runway. Pause discretionary mandates to extend buffer."
        if total > 0
        else "No active recurring debt mandates or AutoPay deductions detected. 100% discretionary flexibility."
    )
    return {
        "persona_id": persona_id,
        "mandates": mandates,
        "total_autodebit": total,
        "runway_days_equivalent": runway_saved,
        "insight": insight,
    }
