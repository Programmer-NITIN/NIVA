"""
NIVA Raksha — Fraud Shield Service.
In-memory for hackathon; structure ready for DB + Merkle.
"""
import uuid
import hashlib
from datetime import datetime
from typing import Dict, List, Optional

# Store: case_id -> case
_FRAUD_STORE: Dict[str, dict] = {}
# persona_id -> list case_ids
_PERSONA_INDEX: Dict[str, List[str]] = {}

FRAUD_TYPES = {
    "upi_fraud": "UPI / QR Trick — Money debited to unknown VPA",
    "otp_phish": "OTP / Link Shared — Phished or remote access",
    "card_fraud": "Card / Netbanking Unauthorized Debit",
    "loan_app": "Fake Loan App Harassment / Extortion",
    "other": "Other Financial Cyber Fraud",
}

def _hash_case(case: dict) -> str:
    payload = f"{case['id']}-{case['persona_id']}-{case['amount']}-{case['created_at']}"
    return hashlib.sha256(payload.encode()).hexdigest()[:16]

def create_case(persona_id: str, fraud_type: str, amount: float, txn_id: Optional[str],
                counterparty: Optional[str], description: str, twin_snapshot: dict = None,
                anomaly_flag: Optional[str] = None) -> dict:
    cid = f"FR-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow().isoformat() + "Z"
    if fraud_type not in FRAUD_TYPES:
        fraud_type = "other"
    case = {
        "id": cid,
        "persona_id": persona_id,
        "fraud_type": fraud_type,
        "fraud_type_label": FRAUD_TYPES[fraud_type],
        "amount": float(amount or 0),
        "txn_id": txn_id or f"TXN-{cid}",
        "counterparty": counterparty or "Unknown VPA / Beneficiary",
        "description": description or "",
        "status": "REPORTED",  # REPORTED -> CALLED_1930 -> FILED_PORTAL -> BANK_INFORMED -> ACK_RECEIVED
        "created_at": now,
        "updated_at": now,
        "twin_snapshot": twin_snapshot or {},
        "anomaly_flag": anomaly_flag,
        "integrity_hash": "",
        "timeline": [
            {"at": now, "status": "REPORTED", "note": "Fraud reported via NIVA Raksha — Evidence bundle auto-compiled"},
        ],
        "pots_frozen": False,
        "call_script": f"Namaste, mera Rs {amount:,.0f} ka UPI fraud hua {now[:10]}. TXN {txn_id}, counterparty {counterparty}. Account XXXX-8899. Kripya lien lagayein. — NIVA reference {cid}",
        "next_steps": [
            {"step": 1, "title": "Call 1930 (Golden Hour)", "action": "tel:1930", "desc": "Call National Cyber Crime Helpline 1930 within 90 mins. Share TXN + amount. Ask for Acknowledgement No."},
            {"step": 2, "title": "File on cybercrime.gov.in", "action": "https://cybercrime.gov.in", "desc": "Report → Financial Fraud → With Aadhaar. Paste FIR draft from bundle. Upload evidence PDF."},
            {"step": 3, "title": "Inform Bank Nodal Officer", "action": "bank_letter", "desc": "Send dispute letter to SBI/HDFC Nodal Officer. Request lien + chargeback per RBI circular."},
            {"step": 4, "title": "Track + Ombudsman", "action": "https://cms.rbi.org.in", "desc": "If no resolution in 30 days, escalate to RBI CMS (Ombudsman)."},
        ]
    }
    case["integrity_hash"] = _hash_case(case)
    _FRAUD_STORE[cid] = case
    _PERSONA_INDEX.setdefault(persona_id, []).append(cid)
    return case

def get_case(case_id: str) -> Optional[dict]:
    return _FRAUD_STORE.get(case_id)

def list_cases(persona_id: str) -> List[dict]:
    ids = _PERSONA_INDEX.get(persona_id, [])
    return [_FRAUD_STORE[i] for i in ids if i in _FRAUD_STORE][::-1]

