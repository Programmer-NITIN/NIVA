from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.sms_parser import parse_sms_to_transactions
from app.services.twin import FinancialTwinService, _uploaded_twins
from app.schemas.aa import FIDataResponse, FIAccountSummary
from datetime import datetime

router = APIRouter()
twin_service = FinancialTwinService()

class SmsIngestReq(BaseModel):
    persona_id: str = "custom_user"
    sms_text: str
    full_name: str = "SMS User"
    phone: str = ""

@router.post("/ingest")
async def ingest_sms(req: SmsIngestReq):
    if not req.sms_text.strip():
        raise HTTPException(400, "sms_text is empty")
    if len(req.sms_text) > 8000:
        raise HTTPException(400, "sms_text too large (max 8000 chars)")
    try:
        txns = parse_sms_to_transactions(req.sms_text)
    except ValueError as e:
        raise HTTPException(400, str(e))
    balance = sum(t.amount if t.type=="CREDIT" else -t.amount for t in txns)
    balance = max(0, balance)
    fi = FIDataResponse(
        consent_id="CNST-SMS-INGEST",
        accounts=[FIAccountSummary(fip_id="FIP-SMS", account_type="SAVINGS", masked_number="XXXX-XXXX-8899", branch="SMS Ingest", ifsc="SBIN0000000", current_balance=balance)],
        transactions=txns,
        data_range_start=txns[0].transaction_date,
        data_range_end=txns[-1].transaction_date,
        total_transactions=len(txns)
    )
    twin = twin_service.register_uploaded_statement(req.persona_id, fi, req.full_name)
    return {"status": "success", "transactions_parsed": len(txns), "persona_id": req.persona_id, "twin": twin}
