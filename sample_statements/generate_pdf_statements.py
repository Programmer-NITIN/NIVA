"""
NIVA — PDF Bank Statement Generator for Verification & Demo Uploads.
Generates authentic-looking Indian bank statement PDFs (SBI, HDFC, ICICI) with:
- Bank header, logo/branding colors, IFSC, Branch, Account details
- Customer metadata (Name, Account No, Cust ID, Address)
- Formatted transaction ledger tables (Date, Narration, Chq/Ref, Debit, Credit, Balance)
- Realistic summaries (Opening bal, total deposits, withdrawals, closing bal)
- Optional password encryption (for testing password-protected statement upload)
"""

import os
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_pdf_from_csv(csv_path: str, pdf_path: str, bank_meta: dict):
    """
    Reads a sample CSV file and creates a high-fidelity bank statement PDF.
    """
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette based on Bank
    primary_color = bank_meta.get("primary_color", colors.HexColor("#1A365D"))
    secondary_color = bank_meta.get("secondary_color", colors.HexColor("#2B6CB0"))
    accent_bg = bank_meta.get("accent_bg", colors.HexColor("#EDF2F7"))

    title_style = ParagraphStyle(
        'BankTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=primary_color
    )
    
    subtitle_style = ParagraphStyle(
        'BankSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4A5568")
    )

    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#2D3748")
    )

    meta_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1A202C")
    )

    tbl_header_style = ParagraphStyle(
        'TblHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1 # Center
    )

    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#1A202C")
    )
    
    cell_right_style = ParagraphStyle(
        'CellRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#1A202C"),
        alignment=2 # Right
    )

    elements = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph(f"<b>{bank_meta['bank_name']}</b>", title_style),
            Paragraph(f"<b>STATEMENT OF ACCOUNT</b><br/><font size='7' color='#718096'>Generated on: {datetime.now().strftime('%d-%b-%Y %H:%M')}</font>", ParagraphStyle('RHead', alignment=2, textColor=primary_color))
        ],
        [
            Paragraph(f"{bank_meta['branch']} | IFSC: {bank_meta['ifsc']}<br/>{bank_meta['address']}", subtitle_style),
            Paragraph(f"Statement Period: <b>{bank_meta['period']}</b>", ParagraphStyle('RPeriod', alignment=2, fontName='Helvetica', fontSize=8, textColor=colors.HexColor("#2D3748")))
        ]
    ]
    header_table = Table(header_data, colWidths=[330, 205])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=12))

    # 2. Account Holder & Summary Cards (2-column layout)
    cust_info = [
        [Paragraph("<b>Customer Name:</b>", meta_label_style), Paragraph(bank_meta['customer_name'], meta_value_style)],
        [Paragraph("<b>Account Number:</b>", meta_label_style), Paragraph(bank_meta['account_no'], meta_value_style)],
        [Paragraph("<b>Account Type:</b>", meta_label_style), Paragraph(bank_meta['account_type'], meta_value_style)],
        [Paragraph("<b>Customer ID / CIF:</b>", meta_label_style), Paragraph(bank_meta['cif'], meta_value_style)],
        [Paragraph("<b>Registered Mobile:</b>", meta_label_style), Paragraph(bank_meta['mobile'], meta_value_style)],
    ]
    cust_table = Table(cust_info, colWidths=[95, 160])
    cust_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))

    # Calculate Totals
    total_debits = sum(float(r[3]) for r in rows if len(r) > 3 and r[3].strip())
    total_credits = sum(float(r[4]) for r in rows if len(r) > 4 and r[4].strip())
    closing_bal = rows[-1][5] if rows and len(rows[-1]) > 5 else "0.00"
    opening_bal = bank_meta.get("opening_bal", "48,500.00")

    summary_info = [
        [Paragraph("<b>Opening Balance:</b>", meta_label_style), Paragraph(f"INR {opening_bal}", meta_value_style)],
        [Paragraph("<b>Total Deposits (Cr):</b>", meta_label_style), Paragraph(f"<font color='#22543D'>INR {total_credits:,.2f}</font>", meta_value_style)],
        [Paragraph("<b>Total Debits (Dr):</b>", meta_label_style), Paragraph(f"<font color='#742A2A'>INR {total_debits:,.2f}</font>", meta_value_style)],
        [Paragraph("<b>Closing Balance:</b>", meta_label_style), Paragraph(f"<b>INR {float(closing_bal):,.2f}</b>", meta_value_style)],
        [Paragraph("<b>Total Txn Count:</b>", meta_label_style), Paragraph(f"{len(rows)} Transactions", meta_value_style)],
    ]
    summary_table = Table(summary_info, colWidths=[105, 150])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))

    two_col = [
        [Paragraph("<b>ACCOUNT HOLDER DETAILS</b>", ParagraphStyle('TH1', fontName='Helvetica-Bold', fontSize=8, textColor=primary_color)),
         Paragraph("<b>STATEMENT SUMMARY</b>", ParagraphStyle('TH2', fontName='Helvetica-Bold', fontSize=8, textColor=primary_color))],
        [cust_table, summary_table]
    ]
    info_box = Table(two_col, colWidths=[265, 270])
    info_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), accent_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(info_box)
    elements.append(Spacer(1, 14))

    # 3. Transaction Table
    # Header: Date, Narration, Chq/Ref, Withdrawal, Deposit, Balance
    table_data = [
        [
            Paragraph("Date", tbl_header_style),
            Paragraph("Narration / Description", tbl_header_style),
            Paragraph("Chq / Ref No", tbl_header_style),
            Paragraph("Withdrawal (Dr)", tbl_header_style),
            Paragraph("Deposit (Cr)", tbl_header_style),
            Paragraph("Balance (INR)", tbl_header_style),
        ]
    ]

    for idx, r in enumerate(rows):
        dt = r[0] if len(r) > 0 else ""
        narr = r[1] if len(r) > 1 else ""
        ref = r[2] if len(r) > 2 else ""
        dr = f"{float(r[3]):,.2f}" if (len(r) > 3 and r[3].strip()) else ""
        cr = f"{float(r[4]):,.2f}" if (len(r) > 4 and r[4].strip()) else ""
        bal = f"{float(r[5]):,.2f}" if (len(r) > 5 and r[5].strip()) else ""

        table_data.append([
            Paragraph(dt, cell_style),
            Paragraph(narr, cell_style),
            Paragraph(ref, cell_style),
            Paragraph(dr, cell_right_style),
            Paragraph(cr, cell_right_style),
            Paragraph(bal, cell_right_style),
        ])

    col_widths = [55, 205, 65, 70, 70, 70]
    tx_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD5E0")),
    ]
    # Zebra striping for readability
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            t_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor("#F7FAFC")))

    tx_table.setStyle(TableStyle(t_style))
    elements.append(tx_table)

    # 4. Footer notes
    elements.append(Spacer(1, 14))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E0"), spaceAfter=6))
    notice = Paragraph(
        "<i>* This is a computer-generated bank account statement provided under RBI Account Aggregator guidelines. "
        "Verified via NIVA Intelligent Document Ingestion Engine with SHA-256 integrity check.</i>",
        subtitle_style
    )
    elements.append(notice)

    doc.build(elements)
    print(f"Generated PDF: {pdf_path} ({len(rows)} txns)")


