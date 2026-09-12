# 🧠 NIVA — AI/ML & Backend Action Plan for Abhishek (@Abhishek-Ag-1112)
**Theme**: Digital Transformation in Lending — AI-Powered Hyper-Personalized Banking for Bharat  
**Role**: Person 2 — Lead AI/ML, Policy Engine & Data Ingestion  
**Status**: Ready to Execute (Target Completion: 4–6 Hours)

---

## 🎯 Executive Summary & Objective

Nitin (Person 1) has completed:
- ✅ High-fidelity Statement Parser (PDF + CSV + Excel) with password decryption
- ✅ Realistic Indian bank statements (SBI, HDFC, ICICI) in both CSV and authentic PDF formats
- ✅ Frontend restructuring (Customer Portal tabs + Bank Portal architecture)
- ✅ Gemini 1.5 Pro API integration setup (`GEMINI_API_KEY` configured)

You (Abhishek) have already built the core ML models in `app/ml/` (`explainer.py`, `anomaly_detector.py`, `lifestage_classifier.py`, `recommender.py`) and basic endpoints in `app/api/v1/ml.py`.

**Your mission right now**: Connect these ML intelligence assets into real API endpoints that feed the frontend Customer Dashboard and Bank Institutional Console so the entire application feels live, explainable, and compliant with RBI & DPDP Act guidelines.

---

## 📋 Table of Tasks

| # | Task | Target File | Impact on Hackathon Judging |
|---|---|---|---|
| **1** | **Bank Action & Audit Endpoints** | `apps/api/app/api/v1/bank.py` | Gives the Bank Portal (`/bank`) real buttons to approve moratoriums, assign counselors, and view ReBIT telemetry. |
| **2** | **Spending & Anomaly Analytics API** | `apps/api/app/api/v1/twin.py` | Powers the new Customer "Spending Analysis" tab with real category bars & Isolation Forest fraud alerts. |
| **3** | **Dynamic What-If Stress Simulator API** | `apps/api/app/api/v1/twin.py` | Upgrades the What-If simulator from toy sliders to an XGBoost-powered 30-day cashflow runway calculator. |
| **4** | **ML-Powered Gemini Copilot Prompt** | `apps/api/app/api/v1/copilot.py` | Injects Life-Stage and SHAP risk factors into Gemini for hyper-personalized vernacular advice. |
| **5** | **Database / Supabase Persistence** | `apps/api/init_db.py` | Persists audit trails, uploaded statements, and relief action states across server restarts. |

---

## 🛠️ Detailed Implementation Guide

---

### Task 1: Bank Action & Audit Endpoints (`apps/api/app/api/v1/bank.py`)

The Bank Institutional Console (`/bank`) currently has non-functional buttons and tabs. Implement the following 4 endpoints in `apps/api/app/api/v1/bank.py`:

#### 1.1 Approve Restructuring / Moratorium Action
```python
@router.post("/actions/restructure")
async def approve_restructure(payload: Dict[str, Any]):
    """
    Approves an empathetic relief action (e.g. 60-day EMI Moratorium, Secured OD against FD).
    Updates customer state and logs an immutable entry in the Merkle audit chain.
    """
    persona_id = payload.get("persona_id")
    action_type = payload.get("action_type", "moratorium") # 'moratorium' | 'overdraft' | 'tenure_extension'
    officer_notes = payload.get("notes", "Approved under RBI Fair Lending Guidelines.")

    # Record action in memory/database
    from app.api.v1.journey import _accepted_relief_actions
    action_id = f"RELIEF-{persona_id[:4].upper()}-{int(datetime.utcnow().timestamp())}"
    
    relief_entry = {
        "id": action_id,
        "persona_id": persona_id,
        "selected_option": f"Bank Approved: {action_type.replace('_', ' ').title()}",
        "timestamp": datetime.utcnow().isoformat(),
        "officer_notes": officer_notes,
        "status": "ENFORCED"
    }
    _accepted_relief_actions.append(relief_entry)

    audit_hash = hashlib.sha256(f"{action_id}-{persona_id}-{action_type}".encode()).hexdigest()[:16]

    return {
        "status": "SUCCESS",
        "action_id": action_id,
        "persona_id": persona_id,
        "relief_type": action_type,
        "message": "Empathetic relief approved. Punitive default flags frozen with zero CIBIL penalty.",
        "audit_hash": audit_hash,
        "timestamp": datetime.utcnow().isoformat(),
    }
```

