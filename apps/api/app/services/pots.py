"""
NIVA — Pots (Income Firewall / Envelopes).
Simple in-memory for hackathon; structure ready for DB.
"""
from typing import Dict, List
from datetime import datetime

DEFAULT_POTS = ["Emergency", "Rent", "Dukaan Stock"]

_pots_store: Dict[str, List[dict]] = {}

def get_pots(persona_id: str) -> List[dict]:
    if persona_id not in _pots_store:
        # seed defaults
        bal_map = {"Emergency": 0, "Rent": 0, "Dukaan Stock": 0}
        # seed based on persona heuristic
        if persona_id == "rajesh_sharma":
            bal_map = {"Emergency": 12000, "Rent": 18000, "Dukaan Stock": 15000}
        elif persona_id == "anita_desai":
            bal_map = {"Emergency": 45000, "Rent": 18000, "Dukaan Stock": 6000}
        elif persona_id == "vikram_patel":
            bal_map = {"Emergency": 3000, "Rent": 9000, "Dukaan Stock": 4200}
        _pots_store[persona_id] = [
            {"id": f"pot-{i+1}", "name": name, "balance": bal_map.get(name,0), "target": 30000 if name=="Emergency" else 18000, "auto_sweep_pct": 12 if name=="Emergency" else 0}
            for i, name in enumerate(DEFAULT_POTS)
        ]
    return _pots_store[persona_id]

def sweep(persona_id: str, amount: float, to_pot: str = "Emergency"):
    pots = get_pots(persona_id)
    for p in pots:
        if p["name"].lower() == to_pot.lower():
            p["balance"] += amount
            return p
    # create if not exists
    new = {"id": f"pot-{len(pots)+1}", "name": to_pot, "balance": amount, "target": 30000, "auto_sweep_pct": 10}
    pots.append(new)
    return new

def release(persona_id: str, amount: float, from_pot: str = "Dukaan Stock"):
    pots = get_pots(persona_id)
    for p in pots:
        if p["name"].lower() == from_pot.lower():
            take = min(p["balance"], amount)
            p["balance"] -= take
            return {"released": take, "pot": p}
    return {"released": 0, "pot": None}
