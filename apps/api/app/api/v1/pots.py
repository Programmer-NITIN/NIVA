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
