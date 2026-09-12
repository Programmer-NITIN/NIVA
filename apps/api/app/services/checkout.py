"""
NIVA — Checkout Copilot (UPI moment-of-payment).
Parses free-form QR/url/amount into deterministic affordability + gate verdict.
"""
import re

def parse_checkout_input(raw: str) -> dict:
    raw = raw or ""
    # upi://pay?pa=...&am=48000&tn=...
    m = re.search(r"[?&]am=([\d.,]+)", raw)
    if m:
        try:
            amt = float(m.group(1).replace(",",""))
            return {"target_amount": int(amt), "description": raw[:120]}
        except: pass
    # ₹48,000 or 48000 or 48k
    m2 = re.search(r"₹?\s*([\d,]+)\s*(k|K)?", raw.replace(",",""))
    if m2:
        try:
            base = float(m2.group(1).replace(",",""))
            if m2.group(2):
                base *= 1000
            # need realistic floor
            if 500 <= base <= 5000000:
                return {"target_amount": int(base), "description": raw[:120]}
        except: pass
    # fallback
    return {"target_amount": 48000, "description": raw[:120]}
