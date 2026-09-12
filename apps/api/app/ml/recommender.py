"""
Step 6: Responsible Next-Best-Action (NBA) Recommender
Combines ML Stress Probability, Predicted Life-Stage, and Policy-Constrained Utility Scoring.
Enforces strict anti-predatory lending rules:
- Suppresses high-risk credit (unsecured loans, credit cards) for financially stressed users (stress_prob > 0.45).
- Promotes protective, recovery, and savings products (debt restructure, emergency RD, health shield).
"""

from typing import Any, Dict, List, Optional


PRODUCT_CATALOG = {
    "personal_loan": {
        "id": "personal_loan",
        "name": "Quick Disbursal Personal Loan",
        "category": "credit",
        "risk_weight": 0.85,
        "description": "Instant unsecured personal loan for lifestyle or capital needs.",
    },
    "credit_card": {
        "id": "credit_card",
        "name": "Platinum Rewards Credit Card",
        "category": "credit",
        "risk_weight": 0.70,
        "description": "Revolving credit line with cashbacks on dining and fuel.",
    },
    "working_capital": {
        "id": "working_capital",
        "name": "MSME Working Capital Overdraft",
        "category": "business_credit",
        "risk_weight": 0.40,
        "description": "Flexible OD line against monthly merchant cashflow & GST returns.",
    },
    "emergency_fund_rd": {
        "id": "emergency_fund_rd",
        "name": "Flexi-Recurring Deposit (Emergency Buffer)",
        "category": "savings",
        "risk_weight": 0.0,
        "description": "Automated micro-savings to build a 3-month liquidity cushion.",
    },
    "health_insurance": {
        "id": "health_insurance",
        "name": "Comprehensive Family Health Shield",
        "category": "protection",
        "risk_weight": 0.0,
        "description": "Cashless hospitalization cover protecting savings from medical shocks.",
    },
    "sip_mutual_fund": {
        "id": "sip_mutual_fund",
        "name": "Automated Index Wealth SIP",
        "category": "investment",
        "risk_weight": 0.10,
        "description": "Systematic investment in diversified equity index funds.",
    },
    "debt_restructure": {
        "id": "debt_restructure",
        "name": "Debt Consolidation & EMI Reducer Plan",
        "category": "recovery",
        "risk_weight": 0.0,
        "description": "Restructures multiple high-interest debts into a single, affordable EMI.",
    },
    "micro_insurance": {
        "id": "micro_insurance",
        "name": "Daily Sachet Gig & Accidental Cover",
        "category": "protection",
        "risk_weight": 0.0,
        "description": "Bite-sized accidental and income protection starting at ₹5/day.",
    },
    "fd_deposit": {
        "id": "fd_deposit",
        "name": "High-Yield Fixed Deposit",
        "category": "savings",
        "risk_weight": 0.0,
        "description": "Guaranteed returns for surplus idle funds.",
    },
}

# Need utility matrix: (LifeStage, ProductID) -> Base Utility (0.0 to 1.0)
NEED_MATRIX = {
    # Gig workers
    ("EARLY_CAREER_GIG", "micro_insurance"): 0.95,
    ("EARLY_CAREER_GIG", "emergency_fund_rd"): 0.90,
    ("EARLY_CAREER_GIG", "personal_loan"): 0.25,
    ("EARLY_CAREER_GIG", "credit_card"): 0.30,
    ("EARLY_CAREER_GIG", "health_insurance"): 0.70,

    # Established family with debt
    ("ESTABLISHED_FAMILY_HIGH_DEBT", "debt_restructure"): 0.95,
    ("ESTABLISHED_FAMILY_HIGH_DEBT", "health_insurance"): 0.90,
    ("ESTABLISHED_FAMILY_HIGH_DEBT", "emergency_fund_rd"): 0.85,
    ("ESTABLISHED_FAMILY_HIGH_DEBT", "personal_loan"): 0.20,
    ("ESTABLISHED_FAMILY_HIGH_DEBT", "credit_card"): 0.15,

    # Kirana / MSME
    ("MSME_KIRANA_SEASONAL", "working_capital"): 0.95,
    ("MSME_KIRANA_SEASONAL", "health_insurance"): 0.75,
    ("MSME_KIRANA_SEASONAL", "fd_deposit"): 0.70,
    ("MSME_KIRANA_SEASONAL", "emergency_fund_rd"): 0.65,

    # Early Career Salaried
    ("EARLY_CAREER_SALARIED", "sip_mutual_fund"): 0.95,
    ("EARLY_CAREER_SALARIED", "credit_card"): 0.85,
    ("EARLY_CAREER_SALARIED", "health_insurance"): 0.80,
    ("EARLY_CAREER_SALARIED", "emergency_fund_rd"): 0.75,

    # Rural / Agri
    ("RURAL_AGRI_ALLIED", "micro_insurance"): 0.95,
    ("RURAL_AGRI_ALLIED", "emergency_fund_rd"): 0.85,
    ("RURAL_AGRI_ALLIED", "debt_restructure"): 0.75,
    ("RURAL_AGRI_ALLIED", "personal_loan"): 0.20,
}


class ResponsibleRecommender:
    """Policy-constrained recommendation engine enforcing RBI anti-predatory guidelines."""

    def __init__(self, stress_threshold: float = 0.45):
        self.stress_threshold = stress_threshold

    def recommend(
        self,
        stress_probability: float,
        life_stage: str,
        twin_metrics: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Computes ranked, responsible next-best-actions.
        """
        recommendations = []

        is_stressed = stress_probability >= self.stress_threshold

        for product_id, catalog_item in PRODUCT_CATALOG.items():
            category = catalog_item["category"]
            risk_weight = catalog_item["risk_weight"]

            # 1. Base need utility from life stage
            base_need = NEED_MATRIX.get((life_stage, product_id), 0.35)

            # 2. Risk penalty based on customer's ML stress score
            risk_penalty = risk_weight * stress_probability

            # 3. Final utility score
            utility_score = max(0.05, base_need - risk_penalty)

            # 4. Anti-predatory Policy Gate
            is_suppressed = False
            suppression_reason = None

            if is_stressed and category in ["credit"]:
                is_suppressed = True
                suppression_reason = (
                    f"Responsible Lending Gate: Customer exhibits elevated financial stress "
                    f"({stress_probability:.1%}). Unsecured credit offer suppressed to prevent over-indebtedness."
                )
            elif is_stressed and product_id in ["debt_restructure", "emergency_fund_rd"]:
                # Boost recovery products for stressed customers
                utility_score = min(1.0, utility_score + 0.25)

            recommendations.append({
                "product_id": product_id,
                "name": catalog_item["name"],
                "category": category,
                "utility_score": round(utility_score, 3),
                "is_suppressed": is_suppressed,
                "suppression_reason": suppression_reason,
                "description": catalog_item["description"],
                "policy_action": "BLOCKED_BY_GUARDRAIL" if is_suppressed else "ELIGIBLE",
            })

        # Sort: Active offers first (by descending utility), followed by suppressed offers
        recommendations.sort(key=lambda x: (x["is_suppressed"], -x["utility_score"]))
        return recommendations
