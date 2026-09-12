from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.pots import get_pots, sweep, release

router = APIRouter()

class SweepReq(BaseModel):
    persona_id: str
    amount: float
    to_pot: str = "Emergency"

class ReleaseReq(BaseModel):
    persona_id: str
    amount: float
    from_pot: str = "Dukaan Stock"

@router.get("/{persona_id}")
async def list_pots(persona_id: str):
    return {"persona_id": persona_id, "pots": get_pots(persona_id)}

@router.post("/sweep")
async def do_sweep(req: SweepReq):
    if req.amount <=0: raise HTTPException(400, "amount must be >0")
    p = sweep(req.persona_id, req.amount, req.to_pot)
    return {"status": "swept", "pot": p, "pots": get_pots(req.persona_id)}

@router.post("/release")
async def do_release(req: ReleaseReq):
    if req.amount <=0: raise HTTPException(400, "amount must be >0")
    res = release(req.persona_id, req.amount, req.from_pot)
    return {"status": "released", **res, "pots": get_pots(req.persona_id)}

@router.post("/autopilot/{persona_id}")
async def autopilot(persona_id: str):
    """Auto-balance pots: good month → sweep surplus into Emergency, bad month → release from Dukaan Stock to cover Rent."""
    pots = get_pots(persona_id)
    emergency = next((p for p in pots if p["name"] == "Emergency"), None)
    rent = next((p for p in pots if p["name"] == "Rent"), None)
    dukaan = next((p for p in pots if p["name"] == "Dukaan Stock"), None)

    action = "No rebalance needed"
    if emergency and emergency["balance"] < emergency["target"]:
        # Sweep surplus from Dukaan Stock to Emergency
        if dukaan and dukaan["balance"] > 5000:
            move = min(dukaan["balance"] - 3000, emergency["target"] - emergency["balance"])
            if move > 0:
                dukaan["balance"] -= move
                emergency["balance"] += move
                action = f"Auto-swept ₹{int(move):,} from Dukaan Stock → Emergency Pot"
    elif rent and rent["balance"] < 15000 and dukaan and dukaan["balance"] > 5000:
        move = min(dukaan["balance"] - 3000, 15000 - rent["balance"])
        if move > 0:
            dukaan["balance"] -= move
            rent["balance"] += move
            action = f"Auto-released ₹{int(move):,} from Dukaan Stock → Rent Pot (bad month cover)"

    return {"status": "autopilot_done", "action": action, "pots": pots}

