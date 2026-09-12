# 🚀 NIVA — Hackathon Master Implementation Roadmap & Team Plan

> **NIVA: Responsible Financial Intelligence for Bharat**  
> *AI-Powered Hyper-Personalized Banking Copilot & Institutional Risk Dashboard using RBI Account Aggregator (AA) Framework*

---

## 📋 Table of Contents
1. [Team Role Division & Ownership](#-team-role-division--ownership)
2. [Role-Based Architecture & Dashboard Specs](#-role-based-architecture--dashboard-specs)
3. [Machine Learning Models & Exact Parameters](#-machine-learning-models--exact-parameters)
4. [Data Sources & Synthetic Dataset Strategy](#-data-sources--synthetic-dataset-strategy)
5. [End-to-End Execution Roadmap](#-end-to-end-execution-roadmap)
6. [Judging Criteria Alignment & Deliverables Checklist](#-judging-criteria-alignment--deliverables-checklist)
7. [Git Synchronization & Merge Strategy (When to Pull & Merge)](#-git-synchronization--merge-strategy-when-to-pull--merge)

---

## 👥 Team Role Division & Ownership

To maximize development velocity during the hackathon, responsibilities are cleanly decoupled between **Person 1 (Full-Stack & Systems)** and **Person 2 (AI/ML & Data Science)**.

```
┌─────────────────────────────────────────────────────────┐
│                    PROJECT NIVA                         │
└────────────────────────────┬────────────────────────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       ▼                                           ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│  PERSON 1: UI & BACKEND LEAD  │   │  PERSON 2: AI/ML & DATA LEAD  │
├───────────────────────────────┤   ├───────────────────────────────┤
│ • Next.js 15 Frontend Pages   │   │ • Synthetic Bharat Data Gen   │
│ • FastAPI Router & Endpoints  │   │ • 5 ML Predictive Models      │
│ • RBAC Role Switcher & Auth   │   │ • SHAP Explainability Engine  │
│ • Vernacular Voice & Audio UI │   │ • ML Inference Pipelines      │
│ • ReBIT AA Mock Provider      │   │ • Anomaly Detection Service   │
│ • DPDP Consent Manager UI     │   │ • Model Metrics & Benchmarks  │
└───────────────────────────────┘   └───────────────────────────────┘
```

### 🧑‍💻 Person 1: UI, Backend & System Integration
- **Frontend Lead**:
  - Build/refine the 3 dedicated Role Dashboards (Customer, Bank RM, Compliance Auditor).
  - Implement the **Conversational Vernacular Loan & Onboarding Flow** (`/onboarding-loan`) with Hindi/Gujarati/English voice interactions.
  - Implement the **Empathetic Intervention Modal** (restructuring options, micro-SIP nudges instead of cold rejections).
  - Build the **DPDP Act 2023 Consent Manager** (granular toggles, 1-click consent revocation).
- **Backend Lead**:
  - Maintain and extend FastAPI endpoints (`/api/v1/ml/*`, `/api/v1/bank/*`, `/api/v1/twin/*`).
  - Implement Role-Based Access Control (RBAC) middleware and role switching.
  - Hook Person 2's serialized ML models into FastAPI services.
  - Ensure Merkle hash audit logging for all recommendations.

### 🧠 Person 2: AI/ML, Data Science & Explainability
- **Data Engineering**:
  - Create a realistic synthetic Indian banking dataset generator (`generate_bharat_data.py`) simulating 5,000+ customer profiles across Tier 1/2/3/4 demographics.
- **Model Development (5 Core Models)**:
  1. **Early Financial Stress & Default Predictor** (`XGBoost` / `LightGBM`).
  2. **Explainable AI Engine** (`SHAP TreeExplainer` waterfall values for model transparency).
  3. **Anomaly & Fraud Detection Model** (`Isolation Forest` + Dynamic Z-score velocity).
  4. **Life-Stage & Financial Milestone Classifier** (`RandomForestClassifier`).
  5. **Responsible Next-Best-Action (NBA) Recommender** (Constrained Contextual Bandit / Policy Utility Engine).
- **Inference Service**:
  - Package models under `apps/api/app/services/ml_models.py` with fast in-memory predictions (<10ms).

---

## 🏛️ Role-Based Architecture & Dashboard Specs

### 1. Customer Portal (`/` & `/ask-niva` & `/financial-state`)
* **Target Users**: *Rajesh (Stressed IT)*, *Anita (Kirana Owner)*, *Vikram (Gig Worker)*.
* **Key Features**:
  - **Financial Digital Twin**: 0–100 Health score, Income stability gauge, Liquidity buffer (days), DTI ratio.
  - **Ask NIVA Copilot**: Multi-lingual conversational agent (English, Hindi, Gujarati) with voice I/O.
  - **Zero-Hallucination Affordability Calculator**: Pure arithmetic "What-If" slider for major purchases.
  - **Conversational Loan Journey**: 3-step voice-assisted loan/overdraft application with zero manual paperwork.
  - **DPDP Consent Dashboard**: Clear data visibility, granular purpose selection, and 1-click "Forget Me" button.

### 2. Bank Relationship Manager (RM) / Underwriter Dashboard (`/bank`)
* **Target Users**: Credit Underwriters, Branch Managers, Loan Officers.
* **Key Features**:
  - **Customer 360 Portfolio**: Live feed of customer health metrics with search and filter.
  - **38-Day Information Blind Spot Comparison**: Visual side-by-side of legacy Bureau score (lagging) vs. Real-Time Account Aggregator Health (leading).
  - **Responsible Gate Decision Inspector**: Clear breakdown of why a product was Approved, Conditional, or Suppressed.
  - **Empathetic Outreach Action Center**: 1-click triggers for EMI restructuring, moratorium offers, or financial counseling.

### 3. Risk & Compliance Officer Dashboard (`/bank?view=compliance` or `/compliance`)
* **Target Users**: RBI Auditors, Internal Risk Committees, Model Governance Officers.
* **Key Features**:
  - **Early Warning System (EWS) Portfolio Heatmap**: Aggregated risk distribution across customer segments.
  - **Explainable AI (SHAP) Visualizer**: Interactive waterfall plot showing top contributing factors behind risk scores.
  - **Anti-Predatory Audit Trail**: Merkle-hashed immutable log proving predatory loans were suppressed for stressed users.
  - **DPDP Telemetry**: Audit log of customer consents granted, modified, and revoked.

---

## 🤖 Machine Learning Models & Exact Parameters

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      INPUT FEATURES (AA + Profile)                     │
 ├────────────────────────────────────────────────────────────────────────┤
 │ • monthly_income_inr           • avg_monthly_debit_inr                 │
 │ • income_volatility_cv         • dti_ratio (Debt-to-Income)            │
 │ • savings_rate_pct             • liquidity_buffer_days                 │
 │ • upi_txns_per_day             • late_mandate_frequency_90d           │
 │ • discretionary_spend_ratio    • balance_trend_slope (last 90 days)    │
 │ • night_txn_velocity (12-5am)  • new_vpa_transfer_pct                  │
 └───────────────────┬────────────────────────────────┬───────────────────┘
                     │                                │
                     ▼                                ▼
       ┌───────────────────────────┐    ┌───────────────────────────┐
       │   MODEL 1: STRESS & RISK  │    │   MODEL 2: ANOMALY/FRAUD  │
       │   (XGBoost + SHAP XAI)    │    │    (Isolation Forest)     │
       └─────────────┬─────────────┘    └─────────────┬─────────────┘
                     │                                │
                     ▼                                ▼
       ┌───────────────────────────┐    ┌───────────────────────────┐
       │   MODEL 3: LIFE-STAGE     │    │   MODEL 4: RESPONSIBLE    │
       │  (RandomForest Multi-Cls) │    │   NBA POLICY RECOMMENDER  │
       └─────────────┬─────────────┘    └─────────────┬─────────────┘
                     │                                │
                     └────────────────┬───────────────┘
                                      ▼
                      ┌───────────────────────────────┐
                      │  MODEL 5: VERNACULAR COPILOT  │
                      │   (Gemini 2.0 + Speech API)   │
                      └───────────────────────────────┘
```

### Model 1: Early Financial Stress & Default Risk Predictor
* **Algorithm**: `XGBoostClassifier` / `LightGBMClassifier` + `shap.TreeExplainer`
* **Objective**: Predict probability of financial distress / default in the next 60 days.
* **Parameters / Input Features**:
  1. `dti_ratio`: Total monthly EMIs / Monthly Inflows ($0.0 \to 1.0$).
  2. `income_volatility_cv`: Coefficient of variation of monthly credits (Standard Deviation / Mean).
  3. `liquidity_buffer_days`: Liquid balance / Average daily expenses ($0 \to 180+$ days).
  4. `savings_rate`: (Credits - Debits) / Credits (can be negative).
  5. `late_mandate_count_90d`: Number of failed auto-debits / NACH mandates.
  6. `balance_trend_slope`: Linear regression slope of ending balances over 3 months.
  7. `discretionary_spend_ratio`: Spending on dining/entertainment/luxury / Total spend.
* **Output**:
  - `stress_score`: $0.00 \to 1.00$ (Low, Moderate, High, Critical).
  - `shap_contributions`: Dictionary of top positive/negative drivers (e.g., `{"dti_ratio": +0.32, "liquidity_buffer_days": +0.25}`).

---

### Model 2: Transaction Anomaly & Fraud Detection Engine
* **Algorithm**: `IsolationForest` (contamination=0.03) + Dynamic Rolling Z-Score
* **Objective**: Protect non-tech-savvy users from sudden unauthorized drains or phishing scams.
* **Parameters / Input Features**:
  1. `txn_amount_inr`: Amount of the transaction.
  2. `amount_to_avg_ratio`: `txn_amount` / 30-day average transaction amount for category.
  3. `time_of_day_sin`/`cos`: Cyclical encoding of transaction hour.
  4. `is_night_txn`: Flag for transactions between 11:00 PM and 5:00 AM.
  5. `velocity_1h`: Number of transactions in the preceding 60 minutes.
  6. `is_new_beneficiary_vpa`: Boolean flag (first time transferring to this VPA).
* **Output**:
  - `is_anomaly`: Boolean (`True` / `False`).
  - `anomaly_score`: Normalized severity index ($0.0 \to 1.0$).
  - `risk_flag`: Categorical (`"UNUSUAL_MIDNIGHT_VELOCITY"`, `"AMOUNT_SPIKE"`, `"BENEFICIARY_SURGE"`).

---

### Model 3: Life-Stage & Financial Milestone Classifier
* **Algorithm**: `RandomForestClassifier` (Multi-class)
* **Objective**: Infer customer life stage to offer the right product at the exact right moment.
* **Classes**:
  - `EARLY_CAREER_GIG` (Vikram persona)
  - `ESTABLISHED_FAMILY_HIGH_DEBT` (Rajesh persona)
  - `MSME_KIRANA_SEASONAL` (Anita persona)
  - `RETIREMENT_PREPARATION`
* **Parameters / Input Features**:
  1. `inflow_regularity`: Regular monthly salary date (1-5th) vs. daily fragmented UPI credits.
  2. `merchant_category_entropy`: Spread of spending across grocery, business supply, e-commerce, school fees.
  3. `insurance_premium_detected`: Boolean flag for recurring LIC/Health insurance debits.
  4. `education_fee_surge`: Surge in recurring school/college fee debits in June/July or quarterly.
  5. `b2b_supplier_transfer_ratio`: Percentage of outflow going to wholesale merchant VPAs.
* **Output**:
  - `predicted_life_stage`: String code.
  - `primary_need`: E.g., `"WORKING_CAPITAL_LINE"`, `"DEBT_CONSOLIDATION"`, `"MICRO_HEALTH_INSURANCE"`.

---

### Model 4: Responsible Next-Best-Action (NBA) Policy Recommender
* **Algorithm**: Constrained Utility Ranking Function + Policy Gate:
  $$\text{Utility}(p) = w_{\text{elig}} \cdot E(p) + w_{\text{need}} \cdot N(p) - w_{\text{risk}} \cdot \text{StressRisk}$$
* **Responsible Anti-Predatory Rule**:
  $$\text{If } \text{StressRisk} > 0.45 \implies \text{FilterOut}(\text{UncollateralizedLoans}, \text{CreditCardLimitIncrease})$$
  $$\text{Promote}(\text{EmergencyFundRD}, \text{DebtRestructuring}, \text{MicroInsurance})$$

---

### Model 5: Vernacular Conversational Engine ("Ask NIVA")
* **Core Technology**: Gemini 2.0 Flash + Web Speech API (Voice Recognition & TTS)
* **Languages Supported**: English (`en-IN`), Hindi (`hi-IN`), Gujarati (`gu-IN`).
* **Zero-Hallucination Guardrail**:
  - LLM is constrained via strict JSON function calling to use deterministic backend tools (`calculate_affordability`, `get_twin_summary`, `get_gate_verdict`).
  - Strict system prompt prevents making up numerical estimations without API tools.

---

## 📊 Data Sources & Synthetic Dataset Strategy

### 1. Public Real-World Benchmark Datasets
Use these open-source datasets to guide feature ranges and validate ML architectures:
* **Kaggle Give Me Some Credit / Financial Distress Dataset**: For DTI, delinquency, and buffer-to-debt distributions.
* **Kaggle PaySim Financial Fraud Dataset**: For synthetic mobile money / UPI transaction logs.
* **RBI Annual Publications on Banking & Account Aggregator Statistics**: For realistic Indian ticket sizes (₹500 to ₹10,00,000).

### 2. Built-in Synthetic Bharat Data Generator (`generate_bharat_data.py`)
To guarantee 100% realistic AA transaction feeds, create a synthetic generator producing:
- **5,000 Simulated Indian Customers** across 4 archetypes:
  1. *Salaried Tier 1/2 IT / Corporate Worker*
  2. *Kirana & MSME Shopkeeper*
  3. *Gig / Platform Delivery Executive*
  4. *Rural / Agri-Allied Earner*
- **Output Artifacts**:
  - `data/synthetic_profiles.csv`
  - `data/synthetic_transactions.csv`
  - `apps/api/app/providers/aa/mock_db.json`

---

## 🗓️ End-to-End Execution Roadmap

```
  HOUR 0-4                 HOUR 4-12                HOUR 12-20               HOUR 20-24
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ PHASE 1:         │────▶│ PHASE 2:         │────▶│ PHASE 3:         │────▶│ PHASE 4:         │
│ Data Gen & ML    │     │ Dashboards &     │     │ XAI, Empathetic  │     │ Pitch, Polish &  │
│ Scaffolding      │     │ Journey UI       │     │ Interventions    │     │ Demo Video       │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Phase 1: Data Generation & Model Training (Hours 0 – 4)
* **Person 2**:
  - Write `generate_bharat_data.py` to create 5,000 synthetic transaction records.
  - Train `XGBoost` stress predictor and compute initial SHAP values.
  - Fit `IsolationForest` on transaction amounts and night velocity.
  - Train `RandomForest` life-stage classifier.
  - Save models to `apps/api/app/ml/saved_models/`.
* **Person 1**:
  - Setup FastAPI route `/api/v1/ml/*` to consume Person 2's models.
  - Build UI Role Switcher dropdown in the top header (`Customer` | `Bank RM` | `Compliance Officer`).
  - Verify ReBIT mock AA consent handshake endpoints.

### Phase 2: Dashboards & Conversational Journey (Hours 4 – 12)
* **Person 1**:
  - Create the **Conversational Loan / KYC Journey** (`/onboarding-loan`) with interactive step-by-step vernacular prompts.
  - Upgrade the Bank Dashboard (`/bank`) with the **38-Day Blind Spot** visual comparison (Bureau vs. AA).
  - Add voice recording indicator and response speech synthesis in `/ask-niva`.
* **Person 2**:
  - Implement the **Responsible NBA Recommender** logic combining ML stress scores with policy rules.
  - Build the SHAP explanation API returning top 3 positive and negative features per prediction.
  - Benchmark inference latency (ensure <15ms response time).

### Phase 3: Empathetic Interventions & DPDP Compliance (Hours 12 – 20)
* **Person 1**:
  - Build the **Empathetic Intervention Modal**: When a stressed customer (like Rajesh) is detected, provide 3 recovery paths (EMI restructuring, micro-budgeting, moratorium advice).
  - Build the **DPDP Act 2023 Consent Manager**: Granular data access checkboxes + instant "Revoke Consent" trigger.
  - Integrate SHAP waterfall charts in `/bank` and `/responsible-gate` using Chart.js or Recharts.
* **Person 2**:
  - Write automated model evaluation report (ROC-AUC, Precision/Recall, Confusion Matrix).
  - Implement Merkle tree hashing service for tamper-proof recommendation audit logs.
  - Document ethical AI safeguards (bias evaluation across personas).

### Phase 4: Final Verification, Pitch & Demo Assets (Hours 20 – 24)
* **Joint Work**:
  - End-to-end user testing across the 3 personas (*Rajesh, Anita, Vikram*).
  - Record a 3-minute video demo showcasing:
    1. *Anita* getting pre-approved working capital before festive season via voice in Gujarati.
    2. *Rajesh* being protected from predatory credit, with NIVA explaining the decision empathetically in Hindi and offering an EMI restructuring plan.
    3. *Bank Officer* viewing the real-time EWS warning that legacy bureau completely missed.
    4. *Compliance Officer* verifying the Merkle hash audit trail and DPDP consent logs.
  - Finalize Presentation Slide Deck.

---

## 🏆 Judging Criteria Alignment & Deliverables Checklist

| Hackathon Criterion | NIVA Implementation Proof | Owner |
|---|---|---|
| **1. Innovation & Feasibility** | Real-time AA data stream + 38-Day blindspot elimination + Zero-hallucination deterministic math. | Person 1 & 2 |
| **2. Depth of Personalization vs Genuine Benefit** | Proactive responsible gating that suppresses loans for stressed users and offers debt restructuring instead. | Person 1 & 2 |
| **3. Explainability & RBI/DPDP Compliance** | SHAP feature importance charts + DPDP 2023 Consent Manager + Merkle immutable audit trail. | Person 2 (XAI) & Person 1 (UI) |
| **4. Usability for Vernacular / Non-Tech Users** | Voice input in Hindi/Gujarati/English + conversational loan journey with 0 complex forms. | Person 1 |
| **5. Scalability & Financial Impact** | Modular FastAPI microservice + ReBIT spec compatibility ready for deployment with any Indian bank. | Person 1 |

---

## 🔄 Git Synchronization & Merge Strategy (When to Pull & Merge)

To avoid merge hell, code overwrites, or broken dependencies during a 24-hour hackathon, follow this strict Git protocol:

```
                  ┌───────────────────────────────────────────────┐
                  │                 main branch                   │
                  │        (Always Stable & Demo-Ready)           │
                  └───┬───────────────────────────────────────┬───┘
                      │                                       │
      (Branch at Start)                                       │ (Branch at Start)
                      ▼                                       ▼
        ┌───────────────────────────┐           ┌───────────────────────────┐
        │   feature/ui-backend      │           │     feature/ai-ml-models  │
        │       (Person 1)          │           │          (Person 2)       │
        └─────────────┬─────────────┘           └─────────────┬─────────────┘
                      │                                       │
                      ├───────────────────┬───────────────────┤
                      │                   │                   │
                      ▼                   ▼                   ▼
               CHECKPOINT 1          CHECKPOINT 2        CHECKPOINT 3
                (Hour 4)              (Hour 12)           (Hour 20)
                Data Schema           Model Inference     E2E Flow Merged
```

### 🌿 1. Branch Naming & Ownership
* **`main`**: Protected branch. Only merged via verified checkpoints. Always runnable (`npm run dev` and `uvicorn app.main:app` must never fail on `main`).
* **`feature/ui-backend`** (*Person 1*):
  - Owns: `apps/web/`, `apps/api/app/api/`, `apps/api/app/main.py`, `apps/api/app/config.py`.
* **`feature/ai-ml-models`** (*Person 2*):
  - Owns: `apps/api/app/ml/`, `apps/api/app/services/ml_models.py`, `data/`, `notebooks/`.

---

### ⏰ 2. Exactly When to Pull & When to Merge (Sync Checkpoints)

| Checkpoint | Time | What Person 1 Does | What Person 2 Does | Merge Action & Verification |
|---|---|---|---|---|
| **Checkpoint 1: Data Contracts** | **Hour 4** | Sets up Pydantic schemas in `apps/api/app/schemas/` & mock endpoints. | Completes `generate_bharat_data.py` & basic training script. | 1. Person 1 merges API schemas to `main`.<br>2. **Person 2 pulls `main`** to get schema definitions. |
| **Checkpoint 2: Model Serialization** | **Hour 12** | Builds UI layouts for Vernacular Journey & Bank Dashboard. | Finishes training 5 models & exports `.pkl`/`.json` to `apps/api/app/ml/saved_models/`. | 1. Person 2 merges ML services to `main`.<br>2. **Person 1 pulls `main`** and hooks ML endpoints to UI. |
| **Checkpoint 3: End-to-End Integration** | **Hour 20** | Connects voice copilot, DPDP consent toggles, and SHAP charts to live ML API. | Validates SHAP explanation latency & generates model evaluation metrics. | 1. **Both merge into `main`**.<br>2. Joint end-to-end smoke test on localhost. |
| **Checkpoint 4: Code Freeze** | **Hour 22** | UI text polish, dark mode checks, persona quick-select. | Verifies edge cases (zero balance, high volatility). | **Hard code freeze**. No new features. Only bug fixes merged to `main`. |

---

### 📥 3. Daily / Hourly Pull Rules

1. **Before Starting Any New Sub-feature**:
   ```bash
   git checkout feature/<your-branch>
   git fetch origin
   git merge origin/main   # Pull latest changes from main into your feature branch
   ```
2. **Never Commit Large Datasets**:
   - Add raw datasets (`*.csv`, `*.parquet` > 50MB) to `.gitignore`.
   - Store only lightweight synthetic samples (`<5MB`) and pickled model weights (`*.joblib`, `*.pkl`) in the repo.
3. **If You Change a Shared File** (e.g., `requirements.txt` or `package.json`):
   - Notify teammate on WhatsApp/Discord immediately.
   - Run `pip install -r requirements.txt` or `npm install` immediately after pulling.

---

### 🚀 4. Safe Merge Commands (Step-by-Step)

When reaching a checkpoint, merge into `main` using this safe sequence:

```bash
# Step 1: Commit all work on your feature branch
git add .
git commit -m "feat(ml): complete stress prediction and SHAP explainability service"
git push origin feature/ai-ml-models

# Step 2: Switch to main and update
git checkout main
git pull origin main

# Step 3: Merge feature branch into main
git merge feature/ai-ml-models

# Step 4: Verify that app starts cleanly!
# Backend check:
python -m uvicorn app.main:app --port 8000
# Frontend check:
npm run dev

# Step 5: Push verified main to GitHub
git push origin main

# Step 6: Teammate pulls the fresh main into their branch
git checkout feature/ui-backend
git merge main
```
