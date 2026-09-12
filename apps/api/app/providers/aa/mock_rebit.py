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
_custom_personas: dict[str, dict] = {}
_custom_fi_data: dict[str, FIDataResponse] = {}


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

    @classmethod
    def register_custom_persona(cls, persona_id: str, profile: dict, fi_data: FIDataResponse):
        """Register a dynamically uploaded bank statement as an active AA persona."""
        _custom_fi_data[persona_id] = fi_data
        _custom_personas[persona_id] = {
            "persona_id": persona_id,
            "profile": profile,
            "accounts": [
                {
                    "fip_id": a.fip_id,
                    "account_type": a.account_type,
                    "masked_number": a.masked_number,
                    "branch": a.branch,
                    "ifsc": a.ifsc,
                    "current_balance": a.current_balance,
                }
                for a in fi_data.accounts
            ],
            "transactions": [
                {
                    "id": t.id,
                    "type": t.type,
                    "mode": t.mode,
                    "amount": t.amount,
                    "balance_after": t.balance_after,
                    "narration": t.narration,
                    "merchant_name": t.merchant_name,
                    "category": t.category,
                    "transaction_date": t.transaction_date.isoformat(),
                    "reference_id": t.reference_id,
                }
                for t in fi_data.transactions
            ]
        }

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
        if persona_id in _custom_personas:
            return _custom_personas[persona_id]
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
        """Create a simulated consent request."""
        consent_id = f"CNST-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.utcnow()

        _consent_store[consent_id] = {
            "consent_id": consent_id,
            "phone": request.phone,
            "status": "pending",
            "fi_types": request.fi_types,
            "duration_months": request.duration_months,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        return ConsentResponse(
            consent_id=consent_id,
            status="pending",
            redirect_url=f"/consent/approve/{consent_id}",
            created_at=now,
        )

    async def get_consent_status(self, consent_id: str) -> ConsentStatusResponse:
        """Check consent status."""
        consent = _consent_store.get(consent_id)
        if not consent:
            raise ValueError(f"Consent {consent_id} not found")

        return ConsentStatusResponse(
            consent_id=consent_id,
            status=consent["status"],
            accounts_linked=2 if consent["status"] == "approved" else 0,
            updated_at=datetime.fromisoformat(consent["updated_at"]),
        )

    async def approve_consent(self, consent_id: str, otp: Optional[str] = None) -> ConsentStatusResponse:
        """Simulate consent approval (OTP verification)."""
        consent = _consent_store.get(consent_id)
        if not consent:
            raise ValueError(f"Consent {consent_id} not found")

        # In mock mode, any 6-digit OTP works (or no OTP required)
        consent["status"] = "approved"
        consent["updated_at"] = datetime.utcnow().isoformat()

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
        """
        if persona_id in _custom_fi_data:
            return _custom_fi_data[persona_id]

        consent = _consent_store.get(consent_id)
        if consent and consent["status"] != "approved":
            raise ValueError(f"Consent {consent_id} is not approved (status: {consent['status']})")

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
