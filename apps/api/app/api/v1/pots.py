from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.pots import get_pots, sweep, release, create_pot, delete_pot

router = APIRouter()

class CreatePotReq(BaseModel):
    persona_id: str
    name: str
    target: float = 25000.0
    initial_balance: float = 0.0
    auto_sweep_pct: int = 10
    icon: Optional[str] = "🏺"

class SweepReq(BaseModel):
    persona_id: str
    amount: float
    to_pot: str = "Emergency"

class ReleaseReq(BaseModel):
    persona_id: str
    amount: float
    from_pot: str = "Dukaan Stock"

# Define static routes FIRST to avoid /{persona_id} capturing them
@router.post("/create")
async def add_pot(req: CreatePotReq):
    if not req.name or not req.name.strip():
        raise HTTPException(400, "Pot name cannot be empty")
    if req.target <= 0:
        raise HTTPException(400, "Target amount must be > 0")
    pot = create_pot(
        persona_id=req.persona_id,
        name=req.name.strip(),
        target=req.target,
        initial_balance=req.initial_balance,
        auto_sweep_pct=req.auto_sweep_pct,
        icon=req.icon or "🏺",
    )
    return {"status": "created", "pot": pot, "pots": get_pots(req.persona_id)}

@router.post("/sweep")
async def do_sweep(req: SweepReq):
    if req.amount <= 0:
        raise HTTPException(400, "amount must be > 0")
    p = sweep(req.persona_id, req.amount, req.to_pot)
    return {"status": "swept", "pot": p, "pots": get_pots(req.persona_id)}

@router.post("/release")
async def do_release(req: ReleaseReq):
    if req.amount <= 0:
        raise HTTPException(400, "amount must be > 0")
    res = release(req.persona_id, req.amount, req.from_pot)
    return {"status": "released", **res, "pots": get_pots(req.persona_id)}

@router.post("/autopilot/{persona_id}")
async def autopilot(persona_id: str):
    """Auto-balance pots: good month → sweep surplus into Emergency, bad month → release from Dukaan Stock to cover Rent."""
    pots = get_pots(persona_id)
    emergency = next((p for p in pots if "emergency" in p["name"].lower()), None)
    rent = next((p for p in pots if "rent" in p["name"].lower()), None)
    dukaan = next((p for p in pots if any(k in p["name"].lower() for k in ["dukaan", "stock", "buffer"])), None)

    action = "All pots balanced — runway healthy"
    if emergency and emergency["balance"] < emergency["target"]:
        # Sweep surplus from dukaan/buffer into Emergency
        if dukaan and dukaan["balance"] > 4000:
            move = min(dukaan["balance"] - 2000, emergency["target"] - emergency["balance"], 5000)
            if move > 0:
                dukaan["balance"] -= move
                emergency["balance"] += move
                action = f"Auto-swept ₹{int(move):,} from {dukaan['name']} → Emergency Pot"
        else:
            emergency["balance"] += 2000
            action = "Auto-swept ₹2,000 surplus inflow into Emergency Pot"
    elif rent and rent["balance"] < rent["target"] and dukaan and dukaan["balance"] > 4000:
        move = min(dukaan["balance"] - 2000, rent["target"] - rent["balance"], 5000)
        if move > 0:
            dukaan["balance"] -= move
            rent["balance"] += move
            action = f"Auto-released ₹{int(move):,} from {dukaan['name']} → {rent['name']} Pot (zero penalty)"

    return {"status": "autopilot_done", "action": action, "pots": pots}

@router.delete("/{persona_id}/{pot_id}")
async def remove_pot(persona_id: str, pot_id: str):
    deleted = delete_pot(persona_id, pot_id)
    if not deleted:
        raise HTTPException(404, "Pot not found")
    return {"status": "deleted", "pots": get_pots(persona_id)}

# Dynamic route at the bottom
@router.get("/{persona_id}")
async def list_pots(persona_id: str):
    return {"persona_id": persona_id, "pots": get_pots(persona_id)}
