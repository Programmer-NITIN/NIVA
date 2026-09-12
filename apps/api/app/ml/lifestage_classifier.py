"""
Step 5: Life-Stage Classifier Module
Loads the trained Random Forest classifier and LabelEncoder to categorize customers into
Bharat demographic life stages for hyper-targeted product recommendations:
- EARLY_CAREER_GIG
- EARLY_CAREER_SALARIED
- ESTABLISHED_FAMILY_HIGH_DEBT
- MSME_KIRANA_SEASONAL
- RURAL_AGRI_ALLIED
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "app" / "ml" / "saved_models" / "lifestage_classifier.joblib"
ENCODER_PATH = BASE_DIR / "app" / "ml" / "saved_models" / "lifestage_encoder.joblib"

LIFESTAGE_FEATURES = [
    "monthly_income",
    "income_volatility_cv",
    "dti_ratio",
    "merchant_category_entropy",
    "upi_txns_per_day",
    "discretionary_spend_ratio",
    "savings_rate",
]

PRODUCT_RECOMMENDATIONS = {
    "EARLY_CAREER_GIG": [
        {"product": "Daily Sachet Micro-Insurance", "category": "insurance", "rationale": "High road exposure & income volatility"},
        {"product": "Flexi-Recurring Deposit (₹50/day)", "category": "savings", "rationale": "Micro-savings tailored for daily platform payouts"},
        {"product": "Emergency UPI Credit Line (₹10k)", "category": "credit", "rationale": "Overcome end-of-month cash buffer shortfalls"},
    ],
    "EARLY_CAREER_SALARIED": [
        {"product": "Automated Index SIP", "category": "investment", "rationale": "Long investment horizon with surplus income"},
        {"product": "Digital Health Shield Plan", "category": "insurance", "rationale": "Comprehensive base medical coverage"},
        {"product": "Rewards Fuel/Dining Credit Card", "category": "credit", "rationale": "Optimize high discretionary lifestyle spend"},
    ],
    "ESTABLISHED_FAMILY_HIGH_DEBT": [
        {"product": "Personal Loan Debt Consolidation", "category": "debt_relief", "rationale": "Consolidate high-interest loans to reduce monthly EMI stress"},
        {"product": "Pure Term Life Insurance (1 Cr)", "category": "insurance", "rationale": "Secure dependents against liability debt"},
        {"product": "Automated Budget Expense Cap", "category": "savings", "rationale": "Control rising discretionary and dining expenses"},
    ],
    "MSME_KIRANA_SEASONAL": [
        {"product": "Working Capital Overdraft", "category": "business_loan", "rationale": "Manage supplier payments and inventory restock"},
        {"product": "QR Soundbox Merchant Loan", "category": "credit", "rationale": "Unsecured loan underwritten on daily UPI QR volumes"},
        {"product": "Shop & Inventory Fire/Theft Cover", "category": "insurance", "rationale": "Protect commercial stock from unforeseen losses"},
    ],
    "RURAL_AGRI_ALLIED": [
        {"product": "Pradhan Mantri Fasal Bima / Weather Insurance", "category": "insurance", "rationale": "Hedge against seasonal weather fluctuations"},
        {"product": "Kisan Credit Card (KCC) Subvention Renewal", "category": "credit", "rationale": "Avail interest subvention on timely seasonal repayment"},
        {"product": "Sovereign Gold Loan / Agri-equipment Finance", "category": "secured_loan", "rationale": "Low-interest liquidity for agricultural inputs"},
    ],
}


class LifeStageClassifier:
    """Predicts demographic and behavioral life stage from financial twin metrics."""

    def __init__(self, model_path: Optional[Path] = None, encoder_path: Optional[Path] = None):
        m_path = model_path or MODEL_PATH
        e_path = encoder_path or ENCODER_PATH

        if not m_path.exists() or not e_path.exists():
            raise FileNotFoundError(
                f"LifeStage model or encoder not found at {m_path} or {e_path}."
            )

        self.model = joblib.load(m_path)
        self.encoder = joblib.load(e_path)

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Classifies life stage and returns targeted next-best-actions.
        """
        X = np.array([[features.get(f, 0.0) for f in LIFESTAGE_FEATURES]])
        pred_encoded = self.model.predict(X)[0]
        life_stage_name = str(self.encoder.inverse_transform([pred_encoded])[0])
        probabilities = self.model.predict_proba(X)[0]

        # Get top class probabilities
        class_probs = {
            cls: round(float(prob), 4)
            for cls, prob in zip(self.encoder.classes_, probabilities)
        }

        # Targeted recommendations for this life stage
        recommendations = PRODUCT_RECOMMENDATIONS.get(life_stage_name, [])

        return {
            "life_stage": life_stage_name,
            "confidence": round(float(max(probabilities)), 4),
            "class_probabilities": class_probs,
            "recommended_products": recommendations,
        }
