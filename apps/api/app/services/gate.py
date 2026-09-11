"""
NIVA — Responsible Recommendation Gate Service.

The flagship differentiator: recommendations that put customer welfare first.
Suppresses harmful product recommendations when financial stress is detected.

Pipeline: Eligibility → Suitability → Stress Check → Affordability → Gate Decision
"""

from datetime import datetime
from app.services.twin import FinancialTwinService
from app.schemas.recommendation import GateVerdictResponse, RecommendationListResponse

twin_service = FinancialTwinService()

# Product catalog with eligibility and suitability rules
PRODUCT_CATALOG = {
    "personal_loan": {
        "name": "Pre-approved Personal Loan ₹2,00,000 @ 12.5% p.a.",
        "eligibility": {"min_income": 25000, "min_months_history": 6},
        "suitability": {"max_stress_score": 55, "max_debt_to_income": 0.45, "max_emi_burden": 0.50},
        "proposed_emi": 6690,
        "proposed_tenure": 36,
        "total_interest": 40840,
        "originator": "HDFC Lending Portal",
    },
    "credit_card": {
        "name": "Premium Rewards Credit Card",
        "eligibility": {"min_income": 30000},
        "suitability": {"max_stress_score": 60, "max_credit_utilization": 0.70},
        "originator": "ICICI Cards Division",
    },
    "emergency_fund": {
        "name": "Emergency Fund — 90-Day Cash Buffer Strategy",
        "eligibility": {"min_income": 15000},
        "suitability": {"emergency_months_below": 3},
        "always_recommend_if_needed": True,
        "originator": "NIVA Financial Planning",
    },
    "fixed_deposit": {
        "name": "High-Yield Fixed Deposit @ 7.5% p.a.",
        "eligibility": {"min_income": 20000, "min_balance": 25000},
        "suitability": {"min_savings_rate": 10},
        "originator": "SBI FD Division",
    },
    "sip": {
        "name": "Balanced Advantage SIP — ₹5,000/month",
        "eligibility": {"min_income": 30000},
        "suitability": {"max_stress_score": 50, "min_savings_rate": 15},
        "originator": "Axis Mutual Fund",
    },
    "health_insurance": {
        "name": "Family Health Insurance — ₹5L Cover",
        "eligibility": {"min_income": 15000},
        "suitability": {"always": True},
        "originator": "NIVA Insurance Advisory",
    },
}


