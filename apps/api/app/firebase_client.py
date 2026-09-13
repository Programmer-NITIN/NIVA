"""
NIVA — Firebase Client & Firestore Persistence Service.
Provides a singleton Firestore client and clean helper methods for collections:
- users
- financial_twins
- relief_actions
- audit_entries
- bank_actions
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

_firestore_client = None
_firebase_initialized = False


def init_firebase() -> Optional[Any]:
    """Initialize Firebase Admin SDK and return Firestore client singleton."""
    global _firestore_client, _firebase_initialized

    if _firebase_client_is_ready():
        return _firestore_client

    try:
        import firebase_admin
        from firebase_admin import firestore, credentials
        from app.config import settings

        project_id = getattr(settings, "firebase_project_id", "niva-banking-daiict")
        cred_path = getattr(settings, "firebase_credentials_path", None)

        if not firebase_admin._apps:
            if cred_path:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred, {"projectId": project_id})
            else:
                # Uses Application Default Credentials (ADC / gcloud auth)
                firebase_admin.initialize_app(options={"projectId": project_id})

        _firestore_client = firestore.client()
        _firebase_initialized = True
        logger.info(f"Firebase Firestore initialized successfully for project: {project_id}")
        return _firestore_client

    except Exception as e:
        logger.warning(f"Firebase initialization warning (falling back to memory): {e}")
        _firestore_client = None
        _firebase_initialized = False
        return None


def _firebase_client_is_ready() -> bool:
    return _firestore_client is not None and _firebase_initialized


def get_db() -> Optional[Any]:
    """Get the active Firestore DB client or attempt re-init."""
    global _firestore_client
    if _firestore_client is None:
        init_firebase()
    return _firestore_client


# ==========================================
# Generic Document Helpers
# ==========================================

def set_document(collection: str, doc_id: str, data: Dict[str, Any], merge: bool = True) -> bool:
    """Write or update a document in a Firestore collection."""
    db = get_db()
    if not db:
        return False
    try:
        # Convert any non-serializable objects (like datetime) to ISO strings
        clean_data = _sanitize_for_firestore(data)
        clean_data["_updated_at"] = datetime.utcnow().isoformat()
        db.collection(collection).document(str(doc_id)).set(clean_data, merge=merge)
        return True
    except Exception as e:
        logger.error(f"Firestore set_document failed [{collection}/{doc_id}]: {e}")
        return False


def get_document(collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a document by ID from a Firestore collection."""
    db = get_db()
    if not db:
        return None
    try:
        doc_ref = db.collection(collection).document(str(doc_id))
        snap = doc_ref.get()
        if snap.exists:
            return snap.to_dict()
        return None
    except Exception as e:
        logger.error(f"Firestore get_document failed [{collection}/{doc_id}]: {e}")
        return None


