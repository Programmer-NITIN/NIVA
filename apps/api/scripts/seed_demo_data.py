"""
NIVA — Seed 10 Diverse Indian Personas for Presentation Demo.

Generates realistic KYC profiles, transaction histories, and financial twins
for 10 demographically diverse Indian banking customers.
Persists everything to Firebase Firestore collections:
  - users (KYC profiles)
  - statements (parsed transactions)
  - financial_twins (computed twins)

Usage:
    cd apps/api
    python -m scripts.seed_demo_data
"""

import sys
import os
import random
from datetime import datetime, timedelta

# Ensure app modules are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.schemas.aa import FIAccountSummary, FITransaction, FIDataResponse
from app.services.statement_parser import detect_category, detect_mode, extract_merchant

# ============================================================
#  10 PERSONAS — Diverse Indian Banking Customers
# ============================================================

DEMO_PERSONAS = [
    {
        "persona_id": "priya_nair",
        "full_name": "Priya Nair",
        "phone": "+91 98123 45601",
        "masked_aadhaar": "XXXX-XXXX-3401",
        "pan": "ABCPN3401K",
        "dob": "1995-06-12",
        "gender": "Female",
        "address": "Flat 1201, Hiranandani Gardens, Powai, Mumbai 400076",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "UX Designer at Flipkart",
        "bank_linked": "HDFC Bank (A/C ending in 7712)",
        "bank_name": "HDFC Bank",
        "ifsc": "HDFC0001234",
        "account_number": "50100927712",
        "monthly_income": 92000,
        "city": "Mumbai",
        "narrative": "High earner with disciplined savings (40% rate). Strong emergency buffer of 6.2 months. Ideal candidate for wealth creation products.",
        "empathetic_offer": {
            "title": "Smart Wealth SIP + Tax Saver ELSS",
            "type": "sip",
            "description": "Automated Rs 10,000/month index fund SIP with Rs 1.5L ELSS tax benefit under Section 80C.",
            "relief_amount": "12.4% historical return",
        },
        "transactions": [
            ("NEFT CR / FLIPKART DESIGN TEAM SALARY", 92000, "CREDIT", "NEFT"),
            ("UPI/NOBROKER APARTMENT RENT POWAI", 28000, "DEBIT", "UPI"),
            ("ACH DEBIT / AXIS MF SIP FLEXI CAP", 10000, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/BLINKIT GROCERIES POWAI", 2200, "DEBIT", "UPI"),
            ("UPI/BESCOM ELECTRICITY BILL MUMBAI", 1800, "DEBIT", "UPI"),
            ("UPI/P2M/SWIGGY FOOD ORDER", 850, "DEBIT", "UPI"),
            ("UPI/CULT FIT PREMIUM MEMBERSHIP", 2500, "DEBIT", "UPI"),
            ("UPI/P2M/AMAZON INDIA SHOPPING", 3200, "DEBIT", "UPI"),
            ("POS DEBIT / ZARA PHOENIX MALL MUMBAI", 4800, "DEBIT", "CARD"),
            ("UPI/AIRTEL BROADBAND RECHARGE", 999, "DEBIT", "UPI"),
            ("ACH DEBIT / HDFC ERGO HEALTH PREMIUM", 1500, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/UBER RIDES MUMBAI", 1200, "DEBIT", "UPI"),
        ],
    },
    {
        "persona_id": "suresh_yadav",
        "full_name": "Suresh Yadav",
        "phone": "+91 94123 77801",
        "masked_aadhaar": "XXXX-XXXX-8812",
        "pan": "BKPSY8812L",
        "dob": "1978-02-28",
        "gender": "Male",
        "address": "Near Clock Tower, Johari Bazaar, Jaipur, RJ 302001",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Auto Rickshaw Fleet Owner (3 vehicles)",
        "bank_linked": "State Bank of India (A/C ending in 5543)",
        "bank_name": "State Bank of India",
        "ifsc": "SBIN0005678",
        "account_number": "30948855543",
        "monthly_income": 35000,
        "city": "Jaipur",
        "narrative": "Self-employed fleet owner with seasonal income variation. Moderate stress due to vehicle maintenance costs and fuel price fluctuations.",
        "empathetic_offer": {
            "title": "PM SVANidhi Micro-Merchant Working Capital",
            "type": "credit",
            "description": "Collateral-free Rs 50,000 working capital at 7% APR aligned with seasonal earnings cycle.",
            "relief_amount": "Rs 50,000 line",
        },
        "transactions": [
            ("UPI/P2P/DAILY COLLECTION DEPOSIT", 35000, "CREDIT", "UPI"),
            ("ACH DEBIT / SBI VEHICLE LOAN EMI", 8500, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/IOCL PETROL PUMP JAIPUR", 6200, "DEBIT", "UPI"),
            ("UPI/P2M/AUTO PARTS SANGANER RD", 4500, "DEBIT", "UPI"),
            ("UPI/P2M/DMART JAIPUR GROCERIES", 3200, "DEBIT", "UPI"),
            ("UPI/JAIPUR VIDYUT ELECTRICITY BILL", 1800, "DEBIT", "UPI"),
            ("ATM CASH WITHDRAWAL SBI JAIPUR MAIN", 5000, "DEBIT", "ATM/CASH"),
            ("UPI/AIRTEL MOBILE RECHARGE", 599, "DEBIT", "UPI"),
            ("UPI/P2P/DRIVER SALARY PAYMENT", 12000, "DEBIT", "UPI"),
        ],
    },
    {
        "persona_id": "meena_devi",
        "full_name": "Meena Devi",
        "phone": "+91 97915 33201",
        "masked_aadhaar": "XXXX-XXXX-1198",
        "pan": "CDFMD1198P",
        "dob": "1982-09-15",
        "gender": "Female",
        "address": "Ward 14, Sigra, Varanasi, UP 221010",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Anganwadi Worker (Govt ICDS)",
        "bank_linked": "Bank of Baroda (A/C ending in 6629)",
        "bank_name": "Bank of Baroda",
        "ifsc": "BARB0VARANA",
        "account_number": "41240106629",
        "monthly_income": 18000,
        "city": "Varanasi",
        "narrative": "Government employee with fixed low income. High stress from family medical expenses. Needs protection, not credit products.",
        "empathetic_offer": {
            "title": "Ayushman Bharat Health Shield + Savings Buffer",
            "type": "protection",
            "description": "Free Rs 5L family health cover under PMJAY and automated Rs 500/month recurring deposit at 7.2%.",
            "relief_amount": "Free health coverage",
        },
        "transactions": [
            ("NEFT CR / ICDS GOVT SALARY CREDITED", 18000, "CREDIT", "NEFT"),
            ("UPI/P2M/KIRANA STORE GROCERIES", 4500, "DEBIT", "UPI"),
            ("UPI/P2M/APOLLO PHARMACY VARANASI", 2800, "DEBIT", "UPI"),
            ("ATM CASH WITHDRAWAL BOB SIGRA", 3000, "DEBIT", "ATM/CASH"),
            ("UPI/TORRENT POWER UP EAST BILL", 950, "DEBIT", "UPI"),
            ("UPI/P2M/INDANE GAS CYLINDER BOOKING", 980, "DEBIT", "UPI"),
            ("UPI/P2P/DAUGHTER SCHOOL FEE TRANSFER", 2500, "DEBIT", "UPI"),
            ("UPI/AIRTEL MOBILE RECHARGE", 299, "DEBIT", "UPI"),
        ],
    },
    {
        "persona_id": "arjun_reddy",
        "full_name": "Arjun K. Reddy",
        "phone": "+91 99001 88401",
        "masked_aadhaar": "XXXX-XXXX-5567",
        "pan": "ABCPR5567M",
        "dob": "1993-01-08",
        "gender": "Male",
        "address": "Villa 23, Jubilee Hills, Hyderabad 500033",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Cloud Solutions Architect at TCS",
        "bank_linked": "ICICI Bank (A/C ending in 9034)",
        "bank_name": "ICICI Bank",
        "ifsc": "ICIC0001234",
        "account_number": "22040109034",
        "monthly_income": 110000,
        "city": "Hyderabad",
        "narrative": "Highest earner persona. Strong investment discipline with 35% savings. 8.2 months emergency buffer. Premium banking candidate.",
        "empathetic_offer": {
            "title": "Premium Wealth Management Suite",
            "type": "sip",
            "description": "Automated Rs 25,000/month portfolio across equity, debt, and international funds with dedicated relationship manager.",
            "relief_amount": "14.2% portfolio target",
        },
        "transactions": [
            ("NEFT CR / TCS MONTHLY SALARY CREDIT", 110000, "CREDIT", "NEFT"),
            ("UPI/NOBROKER APARTMENT RENT HYDERABAD", 35000, "DEBIT", "UPI"),
            ("ACH DEBIT / ZERODHA SIP FLEXI CAP", 15000, "DEBIT", "NACH/AUTO-DEBIT"),
            ("ACH DEBIT / GROWW US EQUITY FUND SIP", 10000, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/BIGBASKET PROVISIONS", 4500, "DEBIT", "UPI"),
            ("UPI/P2M/SWIGGY INSTAMART HYDERABAD", 1200, "DEBIT", "UPI"),
            ("UPI/TSECL ELECTRICITY BILL HYDERABAD", 2100, "DEBIT", "UPI"),
            ("UPI/P2M/ZOMATO FOOD ORDER", 950, "DEBIT", "UPI"),
            ("POS DEBIT / LIFESTYLE BANJARA HILLS", 5500, "DEBIT", "CARD"),
            ("UPI/P2M/UBER RIDES HYDERABAD", 1800, "DEBIT", "UPI"),
            ("ACH DEBIT / STAR HEALTH INSURANCE", 3200, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/DECATHLON SPORTS EQUIPMENT", 2800, "DEBIT", "UPI"),
            ("ACH DEBIT / NPS CONTRIBUTION TIER 1", 5000, "DEBIT", "NACH/AUTO-DEBIT"),
        ],
    },
    {
        "persona_id": "fatima_sheikh",
        "full_name": "Fatima Sheikh",
        "phone": "+91 96543 21801",
        "masked_aadhaar": "XXXX-XXXX-4478",
        "pan": "DEEFS4478K",
        "dob": "1986-04-22",
        "gender": "Female",
        "address": "Aminabad Market, Lucknow, UP 226018",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Tailoring Workshop Owner (6 employees)",
        "bank_linked": "Punjab National Bank (A/C ending in 3390)",
        "bank_name": "Punjab National Bank",
        "ifsc": "PUNB0123400",
        "account_number": "60180103390",
        "monthly_income": 28000,
        "city": "Lucknow",
        "narrative": "Growing micro-enterprise with 6 employees. Needs working capital for bulk fabric purchases. Low DTI (18%) makes her eligible for MSME credit.",
        "empathetic_offer": {
            "title": "MUDRA Shishu Business Growth Loan",
            "type": "credit",
            "description": "Pre-approved Rs 75,000 MUDRA loan at 8% for fabric inventory and sewing machine upgrade.",
            "relief_amount": "Rs 75,000 line",
        },
        "transactions": [
            ("NEFT CR / WORKSHOP SALES COLLECTION", 28000, "CREDIT", "NEFT"),
            ("UPI/P2P/ADDITIONAL ORDER PAYMENT", 8000, "CREDIT", "UPI"),
            ("UPI/P2M/FABRIC WHOLESALE AMINABAD", 12000, "DEBIT", "UPI"),
            ("UPI/P2M/SEWING SUPPLIES VENDOR", 3500, "DEBIT", "UPI"),
            ("UPI/P2M/KIRANA STORE GROCERIES", 4200, "DEBIT", "UPI"),
            ("UPI/LESCO ELECTRICITY BILL LUCKNOW", 1400, "DEBIT", "UPI"),
            ("ATM CASH WITHDRAWAL PNB AMINABAD", 5000, "DEBIT", "ATM/CASH"),
            ("UPI/P2P/EMPLOYEE WAGES MONTHLY", 6000, "DEBIT", "UPI"),
            ("UPI/AIRTEL MOBILE RECHARGE", 399, "DEBIT", "UPI"),
        ],
    },
    {
        "persona_id": "deepak_chauhan",
        "full_name": "Deepak Chauhan",
        "phone": "+91 98760 55401",
        "masked_aadhaar": "XXXX-XXXX-7821",
        "pan": "FGHDC7821L",
        "dob": "1980-12-03",
        "gender": "Male",
        "address": "Sector 22-B, Chandigarh 160022",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Punjab Police Constable",
        "bank_linked": "State Bank of India (A/C ending in 1187)",
        "bank_name": "State Bank of India",
        "ifsc": "SBIN0012345",
        "account_number": "30949001187",
        "monthly_income": 42000,
        "city": "Chandigarh",
        "narrative": "Government employee with stable income but high family obligations (3 children in school, elderly parents). Moderate DTI (32%) from home loan.",
        "empathetic_offer": {
            "title": "Education Loan Pre-Approval + FD Ladder",
            "type": "sip",
            "description": "Pre-approved Rs 2L education loan at 7.5% and automated FD ladder for children's higher education corpus.",
            "relief_amount": "7.5% education loan rate",
        },
        "transactions": [
            ("NEFT CR / PUNJAB POLICE SALARY CREDIT", 42000, "CREDIT", "NEFT"),
            ("ACH DEBIT / SBI HOME LOAN EMI", 13500, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/RELIANCE FRESH GROCERIES CHD", 5200, "DEBIT", "UPI"),
            ("UPI/P2P/CHILDREN SCHOOL FEE TRANSFER", 4500, "DEBIT", "UPI"),
            ("UPI/IOCL PETROL PUMP SECTOR 22", 3500, "DEBIT", "UPI"),
            ("UPI/PSPCL ELECTRICITY BILL CHD", 1800, "DEBIT", "UPI"),
            ("UPI/P2P/PARENTS MONTHLY SUPPORT", 5000, "DEBIT", "UPI"),
            ("UPI/AIRTEL BROADBAND + MOBILE", 899, "DEBIT", "UPI"),
            ("ATM CASH WITHDRAWAL SBI SEC 22", 3000, "DEBIT", "ATM/CASH"),
            ("UPI/P2M/APOLLO PHARMACY CHD", 1200, "DEBIT", "UPI"),
        ],
    },
    {
        "persona_id": "lakshmi_iyer",
        "full_name": "Lakshmi Iyer",
        "phone": "+91 94440 88901",
        "masked_aadhaar": "XXXX-XXXX-2245",
        "pan": "GHILI2245M",
        "dob": "1970-08-19",
        "gender": "Female",
        "address": "3rd Cross, Besant Nagar, Chennai 600090",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "School Principal (Govt Aided)",
        "bank_linked": "Indian Overseas Bank (A/C ending in 0891)",
        "bank_name": "Indian Overseas Bank",
        "ifsc": "IOBA0001234",
        "account_number": "18920100891",
        "monthly_income": 65000,
        "city": "Chennai",
        "narrative": "Senior educator nearing retirement. Conservative risk profile. Strong pension-backed income with 4.8 months buffer. Ideal for low-risk wealth preservation.",
        "empathetic_offer": {
            "title": "Senior Citizen FD + Pension Optimizer",
            "type": "sip",
            "description": "High-yield 8.1% Senior Citizen FD with quarterly interest payout and NPS Tier-1 top-up for tax benefit.",
            "relief_amount": "8.1% FD rate",
        },
        "transactions": [
            ("NEFT CR / GOVT AIDED SCHOOL SALARY", 65000, "CREDIT", "NEFT"),
            ("ACH DEBIT / LIC JEEVAN ANAND PREMIUM", 5500, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/SPENCER'S DAILY PROVISIONS", 4800, "DEBIT", "UPI"),
            ("UPI/TNEB ELECTRICITY BILL CHENNAI", 1600, "DEBIT", "UPI"),
            ("UPI/P2M/MEDPLUS PHARMACY BESANT NGR", 2200, "DEBIT", "UPI"),
            ("ACH DEBIT / SBI MF BALANCED FUND SIP", 5000, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2P/GRANDCHILDREN GIFTS TRANSFER", 3000, "DEBIT", "UPI"),
            ("UPI/INDANE GAS CYLINDER BOOKING", 980, "DEBIT", "UPI"),
            ("UPI/P2M/TEMPLE DONATION TRUST", 1100, "DEBIT", "UPI"),
            ("ATM CASH WITHDRAWAL IOB BESANT NGR", 4000, "DEBIT", "ATM/CASH"),
        ],
    },
    {
        "persona_id": "ravi_gupta",
        "full_name": "Ravi Gupta",
        "phone": "+91 99111 44501",
        "masked_aadhaar": "XXXX-XXXX-6634",
        "pan": "HIJRG6634K",
        "dob": "1988-11-30",
        "gender": "Male",
        "address": "Lajpat Nagar Market, New Delhi 110024",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Street Food Vendor (Chaat & Snacks)",
        "bank_linked": "Union Bank of India (A/C ending in 4490)",
        "bank_name": "Union Bank of India",
        "ifsc": "UBIN0534490",
        "account_number": "52010104490",
        "monthly_income": 22000,
        "city": "Delhi",
        "narrative": "Cash-heavy street food business with erratic daily deposits. High stress from irregular inflows and rising raw material costs. Needs protection, not loans.",
        "empathetic_offer": {
            "title": "PM SVANidhi Micro Credit + Digital Payment Setup",
            "type": "credit",
            "description": "Rs 20,000 collateral-free working capital at 7% APR with UPI QR payment setup for digital collections.",
            "relief_amount": "Rs 20,000 line + UPI QR",
        },
        "transactions": [
            ("UPI/P2P/DAILY SALES DEPOSIT", 8000, "CREDIT", "UPI"),
            ("UPI/P2P/EVENING COLLECTION DEPOSIT", 6000, "CREDIT", "UPI"),
            ("UPI/P2P/WEEKEND EXTRA SALES", 8000, "CREDIT", "UPI"),
            ("UPI/P2M/VEGETABLE WHOLESALE INA MKT", 5500, "DEBIT", "UPI"),
            ("UPI/P2M/SPICE SUPPLIER CHANDNI CHOWK", 2800, "DEBIT", "UPI"),
            ("ATM CASH WITHDRAWAL UBI LAJPAT NGR", 4000, "DEBIT", "ATM/CASH"),
            ("UPI/P2M/GAS CYLINDER REFILL BOOKING", 1200, "DEBIT", "UPI"),
            ("UPI/BSES ELECTRICITY BILL DELHI", 1400, "DEBIT", "UPI"),
            ("UPI/P2M/DMART GROCERIES DELHI", 3200, "DEBIT", "UPI"),
            ("UPI/AIRTEL MOBILE RECHARGE", 299, "DEBIT", "UPI"),
        ],
    },
    {
        "persona_id": "sneha_patil",
        "full_name": "Sneha Patil",
        "phone": "+91 98903 22101",
        "masked_aadhaar": "XXXX-XXXX-9912",
        "pan": "IJKSP9912L",
        "dob": "1994-07-14",
        "gender": "Female",
        "address": "Kothrud, Pune 411038",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Freelance Content Writer & Blogger",
        "bank_linked": "Kotak Mahindra Bank (A/C ending in 8823)",
        "bank_name": "Kotak Mahindra Bank",
        "ifsc": "KKBK0001234",
        "account_number": "71120108823",
        "monthly_income": 55000,
        "city": "Pune",
        "narrative": "Irregular freelance income with monthly variance of 20-30%. Good savings discipline when income is high. Needs income stabilization tools.",
        "empathetic_offer": {
            "title": "Freelancer Income Buffer + Health Guard",
            "type": "sip",
            "description": "Automated sweep-to-FD for surplus months and Rs 5L individual health insurance at group rates.",
            "relief_amount": "Income smoothing + health cover",
        },
        "transactions": [
            ("NEFT CR / CLIENT PAYMENT TECHWRITER CO", 32000, "CREDIT", "NEFT"),
            ("NEFT CR / MEDIUM PLATFORM EARNINGS", 15000, "CREDIT", "NEFT"),
            ("UPI/P2P/BLOG SPONSORSHIP PAYMENT", 8000, "CREDIT", "UPI"),
            ("UPI/NOBROKER APARTMENT RENT KOTHRUD", 15000, "DEBIT", "UPI"),
            ("ACH DEBIT / GROWW NIFTY 50 SIP", 5000, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/BIGBASKET PROVISIONS PUNE", 3800, "DEBIT", "UPI"),
            ("UPI/P2M/STARBUCKS COWORKING PUNE", 1200, "DEBIT", "UPI"),
            ("UPI/MSEDCL ELECTRICITY BILL PUNE", 1500, "DEBIT", "UPI"),
            ("UPI/P2M/AMAZON INDIA TECH EQUIPMENT", 4500, "DEBIT", "UPI"),
            ("UPI/P2M/NETFLIX SUBSCRIPTION", 649, "DEBIT", "UPI"),
            ("UPI/AIRTEL BROADBAND PUNE", 799, "DEBIT", "UPI"),
        ],
    },
    {
        "persona_id": "mohammed_farooq",
        "full_name": "Mohammed Farooq",
        "phone": "+91 97310 66701",
        "masked_aadhaar": "XXXX-XXXX-3378",
        "pan": "KLMMF3378M",
        "dob": "1990-03-25",
        "gender": "Male",
        "address": "HSR Layout, Bengaluru 560102",
        "kyc_source": "DigiLocker / UIDAI Official Verification",
        "occupation": "Uber/Ola Driver Partner",
        "bank_linked": "Axis Bank (A/C ending in 5501)",
        "bank_name": "Axis Bank",
        "ifsc": "UTIB0002345",
        "account_number": "91701405501",
        "monthly_income": 30000,
        "city": "Bengaluru",
        "narrative": "High stress (76/100). Multiple active EMIs (bike loan + phone EMI). Erratic gig earnings with fuel cost burden. Personal loans must be BLOCKED.",
        "empathetic_offer": {
            "title": "Debt Consolidation + Fuel Cashback Card",
            "type": "restructure",
            "description": "Consolidate 2 active EMIs into a single 24-month facility reducing monthly burden by 35%. Plus 5% fuel cashback.",
            "relief_amount": "EMI reduced by 35%",
        },
        "transactions": [
            ("UPI/P2P/UBER WEEKLY SETTLEMENT", 12000, "CREDIT", "UPI"),
            ("UPI/P2P/OLA WEEKLY SETTLEMENT", 10000, "CREDIT", "UPI"),
            ("UPI/P2P/ADDITIONAL TRIP EARNINGS", 8000, "CREDIT", "UPI"),
            ("ACH DEBIT / AXIS BIKE LOAN EMI", 5200, "DEBIT", "NACH/AUTO-DEBIT"),
            ("ACH DEBIT / BAJAJ FINSERV PHONE EMI", 2800, "DEBIT", "NACH/AUTO-DEBIT"),
            ("UPI/P2M/BPCL PETROL PUMP HSR LAYOUT", 7500, "DEBIT", "UPI"),
            ("UPI/P2M/ZEPTO GROCERIES BENGALURU", 2800, "DEBIT", "UPI"),
            ("UPI/BESCOM ELECTRICITY BILL BENGALURU", 1200, "DEBIT", "UPI"),
            ("UPI/P2M/SWIGGY FOOD BENGALURU", 1500, "DEBIT", "UPI"),
            ("UPI/AIRTEL MOBILE RECHARGE", 449, "DEBIT", "UPI"),
            ("ATM CASH WITHDRAWAL AXIS HSR", 3000, "DEBIT", "ATM/CASH"),
            ("ACH DEBIT ECS RETURN FEE", 450, "DEBIT", "NACH/AUTO-DEBIT"),
        ],
    },
]


def generate_transactions_for_persona(persona: dict) -> list[FITransaction]:
    """Generate 3 months of realistic transactions from persona template."""
    txns = []
    base_templates = persona["transactions"]
    base_date = datetime(2026, 7, 1)

    for month_offset in range(3):
        month_start = base_date + timedelta(days=month_offset * 30)
        for i, (narration, amount, txn_type, mode) in enumerate(base_templates):
            # Add some realistic variation
            amount_var = amount * random.uniform(0.92, 1.08)
            amount_var = round(amount_var, 2)

            day_offset = min(i * 3 + random.randint(0, 2), 28)
            txn_date = month_start + timedelta(days=day_offset)

            txns.append(FITransaction(
                id=f"TXN-SEED-{persona['persona_id'][:4].upper()}-{len(txns)+1:05d}",
                type=txn_type,
                mode=mode,
                amount=amount_var,
                balance_after=0,  # Will be calculated
                narration=narration,
                merchant_name=extract_merchant(narration),
                category=detect_category(narration),
                transaction_date=txn_date,
                reference_id=f"REF-SEED-{len(txns)+1:06d}",
            ))

    # Calculate running balance
    starting_balance = persona["monthly_income"] * 0.8 + random.randint(5000, 25000)
    balance = starting_balance
    txns.sort(key=lambda t: t.transaction_date)
    for t in txns:
        if t.type == "CREDIT":
            balance += t.amount
        else:
            balance -= t.amount
            if balance < 2000:
                balance = 2000 + random.randint(500, 3000)
        t.balance_after = round(balance, 2)

    return txns


def seed_all_personas():
    """Seed all 10 personas into Firebase Firestore."""
    print("\n" + "=" * 70)
    print("  [NIVA SEED ENGINE] Generating 10 Demo Personas for Presentation")
    print("=" * 70 + "\n")

    # Initialize Firebase
    from app.firebase_client import (
        init_firebase, save_user_profile, save_statement_data, save_twin_data
    )
    from app.services.twin import FinancialTwinService
    import asyncio

    db = init_firebase()
    if not db:
        print("[ERROR] Firebase initialization failed. Check your credentials.")
        print("        Continuing with in-memory storage only...\n")

    twin_service = FinancialTwinService()
    seeded_count = 0

    for idx, persona in enumerate(DEMO_PERSONAS, 1):
        pid = persona["persona_id"]
        print(f"  [{idx:02d}/10] Seeding: {persona['full_name']} ({pid})")
        print(f"         City: {persona['city']} | Occupation: {persona['occupation']}")
        print(f"         Income: Rs {persona['monthly_income']:,}/month | Bank: {persona['bank_name']}")

        # 1. Generate transactions
        txns = generate_transactions_for_persona(persona)
        print(f"         Transactions: {len(txns)} rows (3 months)")

        # 2. Build FIDataResponse
        acct_num = persona.get("account_number", "0000000000")
        masked = f"XXXX-XXXX-{acct_num[-4:]}" if len(acct_num) >= 4 else "XXXX-XXXX-0000"

        fi_data = FIDataResponse(
            consent_id=f"CNST-SEED-{pid[:4].upper()}",
            accounts=[FIAccountSummary(
                fip_id=f"FIP-{persona['bank_name'].split()[0].upper()}",
                account_type="SAVINGS",
                masked_number=masked,
                branch=f"{persona['city']} Main Branch",
                ifsc=persona["ifsc"],
                current_balance=txns[-1].balance_after if txns else 25000.0,
            )],
            transactions=txns,
            data_range_start=txns[0].transaction_date if txns else datetime.utcnow(),
            data_range_end=txns[-1].transaction_date if txns else datetime.utcnow(),
            total_transactions=len(txns),
        )

        # 3. Compute twin
        twin = twin_service.register_uploaded_statement(pid, fi_data, persona["full_name"])
        print(f"         Health: {twin.health_score}/100 | Stress: {twin.stress_score}/100 ({twin.stress_level})")

        # 4. Save KYC profile to Firestore
        kyc_entry = {k: v for k, v in persona.items() if k != "transactions"}
        kyc_entry["verification_timestamp"] = datetime.utcnow().isoformat() + "Z"
        save_user_profile(pid, kyc_entry)
        print(f"         Firestore: users/{pid} [SAVED]")

        # 5. Save statement data
        st_dict = {
            "persona_id": pid,
            "consent_id": fi_data.consent_id,
            "data_range_start": fi_data.data_range_start.isoformat(),
            "data_range_end": fi_data.data_range_end.isoformat(),
            "total_transactions": len(txns),
            "accounts": [a.model_dump() for a in fi_data.accounts],
            "transactions": [t.model_dump() for t in txns],
        }
        save_statement_data(pid, st_dict)
        print(f"         Firestore: statements/{pid} [SAVED]")

        # 6. Save twin data
        save_twin_data(pid, twin.model_dump())
        print(f"         Firestore: financial_twins/{pid} [SAVED]")

        seeded_count += 1
        print()

    print("=" * 70)
    print(f"  [NIVA SEED ENGINE] Successfully seeded {seeded_count}/10 personas")
    print(f"  Firebase collections populated: users, statements, financial_twins")
    print("=" * 70 + "\n")

    return seeded_count


if __name__ == "__main__":
    seed_all_personas()
