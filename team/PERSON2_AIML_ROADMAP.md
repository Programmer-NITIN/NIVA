# 🧠 Person 2: AI/ML Lead — Complete Execution Roadmap

> **Owner**: Person 2 (AI/ML & Data Science)  
> **Objective**: Build 4 ML models + 1 explainability engine that plug directly into NIVA's existing FastAPI backend  
> **Time Budget**: ~20 hours of focused work across the hackathon

---

## 📋 Table of Contents
1. [What Already Exists (Don't Rebuild)](#1-what-already-exists-dont-rebuild)
2. [What You Must Build](#2-what-you-must-build)
3. [Environment Setup (Do This First)](#3-environment-setup-do-this-first)
4. [Step 1: Synthetic Dataset Generator](#step-1-synthetic-dataset-generator-hour-0-2)
5. [Step 2: Stress & Default Prediction Model (XGBoost)](#step-2-stress--default-prediction-model-xgboost-hour-2-4)
6. [Step 3: SHAP Explainability Engine](#step-3-shap-explainability-engine-hour-4-6)
7. [Step 4: Anomaly & Fraud Detection Model](#step-4-anomaly--fraud-detection-model-hour-6-8)
8. [Step 5: Life-Stage Classifier](#step-5-life-stage-classifier-hour-8-10)
9. [Step 6: Responsible NBA Recommender](#step-6-responsible-nba-recommender-hour-10-12)
10. [Step 7: FastAPI Integration & Endpoints](#step-7-fastapi-integration--endpoints-hour-12-16)
11. [Step 8: Model Evaluation Report](#step-8-model-evaluation-report-hour-16-18)
12. [Step 9: Merkle Audit Trail](#step-9-merkle-audit-trail-hour-18-20)
13. [Git Sync Checkpoints (When to Push)](#git-sync-checkpoints)
14. [File Structure You Will Create](#file-structure-you-will-create)

---

## 1. What Already Exists (Don't Rebuild)

These things are ALREADY BUILT by Person 1. Do NOT duplicate them. Your models will consume their outputs.

| Component | File | What It Does |
|---|---|---|
| **Financial Twin** | `apps/api/app/services/twin.py` | Computes health_score (0-100), stress_score, income metrics, DTI, liquidity, expenses, anomaly_score using rule-based arithmetic |
| **Responsible Gate** | `apps/api/app/services/gate.py` | 4-stage pipeline (Eligibility → Suitability → Stress → Affordability) using hardcoded thresholds |
| **AA Mock Provider** | `apps/api/app/providers/aa/mock_rebit.py` | 3 persona JSON files (Rajesh, Anita, Vikram) with 6 months of realistic Indian transactions |
| **Persona Data** | `apps/api/app/providers/aa/personas/*.json` | ~30-50 transactions per persona with categories: salary, emi, rent, groceries, shopping, dining, transport, entertainment, investment, health, insurance |
| **Pydantic Schemas** | `apps/api/app/schemas/financial.py` | `IncomeMetrics`, `ExpenseMetrics`, `SavingsMetrics`, `DebtMetrics`, `LiquidityMetrics`, `StressFactor` |
| **Z-Score Anomaly** | `twin.py` line 345-361 | Basic max Z-score anomaly on transaction amounts (you'll replace this with Isolation Forest) |
| **Stress Detection** | `twin.py` line 250-343 | Rule-based stress (savings < 10%, DTI > 40%, expenses trending up, EMI > 35%, low buffer) |

**Key Insight**: The existing system is 100% rule-based with hardcoded thresholds. Your ML models will provide **learned** predictions that are more accurate and come with SHAP explainability — this is the hackathon differentiator.

---

## 2. What You Must Build

| # | Model | Algorithm | Why It Matters for Judges |
|---|---|---|---|
| 1 | **Synthetic Dataset Generator** | Python script with `numpy` + `pandas` | Foundation for everything; realistic Indian banking patterns |
| 2 | **Early Stress & Default Predictor** | `XGBoostClassifier` | Beats the rule-based system; learns nonlinear risk patterns |
| 3 | **SHAP Explainability Engine** | `shap.TreeExplainer` | RBI compliance + "Explainability" judging criterion |
| 4 | **Transaction Anomaly Detector** | `IsolationForest` + Rolling Z-Score | Fraud protection for Tier 2/3/4 users |
| 5 | **Life-Stage Classifier** | `RandomForestClassifier` | Right product at the right moment (not one-size-fits-all) |
| 6 | **Responsible NBA Recommender** | Utility score + Policy constraints | Anti-predatory product recommendations |

---

## 3. Environment Setup (Do This First)

### 3.1 Install ML Dependencies
```bash
cd d:\All Project\hackout_daiict\NIVA\apps\api
pip install xgboost lightgbm scikit-learn shap pandas numpy joblib matplotlib seaborn
```

### 3.2 Create Your Folder Structure
```bash
mkdir -p app/ml/saved_models
mkdir -p app/ml/reports
mkdir -p data
```

### 3.3 Verify Existing Backend Runs
```bash
python -m uvicorn app.main:app --port 8000
# Visit http://localhost:8000/docs — confirm /api/v1/twin/rajesh_sharma works
```

---

## Step 1: Synthetic Dataset Generator (Hour 0–2)

### What to Build
Create `apps/api/app/ml/generate_data.py` — a script that produces **5,000 synthetic Indian banking customer profiles** as a CSV.

### Where to Get Data Patterns
You do NOT need external datasets. You will generate synthetic data modeled after the **3 existing personas** in `apps/api/app/providers/aa/personas/`. Open each JSON and study the transaction amounts, categories, and patterns.

| Persona | Income Range (₹) | Stress | Key Pattern |
|---|---|---|---|
| **Rajesh** (`rajesh_sharma.json`) | ₹78,500/month fixed salary | HIGH | Stable salary but rising shopping/dining, high EMI (₹14,350), declining savings, AirPods/tablet impulse buys |
| **Anita** (`anita_desai.json`) | ₹35,000-60,000/month variable | LOW-MODERATE | Kirana daily cash inflows, wholesale supplier payments, seasonal festival surges |
| **Vikram** (`vikram_patel.json`) | ₹18,000-30,000/month volatile | MODERATE | Gig platform credits (Swiggy/Zomato/Rapido), micro-transactions, no EMI but no savings |

### Exact Features to Generate (13 columns)

```python
FEATURE_COLUMNS = [
    "monthly_income",           # ₹15,000 to ₹2,00,000
    "income_volatility_cv",     # Coefficient of variation (0.0 to 0.8)
    "dti_ratio",                # Debt-to-Income (0.0 to 0.75)
    "savings_rate",             # (Income - Expenses) / Income (-0.3 to 0.5)
    "liquidity_buffer_days",    # Balance / Daily Expenses (0 to 180)
    "discretionary_spend_ratio",# Discretionary / Total Spend (0.05 to 0.65)
    "late_mandate_count_90d",   # Failed auto-debits in 90 days (0 to 8)
    "balance_trend_slope",      # Monthly balance linear slope (-15000 to +10000)
    "expense_trend_pct",        # MoM expense change % (-20 to +60)
    "upi_txns_per_day",         # Daily UPI transaction count (0.5 to 25)
    "night_txn_ratio",          # % of txns between 11pm-5am (0.0 to 0.25)
    "new_beneficiary_pct",      # % of txns to first-time VPAs (0.0 to 0.4)
    "merchant_category_entropy",# Shannon entropy of spending categories (0.5 to 3.0)
]

TARGET_COLUMN = "is_stressed"   # Binary: 0 = healthy, 1 = financially stressed
LIFESTAGE_COLUMN = "life_stage" # Multi-class: see below
```

### Data Generation Logic

```python
import numpy as np
import pandas as pd

np.random.seed(42)
N = 5000

def generate_bharat_dataset(n=N):
    data = {}

    # --- 4 Archetypes (proportional to Indian demographics) ---
    archetypes = np.random.choice(
        ["salaried_tier1", "kirana_msme", "gig_worker", "rural_agri"],
        size=n, p=[0.30, 0.25, 0.25, 0.20]
    )

    for i in range(n):
        arch = archetypes[i]

        if arch == "salaried_tier1":
            income = np.random.normal(65000, 25000)
            cv = np.random.uniform(0.02, 0.10)
            dti = np.random.uniform(0.15, 0.55)
            savings = np.random.uniform(-0.05, 0.35)
            buffer = np.random.uniform(15, 120)
            disc_ratio = np.random.uniform(0.15, 0.55)
            late = np.random.choice([0,0,0,0,1,1,2,3], p=[0.4,0.15,0.15,0.1,0.05,0.05,0.05,0.05])
            entropy = np.random.uniform(1.5, 2.8)
            upi = np.random.uniform(2, 12)
            night = np.random.uniform(0.01, 0.08)
            new_ben = np.random.uniform(0.02, 0.12)

        elif arch == "kirana_msme":
            income = np.random.normal(42000, 15000)
            cv = np.random.uniform(0.15, 0.45)
            dti = np.random.uniform(0.05, 0.30)
            savings = np.random.uniform(0.05, 0.30)
            buffer = np.random.uniform(20, 90)
            disc_ratio = np.random.uniform(0.05, 0.20)
            late = np.random.choice([0,0,0,1], p=[0.5,0.2,0.2,0.1])
            entropy = np.random.uniform(0.8, 1.8)
            upi = np.random.uniform(5, 25)
            night = np.random.uniform(0.0, 0.03)
            new_ben = np.random.uniform(0.05, 0.25)

        elif arch == "gig_worker":
            income = np.random.normal(22000, 8000)
            cv = np.random.uniform(0.25, 0.65)
            dti = np.random.uniform(0.0, 0.15)
            savings = np.random.uniform(-0.15, 0.15)
            buffer = np.random.uniform(3, 45)
            disc_ratio = np.random.uniform(0.08, 0.30)
            late = np.random.choice([0,0,1,2,3], p=[0.3,0.25,0.2,0.15,0.1])
            entropy = np.random.uniform(0.6, 1.5)
            upi = np.random.uniform(8, 25)
            night = np.random.uniform(0.03, 0.18)
            new_ben = np.random.uniform(0.03, 0.15)

        else:  # rural_agri
            income = np.random.normal(18000, 7000)
            cv = np.random.uniform(0.30, 0.80)
            dti = np.random.uniform(0.0, 0.25)
            savings = np.random.uniform(-0.10, 0.20)
            buffer = np.random.uniform(5, 60)
            disc_ratio = np.random.uniform(0.03, 0.15)
            late = np.random.choice([0,0,1,2,3,4], p=[0.2,0.2,0.2,0.15,0.15,0.1])
            entropy = np.random.uniform(0.5, 1.2)
            upi = np.random.uniform(0.5, 5)
            night = np.random.uniform(0.0, 0.05)
            new_ben = np.random.uniform(0.01, 0.08)

        income = max(8000, income)
        balance_slope = np.random.normal(income * (savings - 0.1), income * 0.15)
        expense_trend = np.random.normal(5, 15)

        # --- Ground Truth: Stress Label ---
        stress_score = 0
        if dti > 0.40: stress_score += 25
        if savings < 0.05: stress_score += 20
        if buffer < 20: stress_score += 15
        if late >= 2: stress_score += 15
        if balance_slope < -5000: stress_score += 10
        if disc_ratio > 0.40: stress_score += 10
        if expense_trend > 25: stress_score += 5
        # Add noise
        stress_score += np.random.normal(0, 8)
        is_stressed = 1 if stress_score >= 45 else 0

        # --- Life Stage Label ---
        if arch == "salaried_tier1" and dti > 0.35:
            life_stage = "ESTABLISHED_FAMILY_HIGH_DEBT"
        elif arch == "kirana_msme":
            life_stage = "MSME_KIRANA_SEASONAL"
        elif arch == "gig_worker":
            life_stage = "EARLY_CAREER_GIG"
        else:
            life_stage = "RURAL_AGRI_ALLIED"

        # Store row (add to lists or dict)
        # ... (append to DataFrame)

    return pd.DataFrame(data)
```

### Output Files
```
data/synthetic_profiles.csv     → 5,000 rows × 15 columns
data/synthetic_transactions.csv → 150,000 rows (30 txns per customer)
```

### ✅ Done When
- CSV generated, stats printed, no NaN values.
- Distribution sanity check: ~25-30% stressed class (realistic for Indian banking).

---

## Step 2: Stress & Default Prediction Model (XGBoost) (Hour 2–4)

### What to Build
Create `apps/api/app/ml/train_stress_model.py`

### Algorithm & Hyperparameters
```python
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import classification_report, roc_auc_score
import joblib

# Load data
df = pd.read_csv("data/synthetic_profiles.csv")
X = df[FEATURE_COLUMNS]
y = df["is_stressed"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=(y_train == 0).sum() / (y_train == 1).sum(),  # Handle class imbalance
    eval_metric="logloss",
    random_state=42,
    use_label_encoder=False,
)

model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

# Evaluate
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]
print(classification_report(y_test, y_pred))
print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

# Save model
joblib.dump(model, "app/ml/saved_models/stress_predictor.joblib")
```

### Target Metrics (Minimum for Demo)
| Metric | Target |
|---|---|
| ROC-AUC | > 0.85 |
| Precision (Stressed) | > 0.75 |
| Recall (Stressed) | > 0.80 |
| F1 (Stressed) | > 0.77 |

### How This Replaces the Existing System
- Currently `twin.py` lines 250-343 use **fixed thresholds** (DTI > 40% = +25 stress points).
- Your XGBoost model **learns the nonlinear interaction** between ALL 13 features simultaneously.
- Example: A customer with DTI = 42% is currently always flagged. But XGBoost might learn that DTI 42% + high savings_rate 30% + buffer 90 days = actually LOW risk.

---

## Step 3: SHAP Explainability Engine (Hour 4–6)

### What to Build
Create `apps/api/app/ml/explainer.py`

### Implementation
```python
import shap
import joblib
import numpy as np

class StressExplainer:
    """SHAP-based explainability for the stress prediction model."""

    def __init__(self):
        self.model = joblib.load("app/ml/saved_models/stress_predictor.joblib")
        self.explainer = shap.TreeExplainer(self.model)
        self.feature_names = [
            "monthly_income", "income_volatility_cv", "dti_ratio",
            "savings_rate", "liquidity_buffer_days", "discretionary_spend_ratio",
            "late_mandate_count_90d", "balance_trend_slope", "expense_trend_pct",
            "upi_txns_per_day", "night_txn_ratio", "new_beneficiary_pct",
            "merchant_category_entropy",
        ]
        # Human-readable names for UI display
        self.feature_labels = {
            "monthly_income": "Monthly Income",
            "income_volatility_cv": "Income Stability",
            "dti_ratio": "Debt-to-Income Ratio",
            "savings_rate": "Savings Rate",
            "liquidity_buffer_days": "Liquidity Buffer (Days)",
            "discretionary_spend_ratio": "Discretionary Spending %",
            "late_mandate_count_90d": "Late Payment Count (90d)",
            "balance_trend_slope": "Balance Trend",
            "expense_trend_pct": "Expense Growth %",
            "upi_txns_per_day": "UPI Txns/Day",
            "night_txn_ratio": "Night Transaction %",
            "new_beneficiary_pct": "New Beneficiary %",
            "merchant_category_entropy": "Spending Diversity",
        }

    def explain(self, features: dict) -> dict:
        """
        Returns:
        - stress_probability: float (0.0 to 1.0)
        - risk_level: str ("low"/"moderate"/"elevated"/"high"/"critical")
        - top_risk_factors: list of {feature, value, shap_value, direction, label}
        - top_protective_factors: list of same
        """
        X = np.array([[features[f] for f in self.feature_names]])
        prob = float(self.model.predict_proba(X)[0][1])
        shap_values = self.explainer.shap_values(X)[0]

        # Build factor list sorted by absolute SHAP contribution
        factors = []
        for i, fname in enumerate(self.feature_names):
            factors.append({
                "feature": fname,
                "label": self.feature_labels[fname],
                "value": round(features[fname], 4),
                "shap_value": round(float(shap_values[i]), 4),
                "direction": "risk" if shap_values[i] > 0 else "protective",
            })

        factors.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

        risk_factors = [f for f in factors if f["direction"] == "risk"][:5]
        protective_factors = [f for f in factors if f["direction"] == "protective"][:3]

        # Classify risk level
        if prob >= 0.80: level = "critical"
        elif prob >= 0.60: level = "high"
        elif prob >= 0.40: level = "elevated"
        elif prob >= 0.25: level = "moderate"
        else: level = "low"

        return {
            "stress_probability": round(prob, 4),
            "risk_level": level,
            "top_risk_factors": risk_factors,
            "top_protective_factors": protective_factors,
            "all_shap_values": {fname: round(float(shap_values[i]), 4) for i, fname in enumerate(self.feature_names)},
            "base_value": round(float(self.explainer.expected_value), 4),
        }
```

### Why This Wins Points
The judges want **"Explainability and RBI/regulatory compliance readiness"**. SHAP waterfall charts give:
- **For Customers**: "Your loan was declined because your debt payments are 48% of income and your savings dropped 15% this quarter."
- **For Compliance**: Mathematical proof that the model isn't using caste, religion, or gender — only financial behavior.

---

## Step 4: Anomaly & Fraud Detection Model (Hour 6–8)

### What to Build
Create `apps/api/app/ml/anomaly_detector.py`

### Algorithm: Isolation Forest + Dynamic Z-Score
```python
from sklearn.ensemble import IsolationForest
import numpy as np

class TransactionAnomalyDetector:
    """Detects fraudulent or unusual transactions using Isolation Forest."""

    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.03,  # Expect ~3% anomalous transactions
            max_samples="auto",
            random_state=42,
        )
        self.is_fitted = False

    def fit(self, transaction_features: np.ndarray):
        """
        Fit on historical transaction features.
        Each row = [amount, amount_to_avg_ratio, hour_sin, hour_cos,
                     velocity_1h, is_new_beneficiary, is_night]
        """
        self.model.fit(transaction_features)
        self.is_fitted = True

    def detect(self, transactions: list[dict]) -> list[dict]:
        """
        Score each transaction for anomaly.

        Input: list of dicts with keys:
          - amount: float
          - transaction_hour: int (0-23)
          - velocity_1h: int (txns in last hour)
          - is_new_beneficiary: bool
          - avg_amount_30d: float (rolling 30-day avg for this category)
        """
        results = []
        for txn in transactions:
            amount = txn["amount"]
            avg = txn.get("avg_amount_30d", amount)
            hour = txn.get("transaction_hour", 12)

            # Feature engineering
            amount_ratio = amount / avg if avg > 0 else 1.0
            hour_sin = np.sin(2 * np.pi * hour / 24)
            hour_cos = np.cos(2 * np.pi * hour / 24)
            is_night = 1 if hour >= 23 or hour <= 5 else 0
            velocity = txn.get("velocity_1h", 1)
            is_new = 1 if txn.get("is_new_beneficiary", False) else 0

            features = np.array([[amount_ratio, hour_sin, hour_cos,
                                   is_night, velocity, is_new]])

            # Z-score component
            z_score = abs(amount - avg) / max(avg * 0.3, 1)  # Simplified

            # Isolation Forest score (-1 = anomaly, 1 = normal)
            if self.is_fitted:
                iso_score = self.model.decision_function(features)[0]
                is_anomaly = self.model.predict(features)[0] == -1
            else:
                iso_score = 0
                is_anomaly = z_score > 3.0

            # Combined anomaly score (0 to 1)
            anomaly_score = min(1.0, max(0.0,
                0.6 * (1 - (iso_score + 0.5))  # Isolation Forest contribution
                + 0.4 * min(1.0, z_score / 4)  # Z-score contribution
            ))

            # Determine risk flag
            risk_flag = "NORMAL"
            if is_anomaly or anomaly_score > 0.7:
                if is_night and velocity > 3:
                    risk_flag = "UNUSUAL_MIDNIGHT_VELOCITY"
                elif amount_ratio > 5:
                    risk_flag = "AMOUNT_SPIKE"
                elif is_new and amount > avg * 3:
                    risk_flag = "NEW_BENEFICIARY_LARGE_TRANSFER"
                else:
                    risk_flag = "PATTERN_ANOMALY"

            results.append({
                "transaction_id": txn.get("id", ""),
                "is_anomaly": bool(is_anomaly or anomaly_score > 0.65),
                "anomaly_score": round(anomaly_score, 4),
                "risk_flag": risk_flag,
                "z_score": round(z_score, 2),
            })

        return results
```

### How to Get Training Data
Use the **existing persona transactions** from `apps/api/app/providers/aa/personas/*.json`:
1. Load all 3 persona JSON files.
2. Extract amount, hour, category fields.
3. Fit Isolation Forest on "normal" transactions.
4. Inject 3% synthetic anomalies (e.g., ₹50,000 at 2 AM to new VPA).

---

## Step 5: Life-Stage Classifier (Hour 8–10)

### What to Build
Create `apps/api/app/ml/train_lifestage_model.py`

### Classes & Mapping to Products
| Life Stage Class | Example Persona | Best Product Recommendations |
|---|---|---|
| `EARLY_CAREER_GIG` | Vikram | Micro-Insurance, Emergency RD, UPI Credit Line |
| `ESTABLISHED_FAMILY_HIGH_DEBT` | Rajesh | Debt Consolidation, Term Insurance, Budget Optimizer |
| `MSME_KIRANA_SEASONAL` | Anita | Working Capital OD, GST Invoice Financing, Business Insurance |
| `RURAL_AGRI_ALLIED` | New | Crop Insurance, KCC Renewal, Gold Loan |

### Features Used (subset of the 13 + extras)
```python
LIFESTAGE_FEATURES = [
    "monthly_income",
    "income_volatility_cv",      # High CV = gig/seasonal
    "dti_ratio",                 # High DTI = established family
    "merchant_category_entropy", # Low = focused (kirana), High = diverse (salaried)
    "upi_txns_per_day",          # High = gig/kirana
    "discretionary_spend_ratio", # High = salaried lifestyle
    "savings_rate",
]
```

### Algorithm
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

le = LabelEncoder()
y_stage = le.fit_transform(df["life_stage"])

model_stage = RandomForestClassifier(
    n_estimators=150,
    max_depth=8,
    class_weight="balanced",
    random_state=42,
)
model_stage.fit(X_train_stage, y_train_stage)

# Save
joblib.dump(model_stage, "app/ml/saved_models/lifestage_classifier.joblib")
joblib.dump(le, "app/ml/saved_models/lifestage_encoder.joblib")
```

---

## Step 6: Responsible NBA Recommender (Hour 10–12)

### What to Build
Create `apps/api/app/ml/recommender.py`

### This is NOT a pure ML model — it's a Policy-Constrained Scoring Engine

```python
PRODUCT_CATALOG = {
    "personal_loan":    {"category": "credit",  "risk_weight": 0.8},
    "credit_card":      {"category": "credit",  "risk_weight": 0.6},
    "working_capital":  {"category": "credit",  "risk_weight": 0.5},
    "emergency_fund_rd":{"category": "savings", "risk_weight": 0.0},
    "health_insurance": {"category": "protection","risk_weight": 0.0},
    "sip_mutual_fund":  {"category": "investment","risk_weight": 0.1},
    "debt_restructure": {"category": "recovery","risk_weight": 0.0},
    "micro_insurance":  {"category": "protection","risk_weight": 0.0},
    "fd_deposit":       {"category": "savings", "risk_weight": 0.0},
}

def recommend(stress_prob, life_stage, twin_metrics):
    """
    Returns ranked product list with responsible gate verdicts.

    ANTI-PREDATORY RULE:
    If stress_probability > 0.45:
      - SUPPRESS all credit products (loans, credit cards)
      - PROMOTE recovery & protection products
    """
    scores = {}

    for product_id, meta in PRODUCT_CATALOG.items():
        # Base utility: need-based scoring from life_stage
        need_score = NEED_MATRIX.get((life_stage, product_id), 0.3)

        # Risk penalty: higher stress = lower score for credit products
        risk_penalty = meta["risk_weight"] * stress_prob

        # Final score
        utility = need_score - risk_penalty

        # HARD GATE: Suppress credit products for stressed users
        suppressed = False
        if stress_prob > 0.45 and meta["category"] == "credit":
            suppressed = True
            suppression_reason = f"Financial stress detected (probability: {stress_prob:.0%}). Recommending protective alternatives instead."

        scores[product_id] = {
            "utility": round(utility, 3),
            "suppressed": suppressed,
            "reason": suppression_reason if suppressed else "Eligible and suitable",
        }

    # Sort: non-suppressed first, then by utility descending
    ranked = sorted(scores.items(), key=lambda x: (x[1]["suppressed"], -x[1]["utility"]))
    return ranked
```

### Need Matrix (Life-Stage × Product)
```python
NEED_MATRIX = {
    ("EARLY_CAREER_GIG", "micro_insurance"):     0.9,
    ("EARLY_CAREER_GIG", "emergency_fund_rd"):   0.85,
    ("EARLY_CAREER_GIG", "personal_loan"):       0.3,
    ("ESTABLISHED_FAMILY_HIGH_DEBT", "debt_restructure"): 0.9,
    ("ESTABLISHED_FAMILY_HIGH_DEBT", "health_insurance"): 0.85,
    ("ESTABLISHED_FAMILY_HIGH_DEBT", "personal_loan"):    0.4,
    ("MSME_KIRANA_SEASONAL", "working_capital"):  0.9,
    ("MSME_KIRANA_SEASONAL", "health_insurance"): 0.7,
    ("RURAL_AGRI_ALLIED", "micro_insurance"):     0.9,
    ("RURAL_AGRI_ALLIED", "emergency_fund_rd"):   0.8,
    # ... fill remaining combinations with 0.3 default
}
```

---

## Step 7: FastAPI Integration & Endpoints (Hour 12–16)

### What to Build
Create `apps/api/app/api/v1/ml.py` and register it in the main router.

### Endpoint Specifications

```python
from fastapi import APIRouter
from app.ml.explainer import StressExplainer
from app.ml.anomaly_detector import TransactionAnomalyDetector
from app.ml.recommender import ResponsibleRecommender

router = APIRouter(prefix="/ml", tags=["ML Intelligence"])

# Endpoint 1: ML Stress Prediction + SHAP
@router.get("/stress-prediction/{persona_id}")
async def predict_stress(persona_id: str):
    """
    Returns ML-predicted stress probability with SHAP explainability.
    Response includes:
    - stress_probability (0.0 to 1.0)
    - risk_level (low/moderate/elevated/high/critical)
    - top_risk_factors (with SHAP values)
    - top_protective_factors
    - comparison with rule-based system
    """

# Endpoint 2: Transaction Anomaly Detection
@router.get("/anomalies/{persona_id}")
async def detect_anomalies(persona_id: str):
    """
    Scans all transactions for the persona and flags anomalies.
    Returns list of flagged transactions with risk_flag and anomaly_score.
    """

# Endpoint 3: Life-Stage Classification
@router.get("/life-stage/{persona_id}")
async def classify_life_stage(persona_id: str):
    """
    Classifies the customer's life stage from financial behavior.
    Returns predicted_life_stage, confidence, and primary_need.
    """

# Endpoint 4: Responsible NBA Recommendations
@router.get("/responsible-recommendations/{persona_id}")
async def get_responsible_recommendations(persona_id: str):
    """
    Returns ranked product recommendations with suppression verdicts.
    Uses ML stress prediction + life-stage + policy gate.
    """

# Endpoint 5: Model Performance Metrics
@router.get("/model-metrics")
async def get_model_metrics():
    """
    Returns pre-computed evaluation metrics (ROC-AUC, F1, Confusion Matrix).
    For the bank compliance dashboard.
    """
```

### How to Register in Main Router
Open `apps/api/app/api/router.py` and add:
```python
from app.api.v1 import ml
api_router.include_router(ml.router, prefix="/v1")
```

### Bridging ML Features from Existing Twin
The key integration point — extract ML features from the existing `FinancialTwinService`:

```python
async def extract_ml_features(persona_id: str) -> dict:
    """Extract the 13 ML features from the existing Financial Twin."""
    twin = await twin_service.compute_twin(persona_id)

    return {
        "monthly_income": twin.income.monthly_income,
        "income_volatility_cv": (100 - twin.income.stability) / 100,
        "dti_ratio": twin.debt.debt_to_income,
        "savings_rate": twin.savings.rate / 100,
        "liquidity_buffer_days": twin.liquidity.emergency_months * 30,
        "discretionary_spend_ratio": twin.expenses.discretionary / max(twin.expenses.total, 1),
        "late_mandate_count_90d": 0,  # Not tracked in current twin; default 0
        "balance_trend_slope": 0,     # Compute from raw txns if needed
        "expense_trend_pct": twin.expenses.trend,
        "upi_txns_per_day": 5.0,      # Compute from raw txns
        "night_txn_ratio": 0.05,      # Compute from raw txns
        "new_beneficiary_pct": 0.08,  # Compute from raw txns
        "merchant_category_entropy": 2.0,  # Compute from raw txns
    }
```

---

## Step 8: Model Evaluation Report (Hour 16–18)

### What to Build
Create `apps/api/app/ml/reports/evaluation.md` — an auto-generated markdown report.

### Generate via Script
```python
# In train_stress_model.py, after training:
report = f"""
# NIVA ML Model Evaluation Report

## 1. Stress & Default Predictor (XGBoost)
- **ROC-AUC**: {roc_auc:.4f}
- **Accuracy**: {accuracy:.4f}
- **Precision (Stressed)**: {precision:.4f}
- **Recall (Stressed)**: {recall:.4f}
- **F1 (Stressed)**: {f1:.4f}
- **Training Samples**: {len(X_train)}
- **Test Samples**: {len(X_test)}

## 2. Feature Importance (Top 5)
{feature_importance_table}

## 3. Life-Stage Classifier (Random Forest)
- **Accuracy**: {stage_accuracy:.4f}
- **Macro F1**: {stage_f1:.4f}

## 4. Anomaly Detector (Isolation Forest)
- **Contamination**: 3%
- **Flagged in Test Set**: {n_flagged} / {n_total}

## 5. Ethical AI Statement
- Model uses ONLY financial behavioral features
- No demographic features (gender, caste, religion, location) used
- SHAP explainability provided for every prediction
- Anti-predatory suppression active for stressed users
"""
```

---

## Step 9: Merkle Audit Trail (Hour 18–20)

### What to Build
Create `apps/api/app/ml/audit.py`

```python
import hashlib
import json
from datetime import datetime

class MerkleAuditTrail:
    """Tamper-proof audit log for recommendation decisions."""

    def __init__(self):
        self.entries = []
        self.root_hash = None

    def log_decision(self, persona_id: str, decision: dict) -> str:
        """Log a recommendation decision with Merkle hash."""
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "persona_id": persona_id,
            "decision": decision,
            "previous_hash": self.entries[-1]["hash"] if self.entries else "GENESIS",
        }
        entry["hash"] = hashlib.sha256(
            json.dumps(entry, sort_keys=True, default=str).encode()
        ).hexdigest()

        self.entries.append(entry)
        self.root_hash = entry["hash"]
        return entry["hash"]

    def verify_chain(self) -> bool:
        """Verify the entire audit chain is tamper-free."""
        for i, entry in enumerate(self.entries):
            expected_prev = self.entries[i-1]["hash"] if i > 0 else "GENESIS"
            if entry["previous_hash"] != expected_prev:
                return False
            # Recompute hash
            check = {k: v for k, v in entry.items() if k != "hash"}
            computed = hashlib.sha256(
                json.dumps(check, sort_keys=True, default=str).encode()
            ).hexdigest()
            if computed != entry["hash"]:
                return False
        return True
```

---

## Git Sync Checkpoints

| When | What You Push | Branch | Then What |
|---|---|---|---|
| **Hour 2** | `data/synthetic_profiles.csv` + `generate_data.py` | `feature/ai-ml-models` | Push to your branch only |
| **Hour 4** | Trained `stress_predictor.joblib` + `explainer.py` | `feature/ai-ml-models` | **MERGE to `main`** → Tell Person 1 to pull |
| **Hour 8** | `anomaly_detector.py` + `lifestage_classifier.joblib` | `feature/ai-ml-models` | Push to your branch |
| **Hour 12** | `recommender.py` + `ml.py` API routes | `feature/ai-ml-models` | **MERGE to `main`** → Joint integration test |
| **Hour 18** | `audit.py` + `evaluation.md` report | `feature/ai-ml-models` | **MERGE to `main`** |
| **Hour 20** | Bug fixes only | `main` directly | **CODE FREEZE at Hour 22** |

### Merge Commands
```bash
# When ready to merge (e.g., Hour 4):
git add .
git commit -m "feat(ml): stress predictor with SHAP explainability"
git push origin feature/ai-ml-models

git checkout main
git pull origin main
git merge feature/ai-ml-models
# Verify: python -m uvicorn app.main:app --port 8000
git push origin main

# Go back to your branch
git checkout feature/ai-ml-models
git merge main
```

---

## File Structure You Will Create

```
apps/api/
├── app/
│   ├── ml/                              ← YOUR ENTIRE WORKSPACE
│   │   ├── __init__.py
│   │   ├── generate_data.py             ← Step 1: Synthetic data generator
│   │   ├── train_stress_model.py        ← Step 2: XGBoost stress training
│   │   ├── train_lifestage_model.py     ← Step 5: RandomForest life-stage
│   │   ├── explainer.py                 ← Step 3: SHAP explainability
│   │   ├── anomaly_detector.py          ← Step 4: Isolation Forest fraud
│   │   ├── recommender.py              ← Step 6: Responsible NBA engine
│   │   ├── audit.py                     ← Step 9: Merkle audit trail
│   │   ├── saved_models/
│   │   │   ├── stress_predictor.joblib
│   │   │   ├── lifestage_classifier.joblib
│   │   │   └── lifestage_encoder.joblib
│   │   └── reports/
│   │       └── evaluation.md
│   ├── api/v1/
│   │   └── ml.py                        ← Step 7: FastAPI ML endpoints
│   └── services/
│       └── ml_models.py                 ← Step 7: ML service wrapper
├── data/
│   ├── synthetic_profiles.csv
│   └── synthetic_transactions.csv
└── requirements.txt                     ← Add: xgboost, scikit-learn, shap, joblib
```

---

## ⚡ Quick Reference: Run Order

```bash
# 1. Setup
cd d:\All Project\hackout_daiict\NIVA\apps\api
pip install xgboost scikit-learn shap pandas numpy joblib

# 2. Generate data
python -m app.ml.generate_data

# 3. Train stress model
python -m app.ml.train_stress_model

# 4. Train life-stage model
python -m app.ml.train_lifestage_model

# 5. Start server with ML endpoints
python -m uvicorn app.main:app --reload --port 8000

# 6. Test ML endpoints
# GET http://localhost:8000/api/v1/ml/stress-prediction/rajesh_sharma
# GET http://localhost:8000/api/v1/ml/anomalies/rajesh_sharma
# GET http://localhost:8000/api/v1/ml/life-stage/rajesh_sharma
# GET http://localhost:8000/api/v1/ml/responsible-recommendations/rajesh_sharma
```