def update_status(case_id: str, new_status: str, note: str = "") -> Optional[dict]:
    c = _FRAUD_STORE.get(case_id)
    if not c: return None
    c["status"] = new_status
    c["updated_at"] = datetime.utcnow().isoformat() + "Z"
    c["timeline"].append({"at": c["updated_at"], "status": new_status, "note": note})
    c["integrity_hash"] = _hash_case(c)
    return c

def freeze_pots_flag(case_id: str) -> Optional[dict]:
    c = _FRAUD_STORE.get(case_id)
    if not c: return None
    c["pots_frozen"] = True
    c["updated_at"] = datetime.utcnow().isoformat() + "Z"
    c["timeline"].append({"at": c["updated_at"], "status": "POTS_FROZEN", "note": "Emergency: Pots locked to Vault — no further auto-debits"})
    return c

def build_bundle(case_id: str) -> dict:
    c = _FRAUD_STORE.get(case_id)
    if not c: return {}
    tw = c.get("twin_snapshot", {})
    fir_draft = f"""To: National Cyber Crime Reporting Portal (cybercrime.gov.in) & SHO, Cyber Cell

Subject: Complaint of Unauthorized Financial Transaction — Request for FIR & Lien

I, persona {c['persona_id']}, report unauthorized debit:

- Amount: Rs {c['amount']:,.0f}
- Date/Time (IST): {c['created_at']}
- Transaction ID / UTR / UPI Ref: {c['txn_id']}
- Counterparty VPA / Account: {c['counterparty']}
- Victim Account: XXXX-8899 (SBI/HDFC — see ReBIT telemetry)
- Mode: {c['fraud_type_label']}
- Twin Snapshot at fraud: Health {tw.get('health_score','--')}/100, Stress {tw.get('stress_score','--')}, Buffer {tw.get('buffer','--')} mo, DTI {tw.get('dti','--')}
- Anomaly Flag: {c.get('anomaly_flag') or 'User-reported'}
- Description: {c['description']}

Request: Please register FIR under IT Act 66D / IPC 420, issue acknowledgement, instruct beneficiary bank to lien amount per RBI Cyber Security Framework, 1930 protocol.

Evidence enclosed: ReBIT transaction, anomaly report, twin snapshot, Merkle hash {c['integrity_hash']}.

Yours faithfully,
{c['persona_id']}  (via NIVA Raksha — {c['id']})
"""
    bank_letter = f"""To: Nodal Officer, SBI/HDFC Bank
Subject: Dispute of Unauthorized Transaction {c['txn_id']} — Request Lien & Chargeback

Dear Sir/Madam,
I dispute Rs {c['amount']:,.0f} debited on {c['created_at']} to {c['counterparty']} (TXN {c['txn_id']}). I did not authorize. Please freeze beneficiary lien, initiate chargeback, share UTR & beneficiary bank details per RBI circular on Customer Protection (2017). Complaint also filed on 1930 / cybercrime.gov.in Ref {c['id']}.

Account: XXXX-8899
Contact: Via NIVA Raksha Case {c['id']}
Date: {c['created_at']}
"""
    return {
        "case": c,
        "fir_draft": fir_draft,
        "bank_letter": bank_letter,
        "checklist": [
            "TXN ID / UTR / UPI Ref",
            "Exact amount + timestamp (IST)",
            "Counterparty VPA / account + bank",
            "Your masked account + FIP",
            "Screenshots (if any) + SMS",
            "1930 acknowledgement number",
        ],
        "links": {
            "cybercrime": "https://cybercrime.gov.in/Webform/Crime_AuthoLogin.aspx",
            "cyber_gov": "https://cybercrime.gov.in",
            "helpline": "tel:1930",
            "rbi_cms": "https://cms.rbi.org.in",
        }
    }
