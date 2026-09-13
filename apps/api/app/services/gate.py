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
        """Evaluate all products/schemes for a persona."""
        twin = await twin_service.compute_twin(persona_id)
        recommendations = []

        # 1. Fetch active bank schemes from Firestore
        catalog_items = {}
        try:
            from app.firebase_client import list_bank_schemes
            bank_schemes = list_bank_schemes(active_only=True)
            if bank_schemes:
                for s in bank_schemes:
                    sid = s.get("scheme_id") or s.get("id")
                    category = s.get("category", "credit")
                    is_subsidized = bool(s.get("subsidized", False))
                    suitability = {
                        "max_stress_score": float(s.get("max_stress_score", 50.0)),
                        "max_debt_to_income": float(s.get("max_dti", 0.45)),
                    }
                    if category in ["savings", "recovery", "protection"] or is_subsidized:
                        suitability["always_recommend_if_needed"] = True

                    catalog_items[sid] = {
                        "name": s.get("name", "Bank Scheme"),
                        "category": category,
                        "interest_rate_pct": float(s.get("interest_rate_pct", 8.5)),
                        "max_amount": float(s.get("max_amount", 50000.0)),
                        "tenure_months": int(s.get("tenure_months", 12)),
                        "eligibility": {"min_income": float(s.get("min_income", 15000.0))},
                        "suitability": suitability,
                        "originator": s.get("originator_bank", "State Bank of India"),
                        "description": s.get("description", ""),
                        "subsidized": is_subsidized,
                        "target_life_stage": s.get("target_life_stage", "ALL"),
                        "always_recommend_if_needed": category in ["savings", "recovery"] or is_subsidized,
                    }
        except Exception:
            pass

        if not catalog_items:
            catalog_items = PRODUCT_CATALOG

        for product_type, catalog in catalog_items.items():
            verdict = self._evaluate_single(twin, product_type, catalog)
            recommendations.append(verdict)

        # Sort recommendations: RECOMMEND first, then SUPPRESS
        recommendations.sort(key=lambda r: (0 if r.decision == "RECOMMEND" else 1))

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
        catalog_items = {}
        try:
            from app.firebase_client import get_bank_scheme
            scheme = get_bank_scheme(product_type)
            if scheme:
                category = scheme.get("category", "credit")
                is_subsidized = bool(scheme.get("subsidized", False))
                catalog_items[product_type] = {
                    "name": scheme.get("name", "Bank Scheme"),
                    "category": category,
                    "interest_rate_pct": float(scheme.get("interest_rate_pct", 8.5)),
                    "max_amount": float(scheme.get("max_amount", 50000.0)),
                    "tenure_months": int(scheme.get("tenure_months", 12)),
                    "eligibility": {"min_income": float(scheme.get("min_income", 15000.0))},
                    "suitability": {
                        "max_stress_score": float(scheme.get("max_stress_score", 50.0)),
                        "max_debt_to_income": float(scheme.get("max_dti", 0.45)),
                        "always_recommend_if_needed": category in ["savings", "recovery"] or is_subsidized,
                    },
                    "originator": scheme.get("originator_bank", "State Bank of India"),
                    "description": scheme.get("description", ""),
                    "subsidized": is_subsidized,
                    "target_life_stage": scheme.get("target_life_stage", "ALL"),
                    "always_recommend_if_needed": category in ["savings", "recovery"] or is_subsidized,
                }
        except Exception:
            pass

        if product_type not in catalog_items:
            if product_type in PRODUCT_CATALOG:
                catalog_items[product_type] = PRODUCT_CATALOG[product_type]
            else:
                raise ValueError(f"Unknown product: {product_type}")

        twin = await twin_service.compute_twin(persona_id)
        return self._evaluate_single(twin, product_type, catalog_items[product_type])

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

        try:
            from app.utils.terminal_logger import log_gate_policy_eval
            log_gate_policy_eval(
                policy_id=policy_id or "POL-APPROVED",
                policy_name="Statutory Responsible Lending & Protection Policy",
                product_name=catalog.get("name", product_type),
                decision=decision,
                rationale=gate_reason,
                metrics={
                    "Stress": f"{twin.stress_score}/100",
                    "DTI": f"{twin.debt.debt_to_income * 100:.1f}%",
                    "Buffer": f"{twin.liquidity.emergency_months:.1f} Mo",
                },
                persona_id=twin.user_id,
            )
        except Exception:
            pass

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
