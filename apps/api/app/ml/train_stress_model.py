"""
Step 2: Train XGBoost Early Stress & Default Predictor
Loads data/synthetic_profiles.csv, trains XGBClassifier with class weighting,
evaluates metrics (ROC-AUC, Precision, Recall), and exports to app/ml/saved_models/stress_predictor.joblib.
"""

from pathlib import Path
import joblib
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BASE_DIR / "data" / "synthetic_profiles.csv"
MODEL_PATH = BASE_DIR / "app" / "ml" / "saved_models" / "stress_predictor.joblib"

FEATURE_COLUMNS = [
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

TARGET_COLUMN = "is_stressed"


def train():
    print(f"🔄 Loading training data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # Calculate class weight ratio for imbalance
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_weight = float(neg_count / pos_count) if pos_count > 0 else 1.0

    print(f"📊 Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    print(f"⚖️ Scale Pos Weight: {scale_weight:.2f}")

    model = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_weight,
        eval_metric="logloss",
        random_state=42,
    )

    model.fit(
        X_train,
        y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False,
    )

    # Evaluation
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_prob)

    print("\n" + "=" * 50)
    print("📈 CLASSIFICATION REPORT")
    print("=" * 50)
    print(classification_report(y_test, y_pred, digits=4))
    print(f"⭐ ROC-AUC Score: {auc:.4f}")
    print("=" * 50)

    # Save model
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\n✅ Model successfully saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
