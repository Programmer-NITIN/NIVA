"""
NIVA — RebitMockAAProvider.

ReBIT-spec-compliant Account Aggregator simulation with curated Bharat personas.
This is the DEFAULT AA provider for hackathon demos.

Returns data in the exact ReBIT Account Aggregator FI Fetch format,
with realistic Indian financial behavioral patterns.

Mode badge shown in UI: 🟢 RBI AA Sandbox (Simulated FIU-FIP Consent)
"""

import uuid
import json
import os
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

from app.providers.aa.base import AAProvider
from app.schemas.aa import (
    ConsentCreateRequest,
    ConsentResponse,
    ConsentStatusResponse,
    FIAccountSummary,
    FITransaction,
    FIDataResponse,
)

PERSONAS_DIR = Path(__file__).parent / "personas"

# In-memory consent store (for hackathon — production would use DB)
_consent_store: dict[str, dict] = {}


class RebitMockAAProvider(AAProvider):
    """
    Local ReBIT-spec-compliant AA simulation.
    
    Features:
    - Returns exact ReBIT Account Aggregator FI data schema
    - 3 curated Bharat personas with 6 months of transaction history
    - Simulated consent flow with configurable delays
    - 100% reliable — no external API dependencies
    - Deterministic — same persona always returns same data
    """

    def __init__(self):
        self._personas = self._load_personas()

    def _load_personas(self) -> dict:
        """Load all persona JSON files from the personas directory."""
        personas = {}
        if PERSONAS_DIR.exists():
            for file in PERSONAS_DIR.glob("*.json"):
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    personas[data["persona_id"]] = data
        return personas

    def get_persona(self, persona_id: str) -> dict:
        """Get a specific persona by ID."""
        if persona_id not in self._personas:
            # Reload in case new files were added
            self._personas = self._load_personas()
        return self._personas.get(persona_id, self._personas.get("rajesh_sharma", {}))

    def list_personas(self) -> list[dict]:
        """List all available personas with summary info."""
        return [
            {
                "persona_id": pid,
                "name": p["profile"]["name"],
                "description": p["profile"]["description"],
                "monthly_income": p["profile"]["monthly_income"],
                "stress_profile": p["profile"]["stress_profile"],
            }
            for pid, p in self._personas.items()
        ]

    async def create_consent(self, request: ConsentCreateRequest) -> ConsentResponse:
        """Create a simulated consent request and persist to Firestore."""
        consent_id = f"CNST-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.utcnow()

        consent_data = {
            "consent_id": consent_id,
            "phone": request.phone,
            "status": "pending",
            "fi_types": request.fi_types,
            "duration_months": request.duration_months,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        _consent_store[consent_id] = consent_data

        try:
            from app.firebase_client import set_document
            set_document("consents", consent_id, consent_data)
        except Exception as e:
            print(f"[NIVA] Firestore consent save notice: {e}")

        return ConsentResponse(
            consent_id=consent_id,
            status="pending",
            redirect_url=f"/consent/approve/{consent_id}",
            created_at=now,
        )

    async def get_consent_status(self, consent_id: str) -> ConsentStatusResponse:
        """Check consent status from memory or Firestore."""
        consent = _consent_store.get(consent_id)
        if not consent:
            try:
                from app.firebase_client import get_document
                fs_consent = get_document("consents", consent_id)
                if fs_consent:
                    consent = fs_consent
                    _consent_store[consent_id] = consent
            except Exception:
                pass

        if not consent:
            # If demo consent, auto-provision
            if consent_id.startswith("CNST-DEMO"):
                return ConsentStatusResponse(
                    consent_id=consent_id,
                    status="approved",
                    accounts_linked=2,
                    updated_at=datetime.utcnow(),
                )
            raise ValueError(f"Consent {consent_id} not found")

        return ConsentStatusResponse(
            consent_id=consent_id,
            status=consent["status"],
            accounts_linked=2 if consent["status"] == "approved" else 0,
            updated_at=datetime.fromisoformat(consent["updated_at"]),
        )

    async def approve_consent(self, consent_id: str, otp: Optional[str] = None) -> ConsentStatusResponse:
        """Simulate consent approval (OTP verification) and persist to Firestore."""
        consent = _consent_store.get(consent_id)
        if not consent:
            try:
                from app.firebase_client import get_document
                consent = get_document("consents", consent_id)
            except Exception:
                pass

        if not consent:
            raise ValueError(f"Consent {consent_id} not found")

        now_iso = datetime.utcnow().isoformat()
        consent["status"] = "approved"
        consent["updated_at"] = now_iso
        _consent_store[consent_id] = consent

        try:
            from app.firebase_client import update_document
            update_document("consents", consent_id, {"status": "approved", "updated_at": now_iso})
        except Exception as e:
            print(f"[NIVA] Firestore consent approval update notice: {e}")

        return ConsentStatusResponse(
            consent_id=consent_id,
            status="approved",
            accounts_linked=2,
            updated_at=datetime.utcnow(),
        )

    async def fetch_fi_data(self, consent_id: str, persona_id: str = "rajesh_sharma") -> FIDataResponse:
        """
        Fetch financial data for an approved consent.
        Returns ReBIT-spec-compliant account and transaction data.
        Supports both curated Bharat personas and uploaded user bank statements.
        """
        # Check if consent is approved
        if consent_id and not consent_id.startswith("CNST-DEMO"):
            consent = _consent_store.get(consent_id)
            if not consent:
                try:
                    from app.firebase_client import get_document
                    consent = get_document("consents", consent_id)
                except Exception:
                    pass
            if consent and consent.get("status") != "approved":
                raise ValueError(f"Consent {consent_id} is not approved (status: {consent.get('status')})")

        # Check if this is an uploaded user statement (in-memory or Firestore)
        try:
            from app.services.twin import _uploaded_statements
            if persona_id in _uploaded_statements:
                return _uploaded_statements[persona_id]

            # Rehydrate from Firestore if server restarted
            from app.firebase_client import get_statement_data
            st_data = get_statement_data(persona_id)
            if st_data and st_data.get("transactions"):
                parsed_accounts = [
                    FIAccountSummary(
                        fip_id=acc.get("fip_id", "FIP-UPLOADED-BANK"),
                        account_type=acc.get("account_type", "SAVINGS"),
                        masked_number=acc.get("masked_number", "XXXX-XXXX-8921"),
                        branch=acc.get("branch", "Main Branch"),
                        ifsc=acc.get("ifsc", "SBIN0001234"),
                        current_balance=float(acc.get("current_balance", 25000.0)),
                    )
                    for acc in st_data.get("accounts", [])
                ] or [
                    FIAccountSummary(
                        fip_id="FIP-UPLOADED-BANK",
                        account_type="SAVINGS",
                        masked_number="XXXX-XXXX-8921",
                        branch="Main Branch",
                        ifsc="SBIN0001234",
                        current_balance=25000.0,
                    )
                ]

                parsed_txns = []
                for idx, t in enumerate(st_data["transactions"]):
                    d_val = t.get("transaction_date")
                    if isinstance(d_val, str):
                        try:
                            t_date = datetime.fromisoformat(d_val)
                        except Exception:
                            t_date = datetime.utcnow()
                    else:
                        t_date = datetime.utcnow()

                    parsed_txns.append(
                        FITransaction(
                            id=t.get("id", f"TXN-UPL-{idx + 1:05d}"),
                            type=t.get("type", "DEBIT"),
                            mode=t.get("mode", "UPI"),
                            amount=float(t.get("amount", 0.0)),
                            balance_after=float(t.get("balance_after")) if t.get("balance_after") is not None else None,
                            narration=t.get("narration", "Transaction"),
                            merchant_name=t.get("merchant_name"),
                            category=t.get("category", "miscellaneous"),
                            transaction_date=t_date,
                            reference_id=t.get("reference_id"),
                        )
                    )

                d_start = datetime.fromisoformat(st_data["data_range_start"]) if st_data.get("data_range_start") else (parsed_txns[0].transaction_date if parsed_txns else datetime.utcnow())
                d_end = datetime.fromisoformat(st_data["data_range_end"]) if st_data.get("data_range_end") else (parsed_txns[-1].transaction_date if parsed_txns else datetime.utcnow())

                fi_resp = FIDataResponse(
                    consent_id=st_data.get("consent_id", "CNST-UPLOADED-LIVE"),
                    accounts=parsed_accounts,
                    transactions=parsed_txns,
                    data_range_start=d_start,
                    data_range_end=d_end,
                    total_transactions=len(parsed_txns),
                )
                _uploaded_statements[persona_id] = fi_resp
                return fi_resp
        except Exception as e:
            print(f"[NIVA] Firestore statement hydrate notice for {persona_id}: {e}")

        persona = self.get_persona(persona_id)
        if not persona:
            raise ValueError(f"Persona {persona_id} not found")

        # Build accounts
        accounts = [
            FIAccountSummary(
                fip_id=acc["fip_id"],
                account_type=acc["account_type"],
                masked_number=acc["masked_number"],
                branch=acc.get("branch"),
                ifsc=acc.get("ifsc"),
                current_balance=acc["current_balance"],
            )
            for acc in persona["accounts"]
        ]

        # Build transactions
        transactions = [
            FITransaction(
                id=txn["id"],
                type=txn["type"],
                mode=txn["mode"],
                amount=txn["amount"],
                balance_after=txn.get("balance_after"),
                narration=txn["narration"],
                merchant_name=txn.get("merchant_name"),
                category=txn.get("category"),
                transaction_date=datetime.fromisoformat(txn["transaction_date"]),
                reference_id=txn.get("reference_id"),
            )
            for txn in persona["transactions"]
        ]

        now = datetime.utcnow()
        return FIDataResponse(
            consent_id=consent_id or "CNST-DEMO",
            accounts=accounts,
            transactions=transactions,
            data_range_start=now - timedelta(days=180),
            data_range_end=now,
            total_transactions=len(transactions),
        )

    async def revoke_consent(self, consent_id: str) -> bool:
        """Revoke a consent."""
        consent = _consent_store.get(consent_id)
        if not consent:
            return False
        consent["status"] = "revoked"
        consent["updated_at"] = datetime.utcnow().isoformat()
        return True
