"""
Generate realistic dummy Indian Bank Statement PDFs (SBI, HDFC, Axis)
using reportlab. Formatted with bank headers, customer details, account summary,
and tabular transaction statements easily extracted by pdfplumber and regex parsers.
"""

import os
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_statements")
os.makedirs(DATA_DIR, exist_ok=True)


def generate_sbi_statement():
    pdf_path = os.path.join(DATA_DIR, "sbi_rajesh_sharma_statement.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "BankTitle",
        parent=styles["Heading1"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#002B49"),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "BankSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#555555"),
    )
    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#333333"),
    )
    table_hdr_style = ParagraphStyle(
        "TableHdr",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.white,
        fontName="Helvetica-Bold",
    )
    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#222222"),
    )

    # Bank Header
    story.append(Paragraph("<b>STATE BANK OF INDIA</b>", title_style))
    story.append(Paragraph("SURAT MAIN BRANCH, CLOTH MARKET, SURAT - 395003 | IFSC: SBIN0001234", subtitle_style))
    story.append(Paragraph("STATEMENT OF ACCOUNT FOR SAVINGS BANK ACCOUNT (REBIT 1.1 / RBI AA STANDARD)", subtitle_style))
    story.append(Spacer(1, 12))

    # Customer & Account Info Box
    cust_info = [
        [
            Paragraph("<b>Account Name:</b> RAJESH KUMAR SHARMA", meta_label_style),
            Paragraph("<b>Account Number:</b> 3094882194109", meta_label_style),
        ],
        [
            Paragraph("<b>Registered Mobile:</b> +91 98765 43210", meta_label_style),
            Paragraph("<b>Account Type:</b> REGULAR SAVINGS A/C", meta_label_style),
        ],
        [
            Paragraph("<b>Address:</b> Shop #14, Main Cloth Market, Surat, GJ 395003", meta_label_style),
            Paragraph("<b>Customer CIF:</b> 88192039120", meta_label_style),
        ],
        [
            Paragraph("<b>Period:</b> 01/07/2026 to 10/09/2026", meta_label_style),
            Paragraph("<b>Currency / Status:</b> INR / ACTIVE", meta_label_style),
        ],
    ]
    info_table = Table(cust_info, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0F4F8")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#002B49")),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor("#D0D8E0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    # Transactions Header
    story.append(Paragraph("<b>TRANSACTION RECORD DETAIL</b>", ParagraphStyle("SubHdr", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#002B49"))))
    story.append(Spacer(1, 6))

    headers = ["Date", "Narration / Particulars", "Chq/Ref No", "Debit (INR)", "Credit (INR)", "Balance (INR)"]
    table_rows = [[Paragraph(f"<b>{h}</b>", table_hdr_style) for h in headers]]

    txns_data = [
        ("02/07/2026", "SALARY CREDITED / MONTHLY STORE INFLOW", "NEFT-9912", "", "58,000.00", "78,500.00"),
        ("05/07/2026", "ACH DEBIT / SBI HOME LOAN EMI", "ACH-8812", "12,450.00", "", "66,050.00"),
        ("08/07/2026", "UPI/P2M/SURAT TEXTILE DISTRIBUTORS/INVENTORY", "UPI-1092", "22,500.00", "", "43,550.00"),
        ("12/07/2026", "UPI/P2M/SHREE MEDICAL STORE/EMERGENCY MEDICINES", "UPI-8841", "4,200.00", "", "39,350.00"),
        ("15/07/2026", "NEFT-DR / SURAT CIVIL HOSPITAL HEALTH SURGERY BILL", "NEFT-7712", "45,000.00", "", "15,350.00"),
        ("18/07/2026", "UPI/P2P/FAMILY SUPPORT EMERGENCY INFLOW", "UPI-4401", "", "20,000.00", "35,350.00"),
        ("22/07/2026", "UPI/TORRENT POWER SURAT BILL PAYMENT", "UPI-2291", "2,450.00", "", "32,900.00"),
        ("28/07/2026", "ATM CASH WITHDRAWAL SURAT MAIN BRANCH", "ATM-0918", "5,000.00", "", "27,900.00"),
        ("02/08/2026", "UPI/P2M/STORE RETAIL SALES COLLECTIONS", "UPI-9910", "", "52,000.00", "79,900.00"),
        ("05/08/2026", "ACH DEBIT / SBI HOME LOAN EMI", "ACH-8813", "12,450.00", "", "67,450.00"),
        ("09/08/2026", "UPI/P2M/DMART RETAIL GROCERIES SURAT", "UPI-3310", "4,150.00", "", "63,300.00"),
        ("14/08/2026", "UPI/P2M/GUJARAT GAS DOMESTIC PNG BILL", "UPI-5512", "1,250.00", "", "62,050.00"),
        ("18/08/2026", "ACH DEBIT / BAJAJ FINSERVE LOAN RETURN ECS FEE", "ACH-RET9", "450.00", "", "61,600.00"),
        ("21/08/2026", "UPI/AIRTEL BROADBAND & MOBILE RECHARGE", "UPI-8821", "1,199.00", "", "60,401.00"),
        ("27/08/2026", "UPI/P2M/TEXTILE MARKET WHOLESALE RAW MATERIAL", "UPI-7719", "28,000.00", "", "32,401.00"),
        ("01/09/2026", "MONTHLY STORE INFLOW / CASH SALES DEPOSIT", "CSH-3301", "", "48,000.00", "80,401.00"),
        ("05/09/2026", "ACH DEBIT / SBI HOME LOAN EMI", "ACH-8814", "12,450.00", "", "67,951.00"),
        ("07/09/2026", "UPI/P2M/APOLLO PHARMACY SURAT", "UPI-6612", "1,850.00", "", "66,101.00"),
        ("09/09/2026", "UPI/IOCL PETROL PUMP RING ROAD SURAT", "UPI-4419", "1,500.00", "", "64,601.00"),
    ]

    for d, narr, ref, dr, cr, bal in txns_data:
        table_rows.append([
            Paragraph(d, table_cell_style),
            Paragraph(narr, table_cell_style),
            Paragraph(ref, table_cell_style),
            Paragraph(dr, table_cell_style),
            Paragraph(cr, table_cell_style),
            Paragraph(bal, table_cell_style),
        ])

    txn_table = Table(table_rows, colWidths=[62, 210, 68, 65, 65, 70])
    txn_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#002B49")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D8D8D8")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FBFD")]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(txn_table)

    # Footer Disclaimer
    story.append(Spacer(1, 14))
    story.append(Paragraph("<i>This is a computer-generated bank statement compliant with Reserve Bank of India (RBI) Account Aggregator Technical Framework. Verified under DPDP 2023.</i>", subtitle_style))

    doc.build(story)
    print(f"[NIVA PDF Generator] Created: {pdf_path}")
    return pdf_path


def generate_hdfc_statement():
    pdf_path = os.path.join(DATA_DIR, "hdfc_anita_desai_statement.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "HDFCTitle",
        parent=styles["Heading1"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#004B87"),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "HDFCSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#444444"),
    )
    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#333333"),
    )
    table_hdr_style = ParagraphStyle(
        "TableHdr",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.white,
        fontName="Helvetica-Bold",
    )
    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#222222"),
    )

    story.append(Paragraph("<b>HDFC BANK LIMITED</b>", title_style))
    story.append(Paragraph("KORAMANGALA BRANCH, BENGALURU - 560034 | IFSC: HDFC0000088", subtitle_style))
    story.append(Paragraph("ACCOUNT STATEMENT (RBI REBIT 1.1 COMPLIANT FORMAT)", subtitle_style))
    story.append(Spacer(1, 12))

    cust_info = [
        [
            Paragraph("<b>Account Holder:</b> ANITA SURESH DESAI", meta_label_style),
            Paragraph("<b>Account Number:</b> 5010048832019", meta_label_style),
        ],
        [
            Paragraph("<b>Mobile:</b> +91 98234 56789", meta_label_style),
            Paragraph("<b>A/C Scheme:</b> SALARY PRIVILEGE ACCOUNT", meta_label_style),
        ],
        [
            Paragraph("<b>Address:</b> Flat 402, Green Glen, Bellandur, Bengaluru 560103", meta_label_style),
            Paragraph("<b>Customer ID:</b> 91048821", meta_label_style),
        ],
        [
            Paragraph("<b>Statement Period:</b> 01/07/2026 to 10/09/2026", meta_label_style),
            Paragraph("<b>Clear Balance:</b> INR 1,84,320.00 CR", meta_label_style),
        ],
    ]
    info_table = Table(cust_info, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EBF3FA")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#004B87")),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor("#CFE1F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("<b>TRANSACTION SUMMARY DETAILS</b>", ParagraphStyle("SubHdr", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#004B87"))))
    story.append(Spacer(1, 6))

    headers = ["Date", "Narration", "Reference No", "Withdrawal (DR)", "Deposit (CR)", "Closing Balance"]
    table_rows = [[Paragraph(f"<b>{h}</b>", table_hdr_style) for h in headers]]

    txns_data = [
        ("01/07/2026", "NEFT CR / INFOSYS TECH MONTHLY PAYROLL SALARY", "NEFT-INF-01", "", "85,000.00", "1,65,400.00"),
        ("04/07/2026", "UPI/NOBROKER APARTMENT RENT BELLANDUR", "UPI-NBR-81", "24,000.00", "", "1,41,400.00"),
        ("07/07/2026", "ACH DEBIT / ZERODHA BROKING MUTUAL FUND SIP", "ACH-ZER-11", "15,000.00", "", "1,26,400.00"),
        ("11/07/2026", "UPI/P2M/BLINKIT INSTANT GROCERIES BENGALURU", "UPI-BLN-92", "1,850.00", "", "1,24,550.00"),
        ("14/07/2026", "UPI/BESCOM ELECTRICITY BILL BANGALORE", "UPI-BSC-33", "1,420.00", "", "1,23,130.00"),
        ("20/07/2026", "UPI/P2M/SWIGGY FOOD DELIVERY BENGALURU", "UPI-SWG-09", "680.00", "", "1,22,450.00"),
        ("28/07/2026", "POS DEBIT / ZARA FORUM MALL BANGALORE", "POS-ZAR-77", "4,500.00", "", "1,17,950.00"),
        ("01/08/2026", "NEFT CR / INFOSYS TECH MONTHLY PAYROLL SALARY", "NEFT-INF-02", "", "85,000.00", "2,02,950.00"),
        ("04/08/2026", "UPI/NOBROKER APARTMENT RENT BELLANDUR", "UPI-NBR-82", "24,000.00", "", "1,78,950.00"),
        ("07/08/2026", "ACH DEBIT / ZERODHA BROKING MUTUAL FUND SIP", "ACH-ZER-12", "15,000.00", "", "1,63,950.00"),
        ("12/08/2026", "UPI/P2M/BIGBASKET PROVISIONS BELLANDUR", "UPI-BGB-44", "3,200.00", "", "1,60,750.00"),
        ("19/08/2026", "ACH DEBIT / HDFC ERGO HEALTH SURAKSHA PREMIUM", "ACH-ERG-90", "6,500.00", "", "1,54,250.00"),
        ("25/08/2026", "UPI/P2M/AMAZON INDIA SHOPPING", "UPI-AMZ-12", "2,890.00", "", "1,51,360.00"),
        ("01/09/2026", "NEFT CR / INFOSYS TECH MONTHLY PAYROLL SALARY", "NEFT-INF-03", "", "85,000.00", "2,36,360.00"),
        ("04/09/2026", "UPI/NOBROKER APARTMENT RENT BELLANDUR", "UPI-NBR-83", "24,000.00", "", "2,12,360.00"),
        ("07/09/2026", "ACH DEBIT / ZERODHA BROKING MUTUAL FUND SIP", "ACH-ZER-13", "15,000.00", "", "1,97,360.00"),
        ("09/09/2026", "UPI/P2M/CULT FIT FITNESS RENEWAL", "UPI-CLT-55", "3,500.00", "", "1,93,860.00"),
    ]

    for d, narr, ref, dr, cr, bal in txns_data:
        table_rows.append([
            Paragraph(d, table_cell_style),
            Paragraph(narr, table_cell_style),
            Paragraph(ref, table_cell_style),
            Paragraph(dr, table_cell_style),
            Paragraph(cr, table_cell_style),
            Paragraph(bal, table_cell_style),
        ])

    txn_table = Table(table_rows, colWidths=[62, 210, 68, 65, 65, 70])
    txn_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#004B87")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D8D8D8")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F9FD")]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(txn_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("<i>End of Statement. HDFC Bank customer service helpline: 1800 202 6161. Generated under RBI AA Consent Guidelines.</i>", subtitle_style))

    doc.build(story)
    print(f"[NIVA PDF Generator] Created: {pdf_path}")
    return pdf_path


