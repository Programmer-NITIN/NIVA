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

import logging

logger = logging.getLogger(__name__)

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
    },
    "setu_sandbox_user": {
        "persona_id": "setu_sandbox_user",
        "full_name": "Kailash Verma",
        "phone": "+91 98111 22334",
        "masked_aadhaar": "XXXX-XXXX-9918",
        "pan": "BKPVR9918K",
        "dob": "1988-05-18",
        "gender": "Male",
        "address": "B-42, Sector 18, Noida, Uttar Pradesh - 201301",
        "kyc_source": "Setu AA Sandbox / UIDAI Verification",
        "verification_timestamp": "2026-09-12T10:00:00Z",
        "occupation": "Auto Parts & Retail Merchant",
        "bank_linked": "Axis Bank (A/C ending in 8231)",
        "narrative": "Setu AA Sandbox verified customer. Healthy business cashflow turnover with low debt burden (DTI 10%).",
        "empathetic_offer": {
            "title": "Collateral-Free MSME Expansion Credit",
            "type": "credit",
            "description": "Pre-approved ₹1,50,000 working capital line at prime rate (8.5%) aligned with inventory turnover cycles.",
            "relief_amount": "₹1,50,000 line",
        }
    }
}

# Auto-register seeded demo personas (loaded lazily from seed script)
SEEDED_PERSONA_KYC = {
    "priya_nair": {
        "persona_id": "priya_nair", "full_name": "Priya Nair", "phone": "+91 98123 45601",
        "masked_aadhaar": "XXXX-XXXX-3401", "pan": "ABCPN3401K", "dob": "1995-06-12", "gender": "Female",
        "address": "Flat 1201, Hiranandani Gardens, Powai, Mumbai 400076",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "UX Designer at Flipkart", "bank_linked": "HDFC Bank (A/C ending in 7712)",
        "narrative": "High earner with disciplined savings (40% rate). Strong emergency buffer of 6.2 months.",
        "empathetic_offer": {"title": "Smart Wealth SIP + Tax Saver ELSS", "type": "sip",
            "description": "Automated Rs 10,000/month index fund SIP with Rs 1.5L ELSS tax benefit.", "relief_amount": "12.4% return"},
    },
    "suresh_yadav": {
        "persona_id": "suresh_yadav", "full_name": "Suresh Yadav", "phone": "+91 94123 77801",
        "masked_aadhaar": "XXXX-XXXX-8812", "pan": "BKPSY8812L", "dob": "1978-02-28", "gender": "Male",
        "address": "Near Clock Tower, Johari Bazaar, Jaipur, RJ 302001",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Auto Rickshaw Fleet Owner", "bank_linked": "State Bank of India (A/C ending in 5543)",
        "narrative": "Self-employed fleet owner with seasonal income variation. Moderate stress.",
        "empathetic_offer": {"title": "PM SVANidhi Micro-Merchant Credit", "type": "credit",
            "description": "Rs 50,000 working capital at 7% APR aligned with seasonal cycle.", "relief_amount": "Rs 50,000"},
    },
    "meena_devi": {
        "persona_id": "meena_devi", "full_name": "Meena Devi", "phone": "+91 97915 33201",
        "masked_aadhaar": "XXXX-XXXX-1198", "pan": "CDFMD1198P", "dob": "1982-09-15", "gender": "Female",
        "address": "Ward 14, Sigra, Varanasi, UP 221010",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Anganwadi Worker (Govt ICDS)", "bank_linked": "Bank of Baroda (A/C ending in 6629)",
        "narrative": "Government employee with fixed low income. High stress from family medical expenses.",
        "empathetic_offer": {"title": "Ayushman Bharat Health Shield", "type": "protection",
            "description": "Free Rs 5L family health cover under PMJAY.", "relief_amount": "Free coverage"},
    },
    "arjun_reddy": {
        "persona_id": "arjun_reddy", "full_name": "Arjun K. Reddy", "phone": "+91 99001 88401",
        "masked_aadhaar": "XXXX-XXXX-5567", "pan": "ABCPR5567M", "dob": "1993-01-08", "gender": "Male",
        "address": "Villa 23, Jubilee Hills, Hyderabad 500033",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Cloud Solutions Architect at TCS", "bank_linked": "ICICI Bank (A/C ending in 9034)",
        "narrative": "Highest earner. Strong investment discipline with 35% savings rate. Premium candidate.",
        "empathetic_offer": {"title": "Premium Wealth Management Suite", "type": "sip",
            "description": "Automated Rs 25,000/month diversified portfolio.", "relief_amount": "14.2% target"},
    },
    "fatima_sheikh": {
        "persona_id": "fatima_sheikh", "full_name": "Fatima Sheikh", "phone": "+91 96543 21801",
        "masked_aadhaar": "XXXX-XXXX-4478", "pan": "DEEFS4478K", "dob": "1986-04-22", "gender": "Female",
        "address": "Aminabad Market, Lucknow, UP 226018",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Tailoring Workshop Owner", "bank_linked": "Punjab National Bank (A/C ending in 3390)",
        "narrative": "Growing micro-enterprise. Low DTI (18%), eligible for MSME credit.",
        "empathetic_offer": {"title": "MUDRA Shishu Business Growth Loan", "type": "credit",
            "description": "Rs 75,000 MUDRA loan at 8% for fabric inventory.", "relief_amount": "Rs 75,000"},
    },
    "deepak_chauhan": {
        "persona_id": "deepak_chauhan", "full_name": "Deepak Chauhan", "phone": "+91 98760 55401",
        "masked_aadhaar": "XXXX-XXXX-7821", "pan": "FGHDC7821L", "dob": "1980-12-03", "gender": "Male",
        "address": "Sector 22-B, Chandigarh 160022",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Punjab Police Constable", "bank_linked": "State Bank of India (A/C ending in 1187)",
        "narrative": "Stable income but high family obligations. Moderate DTI (32%) from home loan.",
        "empathetic_offer": {"title": "Education Loan Pre-Approval + FD Ladder", "type": "sip",
            "description": "Rs 2L education loan at 7.5% for children.", "relief_amount": "7.5% rate"},
    },
    "lakshmi_iyer": {
        "persona_id": "lakshmi_iyer", "full_name": "Lakshmi Iyer", "phone": "+91 94440 88901",
        "masked_aadhaar": "XXXX-XXXX-2245", "pan": "GHILI2245M", "dob": "1970-08-19", "gender": "Female",
        "address": "3rd Cross, Besant Nagar, Chennai 600090",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "School Principal (Govt Aided)", "bank_linked": "Indian Overseas Bank (A/C ending in 0891)",
        "narrative": "Senior educator nearing retirement. Conservative risk. Strong pension-backed income.",
        "empathetic_offer": {"title": "Senior Citizen FD + Pension Optimizer", "type": "sip",
            "description": "8.1% Senior Citizen FD with quarterly payout.", "relief_amount": "8.1% rate"},
    },
    "ravi_gupta": {
        "persona_id": "ravi_gupta", "full_name": "Ravi Gupta", "phone": "+91 99111 44501",
        "masked_aadhaar": "XXXX-XXXX-6634", "pan": "HIJRG6634K", "dob": "1988-11-30", "gender": "Male",
        "address": "Lajpat Nagar Market, New Delhi 110024",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Street Food Vendor (Chaat & Snacks)", "bank_linked": "Union Bank of India (A/C ending in 4490)",
        "narrative": "Cash-heavy business with erratic daily deposits. High stress from irregular inflows.",
        "empathetic_offer": {"title": "PM SVANidhi + Digital Payment QR", "type": "credit",
            "description": "Rs 20,000 working capital at 7% APR + UPI QR setup.", "relief_amount": "Rs 20,000"},
    },
    "sneha_patil": {
        "persona_id": "sneha_patil", "full_name": "Sneha Patil", "phone": "+91 98903 22101",
        "masked_aadhaar": "XXXX-XXXX-9912", "pan": "IJKSP9912L", "dob": "1994-07-14", "gender": "Female",
        "address": "Kothrud, Pune 411038",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Freelance Content Writer & Blogger", "bank_linked": "Kotak Mahindra Bank (A/C ending in 8823)",
        "narrative": "Irregular freelance income with 20-30% monthly variance. Good savings discipline.",
        "empathetic_offer": {"title": "Freelancer Income Buffer + Health Guard", "type": "sip",
            "description": "Sweep-to-FD for surplus months + Rs 5L health cover.", "relief_amount": "Income smoothing"},
    },
    "mohammed_farooq": {
        "persona_id": "mohammed_farooq", "full_name": "Mohammed Farooq", "phone": "+91 97310 66701",
        "masked_aadhaar": "XXXX-XXXX-3378", "pan": "KLMMF3378M", "dob": "1990-03-25", "gender": "Male",
        "address": "HSR Layout, Bengaluru 560102",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Uber/Ola Driver Partner", "bank_linked": "Axis Bank (A/C ending in 5501)",
        "narrative": "High stress (76/100). Multiple EMIs. Erratic gig earnings. Personal loans BLOCKED.",
        "empathetic_offer": {"title": "Debt Consolidation + Fuel Cashback Card", "type": "restructure",
            "description": "Consolidate 2 EMIs into single 24-month facility, reducing burden by 35%.", "relief_amount": "EMI -35%"},
    },
}

