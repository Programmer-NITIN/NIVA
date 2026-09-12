"""NIVA — Bank Copilot API Routes."""

from fastapi import APIRouter
from app.schemas.recommendation import BankCustomerSummary, AuditLogEntry
from app.services.twin import FinancialTwinService
from app.services.gate import ResponsibleGateService
from datetime import datetime
import hashlib

router = APIRouter()
twin_service = FinancialTwinService()
gate_service = ResponsibleGateService()


@router.get("/customers")
async def list_customers():
    """List all customers with summary health metrics (bank view)."""
    personas = ["rajesh_sharma", "anita_desai", "vikram_patel"]
    customers = []

    for pid in personas:
        try:
            twin = await twin_service.compute_twin(pid)
            recs = await gate_service.evaluate_all_products(pid)
            
            gate_verdict = None
            gate_policy = None
            for rec in recs.recommendations:
                if rec.decision == "SUPPRESS":
                    gate_verdict = "HOLD UNSECURED CREDIT"
                    gate_policy = rec.policy_id
                    break

            customers.append(BankCustomerSummary(
                user_id=pid,
                name=twin.persona_id or pid,
                persona_id=pid,
                health_score=twin.health_score,
                stress_score=twin.stress_score,
                stress_level=twin.stress_level,
                anomaly_score=twin.anomaly_score,
                gate_verdict=gate_verdict,
                gate_policy=gate_policy,
                monthly_income=twin.income.monthly_income,
                available_balance=twin.liquidity.available_balance,
                emi_to_income=twin.debt.emi_to_income,
                accounts_linked=2,
                last_synced=datetime.utcnow(),
            ))
        except Exception:
            continue

    return {"customers": customers}


@router.get("/customers/{persona_id}")
async def get_customer_detail(persona_id: str):
    """Get detailed customer view for bank officer."""
    twin = await twin_service.compute_twin(persona_id)
    recs = await gate_service.evaluate_all_products(persona_id)

    return {
        "twin": twin,
        "recommendations": recs,
    }


@router.get("/audit/{persona_id}")
async def get_audit_trail(persona_id: str):
    """Get audit trail for a customer's decisions."""
    now = datetime.utcnow()
    
    # Generate deterministic audit entries
    entries = [
        AuditLogEntry(
            id="AUD-001",
            timestamp=now.replace(second=19, microsecond=481000),
            actor="Setu AA Ingestion Gateway",
            action="FIU FI-Request Fetch (HDFC + ICICI)",
            resource_type="consent",
            resource_id=f"CNST-{persona_id[:4].upper()}",
            result="SUCCESS (200)",
            policy_id=None,
            integrity_hash=hashlib.sha256(f"audit-1-{persona_id}".encode()).hexdigest()[:12],
        ),
        AuditLogEntry(
            id="AUD-002",
            timestamp=now.replace(second=20, microsecond=104000),
            actor="NIVA Cashflow Engine v4.9",
            action="Drawdown Velocity & Liquidity Stress Run",
            resource_type="financial_state",
            resource_id=persona_id,
            result="STRESS=78 HIGH",
            policy_id=None,
            integrity_hash=hashlib.sha256(f"audit-2-{persona_id}".encode()).hexdigest()[:12],
        ),
        AuditLogEntry(
            id="AUD-003",
            timestamp=now.replace(second=20, microsecond=312000),
            actor="Responsible Gatekeeper Node",
            action="Policy POL-402 (Anti-Predatory Overleveraging)",
            resource_type="recommendation",
            resource_id=f"REC-{persona_id[:4].upper()}",
            result="SUPPRESSED",
            policy_id="POL-402",
            integrity_hash=hashlib.sha256(f"audit-3-{persona_id}".encode()).hexdigest()[:12],
        ),
        AuditLogEntry(
            id="AUD-004",
            timestamp=now.replace(minute=3, second=2, microsecond=890000),
            actor="Bank Officer (Underwriting)",
            action="Case File Inspected (Session 0921-A)",
            resource_type="recommendation",
            resource_id=f"REC-{persona_id[:4].upper()}",
            result="VIEWED",
            policy_id=None,
            integrity_hash=hashlib.sha256(f"audit-4-{persona_id}".encode()).hexdigest()[:12],
        ),
    ]

    # Include any dynamic empathetic relief actions accepted by customer in journey
    from app.api.v1.journey import _accepted_relief_actions
    for act in _accepted_relief_actions:
        if act.get("persona_id") == persona_id:
            entries.insert(0, AuditLogEntry(
                id=act["id"],
                timestamp=datetime.fromisoformat(act["timestamp"]),
                actor="Customer via Empathetic Relief Modal",
                action=f"EMPATHETIC RELIEF GRANTED: {act['selected_option']}",
                resource_type="loan_restructuring",
                resource_id=act["id"],
                result="ACTIVE / NON-PUNITIVE",
                policy_id="POL-RELIEF-01",
                integrity_hash=hashlib.sha256(f"relief-{act['id']}".encode()).hexdigest()[:12],
            ))

    return {"persona_id": persona_id, "audit_trail": entries}
