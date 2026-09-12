"""
Step 4: Transaction Anomaly & Fraud Detector
Combines Isolation Forest with rolling dynamic Z-score on transaction features:
- Relative amount ratio (amount / 30d category avg)
- Time-of-day cyclical features (hour_sin, hour_cos, is_night)
- Velocity (txns in last hour)
- New beneficiary transfer indicator
Flags: UNUSUAL_MIDNIGHT_VELOCITY, AMOUNT_SPIKE, NEW_BENEFICIARY_LARGE_TRANSFER, PATTERN_ANOMALY
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "app" / "ml" / "saved_models" / "anomaly_detector.joblib"


class TransactionAnomalyDetector:
    """Detects unusual or suspicious banking transactions using Isolation Forest + Dynamic Z-score."""

    def __init__(self, model_path: Optional[Path] = None):
        target_path = model_path or MODEL_PATH
        if target_path.exists():
            self.model = joblib.load(target_path)
            self.is_fitted = True
        else:
            self.model = IsolationForest(
                n_estimators=100,
                contamination=0.03,  # Expect ~3% anomalous transactions
                max_samples="auto",
                random_state=42,
            )
            self.is_fitted = False

    def fit(self, transaction_features: np.ndarray):
        """Fit on transaction feature matrix."""
        self.model.fit(transaction_features)
        self.is_fitted = True
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)

    def detect(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Score a list of transactions for anomalies.
        Expected dict fields:
          - amount: float
          - transaction_hour: int (0-23)
          - velocity_1h: int
          - is_new_beneficiary: bool
          - avg_amount_30d: float
          - category_std: float (optional)
          - category: str (optional)
          - merchant_name: str (optional)
          - narration: str (optional)
          - description: str (optional)
        """
        results = []
        for txn in transactions:
            amount = float(txn.get("amount", 0.0))
            avg = float(txn.get("avg_amount_30d", amount))
            if avg <= 0:
                avg = max(amount, 1000.0)
            cat_std = float(txn.get("category_std", max(avg * 0.25, 100.0)))
            if cat_std <= 0:
                cat_std = max(avg * 0.25, 100.0)

            hour = int(txn.get("transaction_hour", 12))
            velocity = int(txn.get("velocity_1h", 1))
            is_new = 1 if txn.get("is_new_beneficiary", False) else 0

            category = str(txn.get("category", "general"))
            merchant = str(txn.get("merchant_name", "") or "")
            narrative = str(txn.get("narration", "") or txn.get("description", "") or "")

            amount_ratio = (amount / avg) if avg > 0 else 1.0
            hour_sin = float(np.sin(2 * np.pi * hour / 24))
            hour_cos = float(np.cos(2 * np.pi * hour / 24))
            is_night = 1 if hour >= 23 or hour <= 5 else 0

            features = np.array([[min(amount_ratio, 10.0), hour_sin, hour_cos, is_night, velocity, is_new]])

            # True statistical z-score relative to category/user baseline
            z_score = abs(amount - avg) / max(cat_std, 50.0)

            if self.is_fitted:
                try:
                    iso_score = float(self.model.decision_function(features)[0])
                    is_iso_anomaly = bool(self.model.predict(features)[0] == -1)
                except Exception:
                    iso_score = 0.0
                    is_iso_anomaly = z_score > 2.5
            else:
                iso_score = 0.0
                is_iso_anomaly = z_score > 2.5

            # Categorical rules for financial sanity:
            # Fixed expenses (rent, EMI, SIP) with steady predictable amounts are NOT anomalies
            is_fixed_recurring = any(k in category.lower() for k in ["rent", "emi", "sip", "investment", "salary"])
            if is_fixed_recurring and amount_ratio <= 1.25 and z_score <= 1.0:
                is_anomaly = False
                risk_flag = "NORMAL"
            else:
                is_anomaly = False
                risk_flag = "NORMAL"

                if is_night and velocity > 2 and amount > 2000:
                    is_anomaly = True
                    risk_flag = "UNUSUAL_MIDNIGHT_VELOCITY"
                elif amount_ratio >= 2.0 and z_score >= 2.0 and amount >= 3000:
                    is_anomaly = True
                    risk_flag = "AMOUNT_SPIKE"
                elif is_new and amount > avg * 2.5 and amount >= 5000:
                    is_anomaly = True
                    risk_flag = "NEW_BENEFICIARY_LARGE_TRANSFER"
                elif is_iso_anomaly and (amount_ratio >= 1.9 or z_score >= 2.3) and amount >= 3000:
                    is_anomaly = True
                    risk_flag = "PATTERN_ANOMALY"

            # Clean human-friendly description
            clean_merchant = merchant or narrative or category.title()
            if risk_flag == "UNUSUAL_MIDNIGHT_VELOCITY":
                description = f"Late-night velocity spike: {clean_merchant}"
            elif risk_flag == "AMOUNT_SPIKE":
                description = f"Sudden {amount_ratio:.1f}× spend spike in {category.title()} ({clean_merchant})"
            elif risk_flag == "NEW_BENEFICIARY_LARGE_TRANSFER":
                description = f"High-value transfer to new payee ({clean_merchant})"
            elif is_anomaly:
                description = f"Unusual {category.title()} purchase ({clean_merchant})"
            else:
                description = f"{clean_merchant} — {category.title()}"

            # Normalized anomaly score (0.0 to 1.0)
            if is_anomaly:
                anomaly_score = min(1.0, max(0.65,
                    0.5 * (1.0 - min(1.0, max(-1.0, iso_score) + 0.5)) + 0.5 * min(1.0, z_score / 4.0)
                ))
            else:
                anomaly_score = min(0.35, max(0.0, z_score / 8.0))

            results.append({
                "transaction_id": str(txn.get("transaction_id") or txn.get("id") or ""),
                "amount": round(amount, 2),
                "category": category,
                "description": description,
                "merchant_name": merchant,
                "narration": narrative,
                "transaction_date": str(txn.get("transaction_date", "")),
                "type": str(txn.get("type", "DEBIT")),
                "is_anomaly": is_anomaly,
                "anomaly_score": round(anomaly_score, 4),
                "risk_flag": risk_flag,
                "z_score": round(z_score, 1),
            })

        return results