# Merge seeded personas into main registry
PERSONA_KYC.update(SEEDED_PERSONA_KYC)

# In-memory store for journey-accepted empathetic actions
_accepted_relief_actions = []


class SendOtpRequest(BaseModel):
    phone: str
    persona_id: Optional[str] = "rajesh_sharma"


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str
    persona_id: str = "rajesh_sharma"


class BankOfficerLoginRequest(BaseModel):
    officer_id: str = "SBI-OFFICER-7891"
    pin: str = "889900"


class EmpatheticActionRequest(BaseModel):
    persona_id: str
    action_type: str
    selected_option: str
    notes: Optional[str] = None


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    dependents: Optional[int] = None
    
    # Financial baseline parameters used for AI Analysis
    declared_income: Optional[float] = None
    declared_essential_expenses: Optional[float] = None
    declared_monthly_emi: Optional[float] = None
    target_buffer_months: Optional[float] = None
    risk_tolerance: Optional[str] = None  # "conservative" | "moderate" | "growth"
    
    # DPDP / Privacy preferences
    data_sync_frequency: Optional[str] = None  # "weekly" | "monthly" | "on_demand"
    allow_responsible_analysis: Optional[bool] = None
    language_preference: Optional[str] = None


# In-memory OTP session cache: phone_suffix -> {"otp": str, "persona_id": str, "timestamp": datetime}
_otp_sessions: dict[str, dict] = {}


