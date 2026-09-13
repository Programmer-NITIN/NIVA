from fastapi import APIRouter
from pydantic import BaseModel
from app.services.checkout import parse_checkout_input
from app.services.twin import FinancialTwinService
from app.services.gate import ResponsibleGateService

router = APIRouter()
twin_service = FinancialTwinService()
gate_service = ResponsibleGateService()

class QuickCheckReq(BaseModel):
    persona_id: str = "rajesh_sharma"
    raw_input: str  # QR/url/amount free-form

@router.post("/quick-check")
async def quick_check(req: QuickCheckReq):
    parsed = parse_checkout_input(req.raw_input)
    amount = parsed["target_amount"]
    desc = parsed["description"]
    from app.schemas.financial import AffordabilityRequest
    aff = await twin_service.calculate_affordability(req.persona_id, AffordabilityRequest(target_amount=amount, description=desc))
    # gate verdict for unsecured loan at same amount
    gate = await gate_service.evaluate_product(req.persona_id, "personal_loan")
    # pots alternative
    from app.services.pots import get_pots
    pots = get_pots(req.persona_id)
    total_pots = sum(p["balance"] for p in pots)
    alt = f"Use Pots Rs {min(amount, total_pots):,} ({', '.join(p['name'] for p in pots)}) vs 36% loan" if total_pots>3000 else "No pot buffer — SWEAT the wait"
    return {
        "persona_id": req.persona_id,
        "parsed": parsed,
        "affordability": aff.model_dump(),
        "gate": gate.model_dump(),
        "pots_total": total_pots,
        "alternative": alt,
        "verdict_2s": f"{aff.affordable} — {aff.reasoning} | Gate: {gate.decision} ({gate.policy_id or 'OK'}) | Alt: {alt}",
    }
