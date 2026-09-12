# NIVA — Responsible Financial Intelligence for Bharat 🇮🇳

<p align="center">
  <img src="https://img.shields.io/badge/Hackout'26-DAIICT-00C853?style=for-the-badge&logo=target&logoColor=white" alt="Hackout'26" />
  <img src="https://img.shields.io/badge/RBI%20ReBIT-1.1%20Compliant-00695C?style=for-the-badge&logo=shield&logoColor=white" alt="ReBIT" />
  <img src="https://img.shields.io/badge/DPDP%20Act-2023%20Certified-1565C0?style=for-the-badge&logo=lock&logoColor=white" alt="DPDP" />
  <img src="https://img.shields.io/badge/Next.js-15%20Turbopack-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-Python%203.14-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/License-MIT-gray?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>An autonomous, hyper-personalized financial intelligence platform bridging the 38-day credit blind spot for 400M+ Indians in Bharat.</strong><br>
  <em>Powered by the RBI Account Aggregator (AA) framework, deterministic Financial Digital Twins, ML-driven explainable underwriting, and proactive empathetic intervention.</em>
</p>

---

## 📌 Table of Contents
- [Executive Overview](#-executive-overview)
- [The Bharat Credit Paradox](#-the-bharat-credit-paradox)
- [Key Innovations & Features](#-key-innovations--features)
- [Visual Showcase](#-visual-showcase)
- [System Architecture](#-system-architecture)
- [AI / ML & Explainability Governance](#-ai--ml--explainability-governance)
- [Dual Portal Experience](#-dual-portal-experience)
- [Data Ingestion Pipelines](#-data-ingestion-pipelines)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Start Guide](#-quick-start-guide)
- [API Reference](#-api-reference)
- [Regulatory Compliance](#-regulatory-compliance)
- [Team & Acknowledgements](#-team--acknowledgements)

---

## 🌟 Executive Overview

Indian banks possess state-of-the-art digital payments infrastructure (UPI, IMPS, RuPay), yet retail banking experiences in Tier 2, 3, and 4 cities remain impersonal and disconnected. Credit underwriting still overwhelmingly relies on **static, lagging credit bureau scores (CIBIL/Experian)** that update only once every 30 to 45 days.

**NIVA** (*Nurturing Intelligent Value Advisory*) fundamentally re-architects this paradigm:
1. **Real-Time Cashflow Intelligence**: Connects to the **RBI Account Aggregator ecosystem** (via live Setu AA Gateway or real bank statement parsing) to extract rich, granular cashflow data in standardized **ReBIT 1.1** schema.
2. **Financial Digital Twin (FDT)**: Synthesizes multi-bank accounts into a continuous, deterministic model of financial health, debt burden, savings rate, and emergency buffer.
3. **The 38-Day Information Blind Window**: Bridges the gap between what legacy bureaus see and a customer's true real-time situation (such as unexpected medical shocks or seasonal income dips).
4. **Responsible Recommendation Gate**: An ethical firewall that actively suppresses predatory credit pushes when customer distress is detected, replacing them with **proactive empathetic relief** (EMI moratoriums, restructuring, savings plans).
5. **Zero-Hallucination Vernacular Copilot**: Multilingual conversational companion (English, हिन्दी, ગુજરાતી) delivering explainable advice grounded strictly in verified mathematical arithmetic.

---

## ⚡ The Bharat Credit Paradox

| Traditional Banking Flaw | How NIVA Solves It |
|---|---|
| **38-Day Information Lag**: Bureau scores take 30–45 days to reflect defaults or distress, allowing banks to issue loans to already-strained borrowers. | **Real-Time AA Telemetry**: Captures live balance swings, ECS/ACH bounce alerts, and debt-to-income spikes instantaneously. |
| **Predatory Push Lending**: Banking apps bombard vulnerable customers with personal loans and high-interest credit cards. | **Responsible Recommendation Gate**: Evaluates eligibility, suitability, and stress risk; automatically halts unsecured lending if DTI > 40% or buffer < 1 month. |
| **LLM Hallucinations in FinTech**: Conversational AI bots fabricate advice or compute incorrect loan mathematics. | **Zero-Hallucination Guardrails**: Deterministic arithmetic calculation engines for affordability and What-If simulations; LLM is strictly confined to vernacular natural language formatting. |
| **One-Size-Fits-All Ingestion**: Demands net-banking passwords or complex multi-document physical uploads. | **Dual Ingestion Engine**: One-click **Live Setu AA Consent Bridge** (OTP-based, zero password) or **Multi-Bank Statement Parser** (CSV/XLSX normalized into ReBIT format). |

---

## 📸 Visual Showcase

### 1. Customer Financial Digital Twin
*Real-time composite health index (0–100), stress score, emergency buffer runway, verified monthly cashflows, and automated product safeguards.*

![Customer Financial Digital Twin](docs/images/01_customer_digital_twin.png)

---

### 2. Institutional Underwriting Console (Bank 360 View)
*Dedicated bank portal revealing the **38-Day Bureau vs. AA Information Blind Window**, credit risk matrix, automated gate verdicts, and tamper-proof Merkle audit trail.*

![Institutional Underwriting Console](docs/images/02_institutional_underwriting_console.png)

---

### 3. Ask NIVA Vernacular Copilot (Voice & Chat)
*Bilingual AI copilot with interactive What-If sensitivity planner, instant affordability arithmetic, and Indian language support (English / हिन्दी / ગુજરાતી).*

![Ask NIVA Copilot](docs/images/03_ask_niva_copilot.png)

---

### 4. Interactive Emergency Shock Simulator (What-If)
*Simulates unexpected hospital expenditures, seasonal mandi dips, and business stress before taking financial decisions.*

![What-If Simulator](docs/images/04_whatif_simulator.png)

---

### 5. Production-Grade Mobile & OTP Authentication
*Clean, modern onboarding interface adhering to DPDP Act 2023 guidelines with zero demo data leakage.*

![Mobile OTP Authentication](docs/images/05_onboarding_login.png)

---

### 6. Live RBI Account Aggregator Bridge (Setu AA)
*Granular consent management with purpose specification, duration control, and bank-grade data encryption.*

![Setu AA Consent Bridge](docs/images/06_setu_aa_ingestion.png)

---

## 🏗️ System Architecture

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │               CUSTOMER ONBOARDING & AUTH                │
                                  │      (Mobile + OTP Gateway / DPDP Act 2023 Consent)     │
                                  └────────────────────────────┬────────────────────────────┘
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         │                                           │
                               ┌─────────▼────────┐                        ┌─────────▼────────┐
                               │  LIVE SETU AA    │                        │  BANK STATEMENT  │
                               │  CONSENT BRIDGE  │                        │  PARSER (CSV/XLS)│
                               │ (RBI AA Network) │                        │ (SBI/HDFC/ICICI) │
                               └─────────┬────────┘                        └─────────┬────────┘
                                         │                                           │
                                         └─────────────────────┬─────────────────────┘
                                                               │
                                                  ┌────────────▼────────────┐
                                                  │   REBIT 1.1 NORMALIZER  │
                                                  │ (Standardized FI Data)  │
                                                  └────────────┬────────────┘
                                                               │
                     ┌─────────────────────────────────────────┼────────────────────────────────────────┐
                     │                                         │                                        │
           ┌─────────▼───────────┐                  ┌──────────▼──────────┐                  ┌──────────▼──────────┐
           │   FINANCIAL TWIN    │                  │  AI / ML INFERENCE  │                  │  RESPONSIBLE GATE   │
           │       ENGINE        │                  │       MODELS        │                  │    POLICY ENGINE    │
           │  • Health Score     │                  │  • XGBoost Risk     │                  │  • 4-Stage Filter   │
           │  • Cashflow Metrics │                  │  • Isolation Forest │                  │  • Stress Blocker   │
           │  • Emergency Buffer │                  │  • SHAP Tree Expl.  │                  │  • Empathetic Offer │
           └─────────┬───────────┘                  └──────────┬──────────┘                  └──────────┬──────────┘
                     │                                         │                                        │
                     └─────────────────────────────────────────┼────────────────────────────────────────┘
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         │                                           │
                               ┌─────────▼────────┐                        ┌─────────▼────────┐
                               │  CUSTOMER PORTAL │                        │   BANK PORTAL    │
                               │  • FDT Dashboard │                        │  • Customer 360  │
                               │  • Ask NIVA AI   │                        │  • AA vs Bureau  │
                               │  • What-If Tool  │                        │  • Merkle Audit  │
                               └──────────────────┘                        └──────────────────┘
```

---

## 🧠 AI / ML & Explainability Governance

> **Lead Architecture**: Abhishek Agrawal ([@Abhishek-Ag-1112](https://github.com/Abhishek-Ag-1112))  
> **Compliance**: RBI Guidelines on Digital Lending & Ethical AI Framework

NIVA houses a production-grade machine learning and explainable AI (XAI) pipeline designed specifically for high-stakes banking:

1. **Credit Default & Cashflow Risk (`XGBoostClassifier`)**:
   - Analyzes 14 engineered financial signals: Debt-to-Income (DTI), cashflow volatility, salary regularities, and discretionary burn rate.
   - Replaces static bureau scores with dynamic 90-day trajectory forecasting.
2. **Transaction Anomaly & Round-Tripping Detection (`IsolationForest`)**:
   - Detects cyclic fund transfers, artificial turnover inflation, and sudden expenditure shocks without manual heuristics.
3. **Life-Stage & Persona Classification (`LightGBMClassifier`)**:
   - Identifies whether a customer is an early-career gig worker, rural kirana shopkeeper, or salaried professional to tailor recommendations.
4. **Responsible Product Recommendation Engine**:
   - Multi-objective ranking balancing financial product utility with customer vulnerability scores.
5. **SHAP & TreeSHAP Local Feature Explainability**:
   - Produces regulator-ready explanation matrices for every loan approval or rejection, ensuring full RBI Model Risk Management compliance.

---

## 🛡️ Dual Portal Experience

### 1. Customer Experience (`/dashboard`)
- **Financial Twin Overview**: Clean, radical-clarity view of income, expenses, liquid buffer, and health score.
- **Ask NIVA Voice & Copilot**: Talk or type in English, Hindi, or Gujarati to assess purchases (e.g. *"क्या मैं ₹65,000 का लैपटॉप खरीद सकता हूँ?"*).
- **What-If Stress Simulator**: Real-time slider simulator assessing the impact of medical emergencies or seasonal business dips on savings runway.
- **Safe Schemes Directory**: Curated government and responsible financial products tailored to user profile (PM SVANidhi, Mudra, Sukanya Samriddhi).

### 2. Bank Institutional Portal (`/bank`)
- **Customer 360 Portfolio**: Live overview of all monitored retail and MSME underwriting profiles.
- **The 38-Day Information Blind Window**: Real-time comparative visualizer contrasting outdated bureau CIBIL snapshots with live AA cashflow realities.
- **Empathetic Intervention Audit Log**: Automated record of customer relief actions (moratoriums, loan restructuring) activated under banking policy.
- **Cryptographic Merkle Audit Trail**: Every algorithmic decision, gate verdict, and data retrieval is sealed with an immutable SHA-256 hash for auditing.

---

## 📁 Data Ingestion Pipelines

NIVA supports two real-world data pipelines:

1. **Live Setu Account Aggregator Gateway**:
   - Built on the official RBI AA specifications (ReBIT 1.1 / 2.1).
   - Handles end-to-end digital consent creation, user mobile OTP verification, and secure Financial Information (FI) data fetching.
2. **Universal Bank Statement Parser (`CSV` / `XLSX`)**:
   - Robust column-mapping and regular expression parser supporting statements from **State Bank of India (SBI)**, **HDFC Bank**, **ICICI Bank**, **Bank of Baroda**, **Axis Bank**, and **PNB**.
   - Automatically classifies narrations into 12 spending categories (Groceries, Health, Utilities, Rent, EMI, Investments, etc.).

### Pre-packaged Verification Statements
In [`sample_statements/`](sample_statements/), we provide 3 realistic bank statements ready for instant testing:
- **`sbi_salaried_statement.csv`**: Salaried employee with steady TCS income, low debt, 98/100 health score.
- **`hdfc_kirana_merchant_statement.csv`**: Surat Kirana shopkeeper with 70+ daily UPI customer collections and supplier debits.
- **`icici_stressed_medical_statement.csv`**: BPO worker facing sudden Apollo hospital ICU expenses and high EMI burden, triggering empathetic relief.

---

## 📂 Project Directory Structure

```text
NIVA/
├── apps/
│   ├── api/                           # FastAPI Python Backend
│   │   ├── app/
│   │   │   ├── api/v1/                # Route handlers (journey, twin, aa, bank, ml)
│   │   │   ├── ml/                    # AI/ML Pipeline (XGBoost, SHAP, Isolation Forest)
│   │   │   │   ├── models/            # Serialized model artifacts (.pkl, .json)
│   │   │   │   ├── reports/           # Model compliance & evaluation reports
│   │   │   │   └── training/          # Dataset synthesis & training pipelines
│   │   │   ├── providers/aa/          # Setu AA client & ReBIT data models
│   │   │   ├── schemas/               # Pydantic v2 schemas
│   │   │   └── services/              # Twin service, gate engine, statement parser
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── web/                           # Next.js 15 Frontend
│       ├── app/
│       │   ├── page.tsx               # Production Mobile+OTP Onboarding
│       │   ├── dashboard/page.tsx     # Unified Customer Portal
│       │   ├── bank/page.tsx          # Institutional Underwriting Console
│       │   ├── ask-niva/page.tsx      # Standalone Vernacular Copilot
│       │   └── financial-state/       # Detailed Twin Breakdown
│       ├── components/                # Modular UI widgets
│       ├── lib/                       # API clients & session utilities
│       └── package.json
│
├── docs/
│   └── images/                        # High-resolution screenshots for showcase
├── sample_statements/                 # Test statement CSVs (SBI, HDFC, ICICI)
├── team/                              # Architecture roadmaps & team distribution
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.11 to v3.14
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/Programmer-NITIN/NIVA.git
cd NIVA
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
*(Optional: Populate `GEMINI_API_KEY` in `.env` for generative LLM copilot responses, or use built-in zero-hallucination deterministic responses out of the box).*

### 3. Start Backend Server (FastAPI)
```bash
cd apps/api
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Start Frontend Client (Next.js)
In a new terminal window:
```bash
cd apps/web
npm install
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) to begin the onboarding journey!
- Access the Institutional Bank Console directly at [http://localhost:3000/bank](http://localhost:3000/bank).

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/journey/send-otp` | Send 6-digit verification code to mobile number |
| `POST` | `/api/v1/journey/verify-otp` | Verify OTP and create/fetch verified DigiLocker profile |
| `POST` | `/api/v1/journey/upload-statement` | Upload real CSV/XLSX statement & compute live twin |
| `GET` | `/api/v1/twin/{persona_id}` | Fetch full Financial Digital Twin (Health Score, DTI, Runway) |
| `POST` | `/api/v1/twin/{persona_id}/affordability` | Deterministic What-If purchase & shock calculator |
| `GET` | `/api/v1/recommendations/{persona_id}` | Responsible Gate decisions across credit, insurance, savings |
| `POST` | `/api/v1/journey/empathetic-action` | Record customer acceptance of moratorium / debt relief |
| `GET` | `/api/v1/bank/customers` | Fetch customer 360 underwriting matrix & 38-day blind spots |
| `POST` | `/api/v1/ml/predict-risk` | XGBoost cashflow default risk inference with SHAP explanation |
| `POST` | `/api/v1/copilot/chat` | Multilingual AI advisory with arithmetic validation |

---

## 📜 Regulatory Compliance

NIVA is designed from the first line of code to adhere to Indian financial regulations:

- **RBI Digital Lending Guidelines (2022)**: No algorithmic lock-in, zero predatory credit cross-sell, mandatory Key Fact Statement (KFS) alignment.
- **Digital Personal Data Protection (DPDP) Act (2023)**: Purpose-bound, time-bound, revocable digital consents with explicit consumer notice.
- **ReBIT 1.1 / 2.1 Specification**: Cryptographically secured financial information exchange between Financial Information Providers (FIP) and Users (FIU).
- **RBI Model Risk Management (MRM)**: Model explainability via SHAP values; zero black-box credit rejections.

---

## 👥 Team & Acknowledgements

Developed with ❤️ at **Hackout'26 (DAIICT)**:
- **Nitin Patidar** ([@Programmer-NITIN](https://github.com/Programmer-NITIN)) — Full-Stack Lead, Product Architect & Platform Integration
- **Abhishek Agrawal** ([@Abhishek-Ag-1112](https://github.com/Abhishek-Ag-1112)) — AI/ML Architecture Lead, Risk Modeling & Model Governance

---

<p align="center">
  <strong>NIVA — Responsible Financial Intelligence for Bharat</strong><br>
  Empowering 400M+ Indians with dignified, transparent, and empathetic banking.
</p>