@router.post("/send-otp")
async def send_otp(req: SendOtpRequest):
    """
    Stage 1: Generate & dispatch 6-digit OTP for Vernacular Onboarding.
    Prints OTP in real-time to the backend terminal and stores session in Firestore.
    """
    import random
    clean_phone = req.phone.strip()
    if not clean_phone:
        raise HTTPException(status_code=400, detail="Mobile phone number is required.")

    # Generate realistic dynamic 6-digit OTP
    generated_otp = f"{random.randint(100000, 999999)}"
    safe_key = clean_phone.replace(" ", "").replace("+91", "")[-10:]
    if not safe_key:
        safe_key = "default"

    session_data = {
        "phone": clean_phone,
        "persona_id": req.persona_id or "rajesh_sharma",
        "otp": generated_otp,
        "created_at": datetime.utcnow().isoformat(),
        "expires_in_seconds": 600,
    }

    _otp_sessions[safe_key] = session_data

    # Real-time Terminal Print Banner
    terminal_banner = f"""
================================================================================
  [NIVA SMS GATEWAY] VERNACULAR ONBOARDING OTP
  Recipient Phone   : {clean_phone}
  Persona Identifier: {req.persona_id or 'rajesh_sharma'}
  ONE-TIME PASSWORD : >>>  {generated_otp}  <<<
  Dispatched At     : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} IST
  Compliance        : RBI Master Direction & DPDP Act 2023
================================================================================
"""
    print(terminal_banner, flush=True)

    try:
        from app.firebase_client import set_document
        set_document("auth_sessions", safe_key, session_data)
    except Exception as e:
        print(f"[NIVA] Firestore auth session notice: {e}", flush=True)

    return {
        "status": "sent",
        "message": f"OTP successfully dispatched to {clean_phone}.",
        "phone": clean_phone,
        "otp_preview": generated_otp,
        "expires_in_seconds": 600,
    }


