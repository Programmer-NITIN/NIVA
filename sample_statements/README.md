# NIVA — Sample Bank Statements for Verification & Testing

These realistic Indian bank statement files (available in both **PDF** and **CSV** formats) can be uploaded during the **Step 2 (Data Aggregation & Consent)** onboarding stage to verify parsing, Financial Digital Twin calculation, Responsible Gate underwriting, and Empathetic intervention flows.

---

## Available Sample Files

### 1. `sbi_salaried_statement.pdf` / `sbi_salaried_statement.csv` (Healthy Salaried Professional)
- **Bank**: State Bank of India (SBI)
- **Profile**: Ramesh Kumar (IT Employee)
- **Monthly Income**: ₹58,000 (Regular TCS Payroll NEFT credit on 1st of every month)
- **Key Transactions**: Rent (₹18,000), Zerodha SIP (₹5,000), DMart groceries, BESCOM electricity, fuel, dining.
- **Computed Results**:
  - **Health Score**: 98 / 100
  - **Savings Rate**: ~42%
  - **Debt/EMI**: ₹0 (Zero default risk)
  - **Stress Level**: Low (0 / 100)
  - **Gate Decision**: Pre-approved for instant credit / premium products

---

### 2. `hdfc_kirana_merchant_statement.pdf` / `hdfc_kirana_merchant_statement.csv` (Micro-Business & MSME)
- **Bank**: HDFC Bank (Current / Business Account)
- **Profile**: Surat Kirana Store (SME Merchant)
- **Monthly Turnover**: ~₹80,000+ across 70+ daily retail transactions
- **Key Transactions**: Daily UPI customer QR settlements (Paytm / PhonePe / BharatPe), weekly wholesale supplier inventory debits (Hindustan Unilever, ITC, dairy cooperative), Bajaj Finance business equipment loan EMI (₹8,500).
- **Computed Results**:
  - **Health Score**: 79 / 100
  - **Cashflow Profile**: Dynamic daily cash receipts with consistent weekly supplier settlements
  - **Gate Decision**: Pre-approved for Working Capital Line / Merchant Overdraft

---

### 3. `icici_stressed_medical_statement.pdf` / `icici_stressed_medical_statement.csv` (Cash-Strained / Empathetic Relief Trigger)
- **Bank**: ICICI Bank
- **Profile**: Rajesh Verma (BPO Executive facing sudden hospital crisis)
- **Monthly Income**: ₹42,000 (Salary)
- **Key Transactions**: Multiple heavy loan EMIs (₹18,700/mo - HDFC personal loan + Cholamandalam two-wheeler), sudden Apollo Multispecialty Hospital ICU debits (₹38,500 + ₹8,400 pharmacy), ECS penalty charges.
- **Computed Results**:
  - **Health Score**: 40 / 100
  - **Stress Factors Detected**: High EMI burden (>44% of income), Low emergency buffer (<1 month), Medical expenditure shock
  - **Stress Level**: Moderate / High
  - **Gate Decision**: Empathetic Intervention triggered (recommends EMI moratorium, credit counseling, and loan restructuring instead of predatory lending).

---

## How to Test in NIVA

1. Open **[http://localhost:3000](http://localhost:3000)**
2. In **Step 1 (Identity & KYC)**: Enter your mobile number (e.g. `9876543210`), click **Send OTP**, enter `123456`, and click **Verify & Continue**.
3. In **Step 2 (Data Aggregation)**: Click the **Upload Bank Statement** tab.
4. Click **Select Statement File** and choose one of the `.pdf` or `.csv` files from `c:\Users\nitin\NIVA hackout\sample_statements\`.
5. *(Optional for password-protected statements)*: If testing protected PDFs, enter the statement password.
6. Enter your Full Name and click **Upload & Parse Statement**.
7. Watch NIVA's dual-strategy parser extract transactions into ReBIT 1.1 schema, generate your **Financial Digital Twin**, and unlock your personalized **Customer Dashboard**!

