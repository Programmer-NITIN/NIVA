"""
NIVA — Family Twin (Household Health).
Merges multiple persona twins into one household view.
"""
from typing import Dict, List
from app.services.twin import FinancialTwinService

twin_service = FinancialTwinService()
FAMILY_STORE: Dict[str, dict] = {}

def _family_id(name: str) -> str:
    base = name.lower().replace(" ","-")[:24]
    # simple dedup
    fid = f"fam-{base}"
    i=1
    while fid in FAMILY_STORE:
        fid = f"fam-{base}-{i}"
        i+=1
    return fid

async def create_family(head_persona_id: str, members: List[str], name: str) -> dict:
    members = [m for m in members if m] 
    # ensure head in members
    if head_persona_id not in members:
        members = [head_persona_id] + members
    # dedup preserve order
    seen=set(); uniq=[]
    for m in members:
        if m not in seen:
            uniq.append(m); seen.add(m)
    fid = _family_id(name or head_persona_id)
    FAMILY_STORE[fid] = {"family_id": fid, "name": name or "My Family", "head": head_persona_id, "members": uniq, "created_at": __import__("datetime").datetime.utcnow().isoformat()+"Z"}
    return FAMILY_STORE[fid]

async def household_twin(family_id: str) -> dict:
    fam = FAMILY_STORE.get(family_id)
    if not fam:
        raise ValueError(f"Family {family_id} not found")
    twins = []
    for pid in fam["members"]:
        twins.append(await twin_service.compute_twin(pid))
    # merge
    total_income = sum(t.income.monthly_income for t in twins)
    total_expenses = sum(t.expenses.total for t in twins)
    total_essential = sum(t.expenses.essential for t in twins)
    total_balance = sum(t.liquidity.available_balance for t in twins)
    avg_health = round(sum(t.health_score for t in twins)/len(twins))
    max_stress = max(t.stress_score for t in twins)
    # buffer household
    household_buffer = round(total_balance / max(total_essential,1), 1)
    # household DTI weighted
    total_emi = sum(t.debt.total_emi for t in twins)
    household_dti = round(total_emi / max(total_income,1), 3)
    # detect school fee due in 12d but buffer < 8d simulation:
    # use category education presence
    has_education = any(any(c.category=="education" for c in t.spending_by_category) for t in twins)
    alert = None
    if household_buffer < 2.0:
        alert = f"Household buffer {household_buffer} mo is tight. If school fee (Rs ~8,000) due in 12 days, buffer falls to {round(max(0, household_buffer-0.35),1)} mo — consider pausing SIP Rs 5,000 and using Family Pot instead of loan."
    elif has_education and household_buffer < 3:
        alert = "Education spend detected. Keep Family Pot topped via Autopilot before fee cycle."
    return {
        "family": fam,
        "members": [{"persona_id": t.user_id, "name": t.persona_id, "health": t.health_score, "stress": t.stress_score, "income": t.income.monthly_income, "balance": t.liquidity.available_balance} for t in twins],
        "household": {"health": avg_health, "max_stress": max_stress, "total_income": total_income, "total_expenses": total_expenses, "total_balance": total_balance, "buffer": household_buffer, "dti": household_dti},
        "alert": alert,
    }

def list_families() -> List[dict]:
    return list(FAMILY_STORE.values())
