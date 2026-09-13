# NIVA — 10-Minute Master Video Demo Script & Screen Recording Walkthrough

> **Project**: NIVA (Nuanced Intelligence Virtual Advisor) — Responsible Financial Intelligence for Bharat  
> **Target Video Duration**: 9:30 – 10:30 minutes  
> **Audience**: Hackathon Grand Jury, Fintech Underwriters, Institutional Judges, Technical Evaluators  
> **Key Message**: *NIVA solves the credit assessment and predatory lending paradox in Bharat by moving from static credit scores (CIBIL/bureau lag) to verified real-time ReBIT 1.1 Account Aggregator data, explainable AI financial twins, non-predatory guardrails, and real-time fraud protection (NIVA Raksha).*

---

## 🎬 Video Recording Checklist & Setup (Do Before Hitting Record)

1. **Browser Windows Ready**:
   - Tab 1: `http://localhost:3000` (Customer Portal & Onboarding)
   - Tab 2: `http://localhost:3000/dashboard` (Digital Twin & Telemetry)
   - Tab 3: `http://localhost:3000/bank` (Bank Risk Officer & Underwriting Portal)
   - Tab 4: `http://localhost:3000/ask-niva` (Ask NIVA Multilingual AI Copilot)
   - Tab 5: `http://localhost:8000/docs` (Interactive FastAPI Swagger Documentation)
2. **Audio & Screen**:
   - Resolution: 1080p (1920x1080) or 4K.
   - Microphone: Clean voice, energetic, confident delivery.
   - Zoom level in browser: 100% or 110% for razor-sharp readability of numbers and charts.

---

## ⏱️ Master Timeline & Scene Breakdown

| Segment | Timestamp | Screen Focus | Core Topic |
|---|---|---|---|
| **Scene 1** | 0:00 – 1:00 | Title Slide / Landing Page | Hook, Problem Statement & Bharat Credit Paradox |
| **Scene 2** | 1:00 – 2:30 | `http://localhost:3000` | Vernacular Onboarding, OTP, DigiLocker e-KYC & ReBIT 1.1 Consent |
| **Scene 3** | 2:30 – 4:30 | `http://localhost:3000/dashboard` | AI Financial Digital Twin, 13-Feature XGBoost & SHAP Explainability |
| **Scene 4** | 4:30 – 5:45 | Dashboard (`Spending` & `Pots`) | Dynamic Spending, Isolation Forest Anomalies & Micropots Autopilot |
| **Scene 5** | 5:45 – 7:00 | Dashboard (`🚨 Raksha` Tab) | NIVA Raksha: Real-Time Fraud, Mule Detection & Scam Defense |
| **Scene 6** | 7:00 – 8:15 | `http://localhost:3000/ask-niva` | Ask NIVA Multilingual Copilot (Groq GPT-OSS-120b & Voice TTS) |
| **Scene 7** | 8:15 – 9:30 | `http://localhost:3000/bank` | Institutional Bank Risk Officer Portal & Responsible Policy Gate |
| **Scene 8** | 9:30 – 10:00 | Architecture / FastAPI / Docs | Tech Stack Summary, Compliance & Closing Vision |

---

# 📜 Scene-by-Scene Script & Click Actions

---

### SCENE 1: The Bharat Paradox & The Problem We Solve (0:00 – 1:00)

#### 🖥️ What to Show on Screen:
- Open `http://localhost:3000`.
- Scroll smoothly across the clean, enterprise-grade dark-themed landing page showing **"Responsible Financial Intelligence for Bharat"**.

#### 🎙️ Spoken Script:
> *"Hello respected judges and evaluators! Today, over 400 million hardworking Indians—kirana merchants, gig workers, farmers, and students—face a systemic financial paradox.*
> 
> *Traditional credit bureaus like CIBIL rely on a 30 to 60-day delayed reporting cycle. If a small business owner faces an unexpected medical emergency or a seasonal crop failure, traditional algorithms either reject them outright due to lack of bureau history, or worse, push them into predatory 36% interest micro-loans and debt traps.*
> 
> *We built **NIVA**—the Nuanced Intelligence Virtual Advisor. NIVA is an AI-powered, empathetic financial operating system designed for Bharat. It leverages real-time RBI Account Aggregator telemetry, explainable Machine Learning, non-predatory policy guardrails, and real-time fraud protection. Let me show you how it works end-to-end."*