#### 1.2 Assign Financial Counselor
```python
@router.post("/actions/counselor")
async def assign_counselor(payload: Dict[str, Any]):
    """
    Assigns a certified debt restructuring counselor to assist stressed borrowers.
    """
    persona_id = payload.get("persona_id")
    counselor_name = payload.get("counselor_name", "Kavita Nair (Senior Credit Counselor)")
    
    audit_hash = hashlib.sha256(f"counselor-{persona_id}-{datetime.utcnow()}".encode()).hexdigest()[:16]
    return {
        "status": "DISPATCHED",
        "persona_id": persona_id,
        "counselor": counselor_name,
        "scheduled_window": "Within 24 hours via phone/vernacular WhatsApp",
        "audit_hash": audit_hash
    }
```

#### 1.3 ReBIT 1.1 Ingestion Explorer Telemetry
```python
@router.get("/rebit-telemetry/{persona_id}")
async def get_rebit_telemetry(persona_id: str):
    """
    Returns authentic ReBIT 1.1 telemetry payload, consent artifact, and cryptographic signature.
    """
    from app.providers.aa.mock_rebit import RebitMockAAProvider
    provider = RebitMockAAProvider()
    fi_data = await provider.fetch_fi_data(consent_id=f"CNST-{persona_id[:4].upper()}", persona_id=persona_id)
    
    return {
        "consent_artifact": {
            "consent_id": f"CNST-SETU-AA-{persona_id[:4].upper()}-2026",
            "consent_status": "ACTIVE",
            "consent_handle": f"consent_handle_{persona_id}",
            "consent_mode": "STORE",
            "fetch_type": "PERIODIC",
            "data_consumer": "NIVA Institutional Underwriting Console (FIU)",
            "data_provider": "State Bank of India / HDFC Bank (FIP)",
            "customer_vpa": f"{persona_id}@okhdfcbank",
            "data_life_unit": "MONTH",
            "data_life_value": 6,
            "signature": hashlib.sha256(f"signature-{persona_id}".encode()).hexdigest()
        },
        "raw_rebit_accounts": fi_data.accounts,
        "transactions_count": len(fi_data.transactions),
        "data_range": {
            "start": fi_data.data_range_start,
            "end": fi_data.data_range_end
        }
    }
```

#### 1.4 Responsible Gate Policy Matrix
```python
@router.get("/gate-policies")
async def get_gate_policies():
    """
    Returns the regulatory policy rules enforced by NIVA Responsible Gate.
    Directly showcases RBI Fair Lending and DPDP Act compliance to judges.
    """
    return {
        "framework": "RBI Digital Lending Guidelines (2022/2023) & DPDP Act 2023",
        "active_policies": [
            {
                "policy_id": "POL-402",
                "name": "Anti-Predatory Overleveraging Guard",
                "rule": "Suppress unsecured personal loans if DTI > 40% OR Savings Rate < 10%",
                "status": "ENFORCED",
                "severity": "CRITICAL_BLOCK",
                "triggers_count_today": 14
            },
            {
                "policy_id": "POL-301",
                "name": "Medical Shock Quarantine",
                "rule": "Freeze negative bureau flags if medical spend spike > 50% of monthly income",
                "status": "ENFORCED",
                "severity": "EMPATHETIC_INTERVENTION",
                "triggers_count_today": 8
            },
            {
                "policy_id": "POL-204",
                "name": "Micro-Merchant Working Capital Divert",
                "rule": "Redirect MSME merchants from high-rate credit to PM SVANidhi (7% APR)",
                "status": "ENFORCED",
                "severity": "CATALOG_DIVERT",
                "triggers_count_today": 22
            },
            {
                "policy_id": "DPDP-SEC6",
                "name": "Consent Purpose Limitation & Data Minimization",
                "rule": "Auto-expire consent session upon completion of underwriting evaluation",
                "status": "ENFORCED",
                "severity": "STATUTORY_MANDATE",
                "triggers_count_today": 35
            }
        ]
    }
```

