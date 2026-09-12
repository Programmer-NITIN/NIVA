"""
NIVA — SMS-to-Twin Parser.
Parses forwarded bank SMS into FITransaction-like records.
"""
import re
from datetime import datetime, timedelta
from typing import List
from app.schemas.aa import FITransaction

SMS_PATTERNS = [
    # HDFC: Rs. 5,000 debited from A/c XX1234 on 12-Sep-26 UPI Ref 123...
    re.compile(r"Rs\.?\s*([\d,]+\.?\d*)\s*(credited|debited|deposited)", re.I),
    re.compile(r"INR\s*([\d,]+\.?\d*)\s*(credited|debited)", re.I),
    re.compile(r"Amt\s*Rs\.?\s*([\d,]+\.?\d*)", re.I),
]

def parse_sms_to_transactions(sms_text: str) -> List[FITransaction]:
    lines = [l.strip() for l in sms_text.strip().splitlines() if l.strip()]
    txns: List[FITransaction] = []
    now = datetime.utcnow()
    for idx, line in enumerate(lines):
        amount = None
        is_credit = None
        for pat in SMS_PATTERNS:
            m = pat.search(line)
            if m:
                try:
                    amount = float(m.group(1).replace(",", ""))
                except:
                    continue
                verb = m.group(2).lower() if m.lastindex and m.lastindex >= 2 else ""
                if "credit" in verb or "deposit" in verb:
                    is_credit = True
                elif "debit" in verb:
                    is_credit = False
                else:
                    # heuristic: credited in line = credit
                    is_credit = "credit" in line.lower() or "received" in line.lower()
                break
        if amount is None:
            # try generic amount
            m2 = re.search(r"([\d,]+\.?\d*)", line)
            if m2:
                try:
                    amount = float(m2.group(1).replace(",", ""))
                except:
                    continue
                is_credit = "credited" in line.lower() or "received" in line.lower()
        if amount is None or amount <= 0:
            continue
        txn_type = "CREDIT" if is_credit else "DEBIT"
        # Determine mode/category heuristics
        upper = line.upper()
        mode = "UPI" if "UPI" in upper else "NEFT" if "NEFT" in upper else "IMPS" if "IMPS" in upper else "OTHERS"
        # Simple category
        cat = "miscellaneous"
        l = line.lower()
        if "salary" in l: cat="salary"
        elif "rent" in l: cat="rent"
        elif "swiggy" in l or "zomato" in l or "restaurant" in l: cat="dining"
        elif "amazon" in l or "flipkart" in l: cat="shopping"
        elif "hospital" in l or "apollo" in l or "medical" in l: cat="health"
        elif "electricity" in l or "bescom" in l or "bill" in l: cat="utilities"
        txns.append(FITransaction(
            id=f"TXN-SMS-{idx+1:04d}",
            type=txn_type,
            mode=mode,
            amount=amount,
            balance_after=None,
            narration=line[:120],
            merchant_name=None,
            category=cat,
            transaction_date=now - timedelta(hours=idx*7),
            reference_id=f"SMS-{idx+1:04d}"
        ))
    if not txns:
        raise ValueError("No valid amounts found in SMS text. Forward exact bank SMS like 'Rs 5,000 debited...'")
    return txns
