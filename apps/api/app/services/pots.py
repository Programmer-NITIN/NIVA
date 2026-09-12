"""
NIVA — Pots (Income Firewall / Envelopes).
Simple in-memory for hackathon; structure ready for DB.
"""
from typing import Dict, List, Optional
from datetime import datetime

DEFAULT_POTS = [
    {"name": "Emergency", "target": 30000, "auto_sweep_pct": 12, "icon": "🛡️", "category": "safety"},
    {"name": "Rent", "target": 18000, "auto_sweep_pct": 0, "icon": "🏠", "category": "envelope"},
    {"name": "Dukaan Stock", "target": 20000, "auto_sweep_pct": 5, "icon": "🏪", "category": "envelope"},
]

_pots_store: Dict[str, List[dict]] = {}

def get_pots(persona_id: str) -> List[dict]:
    if persona_id not in _pots_store:
        # seed realistic starting balances
        bal_map = {"Emergency": 14000, "Rent": 18000, "Dukaan Stock": 12000}
        if persona_id == "rajesh_sharma":
            bal_map = {"Emergency": 12000, "Rent": 18000, "Dukaan Stock": 15000}
        elif persona_id == "anita_desai":
            bal_map = {"Emergency": 45000, "Rent": 18000, "Dukaan Stock": 6000}
        elif persona_id == "vikram_patel":
            bal_map = {"Emergency": 3000, "Rent": 9000, "Dukaan Stock": 4200}
        elif persona_id == "custom_user":
            bal_map = {"Emergency": 15000, "Rent": 16000, "Dukaan Stock": 10000}

        _pots_store[persona_id] = [
            {
                "id": f"pot-{i+1}",
                "name": p["name"],
                "balance": float(bal_map.get(p["name"], 8000)),
                "target": float(p["target"]),
                "auto_sweep_pct": p["auto_sweep_pct"],
                "icon": p["icon"],
                "is_custom": False,
            }
            for i, p in enumerate(DEFAULT_POTS)
        ]
    return _pots_store[persona_id]

def create_pot(persona_id: str, name: str, target: float = 25000, initial_balance: float = 0, auto_sweep_pct: int = 10, icon: str = "🏺") -> dict:
    pots = get_pots(persona_id)
    clean_name = name.strip()
    # Check if pot already exists
    for p in pots:
        if p["name"].lower() == clean_name.lower():
            p["target"] = max(1000.0, float(target))
            p["auto_sweep_pct"] = max(0, min(100, int(auto_sweep_pct)))
            if initial_balance > 0:
                p["balance"] += float(initial_balance)
            if icon:
                p["icon"] = icon
            return p

    new_pot = {
        "id": f"pot-{len(pots)+1}-{int(datetime.utcnow().timestamp())}",
        "name": clean_name,
        "balance": max(0.0, float(initial_balance)),
        "target": max(1000.0, float(target)),
        "auto_sweep_pct": max(0, min(100, int(auto_sweep_pct))),
        "icon": icon or "🏺",
        "is_custom": True,
    }
    pots.append(new_pot)
    return new_pot

def delete_pot(persona_id: str, pot_id: str) -> bool:
    pots = get_pots(persona_id)
    for i, p in enumerate(pots):
        if p.get("id") == pot_id:
            pots.pop(i)
            return True
    return False

def sweep(persona_id: str, amount: float, to_pot: str = "Emergency"):
    pots = get_pots(persona_id)
    for p in pots:
        if p["name"].lower() == to_pot.lower():
            p["balance"] += float(amount)
            return p
    # create if not exists
    new = {
        "id": f"pot-{len(pots)+1}-{int(datetime.utcnow().timestamp())}",
        "name": to_pot,
        "balance": float(amount),
        "target": 30000.0,
        "auto_sweep_pct": 10,
        "icon": "🏺",
        "is_custom": True,
    }
    pots.append(new)
    return new

def release(persona_id: str, amount: float, from_pot: str = "Dukaan Stock"):
    pots = get_pots(persona_id)
    for p in pots:
        if p["name"].lower() == from_pot.lower():
            take = min(float(p["balance"]), float(amount))
            p["balance"] -= take
            return {"released": take, "pot": p}
    return {"released": 0, "pot": None}