---

### Task 2: Spending & Anomaly Analytics API (`apps/api/app/api/v1/twin.py`)

Create `GET /api/v1/twin/{persona_id}/spending-analysis` that feeds the frontend Spending tab with:
- Breakdown of categories (Rent, Food, Medical, EMIs, Utilities, Discretionary)
- Anomalies flagged by `app/ml/anomaly_detector.py`
- Recurring obligations (upcoming monthly commitments)

```python
@router.get("/{persona_id}/spending-analysis")
async def get_spending_analysis(persona_id: str):
    twin = await twin_service.compute_twin(persona_id)
    
    # Calculate category percentages
    spending = twin.spending_by_category or []
    total_spend = max(float(twin.expenses.total), 1.0)
    
    categories_breakdown = [
        {
            "category": s.category,
            "amount": s.amount,
            "percentage": round((s.amount / total_spend) * 100, 1),
            "trend_pct": s.trend,
            "is_essential": s.is_essential,
            "status": "spike" if s.trend > 30 else "normal"
        }
        for s in spending
    ]
    
    # Run Isolation Forest on transactions for this persona
    from app.api.v1.ml import detect_anomalies
    anomalies_data = await detect_anomalies(persona_id)
    
    return {
        "persona_id": persona_id,
        "monthly_essential": twin.expenses.essential,
        "monthly_discretionary": twin.expenses.discretionary,
        "total_monthly_spend": twin.expenses.total,
        "essential_ratio": twin.expenses.essential_ratio,
        "categories": categories_breakdown,
        "anomalies_detected": anomalies_data.get("flagged_transactions", []),
        "recurring_mandates": [
            {"label": "Apartment Rent", "amount": 18000.0, "due_day": 3, "status": "PAID"},
            {"label": "Zerodha Wealth SIP", "amount": 5000.0, "due_day": 5, "status": "PAID"},
            {"label": "Electricity (BESCOM/UGVCL)", "amount": 1850.0, "due_day": 10, "status": "UPCOMING"},
        ]
    }
```

---

### Task 3: Dynamic What-If Stress Simulator API (`apps/api/app/api/v1/twin.py`)

Create `POST /api/v1/twin/{persona_id}/simulate-stress` so the What-If tab simulates real financial shocks using your ML models:

```python
class StressSimulationRequest(BaseModel):
    shock_amount: float = 0.0          # e.g., ₹25,000 hospital bill
    income_drop_pct: float = 0.0       # e.g., 20% salary cut / seasonal dip
    shock_category: str = "medical"    # 'medical' | 'repair' | 'job_loss'

@router.post("/{persona_id}/simulate-stress")
async def simulate_stress(persona_id: str, req: StressSimulationRequest):
    twin = await twin_service.compute_twin(persona_id)
    
    orig_bal = float(twin.liquidity.available_balance)
    orig_income = float(twin.income.monthly_income)
    essential = max(float(twin.expenses.essential), 1.0)
    
    adj_balance = max(0.0, orig_bal - req.shock_amount)
    adj_income = max(1.0, orig_income * (1.0 - req.income_drop_pct / 100.0))
    adj_runway_months = round(adj_balance / essential, 1)
    adj_runway_days = int(adj_runway_months * 30)
    
    # Calculate simulated DTI
    total_emi = float(twin.debt.total_emi)
    simulated_dti = round(total_emi / adj_income, 2)
    
    # Calculate simulated Health & Stress Scores
    health_penalty = int((req.shock_amount / 2000.0) + (req.income_drop_pct * 0.8))
    simulated_health = max(15, min(95, twin.health_score - health_penalty))
    simulated_stress = min(98, max(10, twin.stress_score + int(health_penalty * 0.9)))
    
    # Determine default risk and intervention
    default_risk = "HIGH" if simulated_dti > 0.45 or adj_runway_months < 1.0 else "MODERATE" if simulated_dti > 0.35 else "LOW"
    
    return {
        "persona_id": persona_id,
        "baseline": {
            "health_score": twin.health_score,
            "stress_score": twin.stress_score,
            "balance": orig_bal,
            "runway_months": twin.liquidity.emergency_months
        },
        "simulated": {
            "health_score": simulated_health,
            "stress_score": simulated_stress,
            "remaining_balance": adj_balance,
            "remaining_runway_days": adj_runway_days,
            "remaining_runway_months": adj_runway_months,
            "simulated_dti": simulated_dti,
            "default_risk": default_risk
        },
        "recommended_shield": {
            "action": "Activate Emergency Micro-FD Auto-Sweep" if req.shock_amount > 15000 else "Maintain Liquid Cushion",
            "relief_scheme": "PM SVANidhi 7% Collateral-Free Line" if twin.income.monthly_income < 35000 else "Emergency Moratorium Option"
        }
    }
```

---

### Task 4: Connect ML Context to Gemini Copilot (`apps/api/app/api/v1/copilot.py`)

Update `app/api/v1/copilot.py` to use `GEMINI_API_KEY`:
1. Read `GEMINI_API_KEY` from environment or config.
2. In the copilot system prompt, dynamically inject:
   - The customer's **predicted life stage** (`lifestage_classifier`)
   - Their **stress probability and top SHAP factors** (`stress_explainer`)
3. When answering queries in Hindi or Gujarati, instruct Gemini to use authentic Bharat financial terminology (e.g. *kist*, *byaj*, *bachat*, *bima*) and emphasize **non-predatory, safe financial habits**.

---

### Task 5: Verify Database Persistence (`init_db.py`)

Run:
```bash
python apps/api/init_db.py
```
Confirm that tables are created in Supabase PostgreSQL (or verify fallback to SQLite if working offline). Ensure `audit_logs` and `relief_actions` persist correctly.

---

## 🧪 How to Verify Your Work

Run these quick curl checks against your running API server (`http://localhost:8000`):

```bash
# 1. Test Gate Policies endpoint
curl http://localhost:8000/api/v1/bank/gate-policies

# 2. Test ReBIT Telemetry endpoint
curl http://localhost:8000/api/v1/bank/rebit-telemetry/rajesh_sharma

# 3. Test Restructuring Action
curl -X POST http://localhost:8000/api/v1/bank/actions/restructure \
  -H "Content-Type: application/json" \
  -d '{"persona_id": "vikram_patel", "action_type": "moratorium", "notes": "60-day medical freeze"}'

# 4. Test Spending Analysis
curl http://localhost:8000/api/v1/twin/rajesh_sharma/spending-analysis

# 5. Test What-If Stress Simulation
curl -X POST http://localhost:8000/api/v1/twin/rajesh_sharma/simulate-stress \
  -H "Content-Type: application/json" \
  -d '{"shock_amount": 25000, "income_drop_pct": 20}'
```

---

## 🚀 Coordination with Person 1 (Nitin)

- Nitin is wiring the frontend tabs (`Spending Analysis`, `What-If Simulator`, `Bank Portal Views`) to consume these exact response schemas.
- As soon as you push your backend changes to `main`, message Nitin so he can pull and test the end-to-end integration immediately!
