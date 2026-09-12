from fastapi import APIRouter
from app.services.twin import FinancialTwinService

router = APIRouter()
twin_service = FinancialTwinService()

@router.get("/{persona_id}")
async def subscriptions(persona_id: str):
    twin = await twin_service.compute_twin(persona_id)
    # detect subscriptions: categories that are recurring
    cats = {c.category: c for c in twin.spending_by_category}
    mandates=[]
    # heuristics on narration -> already in twin.py hardcoded; expose here with detect
    candidates = [
        ("rent", 18000, 3), ("investment", 5000, 5), ("utilities",1850,10),
        ("entertainment", 499, 12), ("emi", 4200, 14)
    ]
    for cat, amt, due in candidates:
        if cat in cats:
            mandates.append({"label": cat.replace("_"," ").title(), "category": cat, "amount": amt, "due_day": due, "status": "UPCOMING" if cat=="utilities" else "PAID", "autopay": True})
    # add generic if missing
    if not mandates:
        mandates = [{"label":"Monthly Mandates","category":"other","amount": 2000,"due_day":5,"status":"UPCOMING","autopay":True}]
    total = sum(m["amount"] for m in mandates)
    runway_saved = round(total / max(twin.expenses.essential,1) * 30, 1)
    return {"persona_id": persona_id, "mandates": mandates, "total_autodebit": total, "runway_days_equivalent": runway_saved, "insight": f"₹{total:,.0f}/mo in auto-debits = {runway_saved} days runway. Pause one to extend buffer."}