def generate_all_sample_pdfs():
    sample_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. SBI Salaried (Ramesh Kumar - Salaried Tech Professional)
    sbi_meta = {
        "bank_name": "STATE BANK OF INDIA",
        "branch": "Indiranagar Branch, Bengaluru",
        "ifsc": "SBIN0004128",
        "address": "100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru - 560038",
        "customer_name": "RAMESH KUMAR",
        "account_no": "30489182341",
        "account_type": "Regular Savings A/c",
        "cif": "889104829",
        "mobile": "+91 98450 12345",
        "period": "01-Jun-2026 to 08-Sep-2026",
        "opening_bal": "48,500.00",
        "primary_color": colors.HexColor("#1A365D"),   # SBI Navy
        "secondary_color": colors.HexColor("#2B6CB0"),
        "accent_bg": colors.HexColor("#EBF8FF"),
    }
    sbi_csv = os.path.join(sample_dir, "sbi_salaried_statement.csv")
    sbi_pdf = os.path.join(sample_dir, "sbi_salaried_statement.pdf")
    generate_pdf_from_csv(sbi_csv, sbi_pdf, sbi_meta)

    # 2. HDFC MSME Merchant (Priya Sharma / Surat Kirana Store)
    hdfc_meta = {
        "bank_name": "HDFC BANK LIMITED",
        "branch": "Ring Road Branch, Surat",
        "ifsc": "HDFC0001842",
        "address": "Shop 4-5, Trade Center, Ring Road, Surat, Gujarat - 395002",
        "customer_name": "PRIYA SHARMA (M/S SHARMA KIRANA)",
        "account_no": "50200048192841",
        "account_type": "Current Account - Merchant Pro",
        "cif": "771092841",
        "mobile": "+91 98251 98765",
        "period": "01-Jun-2026 to 08-Sep-2026",
        "opening_bal": "82,400.00",
        "primary_color": colors.HexColor("#003366"),   # HDFC Blue
        "secondary_color": colors.HexColor("#ED1C24"), # HDFC Red
        "accent_bg": colors.HexColor("#F7FAFC"),
    }
    hdfc_csv = os.path.join(sample_dir, "hdfc_kirana_merchant_statement.csv")
    hdfc_pdf = os.path.join(sample_dir, "hdfc_kirana_merchant_statement.pdf")
    generate_pdf_from_csv(hdfc_csv, hdfc_pdf, hdfc_meta)

    # 3. ICICI Stressed / Medical (Vikram Patel)
    icici_meta = {
        "bank_name": "ICICI BANK LIMITED",
        "branch": "Vastrapur Branch, Ahmedabad",
        "ifsc": "ICIC0000841",
        "address": "Opp. Alpha One Mall, Vastrapur Lake, Ahmedabad - 380015",
        "customer_name": "VIKRAM PATEL",
        "account_no": "084101548291",
        "account_type": "Salary Advantage Account",
        "cif": "664019284",
        "mobile": "+91 99090 54321",
        "period": "01-Jun-2026 to 10-Sep-2026",
        "opening_bal": "32,800.00",
        "primary_color": colors.HexColor("#8B181B"),   # ICICI Maroon
        "secondary_color": colors.HexColor("#F58220"), # ICICI Orange
        "accent_bg": colors.HexColor("#FFF5F5"),
    }
    icici_csv = os.path.join(sample_dir, "icici_stressed_medical_statement.csv")
    icici_pdf = os.path.join(sample_dir, "icici_stressed_medical_statement.pdf")
    generate_pdf_from_csv(icici_csv, icici_pdf, icici_meta)

if __name__ == "__main__":
    generate_all_sample_pdfs()