def generate_axis_statement():
    pdf_path = os.path.join(DATA_DIR, "axis_kailash_verma_statement.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "AxisTitle",
        parent=styles["Heading1"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#97144D"),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "AxisSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#444444"),
    )
    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#333333"),
    )
    table_hdr_style = ParagraphStyle(
        "TableHdr",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.white,
        fontName="Helvetica-Bold",
    )
    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#222222"),
    )

    story.append(Paragraph("<b>AXIS BANK LIMITED</b>", title_style))
    story.append(Paragraph("NEW DELHI MAIN BRANCH, CONNAUGHT PLACE - 110001 | IFSC: UTIB0000005", subtitle_style))
    story.append(Paragraph("CUSTOMER ACCOUNT STATEMENT", subtitle_style))
    story.append(Spacer(1, 12))

    cust_info = [
        [
            Paragraph("<b>Account Holder:</b> KAILASH VERMA", meta_label_style),
            Paragraph("<b>Account Number:</b> 918010049918231", meta_label_style),
        ],
        [
            Paragraph("<b>Mobile:</b> +91 98111 22334", meta_label_style),
            Paragraph("<b>Account Category:</b> EASY ACCESS SAVINGS", meta_label_style),
        ],
        [
            Paragraph("<b>Address:</b> B-42, Sector 18, Noida, Uttar Pradesh - 201301", meta_label_style),
            Paragraph("<b>PAN:</b> BKPVR9918K", meta_label_style),
        ],
        [
            Paragraph("<b>Period:</b> 01/08/2026 to 10/09/2026", meta_label_style),
            Paragraph("<b>Closing Balance:</b> INR 42,650.00 CR", meta_label_style),
        ],
    ]
    info_table = Table(cust_info, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FDF2F4")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#97144D")),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor("#F4D0D9")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("<b>ACCOUNT ACTIVITY TRANSACTIONS</b>", ParagraphStyle("SubHdr", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#97144D"))))
    story.append(Spacer(1, 6))

    headers = ["Date", "Description / Narration", "Ref / Chq", "Debit (INR)", "Credit (INR)", "Balance (INR)"]
    table_rows = [[Paragraph(f"<b>{h}</b>", table_hdr_style) for h in headers]]

    txns_data = [
        ("01/08/2026", "MONTHLY BUSINESS INFLOW / CLIENT SETTLEMENT", "NEFT-AX-01", "", "45,000.00", "56,200.00"),
        ("04/08/2026", "ACH DEBIT / AXIS TWO WHEELER LOAN EMI", "ACH-AXIS-91", "4,850.00", "", "51,350.00"),
        ("08/08/2026", "UPI/P2M/ZEPTO GROCERIES NOIDA", "UPI-ZPT-19", "1,240.00", "", "50,110.00"),
        ("12/08/2026", "UPI/ELECTRICITY BILL UPPCL NOIDA", "UPI-UPP-01", "2,100.00", "", "48,010.00"),
        ("16/08/2026", "UPI/P2M/PETROL PUMP SECTOR 18 NOIDA", "UPI-IOC-22", "1,000.00", "", "47,010.00"),
        ("22/08/2026", "UPI/P2P/STORE CUSTOMER PAYMENT", "UPI-P2P-88", "", "6,500.00", "53,510.00"),
        ("28/08/2026", "ATM CASH WITHDRAWAL SECTOR 18 NOIDA", "ATM-AX-09", "4,000.00", "", "49,510.00"),
        ("01/09/2026", "MONTHLY BUSINESS INFLOW / CLIENT SETTLEMENT", "NEFT-AX-02", "", "45,000.00", "94,510.00"),
        ("04/09/2026", "ACH DEBIT / AXIS TWO WHEELER LOAN EMI", "ACH-AXIS-92", "4,850.00", "", "89,660.00"),
        ("06/09/2026", "UPI/P2M/DISTRIBUTOR SUPPLIES WHOLESALE", "UPI-SPL-44", "38,000.00", "", "51,660.00"),
        ("09/09/2026", "UPI/P2M/APOLLO CLINIC HEALTH CHECKUP", "UPI-APL-88", "1,200.00", "", "50,460.00"),
    ]

    for d, narr, ref, dr, cr, bal in txns_data:
        table_rows.append([
            Paragraph(d, table_cell_style),
            Paragraph(narr, table_cell_style),
            Paragraph(ref, table_cell_style),
            Paragraph(dr, table_cell_style),
            Paragraph(cr, table_cell_style),
            Paragraph(bal, table_cell_style),
        ])

    txn_table = Table(table_rows, colWidths=[62, 210, 68, 65, 65, 70])
    txn_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#97144D")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D8D8D8")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#FEF8F9")]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(txn_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("<i>Computer-generated statement from Axis Bank Ltd. Valid for financial assessment without physical signature.</i>", subtitle_style))

    doc.build(story)
    print(f"[NIVA PDF Generator] Created: {pdf_path}")
    return pdf_path


if __name__ == "__main__":
    generate_sbi_statement()
    generate_hdfc_statement()
    generate_axis_statement()
