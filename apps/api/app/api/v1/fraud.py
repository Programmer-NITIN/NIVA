"""
NIVA Raksha — Fraud Shield API.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services.fraud import create_case, get_case, list_cases, update_status, freeze_pots_flag, build_bundle, FRAUD_TYPES
from app.services.twin import FinancialTwinService
from app.ml.anomaly_detector import TransactionAnomalyDetector

router = APIRouter()
twin_service = FinancialTwinService()
detector = TransactionAnomalyDetector()

class ReportReq(BaseModel):
    persona_id: str
    fraud_type: str = Field(default="upi_fraud", description="upi_fraud|otp_phish|card_fraud|loan_app|other")
    amount: float = Field(ge=1)
    txn_id: Optional[str] = None
    counterparty: Optional[str] = None
    description: str = ""

class StatusReq(BaseModel):
    new_status: str
    note: str = ""

@router.get("/fraud-types")
async def fraud_types():
    return {"fraud_types": [{"id": k, "label": v} for k, v in FRAUD_TYPES.items()]}

@router.post("/report")
async def report_fraud(req: ReportReq):
    # Try to enrich from twin + anomalies
    twin_snapshot = {}
    anomaly_flag = None
    try:
        twin = await twin_service.compute_twin(req.persona_id)
        twin_snapshot = {"health_score": twin.health_score, "stress_score": twin.stress_score, "buffer": twin.liquidity.emergency_months, "dti": twin.debt.emi_to_income}
    except: pass
    try:
        from app.providers.aa.mock_rebit import RebitMockAAProvider
        prov = RebitMockAAProvider()
        fi = await prov.fetch_fi_data("CNST-DEMO", req.persona_id)
        txns = fi.transactions or []
        # find by txn_id if provided else latest anomaly
        if req.txn_id:
            for t in txns:
                if req.txn_id in getattr(t, "id", ""):
                    anomaly_flag = "USER_SELECTED_TXN"
                    break
    except: pass
    case = create_case(req.persona_id, req.fraud_type, req.amount, req.txn_id, req.counterparty, req.description, twin_snapshot, anomaly_flag)
    return {"status": "reported", "case": case}

@router.get("/cases/{persona_id}")
async def cases(persona_id: str):
    return {"persona_id": persona_id, "cases": list_cases(persona_id)}

@router.get("/case/{case_id}")
async def case_detail(case_id: str):
    c = get_case(case_id)
    if not c: raise HTTPException(404, "Case not found")
    return {"case": c}

@router.post("/case/{case_id}/status")
async def case_status(case_id: str, req: StatusReq):
    c = update_status(case_id, req.new_status, req.note)
    if not c: raise HTTPException(404, "Case not found")
    return {"case": c}

@router.post("/case/{case_id}/freeze-pots")
async def case_freeze(case_id: str):
    c = get_case(case_id)
    if not c: raise HTTPException(404, "Case not found")
    # freeze via pots service
    try:
        from app.services.pots import get_pots
        pots = get_pots(c["persona_id"])
        # move all non-Emergency into Emergency Locked Vault
        frozen_total = 0
        for p in pots:
            if p["name"] != "Emergency" and p["balance"] > 100:
                move = min(p["balance"]-100, p["balance"])
                p["balance"] -= move
                frozen_total += move
        # add to Emergency
        for p in pots:
            if p["name"] == "Emergency":
                p["balance"] += frozen_total
                break
    except: frozen_total = 0
    freeze_pots_flag(case_id)
    return {"status": "frozen", "frozen_amount": frozen_total, "case": get_case(case_id)}

@router.get("/bundle/{case_id}")
async def bundle(case_id: str):
    b = build_bundle(case_id)
    if not b: raise HTTPException(404, "Case not found")
    return b

@router.get("/suspects/{persona_id}")
async def suspects(persona_id: str):
    """Return recent suspicious txns for one-tap report."""
    try:
        from app.providers.aa.mock_rebit import RebitMockAAProvider
        prov = RebitMockAAProvider()
        fi = await prov.fetch_fi_data("CNST-DEMO", persona_id)
        txns = fi.transactions or []
        # Use detector to score
        formatted = [{"transaction_id": getattr(t,"id","TXN"), "amount": float(getattr(t,"amount",0)), "category": getattr(t,"category","other"), "transaction_hour": getattr(t,"transaction_date",None).hour if getattr(t,"transaction_date",None) else 12, "velocity_1h":1, "is_new_beneficiary": "TRANSFER" in str(getattr(t,"narration","")).upper(), "avg_amount_30d": 4000} for t in txns[-20:]]
        res = detector.detect(formatted)
        suspects = [r for r in res if r["is_anomaly"]]
        # Fallback if none: last 3 debits
        if not suspects:
            debits = [t for t in txns if getattr(t,"type","")=="DEBIT"][-3:]
            suspects = [{"transaction_id": getattr(t,"id","TXN"), "amount": getattr(t,"amount",0), "category": getattr(t,"category",""), "risk_flag":"REVIEW_LARGE_DEBIT", "anomaly_score":0.5} for t in debits]
        return {"persona_id": persona_id, "suspects": suspects[:5]}
    except Exception as e:
        raise HTTPException(500, str(e))
