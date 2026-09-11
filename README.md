# NIVA — Responsible Financial Intelligence for Bharat

<p align="center">
  <strong>AI-Powered Hyper-Personalized Banking Copilot</strong><br>
  <em>Using RBI Account Aggregator Framework for Zero-Credential Financial Data Access</em>
</p>

---

## The Problem

Indian banks have massive digital infrastructure but customers in Tier 2/3/4 cities find banking apps generic and disconnected. Banks struggle with:
- **Rising acquisition costs** and high loan journey drop-offs
- **Dangerous one-size-fits-all** product recommendations
- **38-day information blind spots** from legacy bureau-only underwriting

## NIVA's Solution

NIVA is an autonomous financial intelligence platform that:

1. **Financial Digital Twin** — Real-time behavioral analysis from AA transaction data (health score, stress detection, anomaly detection)
2. **Responsible Recommendation Gate** — Suppresses harmful product pushes when customer stress is detected
3. **Zero-Hallucination Copilot** — Deterministic affordability engine (pure arithmetic, no LLM guessing)
4. **Dual Interface** — Customer copilot + Bank institutional dashboard

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Customer   │────▶│   Next.js    │────▶│    FastAPI       │
│   Browser    │     │   Frontend   │     │    Backend       │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                              ┌────────────────────┼────────────────┐
                              │                    │                │
                    ┌─────────▼──────┐  ┌──────────▼─────┐  ┌──────▼──────┐
                    │ RebitMockAA    │  │  Financial     │  │ Responsible │
                    │ Provider       │  │  Twin Engine   │  │ Gate        │
                    │ (3 Personas)   │  │  (Deterministic)│  │ (Policy-Based)│
                    └────────────────┘  └────────────────┘  └─────────────┘
```

## Key Features

| Feature | Description |
|---------|-------------|
| **3 Bharat Personas** | Rajesh (stressed IT), Anita (kirana owner), Vikram (gig worker) |
| **Health Score** | 0-100 composite of income stability, savings, debt, liquidity |
| **Stress Detection** | Rules-based with interpretable contributing factors |
| **Responsible Gate** | Eligibility → Suitability → Stress Check → Affordability pipeline |
| **Affordability Engine** | Deterministic arithmetic with What-If simulation |
| **Bureau vs AA Comparison** | Shows the 38-day information blind window |
| **Audit Trail** | Immutable decision trail with Merkle hashes |

## Quick Start

### Backend
```bash
cd apps/api
python -m pip install -r requirements.txt
cp ../../.env.example ../../.env
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 — Backend API docs at http://localhost:8000/docs

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Vanilla CSS (Radical Clarity design system)
- **Backend**: FastAPI, Python 3.14, Pydantic v2
- **AA Integration**: RebitMockAAProvider (ReBIT-spec-compliant simulation)
- **Design**: Wise.com-inspired "Radical Clarity" (Plus Jakarta Sans + Inter)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/twin/{persona_id}` | GET | Get Financial Digital Twin |
| `/api/v1/twin/{persona_id}/affordability` | POST | Affordability simulation |
| `/api/v1/recommendations/{persona_id}` | GET | Gate verdicts for all products |
| `/api/v1/aa/consents` | POST | Create AA consent |
| `/api/v1/aa/fi-data/{consent_id}` | GET | Fetch financial data |
| `/api/v1/bank/customers` | GET | Bank dashboard customers |
| `/api/v1/copilot/chat` | POST | NIVA copilot chat |

## Team

Built at **Hackout'26 DAIICT** hackathon.

## License

MIT