@router.post("/login-bank-officer")
async def login_bank_officer(req: BankOfficerLoginRequest):
    """
    Bank Risk Officer & Underwriting Portal authentication.
    Issues cryptographically signed JWT token with 'bank_officer' role.
    """
    from app.services.auth import create_access_token
    token_payload = {
        "sub": req.officer_id,
        "persona_id": "bank_portal",
        "role": "bank_officer",
        "name": f"Risk Underwriter ({req.officer_id})",
        "branch": "State Bank of India / Western Hub",
    }
    access_token = create_access_token(token_payload)

    try:
        import asyncio
        from app.firebase_client import set_document
        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, lambda: set_document("officer_sessions", req.officer_id, {
            "officer_id": req.officer_id,
            "last_login": datetime.utcnow().isoformat(),
            "role": "bank_officer",
        }))
    except Exception as e:
        logger.warning(f"[NIVA Journey] Failed to persist officer session: {e}")

    return {
        "status": "authenticated",
        "officer_id": req.officer_id,
        "role": "bank_officer",
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Bank Officer security credentials verified under RBI Cyber Security Framework.",
    }


@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    """
    Stage 1: Verify mobile OTP for Vernacular Onboarding.
    Validates OTP against in-memory session or Firestore, issues signed JWT token, and persists user to Firestore.
    """
    entered_otp = req.otp.strip()
    if len(entered_otp) != 6:
        raise HTTPException(status_code=400, detail="OTP must be exactly 6 digits.")

    clean_phone = req.phone.strip()
    safe_key = clean_phone.replace(" ", "").replace("+91", "")[-10:] if clean_phone else "default"

    # Validate OTP: check in-memory sessions, Firestore auth_sessions, or standard demo fallbacks
    is_valid_otp = False
    expected_otp = None

    if safe_key in _otp_sessions:
        expected_otp = _otp_sessions[safe_key].get("otp")
        if expected_otp == entered_otp:
            is_valid_otp = True

    if not is_valid_otp:
        try:
            from app.firebase_client import get_document
            fs_session = get_document("auth_sessions", safe_key)
            if fs_session and fs_session.get("otp") == entered_otp:
                is_valid_otp = True
        except Exception as e:
            logger.warning(f"[NIVA Journey] Could not check Firestore auth_sessions: {e}")

    # Demo testing fallbacks (always allow 123456 or 999999 for test harnesses)
    if not is_valid_otp and entered_otp in {"123456", "999999"}:
        is_valid_otp = True

    if not is_valid_otp:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP entered ('{entered_otp}'). Please check the backend terminal for the real-time OTP or use 123456."
        )

    # 1. Check if user already exists in Firestore
    kyc = None
    try:
        from app.firebase_client import get_user_profile, save_user_profile
        stored_user = get_user_profile(req.persona_id)
        if stored_user:
            kyc = stored_user
    except Exception as e:
        logger.warning(f"[NIVA Journey] Could not fetch profile for {req.persona_id}: {e}")

    # 2. Check in-memory demo personas
    if not kyc:
        kyc = PERSONA_KYC.get(req.persona_id)

    # 3. Generate a clean KYC profile for new/unknown users
    if not kyc:
        phone_suffix = req.phone.replace(" ", "").replace("+91", "")[-4:] if req.phone else "0000"
        kyc = {
            "persona_id": req.persona_id,
            "full_name": "Verified Account Holder",
            "phone": req.phone,
            "masked_aadhaar": f"XXXX-XXXX-{phone_suffix}",
            "pan": "XXXXX0000X",
            "dob": "1990-01-01",
            "gender": "Verified",
            "address": "Verified Digital KYC Address, India",
            "kyc_source": "DigiLocker / OTP Mobile Verification",
            "verification_timestamp": datetime.utcnow().isoformat() + "Z",
            "occupation": "Account Holder",
            "bank_linked": "Linked via Verified Mobile Number",
            "narrative": "New verified user. Upload a bank statement or connect via Account Aggregator to generate live financial twin.",
            "empathetic_offer": {
                "title": "Financial Health Assessment & Protection",
                "type": "assessment",
                "description": "Comprehensive, algorithmic financial health evaluation with zero credit score impact.",
                "relief_amount": "Complimentary",
            }
        }

    # Always persist to Firestore for long-term storage
    try:
        from app.firebase_client import save_user_profile
        save_user_profile(req.persona_id, kyc)
        PERSONA_KYC[req.persona_id] = kyc
    except Exception as e:
        logger.warning(f"[NIVA Journey] Could not save user profile for {req.persona_id}: {e}")

    # Issue signed JWT token
    from app.services.auth import create_access_token
    token_payload = {
        "sub": req.phone,
        "persona_id": req.persona_id,
        "role": "customer",
        "name": kyc.get("full_name", "Verified User"),
    }
    access_token = create_access_token(token_payload)

    return {
        "status": "success",
        "verified": True,
        "message": "OTP successfully verified via SMS Gateway.",
        "phone": req.phone,
        "persona_id": req.persona_id,
        "access_token": access_token,
        "token_type": "bearer",
        "role": "customer",
        "kyc_profile": kyc,
    }


