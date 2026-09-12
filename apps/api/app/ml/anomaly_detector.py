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
        """
        results = []
        for txn in transactions:
            amount = float(txn.get("amount", 0.0))
            avg = float(txn.get("avg_amount_30d", amount))
            hour = int(txn.get("transaction_hour", 12))
            velocity = int(txn.get("velocity_1h", 1))
            is_new = 1 if txn.get("is_new_beneficiary", False) else 0

            amount_ratio = (amount / avg) if avg > 0 else 1.0
            hour_sin = float(np.sin(2 * np.pi * hour / 24))
            hour_cos = float(np.cos(2 * np.pi * hour / 24))
            is_night = 1 if hour >= 23 or hour <= 5 else 0

            features = np.array([[amount_ratio, hour_sin, hour_cos, is_night, velocity, is_new]])

            z_score = abs(amount - avg) / max(avg * 0.3, 1.0)

            if self.is_fitted:
                iso_score = float(self.model.decision_function(features)[0])
                is_iso_anomaly = self.model.predict(features)[0] == -1
            else:
                iso_score = 0.0
                is_iso_anomaly = z_score > 3.0

            # Normalized anomaly score (0.0 to 1.0)
            anomaly_score = min(1.0, max(0.0,
                0.6 * (1.0 - (iso_score + 0.5)) + 0.4 * min(1.0, z_score / 4.0)
            ))

            risk_flag = "NORMAL"
            if is_iso_anomaly or anomaly_score > 0.65:
                if is_night and velocity > 3:
                    risk_flag = "UNUSUAL_MIDNIGHT_VELOCITY"
                elif amount_ratio > 5.0:
                    risk_flag = "AMOUNT_SPIKE"
                elif is_new and amount > avg * 3.0:
                    risk_flag = "NEW_BENEFICIARY_LARGE_TRANSFER"
                else:
                    risk_flag = "PATTERN_ANOMALY"

            results.append({
                "transaction_id": txn.get("transaction_id", txn.get("id", "")),
                "is_anomaly": bool(is_iso_anomaly or anomaly_score > 0.65),
                "anomaly_score": round(anomaly_score, 4),
                "risk_flag": risk_flag,
                "z_score": round(z_score, 2),
            })

        return results