class ResponsibleGateService:
    """Evaluates product recommendations through the Responsible AI Gate."""

    async def evaluate_all_products(self, persona_id: str) -> RecommendationListResponse:
        """Evaluate all products for a persona."""
        twin = await twin_service.compute_twin(persona_id)
        recommendations = []

        for product_type, catalog in PRODUCT_CATALOG.items():
            verdict = self._evaluate_single(twin, product_type, catalog)
            recommendations.append(verdict)

        suppressed = sum(1 for r in recommendations if r.decision == "SUPPRESS")
        recommended = sum(1 for r in recommendations if r.decision == "RECOMMEND")

        return RecommendationListResponse(
            user_id=persona_id,
            recommendations=recommendations,
            suppressed_count=suppressed,
            recommended_count=recommended,
        )

    async def evaluate_product(self, persona_id: str, product_type: str) -> GateVerdictResponse:
        """Evaluate a specific product for a persona."""
        if product_type not in PRODUCT_CATALOG:
            raise ValueError(f"Unknown product: {product_type}")

        twin = await twin_service.compute_twin(persona_id)
        return self._evaluate_single(twin, product_type, PRODUCT_CATALOG[product_type])

    def _evaluate_single(self, twin, product_type: str, catalog: dict) -> GateVerdictResponse:
        """Run the gate pipeline for a single product."""
        eligibility_factors = []
        suitability_factors = []
        is_eligible = True
        is_suitable = True

        elig = catalog.get("eligibility", {})
        suit = catalog.get("suitability", {})

        # === ELIGIBILITY ===
        if "min_income" in elig:
            met = twin.income.monthly_income >= elig["min_income"]
            eligibility_factors.append({
                "factor": "Minimum income",
                "required": f"₹{elig['min_income']:,}",
                "actual": f"₹{twin.income.monthly_income:,}",
                "met": met,
            })
            if not met:
                is_eligible = False

        if "min_balance" in elig:
            met = twin.liquidity.available_balance >= elig["min_balance"]
            eligibility_factors.append({
                "factor": "Minimum balance",
                "required": f"₹{elig['min_balance']:,}",
                "actual": f"₹{twin.liquidity.available_balance:,.0f}",
                "met": met,
            })
            if not met:
                is_eligible = False

        # === SUITABILITY (the Responsible Gate) ===
        if "max_stress_score" in suit:
            met = twin.stress_score <= suit["max_stress_score"]
            suitability_factors.append({
                "factor": "Stress score threshold",
                "threshold": suit["max_stress_score"],
                "actual": twin.stress_score,
                "met": met,
                "severity": "critical" if not met else "ok",
            })
            if not met:
                is_suitable = False

        if "max_debt_to_income" in suit:
            met = twin.debt.debt_to_income <= suit["max_debt_to_income"]
            suitability_factors.append({
                "factor": "Debt-to-income ratio",
                "threshold": f"{suit['max_debt_to_income'] * 100}%",
                "actual": f"{twin.debt.debt_to_income * 100:.1f}%",
                "met": met,
            })
            if not met:
                is_suitable = False

        if "max_emi_burden" in suit:
            # Include proposed EMI
            proposed_emi = catalog.get("proposed_emi", 0)
            new_burden = (twin.debt.total_emi + proposed_emi) / twin.income.monthly_income if twin.income.monthly_income > 0 else 1
            met = new_burden <= suit["max_emi_burden"]
            suitability_factors.append({
                "factor": "EMI burden (with new loan)",
                "threshold": f"{suit['max_emi_burden'] * 100}%",
                "actual": f"{new_burden * 100:.1f}%",
                "met": met,
            })
            if not met:
                is_suitable = False

        if "max_credit_utilization" in suit:
            met = (twin.debt.credit_utilization or 0) <= suit["max_credit_utilization"]
            suitability_factors.append({
                "factor": "Credit utilization",
                "threshold": f"{suit['max_credit_utilization'] * 100}%",
                "actual": f"{(twin.debt.credit_utilization or 0) * 100:.0f}%",
                "met": met,
            })
            if not met:
                is_suitable = False

        if "min_savings_rate" in suit:
            met = twin.savings.rate >= suit["min_savings_rate"]
            suitability_factors.append({
                "factor": "Minimum savings rate",
                "threshold": f"{suit['min_savings_rate']}%",
                "actual": f"{twin.savings.rate:.1f}%",
                "met": met,
            })
            if not met:
                is_suitable = False

        if "emergency_months_below" in suit:
            met = twin.liquidity.emergency_months < suit["emergency_months_below"]
            suitability_factors.append({
                "factor": "Emergency buffer below target",
                "threshold": f"{suit['emergency_months_below']} months",
                "actual": f"{twin.liquidity.emergency_months} months",
                "met": met,  # For emergency fund, "met" means they NEED it
            })
            if met and catalog.get("always_recommend_if_needed"):
                is_suitable = True  # Emergency fund is always recommended when needed

        if suit.get("always"):
            is_suitable = True

        # === GATE DECISION ===
        if is_eligible and is_suitable:
            decision = "RECOMMEND"
            gate_reason = f"Customer meets all eligibility and suitability criteria for {catalog['name']}."
            policy_id = None
            alternative = None
            alt_product = None
        elif is_eligible and not is_suitable:
            decision = "SUPPRESS"
            failed = [f["factor"] for f in suitability_factors if not f.get("met", True)]
            gate_reason = (
                f"Eligible but NOT suitable. "
                f"Suitability checks failed: {', '.join(failed)}. "
                f"Taking additional debt now creates elevated default risk."
            )
            policy_id = "POL-402"
            alternative = "Activate 90-day cash buffer strategy. Stabilize discretionary spending. Re-evaluate after stress indicators normalize."
            alt_product = "emergency_fund"
        else:
            decision = "SUPPRESS"
            failed = [f["factor"] for f in eligibility_factors if not f.get("met", True)]
            gate_reason = f"Does not meet eligibility criteria: {', '.join(failed)}."
            policy_id = "POL-100"
            alternative = None
            alt_product = None

        # Impact projections for suppressed loans
        risk_shift = None
        interest_saved = None
        recovery_days = None
        if product_type == "personal_loan" and decision == "SUPPRESS":
            risk_shift = "+340%"
            interest_saved = catalog.get("total_interest", 40840)
            recovery_days = 90

        return GateVerdictResponse(
            product_type=product_type,
            product_name=catalog["name"],
            decision=decision,
            is_eligible=is_eligible,
            eligibility_factors=eligibility_factors,
            is_suitable=is_suitable,
            suitability_factors=suitability_factors,
            gate_reason=gate_reason,
            policy_id=policy_id,
            alternative_action=alternative,
            alternative_product=alt_product,
            risk_shift=risk_shift,
            interest_saved=interest_saved,
            recovery_time_days=recovery_days,
            model_version="v1.0",
            created_at=datetime.utcnow(),
        )