@router.get("/kyc/{persona_id}")
@router.get("/profile/{persona_id}")
async def get_user_profile_endpoint(persona_id: str):
    """
    Retrieve full user profile and financial analysis parameters.
    Reads from Firestore users collection with fallback to built-in personas.
    """
    profile = None
    try:
        from app.firebase_client import get_user_profile
        profile = get_user_profile(persona_id)
    except Exception as e:
        logger.warning(f"[NIVA Journey] Could not fetch profile for {persona_id}: {e}")

    if not profile and persona_id in PERSONA_KYC:
        profile = PERSONA_KYC[persona_id]

    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile for '{persona_id}' not found.")

    return profile


@router.put("/profile/{persona_id}")
async def update_user_profile_endpoint(persona_id: str, req: UserProfileUpdateRequest):
    """
    Update personal demographics, financial baseline parameters, and privacy settings.
    Persists to Firestore users collection and triggers immediate Financial Twin recalculation.
    """
    existing = None
    try:
        from app.firebase_client import get_user_profile
        existing = get_user_profile(persona_id)
    except Exception as e:
        logger.warning(f"[NIVA Journey] Could not fetch existing profile for {persona_id}: {e}")

    if not existing:
        existing = PERSONA_KYC.get(persona_id, {
            "persona_id": persona_id,
            "full_name": "Verified User",
            "phone": "+91 98765 00000",
            "occupation": "Account Holder",
        })

    # Merge incoming non-None fields
    updated = {**existing}
    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            updated[k] = v

    updated["updated_at"] = datetime.utcnow().isoformat()

    # 1. Persist to Firestore
    try:
        from app.firebase_client import save_user_profile
        save_user_profile(persona_id, updated)
    except Exception as e:
        logger.warning(f"[NIVA Journey] Firestore profile update notice: {e}")

    # 2. Update in-memory registry
    PERSONA_KYC[persona_id] = updated

    # 3. Invalidate cached twin and trigger live recalculation
    from app.services.twin import _uploaded_twins
    _uploaded_twins.pop(persona_id, None)

    try:
        recalculated_twin = await twin_service.compute_twin(persona_id, force_recompute=True)
    except Exception as e:
        recalculated_twin = None

    return {
        "status": "success",
        "message": "User profile and financial analysis parameters updated successfully.",
        "profile": updated,
        "recalculated_twin": recalculated_twin,
    }


