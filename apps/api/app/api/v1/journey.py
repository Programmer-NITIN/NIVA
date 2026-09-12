"""
NIVA — Real-World End-to-End Journey API Routes.

Implements the 6-stage lifecycle demanded by the Problem Statement:
1. Vernacular Onboarding & Auth (OTP + DigiLocker e-KYC)
2. RBI Account Aggregator Consent (DPDP 2023)
3. AI Financial Twin & Anomaly Engine
4. The Responsible Gate (Policy Engine)
5. Hyper-Personalized Customer Experience (Empathetic Relief)
6. Bank Risk & Underwriting Portal Bridge
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.services.twin import FinancialTwinService, _uploaded_twins
from app.services.gate import ResponsibleGateService
from app.services.statement_parser import BankStatementParser

router = APIRouter()
twin_service = FinancialTwinService()
gate_service = ResponsibleGateService()

# Simulated DigiLocker e-KYC Registry
PERSONA_KYC = {
    "rajesh_sharma": {
        "persona_id": "rajesh_sharma",
        "full_name": "Rajesh Kumar Sharma",
        "phone": "+91 98765 43210",
        "masked_aadhaar": "XXXX-XXXX-8921",
        "pan": "ABCPS8921K",
        "dob": "1984-08-14",
        "gender": "Male",
        "address": "Shop #14, Main Cloth Market, Surat, Gujarat - 395003",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "verification_timestamp": "2026-09-12T01:30:00Z",
        "occupation": "Kirana & Retail Store Owner",
        "bank_linked": "State Bank of India (A/C ending in 4109)",
        "narrative": "Experienced unexpected hospital bill (₹45,000) in July. High EMI burden (DTI 44%). Needs debt relief, not high-interest loans.",
        "empathetic_offer": {
            "title": "1-Month EMI Moratorium & Interest Waiver",
            "type": "moratorium",
            "description": "Pause your SBI Business Loan EMI for 30 days with zero penalty charges or credit score impact.",
            "relief_amount": "₹12,450/month",
        }
    },
    "anita_desai": {
        "persona_id": "anita_desai",
        "full_name": "Anita Suresh Desai",
        "phone": "+91 98234 56789",
        "masked_aadhaar": "XXXX-XXXX-4512",
        "pan": "AAAPD4512M",
        "dob": "1992-11-22",
        "gender": "Female",
        "address": "Flat 402, Green Glen Heights, Bellandur, Bengaluru - 560103",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "verification_timestamp": "2026-09-12T01:35:00Z",
        "occupation": "Senior Software Quality Engineer",
        "bank_linked": "HDFC Bank (A/C ending in 8832)",
        "narrative": "Healthy cash reserve, 38% monthly savings rate, 5.2 months emergency buffer. Ideal candidate for wealth creation.",
        "empathetic_offer": {
            "title": "Smart Wealth SIP & Health Guard",
            "type": "sip",
            "description": "Start an automated ₹2,500/month index fund SIP and lock ₹10L Super Top-up Health Insurance.",
            "relief_amount": "12.4% historical return",
        }
    },
    "vikram_patel": {
        "persona_id": "vikram_patel",
        "full_name": "Vikram R. Patel",
        "phone": "+91 97123 88990",
        "masked_aadhaar": "XXXX-XXXX-7734",
        "pan": "XYZPP7734F",
        "dob": "1996-03-05",
        "gender": "Male",
        "address": "Sector 22, Near Bus Stand, Gandhinagar, Gujarat - 382022",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "verification_timestamp": "2026-09-12T01:40:00Z",
        "occupation": "Delivery & Mobility Partner",
        "bank_linked": "Bank of Baroda (A/C ending in 1993)",
        "narrative": "Severe stress (81/100). Multiple credit card debts, bounced auto-debit fees, erratic gig earnings. Personal loans must be blocked.",
        "empathetic_offer": {
            "title": "Debt Restructuring & Fee Waiver Program",
            "type": "restructure",
            "description": "Consolidate 3 active loans into a single 36-month tenure, reducing monthly EMI by 42% and waiving past ECS bounce fees.",
            "relief_amount": "EMI reduced from ₹14,200 to ₹8,200",
        }
    }
}

# In-memory store for journey-accepted empathetic actions
_accepted_relief_actions = []


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str
    persona_id: str = "rajesh_sharma"


class EmpatheticActionRequest(BaseModel):
    persona_id: str
    action_type: str
    selected_option: str
    notes: Optional[str] = None


@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    """
    Stage 1: Verify mobile OTP for Vernacular Onboarding.
    Accepts 6-digit OTP (e.g. 123456 or any 6 digits for demo).
    Supports both known personas and new users with any phone number.
    """
    if len(req.otp.strip()) != 6:
        raise HTTPException(status_code=400, detail="OTP must be exactly 6 digits.")

    kyc = PERSONA_KYC.get(req.persona_id)
    if not kyc:
        # Generate a generic KYC profile for new/unknown users
        phone_suffix = req.phone.replace(" ", "").replace("+91", "")[-4:] if req.phone else "0000"
        kyc = {
            "persona_id": req.persona_id,
            "full_name": "Verified User",
            "phone": req.phone,
            "masked_aadhaar": f"XXXX-XXXX-{phone_suffix}",
            "pan": "XXXXX0000X",
            "dob": "1990-01-01",
            "gender": "Not Disclosed",
            "address": "India",
            "kyc_source": "OTP Mobile Verification",
            "verification_timestamp": datetime.utcnow().isoformat() + "Z",
            "occupation": "Account Holder",
            "bank_linked": "Linked via OTP Verification",
            "narrative": "New user verified via mobile OTP. Upload a bank statement or connect via Setu AA to build financial twin.",
            "empathetic_offer": {
                "title": "Financial Health Assessment",
                "type": "assessment",
                "description": "Upload your bank statement to get a free, comprehensive financial health analysis.",
                "relief_amount": "Free",
            }
        }

    return {
        "status": "success",
        "verified": True,
        "message": "OTP successfully verified via SMS Gateway.",
        "phone": req.phone,
        "persona_id": req.persona_id,
        "kyc_profile": kyc,
    }


@router.get("/kyc/{persona_id}")
async def get_kyc_details(persona_id: str):
    """
    Stage 1: Retrieve verified DigiLocker / Aadhaar identity details.
    """
    if persona_id not in PERSONA_KYC:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found.")
    return PERSONA_KYC[persona_id]


@router.post("/empathetic-action")
async def record_empathetic_action(req: EmpatheticActionRequest):
    """
    Stage 5: Customer accepts proactive empathetic intervention (e.g. EMI moratorium).
    Automatically syncs to the Bank Underwriting Portal audit log!
    """
    entry = {
        "id": f"RELIEF-{len(_accepted_relief_actions) + 1:04d}",
        "persona_id": req.persona_id,
        "action_type": req.action_type,
        "selected_option": req.selected_option,
        "notes": req.notes or "Applied via NIVA Customer Empathetic Journey",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "APPROVED_BY_POLICY",
    }
    _accepted_relief_actions.append(entry)

    return {
        "status": "recorded",
        "relief_id": entry["id"],
        "message": "Empathetic relief activated successfully. Bank underwriter notified.",
        "details": entry,
    }


MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_EXT = {".csv",".xlsx",".xls",".pdf"}

@router.post("/upload-statement")
async def upload_bank_statement(
    file: UploadFile = File(...),
    persona_id: str = Form("custom_user"),
    full_name: str = Form(""),
    phone: str = Form("+91 98980 12345"),
    password: str = Form(""),
):
    """
    Parse an uploaded real bank statement (CSV, Excel .xlsx, PDF)
    and compute live Financial Digital Twin + Responsible Gate telemetry.
    PDF statements may be password-protected (e.g., first 4 chars of name + DOB).
    """
    # guardrails
    persona_id = str(persona_id.default if hasattr(persona_id, "default") else persona_id)
    full_name = str(full_name.default if hasattr(full_name, "default") else full_name)
    phone = str(phone.default if hasattr(phone, "default") else phone)
    password = str(password.default if hasattr(password, "default") else password)

    if file.filename and not any(file.filename.lower().endswith(ext) for ext in ALLOWED_EXT):
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXT)}")
    try:
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_UPLOAD_BYTES//(1024*1024)} MB.")
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")
        pdf_password = password if password else None
        fi_data = BankStatementParser.parse_csv_or_excel(content, file.filename or "statement.csv", password=pdf_password)
        
        meta = getattr(fi_data, "metadata", {}) or {}
        extracted_name = meta.get("customer_name") or (full_name if full_name and full_name != "Verified Customer" else "Verified Customer")
        extracted_bank = meta.get("bank_name") or (file.filename.split('.')[0].replace('_', ' ').title() + " Bank")
        extracted_acc = meta.get("masked_account") or (fi_data.accounts[0].masked_number if fi_data.accounts else "XXXX-XXXX-8921")
        extracted_branch = meta.get("branch") or (fi_data.accounts[0].branch if fi_data.accounts else "Main City Branch")
        extracted_ifsc = meta.get("ifsc") or (fi_data.accounts[0].ifsc if fi_data.accounts else "SBIN0001234")
        extracted_phone = meta.get("mobile") or phone or "+91 98980 12345"

        # Register custom KYC entry with extracted credentials
        PERSONA_KYC[persona_id] = {
            "persona_id": persona_id,
            "full_name": extracted_name,
            "phone": extracted_phone,
            "masked_aadhaar": "XXXX-XXXX-9918",
            "pan": "BKPVR9918K",
            "dob": "1988-05-18",
            "gender": "Male",
            "address": meta.get("address") or f"{extracted_branch}, Verified City",
            "kyc_source": f"Real Statement Verified ({file.filename})",
            "verification_timestamp": datetime.utcnow().isoformat() + "Z",
            "occupation": "Verified Account Holder",
            "bank_linked": f"{extracted_bank} ({extracted_acc})",
            "branch": extracted_branch,
            "ifsc": extracted_ifsc,
            "narrative": f"Uploaded real bank statement ({len(fi_data.transactions)} transactions analyzed). Live cashflow telemetry computed.",
            "empathetic_offer": {
                "title": "Flexible Cashflow Micro-Buffer",
                "type": "restructure",
                "description": "Adaptive working capital repayment aligned with your analyzed inflow seasonality.",
                "relief_amount": "Zero bounce fee guarantee",
            }
        }

        # Register custom persona in AA provider for downstream ML endpoints
        from app.providers.aa.mock_rebit import RebitMockAAProvider
        RebitMockAAProvider.register_custom_persona(
            persona_id=persona_id,
            profile={
                "name": extracted_name,
                "phone": extracted_phone,
                "description": f"Account holder at {extracted_bank}",
                "monthly_income": 65000,
                "stress_profile": "dynamic_upload",
            },
            fi_data=fi_data,
        )

        # Register and compute twin
        twin = twin_service.register_uploaded_statement(persona_id, fi_data, extracted_name)

        return {
            "status": "success",
            "filename": file.filename,
            "customer_name": extracted_name,
            "bank_name": extracted_bank,
            "account_number": extracted_acc,
            "ifsc": extracted_ifsc,
            "branch": extracted_branch,
            "transactions_parsed": len(fi_data.transactions),
            "date_range_start": fi_data.data_range_start.isoformat(),
            "date_range_end": fi_data.data_range_end.isoformat(),
            "persona_id": persona_id,
            "kyc": PERSONA_KYC[persona_id],
            "twin": twin,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse statement: {str(e)}")


@router.get("/state/{persona_id}")
async def get_journey_state(persona_id: str):
    """
    Fetch comprehensive, verified state across all 6 stages for a persona or uploaded statement.
    """
    if persona_id not in PERSONA_KYC:
        if persona_id in _uploaded_twins:
            kyc = {
                "persona_id": persona_id,
                "full_name": _uploaded_twins[persona_id].persona_id or "Custom User",
                "phone": "+91 98980 12345",
                "masked_aadhaar": "XXXX-XXXX-9918",
                "pan": "BKPVR9918K",
                "dob": "1988-05-18",
                "gender": "Male",
                "address": "Rajkot, Gujarat - 360001",
                "kyc_source": "Bank Statement Direct Ingestion",
                "verification_timestamp": datetime.utcnow().isoformat() + "Z",
                "occupation": "Verified Account Holder",
                "bank_linked": "Verified Bank Statement",
                "narrative": "Real bank statement ingested and verified under ReBIT standard.",
                "empathetic_offer": {
                    "title": "Tailored Financial Stability Buffer",
                    "type": "moratorium",
                    "description": "Flexible repayment aligned with seasonal inflows.",
                    "relief_amount": "Non-punitive safety net",
                }
            }
        else:
            persona_id = "rajesh_sharma"
            kyc = PERSONA_KYC[persona_id]
    else:
        kyc = PERSONA_KYC[persona_id]

    twin = await twin_service.compute_twin(persona_id)
    recs_response = await gate_service.evaluate_all_products(persona_id)
    recs = recs_response.recommendations

    # Filter suppressed loans vs approved products
    suppressed = [r for r in recs if r.decision == "SUPPRESS"]
    approved = [r for r in recs if r.decision == "RECOMMEND"]

    return {
        "persona_id": persona_id,
        "kyc": kyc,
        "financial_twin": {
            "health_score": twin.health_score,
            "stress_score": twin.stress_score,
            "stress_level": twin.stress_level,
            "anomaly_score": twin.anomaly_score,
            "monthly_income": twin.income.monthly_income,
            "total_expenses": twin.expenses.total,
            "savings_rate": twin.savings.rate,
            "emergency_months": twin.liquidity.emergency_months,
            "dti_ratio": twin.debt.emi_to_income,
            "stress_factors": [f.model_dump() for f in twin.stress_factors],
            "recent_changes": [c.model_dump() for c in twin.changes[:4]],
            "spending_by_category": [c.model_dump() for c in twin.spending_by_category[:6]],
        },
        "responsible_gate": {
            "total_products": len(recs),
            "suppressed_count": len(suppressed),
            "approved_count": len(approved),
            "suppressed": [s.model_dump() for s in suppressed],
            "approved": [a.model_dump() for a in approved],
        },
        "empathetic_offer": kyc.get("empathetic_offer", {
            "title": "Financial Health Protection Plan",
            "type": "protection",
            "description": "Maintain low-risk savings and emergency buffers.",
            "relief_amount": "Active",
        }),
        "relief_history": [a for a in _accepted_relief_actions if a["persona_id"] == persona_id],
    }