---

### SCENE 2: Vernacular Onboarding, Mobile OTP & ReBIT Consent (1:00 – 2:30)

#### 🖥️ What to Show on Screen:
1. Show the language toggle in the top right: click **EN**, then **हिन्दी**, then **ગુજ** to demonstrate instant multilingual localization.
2. Switch back to English or Hindi.
3. In the Mobile Phone box, enter: `98765 43210` (or select Rajesh Sharma).
4. Click **Send OTP →**.
5. Point cursor to the green text that appears: `Dev OTP: xxxxxx (auto-fill for demo)`.
6. Type the 6 digits (or `123456`) and click **Verify & Continue →**.
7. Watch the smooth animation redirect to **Step 2: Bank Data Linking (ReBIT 1.1 / Account Aggregator)**.
8. Show the two ingestion options:
   - Option A: **RBI Account Aggregator (Setu Live Bridge)** with DPDP Act 2023 consent handle.
   - Option B: **Instant Bank Statement Upload (PDF / CSV)**.
9. Click **Connect Account Aggregator** or click **Continue to Dashboard**.

#### 🎙️ Spoken Script:
> *"Stage 1 is hyper-accessible vernacular onboarding. Bharat speaks in regional languages, so NIVA natively supports English, Hindi, and Gujarati with zero friction.*
> 
> *The customer inputs their mobile number. Our backend dispatches a cryptographically secure 6-digit OTP adhering to RBI Master Directions. Notice how the system delivers the OTP preview in real-time for transparent auditing.*
> 
> *Once verified, NIVA initiates Stage 2: Account Aggregator consent under India’s Digital Personal Data Protection Act (DPDP 2023). Notice that NIVA NEVER asks for bank passwords or net-banking credentials. Data is fetched strictly through encrypted, time-bound, purpose-limited ReBIT 1.1 financial information schemas. Let's proceed to the verified Financial Digital Twin."*

---

### SCENE 3: The AI Financial Digital Twin & SHAP Explainability (2:30 – 4:30)

#### 🖥️ What to Show on Screen:
1. You are now on `http://localhost:3000/dashboard`.
2. Highlight the top green welcome banner:
   - Customer Name: **Rajesh Sharma** (Kirana Merchant).
   - **ReBIT 1.1 Ingestion Active • State Bank of India**.
   - **Health Score: 74/100 • Emergency Buffer Guarded**.
3. Scroll down into the **Twin** tab:
   - Show the 4 Circular Telemetry Gauges:
     - **Health Score**: 74/100
     - **Stress Score**: 38/100
     - **Emergency Buffer**: 3.5 months liquid runway
     - **DTI Ratio**: 28% (under the safe 40% RBI threshold)
4. Show the **Monthly Verified Cashflow Breakdown**:
   - Inflow: ₹65,000/mo (verified UPI/NEFT credits)
   - Essential Spend: ₹26,300/mo (groceries, rent, utility)
   - Available Liquid Balance: ₹50,700
5. Point to the **Detected Bharat Life-Stage Card**:
   - Point out **"MSME KIRANA MERCHANT & CASHFLOW OPERATOR"** (predicted by our Random Forest demographic classifier with 86% confidence).
6. Scroll down to the **XGBoost Stress Predictor & SHAP Explainability Matrix**:
   - Hover over the SHAP bar chart showing feature attributions (e.g., `merchant_category_entropy`, `discretionary_spend_ratio`, `liquidity_buffer_days`).
   - Highlight the **Blind Feature Window**: Explain that caste, religion, gender, and personal identifiers are mathematically blinded (SHAP value: 0.000) to ensure zero algorithmic bias.

#### 🎙️ Spoken Script:
> *"Here is NIVA's core innovation: The AI Financial Digital Twin.*
> 
> *Instead of reducing Rajesh to an arbitrary 3-digit bureau score, NIVA computes a real-time behavioral digital twin. We observe 4 primary vital signs: Financial Health Score, Stress Score, Liquid Emergency Runway in months, and Debt-to-Income ratio.*
> 
> *Notice our Demographic Life-Stage Classifier: It automatically recognized Rajesh as an MSME Kirana Merchant operating on dynamic cashflows.*
> 
> *Crucially, look at this SHAP Explainability Matrix. Under RBI guidelines, AI cannot be a black box. NIVA runs a 13-feature gradient boosted model that breaks down exactly WHY a customer is scored a certain way. Furthermore, look at the bottom: our Blind Feature Window mathematically strips protected attributes like gender, community, and religion. It is 100% fair, transparent, and defensible."*

