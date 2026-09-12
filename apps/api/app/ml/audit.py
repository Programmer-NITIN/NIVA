"""
Step 9: Merkle Audit Trail for Responsible AI Compliance.
Provides a cryptographic, tamper-proof audit chain of every recommendation
and suppression decision to prove compliance with RBI guidelines.
"""

from datetime import datetime
import hashlib
import json
from typing import Any, Dict, List, Optional


class MerkleAuditTrail:
    """Tamper-proof cryptographic audit log for recommendation and risk decisions."""

    def __init__(self):
        self.entries: List[Dict[str, Any]] = []
        self.root_hash: Optional[str] = None

    def log_decision(self, persona_id: str, decision: Dict[str, Any]) -> str:
        """Logs a decision into an immutable SHA-256 chained ledger."""
        prev_hash = self.entries[-1]["hash"] if self.entries else "GENESIS_NIVA_BLOCK"
        timestamp = datetime.utcnow().isoformat()

        entry_payload = {
            "index": len(self.entries),
            "timestamp": timestamp,
            "persona_id": persona_id,
            "decision": decision,
            "previous_hash": prev_hash,
        }

        entry_hash = hashlib.sha256(
            json.dumps(entry_payload, sort_keys=True, default=str).encode("utf-8")
        ).hexdigest()

        full_entry = {**entry_payload, "hash": entry_hash}
        self.entries.append(full_entry)
        self.root_hash = entry_hash
        return entry_hash

    def verify_chain(self) -> bool:
        """Cryptographically verifies that no historical decision was altered or forged."""
        for i, entry in enumerate(self.entries):
            expected_prev = self.entries[i - 1]["hash"] if i > 0 else "GENESIS_NIVA_BLOCK"
            if entry.get("previous_hash") != expected_prev:
                return False

            payload = {k: v for k, v in entry.items() if k != "hash"}
            recomputed = hashlib.sha256(
                json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
            ).hexdigest()

            if recomputed != entry.get("hash"):
                return False

        return True

    def get_history(self) -> List[Dict[str, Any]]:
        """Returns the full audit ledger."""
        return self.entries
