"""
NIVA — Sample Bank Statement Generator for Verification and Testing.
Generates realistic Indian bank statements (CSV) matching formats of SBI, HDFC, and ICICI.
"""

import os
import sys
from datetime import datetime, timedelta

def create_sample_statements():
    output_dir = os.path.join(os.path.dirname(__file__))
    os.makedirs(output_dir, exist_ok=True)

    # 1. SBI Salaried Individual (Healthy Profile - Ramesh Kumar)
    # 90 days of transactions, regular salary on 1st of each month, rent, groceries, SIP, utilities, dining
    sbi_lines = ["Date,Narration,ChqRef,Withdrawal,Deposit,Balance"]
    bal = 48500.0
    start_date = datetime(2026, 6, 1)
    
    # Month 1: June 2026
    sbi_lines.append(f"01/06/2026,NEFT CR-TCS LTD-SALARY JUNE 2026,NEFT98124,,58000.00,{bal + 58000:.2f}")
    bal += 58000.0
    sbi_lines.append(f"03/06/2026,UPI/RENT/Shri Ganesh Properties/HDFC,UPI00129,18000.00,,{bal - 18000:.2f}")
    bal -= 18000.0
    sbi_lines.append(f"05/06/2026,ACH/SIP/ZERODHA BROKING/NIPPON MF,ACH88120,5000.00,,{bal - 5000:.2f}")
    bal -= 5000.0
    sbi_lines.append(f"07/06/2026,UPI/DMart Supermarket/Groceries,UPI00341,4250.00,,{bal - 4250:.2f}")
    bal -= 4250.0
    sbi_lines.append(f"10/06/2026,UPI/BESCOM Electricity Bill Pay,UPI00452,1850.00,,{bal - 1850:.2f}")
    bal -= 1850.0
    sbi_lines.append(f"14/06/2026,UPI/Zomato Dining/Bangalore,UPI00563,840.00,,{bal - 840:.2f}")
    bal -= 840.0
    sbi_lines.append(f"18/06/2026,UPI/Apollo Pharmacy/Health,UPI00674,1200.00,,{bal - 1200:.2f}")
    bal -= 1200.0
    sbi_lines.append(f"22/06/2026,UPI/Blinkit Instant Groceries,UPI00785,760.00,,{bal - 760:.2f}")
    bal -= 760.0
    sbi_lines.append(f"25/06/2026,UPI/Amazon Retail Shopping,UPI00896,2499.00,,{bal - 2499:.2f}")
    bal -= 2499.0
    sbi_lines.append(f"28/06/2026,UPI/Indian Oil Petrol/Fuel,UPI00907,1500.00,,{bal - 1500:.2f}")
    bal -= 1500.0

    # Month 2: July 2026
    sbi_lines.append(f"01/07/2026,NEFT CR-TCS LTD-SALARY JULY 2026,NEFT99235,,58000.00,{bal + 58000:.2f}")
    bal += 58000.0
    sbi_lines.append(f"03/07/2026,UPI/RENT/Shri Ganesh Properties/HDFC,UPI01140,18000.00,,{bal - 18000:.2f}")
    bal -= 18000.0
    sbi_lines.append(f"05/07/2026,ACH/SIP/ZERODHA BROKING/NIPPON MF,ACH89231,5000.00,,{bal - 5000:.2f}")
    bal -= 5000.0
    sbi_lines.append(f"08/07/2026,UPI/BigBasket Fresh Groceries,UPI01251,3900.00,,{bal - 3900:.2f}")
    bal -= 3900.0
    sbi_lines.append(f"11/07/2026,UPI/Airtel Broadband Utilities,UPI01362,1199.00,,{bal - 1199:.2f}")
    bal -= 1199.0
    sbi_lines.append(f"15/07/2026,UPI/Swiggy Food Delivery,UPI01473,620.00,,{bal - 620:.2f}")
    bal -= 620.0
    sbi_lines.append(f"20/07/2026,UPI/Uber India Transport,UPI01584,450.00,,{bal - 450:.2f}")
    bal -= 450.0
    sbi_lines.append(f"24/07/2026,UPI/Medplus Pharmacy/Health,UPI01695,950.00,,{bal - 950:.2f}")
    bal -= 950.0
    sbi_lines.append(f"29/07/2026,UPI/Shell Petrol Pump/Fuel,UPI01706,1800.00,,{bal - 1800:.2f}")
    bal -= 1800.0

    # Month 3: August 2026
    sbi_lines.append(f"01/08/2026,NEFT CR-TCS LTD-SALARY AUGUST 2026,NEFT00346,,58000.00,{bal + 58000:.2f}")
    bal += 58000.0
    sbi_lines.append(f"03/08/2026,UPI/RENT/Shri Ganesh Properties/HDFC,UPI02150,18000.00,,{bal - 18000:.2f}")
    bal -= 18000.0
    sbi_lines.append(f"05/08/2026,ACH/SIP/ZERODHA BROKING/NIPPON MF,ACH90342,5000.00,,{bal - 5000:.2f}")
    bal -= 5000.0
    sbi_lines.append(f"08/08/2026,UPI/DMart Supermarket/Groceries,UPI02261,4600.00,,{bal - 4600:.2f}")
    bal -= 4600.0
    sbi_lines.append(f"12/08/2026,UPI/BESCOM Electricity Bill Pay,UPI02372,1720.00,,{bal - 1720:.2f}")
    bal -= 1720.0
    sbi_lines.append(f"16/08/2026,UPI/BookMyShow Cinema/PVR,UPI02483,920.00,,{bal - 920:.2f}")
    bal -= 920.0
    sbi_lines.append(f"21/08/2026,UPI/Myntra Shopping/Retail,UPI02594,2150.00,,{bal - 2150:.2f}")
    bal -= 2150.0
    sbi_lines.append(f"26/08/2026,UPI/Bharat Petroleum IOCL,UPI02605,1600.00,,{bal - 1600:.2f}")
    bal -= 1600.0
    sbi_lines.append(f"30/08/2026,UPI/Zepto Grocery Delivery,UPI02716,840.00,,{bal - 840:.2f}")
    bal -= 840.0

    # Recent window: Early September 2026
    sbi_lines.append(f"01/09/2026,NEFT CR-TCS LTD-SALARY SEPT 2026,NEFT01457,,58000.00,{bal + 58000:.2f}")
    bal += 58000.0
    sbi_lines.append(f"03/09/2026,UPI/RENT/Shri Ganesh Properties/HDFC,UPI03160,18000.00,,{bal - 18000:.2f}")
    bal -= 18000.0
    sbi_lines.append(f"05/09/2026,ACH/SIP/ZERODHA BROKING/NIPPON MF,ACH91453,5000.00,,{bal - 5000:.2f}")
    bal -= 5000.0
    sbi_lines.append(f"08/09/2026,UPI/Reliance Fresh Groceries,UPI03271,3200.00,,{bal - 3200:.2f}")
    bal -= 3200.0

    sbi_path = os.path.join(output_dir, "sbi_salaried_statement.csv")
    with open(sbi_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sbi_lines) + "\n")
    print(f"Generated {sbi_path} ({len(sbi_lines)-1} transactions)")


    # 2. HDFC Kirana & Micro-Merchant (Surat Kirana Store - High UPI Volume)
    # Daily QR payments from retail customers, weekly wholesale FMCG supplier debits
    hdfc_lines = ["Date,Narration,ChqRef,Withdrawal,Deposit,Balance"]
    bal = 32000.0
    
    # June to September 2026
    for day in range(1, 10):
        # June
        hdfc_lines.append(f"{day:02d}/06/2026,UPI/CR/Paytm QR Settlement/Surat Kirana,UPI770{day:02d},,{3800 + (day*150):.2f},{bal + 3800 + (day*150):.2f}")
        bal += 3800 + (day*150)
    
    hdfc_lines.append(f"10/06/2026,IMPS/WHOLESALE GRAIN DISTRIBUTORS/SUPPLIER,IMPS001,24500.00,,{bal - 24500:.2f}")
    bal -= 24500.0
    hdfc_lines.append(f"12/06/2026,NACH/BAJAJ FINANCE/BUSINESS LOAN EMI,NACH001,8500.00,,{bal - 8500:.2f}")
    bal -= 8500.0
    hdfc_lines.append(f"15/06/2026,UPI/Torrent Power Commercial Electricity,UPI008,3200.00,,{bal - 3200:.2f}")
    bal -= 3200.0

    for day in range(16, 25):
        hdfc_lines.append(f"{day:02d}/06/2026,UPI/CR/PhonePe Merchant Collection/Customer,UPI771{day:02d},,{4200 + (day*80):.2f},{bal + 4200 + (day*80):.2f}")
        bal += 4200 + (day*80)

    hdfc_lines.append(f"26/06/2026,NEFT/HINDUSTAN UNILEVER WHOLESALE/STOCK,NEFT002,31000.00,,{bal - 31000:.2f}")
    bal -= 31000.0

    # July
    for day in range(1, 10):
        hdfc_lines.append(f"{day:02d}/07/2026,UPI/CR/BharatPe Daily Settlement/Surat Kirana,UPI880{day:02d},,{4100 + (day*120):.2f},{bal + 4100 + (day*120):.2f}")
        bal += 4100 + (day*120)

    hdfc_lines.append(f"10/07/2026,IMPS/WHOLESALE GRAIN DISTRIBUTORS/SUPPLIER,IMPS002,26000.00,,{bal - 26000:.2f}")
    bal -= 26000.0
    hdfc_lines.append(f"12/07/2026,NACH/BAJAJ FINANCE/BUSINESS LOAN EMI,NACH002,8500.00,,{bal - 8500:.2f}")
    bal -= 8500.0

    for day in range(15, 24):
        hdfc_lines.append(f"{day:02d}/07/2026,UPI/CR/Paytm QR Collection/Customer,UPI881{day:02d},,{3900 + (day*90):.2f},{bal + 3900 + (day*90):.2f}")
        bal += 3900 + (day*90)

    hdfc_lines.append(f"25/07/2026,NEFT/ITC LIMITED WHOLESALE/PROVISION,NEFT003,28500.00,,{bal - 28500:.2f}")
    bal -= 28500.0

    # August
    for day in range(1, 10):
        hdfc_lines.append(f"{day:02d}/08/2026,UPI/CR/PhonePe QR Settlement/Surat Kirana,UPI990{day:02d},,{4300 + (day*110):.2f},{bal + 4300 + (day*110):.2f}")
        bal += 4300 + (day*110)

    hdfc_lines.append(f"10/08/2026,IMPS/GUJARAT DAIRY COOPERATIVE/MILK,IMPS003,19500.00,,{bal - 19500:.2f}")
    bal -= 19500.0
    hdfc_lines.append(f"12/08/2026,NACH/BAJAJ FINANCE/BUSINESS LOAN EMI,NACH003,8500.00,,{bal - 8500:.2f}")
    bal -= 8500.0

    for day in range(15, 25):
        hdfc_lines.append(f"{day:02d}/08/2026,UPI/CR/Paytm Merchant QR/Customer,UPI991{day:02d},,{4400 + (day*70):.2f},{bal + 4400 + (day*70):.2f}")
        bal += 4400 + (day*70)

    # September
    for day in range(1, 8):
        hdfc_lines.append(f"{day:02d}/09/2026,UPI/CR/BharatPe QR Settlement,UPI100{day:02d},,{4600 + (day*80):.2f},{bal + 4600 + (day*80):.2f}")
        bal += 4600 + (day*80)

    hdfc_path = os.path.join(output_dir, "hdfc_kirana_merchant_statement.csv")
    with open(hdfc_path, "w", encoding="utf-8") as f:
        f.write("\n".join(hdfc_lines) + "\n")
    print(f"Generated {hdfc_path} ({len(hdfc_lines)-1} transactions)")


    # 3. ICICI Cash-Stressed Profile (Medical Shock / High Debt Burden)
    # Sudden high hospital debits, multiple loan EMIs, dwindling balance, triggering empathetic intervention
    icici_lines = ["Date,Narration,ChqRef,Withdrawal,Deposit,Balance"]
    bal = 65000.0
    
    # June: Normal baseline
    icici_lines.append(f"02/06/2026,NEFT CR-INFOSYS BPO-SALARY JUNE,NEFT7101,,42000.00,{bal + 42000:.2f}")
    bal += 42000.0
    icici_lines.append(f"05/06/2026,NACH/HDFC BANK/PERSONAL LOAN EMI,ACH7102,14500.00,,{bal - 14500:.2f}")
    bal -= 14500.0
    icici_lines.append(f"07/06/2026,NACH/CHOLAMANDALAM/TWO WHEELER EMI,ACH7103,4200.00,,{bal - 4200:.2f}")
    bal -= 4200.0
    icici_lines.append(f"10/06/2026,UPI/RENT PAYMENT/LANDLORD,UPI7104,12000.00,,{bal - 12000:.2f}")
    bal -= 12000.0
    icici_lines.append(f"14/06/2026,UPI/DMart Provision/Groceries,UPI7105,4500.00,,{bal - 4500:.2f}")
    bal -= 4500.0
    icici_lines.append(f"18/06/2026,UPI/Electricity Bill Torrent,UPI7106,1900.00,,{bal - 1900:.2f}")
    bal -= 1900.0

    # July: Sudden Medical Emergency
    icici_lines.append(f"02/07/2026,NEFT CR-INFOSYS BPO-SALARY JULY,NEFT7201,,42000.00,{bal + 42000:.2f}")
    bal += 42000.0
    icici_lines.append(f"05/07/2026,NACH/HDFC BANK/PERSONAL LOAN EMI,ACH7202,14500.00,,{bal - 14500:.2f}")
    bal -= 14500.0
    icici_lines.append(f"07/07/2026,NACH/CHOLAMANDALAM/TWO WHEELER EMI,ACH7203,4200.00,,{bal - 4200:.2f}")
    bal -= 4200.0
    icici_lines.append(f"10/07/2026,UPI/RENT PAYMENT/LANDLORD,UPI7204,12000.00,,{bal - 12000:.2f}")
    bal -= 12000.0
    # Shock Hospital payment
    icici_lines.append(f"15/07/2026,POS/APOLLO MULTISPECIALTY HOSPITAL/ICU DEPOSIT,POS7205,38500.00,,{bal - 38500:.2f}")
    bal -= 38500.0
    icici_lines.append(f"18/07/2026,UPI/MEDPLUS PHARMACY/EMERGENCY MEDICINES,UPI7206,8400.00,,{bal - 8400:.2f}")
    bal -= 8400.0
    icici_lines.append(f"22/07/2026,UPI/DIAGNOSTIC LAB CLINIC/BLOOD TEST,UPI7207,3600.00,,{bal - 3600:.2f}")
    bal -= 3600.0

    # August: Cash Crunch
    icici_lines.append(f"02/08/2026,NEFT CR-INFOSYS BPO-SALARY AUGUST,NEFT7301,,42000.00,{bal + 42000:.2f}")
    bal += 42000.0
    icici_lines.append(f"05/08/2026,NACH/HDFC BANK/PERSONAL LOAN EMI,ACH7302,14500.00,,{bal - 14500:.2f}")
    bal -= 14500.0
    icici_lines.append(f"07/08/2026,NACH/CHOLAMANDALAM/TWO WHEELER EMI,ACH7303,4200.00,,{bal - 4200:.2f}")
    bal -= 4200.0
    icici_lines.append(f"10/08/2026,UPI/RENT PAYMENT/LANDLORD,UPI7304,12000.00,,{bal - 12000:.2f}")
    bal -= 12000.0
    icici_lines.append(f"14/08/2026,POS/APOLLO HOSPITAL FOLLOWUP/CONSULT,POS7305,6500.00,,{bal - 6500:.2f}")
    bal -= 6500.0
    icici_lines.append(f"18/08/2026,UPI/PHARMACY REFILL MEDICINES,UPI7306,4200.00,,{bal - 4200:.2f}")
    bal -= 4200.0
    icici_lines.append(f"25/08/2026,ACH DEBIT RETURN/PENALTY CHARGE,CHG7307,590.00,,{bal - 590:.2f}")
    bal -= 590.0

    # September: Low balance, high stress
    icici_lines.append(f"02/09/2026,NEFT CR-INFOSYS BPO-SALARY SEPT,NEFT7401,,42000.00,{bal + 42000:.2f}")
    bal += 42000.0
    icici_lines.append(f"05/09/2026,NACH/HDFC BANK/PERSONAL LOAN EMI,ACH7402,14500.00,,{bal - 14500:.2f}")
    bal -= 14500.0
    icici_lines.append(f"07/09/2026,NACH/CHOLAMANDALAM/TWO WHEELER EMI,ACH7403,4200.00,,{bal - 4200:.2f}")
    bal -= 4200.0
    icici_lines.append(f"10/09/2026,UPI/RENT PAYMENT/LANDLORD,UPI7404,12000.00,,{bal - 12000:.2f}")
    bal -= 12000.0

    icici_path = os.path.join(output_dir, "icici_stressed_medical_statement.csv")
    with open(icici_path, "w", encoding="utf-8") as f:
        f.write("\n".join(icici_lines) + "\n")
    print(f"Generated {icici_path} ({len(icici_lines)-1} transactions)")

if __name__ == "__main__":
    create_sample_statements()
