"""
Step 3: SHAP Explainability Engine
Loads the trained XGBoost model and calculates Shapley values (TreeExplainer)
to attribute customer financial stress to specific behavioral features.
Complies with RBI explainability and transparency guidelines.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np

try:
    import shap
except ImportError:
    shap = None

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "app" / "ml" / "saved_models" / "stress_predictor.joblib"


class StressExplainer:
    """SHAP-based explainability for the XGBoost stress prediction model."""

    FEATURE_NAMES = [
        "monthly_income",
        "income_volatility_cv",
        "dti_ratio",
        "savings_rate",
        "liquidity_buffer_days",
        "discretionary_spend_ratio",
        "late_mandate_count_90d",
        "balance_trend_slope",
        "expense_trend_pct",
        "upi_txns_per_day",
        "night_txn_ratio",
        "new_beneficiary_pct",
        "merchant_category_entropy",
    ]

    FEATURE_LABELS = {
        "monthly_income": "Monthly Income (₹)",
        "income_volatility_cv": "Income Volatility",
        "dti_ratio": "Debt-to-Income Ratio (DTI)",
        "savings_rate": "Net Savings Rate",
        "liquidity_buffer_days": "Liquidity Buffer (Days)",
        "discretionary_spend_ratio": "Discretionary Spend %",
        "late_mandate_count_90d": "Late Payment/Mandate Count",
        "balance_trend_slope": "Balance Trend Slope",
        "expense_trend_pct": "MoM Expense Growth %",
        "upi_txns_per_day": "Daily UPI Frequency",
        "night_txn_ratio": "Late Night Transaction %",
        "new_beneficiary_pct": "New Beneficiary %",
        "merchant_category_entropy": "Category Spending Entropy",
    }

    def __init__(self, model_path: Optional[Path] = None):
        target_path = model_path or MODEL_PATH
        if not target_path.exists():
            raise FileNotFoundError(
                f"Model file not found at {target_path}. Run Step 2 training first."
            )

        self.model = joblib.load(target_path)
        self.explainer = None
        if shap is not None:
            self.explainer = shap.TreeExplainer(self.model)

    def explain(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Explain a single customer's stress prediction.
        
        Returns:
            - stress_probability: float (0.0 to 1.0)
            - risk_level: str ("low" | "moderate" | "elevated" | "high" | "critical")
            - top_risk_factors: list of features increasing stress
            - top_protective_factors: list of features decreasing stress
            - all_shap_values: dict of {feature: shap_value}
        """
        X = np.array([[features.get(f, 0.0) for f in self.FEATURE_NAMES]])
        prob = float(self.model.predict_proba(X)[0][1])

        # Compute SHAP values if shap is installed, fallback to feature contributions
        if self.explainer is not None:
            raw_shap = self.explainer.shap_values(X)
            # Binary classification tree explainer handles single array or 2-element list
            if isinstance(raw_shap, list):
                shap_values = raw_shap[1][0]
            elif raw_shap.ndim == 2:
                shap_values = raw_shap[0]
            else:
                shap_values = raw_shap[0][0]
        else:
            # Simple fallback using feature importances
            importances = self.model.feature_importances_
            shap_values = importances * (1.0 if prob > 0.5 else -1.0)

        factors: List[Dict[str, Any]] = []
        all_shap: Dict[str, float] = {}

        for i, fname in enumerate(self.FEATURE_NAMES):
            s_val = float(shap_values[i])
            all_shap[fname] = round(s_val, 4)
            factors.append({
                "feature": fname,
                "label": self.FEATURE_LABELS.get(fname, fname),
                "value": round(float(features.get(fname, 0.0)), 4),
                "shap_value": round(s_val, 4),
                "direction": "risk" if s_val > 0 else "protective",
                "impact_magnitude": round(abs(s_val), 4),
            })

        # Rank by magnitude
        factors.sort(key=lambda x: x["impact_magnitude"], reverse=True)

        risk_factors = [f for f in factors if f["direction"] == "risk"][:5]
        protective_factors = [f for f in factors if f["direction"] == "protective"][:3]

        # Calibrate risk tier
        if prob >= 0.80:
            risk_level = "critical"
        elif prob >= 0.60:
            risk_level = "high"
        elif prob >= 0.40:
            risk_level = "elevated"
        elif prob >= 0.25:
            risk_level = "moderate"
        else:
            risk_level = "low"

        base_val = 0.0
        if self.explainer is not None and hasattr(self.explainer, "expected_value"):
            exp_val = self.explainer.expected_value
            base_val = float(exp_val[1] if isinstance(exp_val, (list, np.ndarray)) else exp_val)

        return {
            "stress_probability": round(prob, 4),
            "risk_level": risk_level,
            "top_risk_factors": risk_factors,
            "top_protective_factors": protective_factors,
            "all_shap_values": all_shap,
            "base_value": round(base_val, 4),
        }