---

### SCENE 4: Spending Intelligence, Anomalies & Smart Pots (4:30 – 5:45)

#### 🖥️ What to Show on Screen:
1. Click the **Spending** tab in the navbar.
   - Show the interactive Category Donut/Bar breakdown (Business Inventory vs Personal Food vs Utilities).
   - Point to the **Isolation Forest Anomaly Banner**: Show flagged anomalous transactions (e.g., unexpected night-time high-velocity spikes or irregular debit surges).
2. Click the **Pots** tab in the navbar.
   - Show the Smart Behavioral Pots (e.g., *Emergency Buffer Pot*, *Shop Inventory Pot*, *Festival Savings*).
   - Click the **Autopilot Sweep** button to demonstrate algorithmic micro-savings sweeping idle cash into high-yield protected pots.

#### 🎙️ Spoken Script:
> *"Next, let's explore Spending & Behavioral Pots.*
> 
> *NIVA integrates an unsupervised Isolation Forest anomaly detection engine. It continuously evaluates transaction velocity, time-of-day entropy, and amount ratios to highlight irregular spending shocks before they deplete working capital.*
> 
> *In the Pots tab, NIVA introduces automated behavioral micro-saving. Rather than letting surplus cash sit idle or get spent impulsively, our Autopilot algorithm automatically sweeps safe margins into purpose-locked pots, compounding liquidity for shop stock and rainy days."*

---

### SCENE 5: NIVA Raksha — Real-Time Scam & Fraud Protection (5:45 – 7:00)

#### 🖥️ What to Show on Screen:
1. Click the **🚨 Raksha** tab in the navbar (the red highlighted tab).
2. Show the **NIVA Raksha Security Command Center**:
   - Risk Indicator: **Shield Active / DPDP Compliant**.
   - Transaction Scanner & Scam Classifier.
3. Demonstrate a live check:
   - Type or paste a suspicious SMS or transaction prompt in the Raksha input box:
     `"URGENT: Your SBI electricity bill is unpaid. Power disconnected tonight. Pay ₹10 immediately via APK link bit.ly/sbi-update"`
   - Click **Scan & Analyze Threat**.
4. Show the instant verdict:
   - **THREAT LEVEL: CRITICAL (Phishing / Electricity Bill Scam)**.
   - Mule Account & APK Sideloading Warning.
   - Immediate safety protocol: Auto-blocks recipient VPA, flags to National Cyber Crime Reporting Portal (1930).

#### 🎙️ Spoken Script:
> *"Now, we are extremely proud to introduce **NIVA Raksha**—our proprietary proactive defense engine against the raging epidemic of cyber fraud and digital arrest scams across India.*
> 
> *Bharat users are frequently targeted by malicious SMS APKs, fake challans, and electricity bill scams. Watch as I paste a real-world phishing SMS into NIVA Raksha.*
> 
> *Within milliseconds, our multi-modal scam classifier flags the urgent tone, identifies the deceptive link, calculates the threat level as Critical, and provides vernacular audio-visual instructions on what steps to take. It prevents the user from transferring money into fraudulent mule accounts, serving as a 24/7 digital security guard."*

---

### SCENE 6: Ask NIVA Multilingual AI Copilot (7:00 – 8:15)

#### 🖥️ What to Show on Screen:
1. Click the **Ask NIVA** tab in the navbar (or go to `http://localhost:3000/ask-niva`).
2. Show the chat interface powered by **Groq (`openai/gpt-oss-120b`)**.
3. Click one of the quick prompts or type in English/Hindi:
   - *"Can I afford to buy a new laptop for ₹60,000 this month?"*