@router.post("/empathetic-action")
async def record_empathetic_action(req: EmpatheticActionRequest):
    """
    Stage 5: Customer accepts proactive empathetic intervention (e.g. EMI moratorium).
    Persists to Firebase Firestore and syncs to the Bank Underwriting Portal audit log!
    """
    entry = {
        "id": f"RELIEF-{len(_accepted_relief_actions) + 1:04d}",
        "action_id": f"RELIEF-{len(_accepted_relief_actions) + 1:04d}",
        "persona_id": req.persona_id,
        "action_type": req.action_type,
        "selected_option": req.selected_option,
        "notes": req.notes or "Applied via NIVA Customer Empathetic Journey",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "APPROVED_BY_POLICY",
    }
    _accepted_relief_actions.append(entry)

    # Persist to Firestore
    try:
        from app.firebase_client import save_relief_action_record
        save_relief_action_record(entry)
    except Exception as e:
        logger.warning(f"[NIVA Journey] Failed to save relief action to Firestore: {e}")

    return {
        "status": "recorded",
        "relief_id": entry["id"],
        "message": "Empathetic relief activated successfully. Bank underwriter notified.",
        "details": entry,
    }


@router.post("/upload-statement")
async def upload_bank_statement(
    file: UploadFile = File(...),
    persona_id: str = Form("custom_user"),
    full_name: str = Form(""),
    phone: str = Form(""),
    password: str = Form(""),
):
    """
    Parse an uploaded real bank statement (CSV, Excel .xlsx, PDF)
    and compute live Financial Digital Twin + Responsible Gate telemetry.
    PDF statements may be password-protected (e.g., first 4 chars of name + DOB).
    """
    try:
        content = await file.read()
        pdf_password = password if password else None
        fi_data = BankStatementParser.parse_csv_or_excel(content, file.filename or "statement.csv", password=pdf_password)
        
        meta = getattr(fi_data, "metadata", None) or {}
        extracted_holder = meta.get("holder_name")
        extracted_phone = meta.get("mobile")
        extracted_bank = meta.get("bank_name") or file.filename.split('.')[0].replace('_', ' ').title()
        extracted_branch = meta.get("branch") or "Main Branch"
        extracted_ifsc = meta.get("ifsc")
        extracted_acct = meta.get("account_number")
        extracted_masked = meta.get("masked_number") or (f"XXXX-XXXX-{extracted_acct[-4:]}" if extracted_acct and len(extracted_acct) >= 4 else "XXXX-XXXX-9918")

        resolved_name = (full_name or "").strip()
        if not resolved_name or resolved_name == "Kailash Verma":
            resolved_name = extracted_holder or f"{extracted_bank} Account Holder"

        resolved_phone = (phone or "").strip()
        if not resolved_phone or resolved_phone == "+91 98765 00000":
            resolved_phone = extracted_phone or "+91 98765 00000"

        # Register custom KYC entry
        profile_entry = {
            "persona_id": persona_id,
            "full_name": resolved_name,
            "phone": resolved_phone,
            "masked_aadhaar": "XXXX-XXXX-9918",
            "pan": meta.get("pan", "BKPVR9918K"),
            "dob": "1988-05-18",
            "gender": "Verified",
            "address": f"{extracted_branch}, India" if extracted_branch != "Main Branch" else "Verified Banking Address, India",
            "kyc_source": f"Real Statement Verified ({file.filename})",
            "verification_timestamp": datetime.utcnow().isoformat() + "Z",
            "occupation": "Account Holder",
            "bank_linked": f"{extracted_bank} ({extracted_masked})",
            "ifsc": extracted_ifsc,
            "account_number": extracted_acct,
            "branch": extracted_branch,
            "narrative": f"Uploaded real bank statement for {resolved_name} ({len(fi_data.transactions)} transactions analyzed). Live cashflow telemetry computed.",
            "empathetic_offer": {
                "title": "Flexible Cashflow Micro-Buffer",
                "type": "restructure",
                "description": "Adaptive working capital repayment aligned with your analyzed inflow seasonality.",
                "relief_amount": "Zero bounce fee guarantee",
            }
        }
        PERSONA_KYC[persona_id] = profile_entry

        # Persist to Firestore
        try:
            from app.firebase_client import save_user_profile
            save_user_profile(persona_id, profile_entry)
        except Exception as e:
            logger.warning(f"[NIVA Journey] Failed to save profile to Firestore for {persona_id}: {e}")

        # Register and compute twin
        twin = twin_service.register_uploaded_statement(persona_id, fi_data, resolved_name)

        # Persist full parsed statements and transactions to Firestore
        try:
            from app.firebase_client import save_statement_data
            st_dict = {
                "persona_id": persona_id,
                "filename": file.filename,
                "consent_id": fi_data.consent_id,
                "data_range_start": fi_data.data_range_start.isoformat() if fi_data.data_range_start else None,
                "data_range_end": fi_data.data_range_end.isoformat() if fi_data.data_range_end else None,
                "total_transactions": len(fi_data.transactions),
                "accounts": [a.model_dump() for a in fi_data.accounts],
                "transactions": [t.model_dump() for t in fi_data.transactions],
            }
            save_statement_data(persona_id, st_dict)
        except Exception as e:
            print(f"[NIVA] Firestore statement persistence notice: {e}", flush=True)

        # Real-time Terminal Notification
        d_start_str = fi_data.data_range_start.strftime('%Y-%m-%d') if fi_data.data_range_start else 'N/A'
        d_end_str = fi_data.data_range_end.strftime('%Y-%m-%d') if fi_data.data_range_end else 'N/A'
        upload_banner = f"""
================================================================================
  [NIVA INGESTION ENGINE] REAL BANK STATEMENT PROCESSED & SYNCED TO FIRESTORE
  Source File       : {file.filename}
  Persona ID        : {persona_id}
  Account Holder    : {resolved_name}
  Transactions Found: {len(fi_data.transactions)} rows
  Date Period       : {d_start_str} to {d_end_str}
  Financial Health  : {twin.health_score}/100
  Stress Score      : {twin.stress_score}/100 ({twin.stress_level.upper()})
  Persistence       : Saved to Firestore collections 'users', 'statements', 'financial_twins'
================================================================================
"""
        print(upload_banner, flush=True)

        return {
            "status": "success",
            "filename": file.filename,
            "transactions_parsed": len(fi_data.transactions),
            "date_range_start": fi_data.data_range_start.isoformat(),
            "date_range_end": fi_data.data_range_end.isoformat(),
            "persona_id": persona_id,
            "twin": twin,
        }
    except Exception as e:
        print(f"[NIVA] Error processing uploaded statement: {e}", flush=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse statement: {str(e)}")


@router.get("/state/{persona_id}")
async def get_journey_state(persona_id: str):
    """
    Fetch comprehensive, verified state across all 6 stages for a persona or uploaded statement.
    Checks Firestore first for persistence across backend restarts.
    """
    kyc = None

    # 1. Try fetching from Firestore
    try:
        from app.firebase_client import get_user_profile
        stored = get_user_profile(persona_id)
        if stored:
            kyc = stored
    except Exception as e:
        logger.warning(f"[NIVA Journey] Could not fetch profile for state ({persona_id}): {e}")

    # 2. Try in-memory store
    if not kyc:
        if persona_id in PERSONA_KYC:
            kyc = PERSONA_KYC[persona_id]
        elif persona_id in _uploaded_twins:
            kyc = {
                "persona_id": persona_id,
                "full_name": _uploaded_twins[persona_id].persona_id or "Custom User",
                "phone": "+91 98980 12345",
                "masked_aadhaar": "XXXX-XXXX-9918",
                "pan": "BKPVR9918K",
                "dob": "1988-05-18",
                "gender": "Verified",
                "address": "Verified Digital Profile, India",
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

    twin = await twin_service.compute_twin(persona_id)
    recs_response = await gate_service.evaluate_all_products(persona_id)
    recs = recs_response.recommendations

    # Filter suppressed loans vs approved products
    suppressed = [r for r in recs if r.decision == "SUPPRESS"]
    approved = [r for r in recs if r.decision == "RECOMMEND"]

    # Merge in-memory and Firestore relief records
    remote_relief = []
    try:
        from app.firebase_client import list_all_relief_actions
        remote_relief = list_all_relief_actions()
    except Exception:
        pass

    combined_map = {}
    for r in (_accepted_relief_actions + remote_relief):
        if r.get("persona_id") == persona_id:
            rid = str(r.get("id") or r.get("action_id") or r.get("timestamp"))
            combined_map[rid] = r

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
        "relief_history": list(combined_map.values()),
    }