def update_document(collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
    """Update fields in an existing Firestore document (merges data)."""
    db = get_db()
    if not db:
        return False
    try:
        db.collection(collection).document(str(doc_id)).set(data, merge=True)
        return True
    except Exception as e:
        logger.error(f"Firestore update_document failed [{collection}/{doc_id}]: {e}")
        return False


def list_documents(collection: str, limit: int = 100) -> List[Dict[str, Any]]:
    """List documents from a Firestore collection."""
    db = get_db()
    if not db:
        return []
    try:
        docs = db.collection(collection).limit(limit).stream()
        results = []
        for doc in docs:
            item = doc.to_dict()
            item["id"] = doc.id
            results.append(item)
        return results
    except Exception as e:
        logger.error(f"Firestore list_documents failed [{collection}]: {e}")
        return []


def delete_document(collection: str, doc_id: str) -> bool:
    """Delete a document from a collection."""
    db = get_db()
    if not db:
        return False
    try:
        db.collection(collection).document(str(doc_id)).delete()
        return True
    except Exception as e:
        logger.error(f"Firestore delete_document failed [{collection}/{doc_id}]: {e}")
        return False


# ==========================================
# Domain-Specific Helper Methods
# ==========================================

def save_user_profile(user_id: str, profile_data: Dict[str, Any]) -> bool:
    """Save user KYC / onboarding profile in Firestore."""
    return set_document("users", user_id, profile_data)


def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user profile from Firestore."""
    return get_document("users", user_id)


def list_all_users() -> List[Dict[str, Any]]:
    """List all user profiles from Firestore."""
    return list_documents("users")


def save_twin_data(persona_or_user_id: str, twin_dict: Dict[str, Any]) -> bool:
    """Save computed financial twin to Firestore."""
    return set_document("financial_twins", persona_or_user_id, twin_dict)


def get_twin_data(persona_or_user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve financial twin from Firestore."""
    return get_document("financial_twins", persona_or_user_id)


def save_relief_action_record(action_data: Dict[str, Any]) -> bool:
    """Save an accepted relief action to Firestore."""
    action_id = action_data.get("action_id") or action_data.get("id") or str(datetime.utcnow().timestamp())
    return set_document("relief_actions", action_id, action_data)


def list_all_relief_actions() -> List[Dict[str, Any]]:
    """Retrieve all accepted relief actions."""
    return list_documents("relief_actions")


def save_audit_entry_record(entry_dict: Dict[str, Any]) -> bool:
    """Save a decision audit entry to Firestore."""
    entry_id = str(entry_dict.get("index", datetime.utcnow().timestamp()))
    persona_id = entry_dict.get("persona_id", "global")
    doc_id = f"{persona_id}_{entry_id}"
    return set_document("audit_entries", doc_id, entry_dict)


def list_audit_trail_entries(persona_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """List audit entries from Firestore, optionally filtered by persona_id."""
    db = get_db()
    if not db:
        return []
    try:
        col = db.collection("audit_entries")
        if persona_id:
            docs = col.where("persona_id", "==", persona_id).stream()
        else:
            docs = col.stream()
        entries = [doc.to_dict() for doc in docs]
        entries.sort(key=lambda x: x.get("timestamp", ""))
        return entries
    except Exception as e:
        logger.error(f"Firestore list_audit_trail_entries failed: {e}")
        return []


def save_bank_action_record(action_dict: Dict[str, Any]) -> bool:
    """Save a bank officer action (loan restructuring, counselor dispatch, etc.)."""
    action_id = action_dict.get("action_id", f"act_{int(datetime.utcnow().timestamp())}")
    return set_document("bank_actions", action_id, action_dict)


def list_bank_actions_records() -> List[Dict[str, Any]]:
    """Retrieve all bank actions from Firestore."""
    return list_documents("bank_actions")


# ==========================================
# Bank Schemes & Products Helpers
# ==========================================

DEFAULT_BANK_SCHEMES = [
    {
        "scheme_id": "pm_svanidhi_working_capital",
        "name": "PM SVANidhi Micro-Merchant Credit",
        "category": "business_credit",
        "interest_rate_pct": 7.0,
        "max_amount": 20000.0,
        "tenure_months": 12,
        "min_income": 15000.0,
        "target_life_stage": "MSME_KIRANA_SEASONAL",
        "max_stress_score": 60.0,
        "max_dti": 0.50,
        "risk_weight": 0.25,
        "is_active": True,
        "description": "Low-cost collateral-free working capital loan with 7% effective APR and digital repayment cashback for Kirana merchants.",
        "originator_bank": "State Bank of India",
        "subsidized": True,
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "scheme_id": "emergency_buffer_micro_fd",
        "name": "Emergency Buffer Flexi-Deposit",
        "category": "savings",
        "interest_rate_pct": 7.2,
        "max_amount": 100000.0,
        "tenure_months": 24,
        "min_income": 10000.0,
        "target_life_stage": "ALL",
        "max_stress_score": 100.0,
        "max_dti": 1.0,
        "risk_weight": 0.0,
        "is_active": True,
        "description": "Automated micro-savings recurring deposit yielding 7.2% APY with zero pre-closure charges to build a 3-month emergency buffer.",
        "originator_bank": "State Bank of India",
        "subsidized": False,
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "scheme_id": "kisan_samriddhi_agri_credit",
        "name": "Kisan Samriddhi Seasonal Credit Line",
        "category": "business_credit",
        "interest_rate_pct": 4.0,
        "max_amount": 50000.0,
        "tenure_months": 18,
        "min_income": 12000.0,
        "target_life_stage": "RURAL_AGRI_ALLIED",
        "max_stress_score": 65.0,
        "max_dti": 0.45,
        "risk_weight": 0.20,
        "is_active": True,
        "description": "Government interest-subvention agricultural credit line with flexible repayment aligned with crop harvest cycles.",
        "originator_bank": "State Bank of India",
        "subsidized": True,
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "scheme_id": "sbi_instant_personal_loan",
        "name": "Instant Express Unsecured Personal Loan",
        "category": "credit",
        "interest_rate_pct": 14.5,
        "max_amount": 150000.0,
        "tenure_months": 36,
        "min_income": 30000.0,
        "target_life_stage": "EARLY_CAREER_SALARIED",
        "max_stress_score": 45.0,
        "max_dti": 0.40,
        "risk_weight": 0.85,
        "is_active": True,
        "description": "Instant unsecured cash loan for personal expenses. Requires stable monthly cashflow and low debt-to-income ratio.",
        "originator_bank": "State Bank of India",
        "subsidized": False,
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "scheme_id": "sbi_debt_consolidation_shield",
        "name": "NIVA Debt Consolidation & EMI Relief Plan",
        "category": "recovery",
        "interest_rate_pct": 8.5,
        "max_amount": 200000.0,
        "tenure_months": 48,
        "min_income": 20000.0,
        "target_life_stage": "ESTABLISHED_FAMILY_HIGH_DEBT",
        "max_stress_score": 85.0,
        "max_dti": 0.65,
        "risk_weight": 0.15,
        "is_active": True,
        "description": "Restructures multiple high-interest retail loans into a single low-EMI long-tenure facility to prevent debt trap default.",
        "originator_bank": "State Bank of India",
        "subsidized": True,
        "created_at": "2026-01-01T00:00:00Z",
    },
]


def save_bank_scheme(scheme_dict: Dict[str, Any]) -> bool:
    """Save or update a bank scheme in Firestore."""
    scheme_id = scheme_dict.get("scheme_id")
    if not scheme_id:
        return False
    if "created_at" not in scheme_dict:
        scheme_dict["created_at"] = datetime.utcnow().isoformat()
    scheme_dict["updated_at"] = datetime.utcnow().isoformat()
    return set_document("bank_schemes", scheme_id, scheme_dict)


def get_bank_scheme(scheme_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a specific bank scheme from Firestore."""
    return get_document("bank_schemes", scheme_id)


def list_bank_schemes(active_only: bool = False) -> List[Dict[str, Any]]:
    """Retrieve bank schemes from Firestore. Seeds defaults if collection is empty."""
    schemes = list_documents("bank_schemes")
    if not schemes:
        # Seed defaults into Firestore
        for default_scheme in DEFAULT_BANK_SCHEMES:
            save_bank_scheme(default_scheme)
        schemes = list_documents("bank_schemes") or DEFAULT_BANK_SCHEMES

    if active_only:
        schemes = [s for s in schemes if s.get("is_active", True)]
    return schemes


def delete_bank_scheme(scheme_id: str) -> bool:
    """Delete a bank scheme from Firestore."""
    return delete_document("bank_schemes", scheme_id)


# ==========================================
# Bank Statement Persistence Helpers
# ==========================================

def save_statement_data(persona_id: str, statement_dict: Dict[str, Any]) -> bool:
    """Save parsed statement transactions, accounts, and metadata into Firestore."""
    statement_dict["persona_id"] = persona_id
    statement_dict["updated_at"] = datetime.utcnow().isoformat()
    return set_document("statements", persona_id, statement_dict)


def get_statement_data(persona_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve parsed statement and transactions for a persona from Firestore."""
    return get_document("statements", persona_id)



# ==========================================
# Serialization Helpers
# ==========================================

def _sanitize_for_firestore(obj: Any) -> Any:
    """Recursively convert datetime objects, numpy types, etc. to Firestore-compatible types."""
    if isinstance(obj, dict):
        return {str(k): _sanitize_for_firestore(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_sanitize_for_firestore(x) for x in obj]
    elif hasattr(obj, "isoformat"):  # datetime / date
        return obj.isoformat()
    elif hasattr(obj, "item"):  # numpy scalars (int64, float64, etc.)
        return obj.item()
    elif hasattr(obj, "tolist"):  # numpy arrays
        return obj.tolist()
    return obj
