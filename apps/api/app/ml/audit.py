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
        self.load_from_storage()

    def load_from_storage(self):
        """Loads historical audit blocks from Firestore if available."""
        try:
            from app.firebase_client import list_audit_trail_entries
            remote_entries = list_audit_trail_entries()
            if remote_entries:
                clean_entries = [
                    {k: v for k, v in e.items() if k not in ("id", "_id")}
                    for e in remote_entries
                ]
                clean_entries.sort(key=lambda x: x.get("index", 0))
                self.entries = clean_entries
                if self.entries:
                    self.root_hash = self.entries[-1].get("hash")
        except Exception:
            pass

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

        try:
            from app.firebase_client import save_audit_entry_record
            # Use copy so Firestore metadata fields don't mutate local block
            save_audit_entry_record(dict(full_entry))
        except Exception:
            pass

        try:
            from app.utils.terminal_logger import log_merkle_audit_block
            product_val = decision.get("product_type") or decision.get("product_name") or decision.get("action_type") or "Product Evaluation"
            action_val = decision.get("decision") or decision.get("action") or "RECORD"
            rule_val = decision.get("policy_rule") or decision.get("policy_id") or "POL-RESPONSIBLE"
            log_merkle_audit_block(
                block_index=entry_payload["index"],
                block_hash=entry_hash,
                persona_id=persona_id,
                product=str(product_val),
                action=str(action_val),
                policy_rule=str(rule_val),
            )
        except Exception:
            pass

        return entry_hash

    def verify_chain(self) -> bool:
        """Cryptographically verifies that no historical decision was altered or forged."""
        if not self.entries:
            return True

        for i, entry in enumerate(self.entries):
            expected_prev = self.entries[i - 1]["hash"] if i > 0 else "GENESIS_NIVA_BLOCK"
            if entry.get("previous_hash") != expected_prev:
                return False

            payload = {k: v for k, v in entry.items() if k != "hash" and k != "id" and not k.startswith("_")}
            recomputed = hashlib.sha256(
                json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
            ).hexdigest()

            if recomputed != entry.get("hash"):
                return False

        return True

    def get_history(self) -> List[Dict[str, Any]]:
        """Returns the full audit ledger."""
        return self.entries