4. Click **Send**.
5. Watch the lightning-fast response render in structured Markdown tables with Indian Rupee figures.
6. Click the **Listen 🔊** button to play real-time vernacular Text-to-Speech audio explaining the calculation.
7. Point out the recommendation: NIVA calculates that spending ₹60,000 now will reduce his emergency runway from 3.5 months to 1.1 months, advising a 3-month savings plan instead.

#### 🎙️ Spoken Script:
> *"Now let's look at **Ask NIVA**, our multilingual voice and text financial copilot.*
> 
> *Powered by Groq's blazing-fast inference running open-weight 120-billion parameter models, Ask NIVA connects directly to the customer's live digital twin telemetry.*
> 
> *I ask: 'Can I afford to buy a laptop for ₹60,000 this month?'*
> 
> *Notice what happens: NIVA does NOT hallucinate. It executes an affordability tool against Rajesh's live cashflow. It tells him honestly: 'If you spend ₹60,000 today, your emergency cushion drops from 3.5 months down to 1.1 months. Instead, if you save ₹15,000 in your Tech Pot for 4 months, you can buy it with zero debt stress.'*
> 
> *And for non-English speakers, one tap on the speaker icon speaks the entire analysis fluently in Hindi or Gujarati."*

---

### SCENE 7: Bank Risk Officer & Underwriting Portal (8:15 – 9:30)

#### 🖥️ What to Show on Screen:
1. Open `http://localhost:3000/bank` in a new tab.
2. Log in as a Risk Officer (use Officer ID `SBI-RISK-9042`).
3. Show the **Institutional Underwriting Console**:
   - Portfolio Overview: 10 Bharat Personas (from Street Vendors to Tech Salaried).
   - Click on **Rajesh Sharma**.
4. Show **The Responsible Policy Gate**:
   - Look at Product Recommendations:
     - ❌ **Unsecured Credit Card (₹1,00,000 limit) -> SUPPRESSED / REJECTED** (Reason: High DTI risk, avoids debt trap).
     - ❌ **Instant High-Interest Personal Loan (18%) -> SUPPRESSED**.
     - ✅ **PM SVANidhi 7% Working Capital Restructuring -> APPROVED**.
     - ✅ **Automated Emergency Buffer Micro-SIP -> APPROVED**.
5. Highlight the **Cryptographic RBI Audit Trail**:
   - Show the SHA-256 hashed immutable audit log recording every underwriting decision and policy gate verdict under RBI IT guidelines.

#### 🎙️ Spoken Script:
> *"Now, let's flip to the lender's perspective: The **Bank Risk Officer & Underwriting Portal**.*
> 
> *Commercial banks cannot afford defaults, yet traditional underwriting turns away good borrowers. In this console, underwriters see real-time portfolio telemetry across all customer personas.*
> 
> *Here is our signature architectural pillar: **The Responsible Gate**.*
> 
> *Notice that for Rajesh, our AI actively SUPPRESSED a high-margin ₹1 Lakh personal loan and a revolving credit card. Why? Because the policy engine detected elevated seasonal expense volatility. Instead of predatory cross-selling, the Gate approved a government-subsidized PM SVANidhi scheme at 7% interest and an emergency buffer plan.*
> 
> *Every single decision is cryptographically logged with SHA-256 signatures, giving regulatory bodies and internal risk committees a tamper-proof audit trail."*

---

### SCENE 8: Architecture & Closing Pitch (9:30 – 10:00)

#### 🖥️ What to Show on Screen:
1. Quickly flip to `http://localhost:8000/docs` (FastAPI Swagger UI).
2. Show the clean modular REST endpoints: `/api/v1/journey`, `/api/v1/twin`, `/api/v1/fraud`, `/api/v1/copilot`, `/api/v1/gate`.
3. Return to the NIVA homepage or documentation summary.

#### 🎙️ Spoken Script:
> *"Behind the scenes, NIVA is built on an enterprise-grade stack: Next.js 16 with Turbopack on the frontend, FastAPI and asynchronous Python on the backend, Supabase PostgreSQL poolers, Firebase real-time sync, and Groq ultra-low-latency LLMs.*
> 
> *NIVA proves that AI in banking doesn't have to be predatory. By combining real-time Account Aggregator data, explainable ML models, ethical policy guardrails, and proactive scam defense, we can empower millions of Indian citizens to achieve genuine financial resilience.*
> 
> *Thank you for your time, and we welcome your questions!"*
