#!/usr/bin/env python3
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR, MSO_AUTO_SIZE
from pptx.enum.shapes import MSO_SHAPE

# Colors
DEEP = RGBColor(0x16,0x33,0x00)
LIME = RGBColor(0x8E,0xF2,0x44)
LIME_DARK = RGBColor(0x7F,0xE0,0x35)
OBSIDIAN = RGBColor(0x0E,0x13,0x11)
SUBTLE = RGBColor(0xF4,0xF4,0xF0)
BORDER = RGBColor(0xE2,0xE8,0xDF)
MUTED = RGBColor(0x74,0x79,0x6C)
POSITIVE = RGBColor(0x00,0xA8,0x59)
CRITICAL = RGBColor(0xE1,0x1D,0x48)
WARNING = RGBColor(0xF5,0x9E,0x0B)
WHITE = RGBColor(0xFF,0xFF,0xFF)

prs = Presentation()
prs.slide_width = Inches(13.33)
prs.slide_height = Inches(7.5)
prs.slide_width, prs.slide_height

def set_bg(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_shape(slide, left, top, width, height, fill_color=None, line_color=None, radius=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.line.fill.background()
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    if radius is not None:
        try:
            shape.adjustments[0] = 0.08
        except: pass
    return shape

def add_textbox(slide, left, top, width, height, text, font_size=12, bold=False, color=OBSIDIAN, alignment=PP_ALIGN.LEFT, font_name="Calibri"):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.alignment = alignment
    tf.auto_size = None
    return txBox

def add_para(text_frame, text, font_size=10, bold=False, color=OBSIDIAN, italic=False, alignment=PP_ALIGN.LEFT, space_after=Pt(4), font_name="Calibri"):
    p = text_frame.add_paragraph()
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.italic = italic
    p.font.name = font_name
    p.alignment = alignment
    p.space_after = space_after
    p.space_before = Pt(0)
    p.line_spacing = Pt(font_size*1.25)
    return p

def bullet(text_frame, text, font_size=9, color=MUTED, bold=False, indent=Inches(0.15)):
    p = text_frame.add_paragraph()
    p.text = "•  " + text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = "Calibri"
    p.space_after = Pt(3)
    p.level = 0
    return p

# Helper to create section label
def section_label(slide, left, top, text):
    s = add_shape(slide, left, top, Inches(1.6), Inches(0.28), fill_color=RGBColor(0xEE,0xF2,0xE8), line_color=BORDER)
    add_textbox(slide, left, top, Inches(1.6), Inches(0.28), text, font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.CENTER)

# SLIDE 1 - TITLE
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, DEEP)
# Lime accent line
add_shape(slide, Inches(0.6), Inches(0.55), Inches(1.2), Inches(0.05), fill_color=LIME, line_color=None)
add_textbox(slide, Inches(0.6), Inches(0.8), Inches(6), Inches(0.4), "RBI ACCOUNT AGGREGATOR  •  DPDP ACT 2023  •  REBIT 1.1", font_size=7, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.2), Inches(7), Inches(1.1), "NIVA", font_size=54, bold=True, color=WHITE, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(2.05), Inches(7.5), Inches(0.45), "Nurturing Intelligent Value Advisory", font_size=14, bold=False, color=RGBColor(0xC3,0xC8,0xB9), alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(2.65), Inches(7), Inches(0.7), "Responsible Financial Intelligence for Bharat", font_size=18, bold=True, color=WHITE, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(3.45), Inches(7), Inches(0.9), "Bridging the 38-day credit blind spot for 400M+ Indians — from insight to action at the moment of payment.", font_size=10, bold=False, color=RGBColor(0xC3,0xC8,0xB9), alignment=PP_ALIGN.LEFT)
# Right card - live stats mock
card = add_shape(slide, Inches(8.2), Inches(0.7), Inches(4.4), Inches(3.9), fill_color=WHITE, line_color=None)
card.shadow.inherit_shadow = False
# inner content
add_textbox(slide, Inches(8.55), Inches(1.0), Inches(3.7), Inches(0.25), "●  LIVE DEMO  •  API 8001  •  WEB 3001", font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(8.55), Inches(1.35), Inches(3.7), Inches(0.35), "Income Firewall Active", font_size=13, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(8.55), Inches(1.75), Inches(3.7), Inches(0.35), "3 Pots  •  Family Twin  •  Checkout Copilot", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# metrics grid mock
for i, (label, val, col) in enumerate([("Predatory Blocks", "Blocked TODAY", CRITICAL), ("Interest Saved", "₹ 1.2L+", POSITIVE), ("Blind Window", "38 days → 0", DEEP)]):
    y = Inches(2.25) + Inches(i*0.62)
    add_shape(slide, Inches(8.55), y, Inches(3.7), Inches(0.5), fill_color=SUBTLE, line_color=BORDER)
    add_textbox(slide, Inches(8.75), y+Inches(0.05), Inches(2), Inches(0.2), label, font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, Inches(10.4), y+Inches(0.05), Inches(1.7), Inches(0.4), val, font_size=9, bold=True, color=col, alignment=PP_ALIGN.RIGHT)
add_textbox(slide, Inches(8.55), Inches(4.15), Inches(3.7), Inches(0.25), "Wise-grade • Spring animations • Bottom nav • Tabular-nums", font_size=7, bold=False, color=MUTED, alignment=PP_ALIGN.CENTER)
# footer
add_textbox(slide, Inches(0.6), Inches(5.8), Inches(7), Inches(0.3), "Team NIVA  •  Hackathon Jury Pitch  •  September 2026  •  One tap from phone number to Financial Twin", font_size=7, bold=False, color=RGBColor(0x9A,0xA8,0x8E), alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(8.2), Inches(5.8), Inches(4.4), Inches(0.3), "Scan QR to try:  upi://pay?pa=shop@okhdfc&am=48000", font_size=7, bold=True, color=LIME, alignment=PP_ALIGN.RIGHT)

# SLIDE 2 - PROBLEM
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "01  •  THE PROBLEM")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Why Bharat Needs NIVA — The 38-Day Blind Spot", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.4), "CIBIL says 760. Bank account says 14 days runway left. Who do you trust?", font_size=10, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# 3 problem cards
for i, (title, desc, metric, icon) in enumerate([
    ("Bureau Lag", "Traditional bureau updates every 38 days.\nMisses -38% drawdown velocity & +42%\nrevolving spike in last 21 days.", "3.4× delinquency hidden", "◷"),
    ("Predatory Credit", "Stressed Kirana & gig workers pushed\n36% payday loans when DTI >40%.\nNPA multiplies, households collapse.", "₹ 40,840 interest trap", "⚠"),
    ("No Household View", "Finance is family in Bharat:\nshop + spouse savings + school fees\n= one DTI, not three.", "400M joint families", "⌂"),
]):
    x = Inches(0.6) + i*Inches(4.15)
    c = add_shape(slide, x, Inches(2.05), Inches(3.85), Inches(3.9), fill_color=WHITE, line_color=BORDER)
    # icon
    add_shape(slide, x+Inches(0.25), Inches(2.3), Inches(0.55), Inches(0.55), fill_color=SUBTLE, line_color=BORDER)
    add_textbox(slide, x+Inches(0.25), Inches(2.3), Inches(0.55), Inches(0.55), icon, font_size=18, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x+Inches(0.95), Inches(2.35), Inches(2.6), Inches(0.3), title, font_size=12, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
    tf = slide.shapes.add_textbox(x+Inches(0.25), Inches(3.0), Inches(3.35), Inches(1.7)).text_frame
    tf.word_wrap=True
    for line in desc.split("\n"):
        add_para(tf, line, font_size=9, color=MUTED, space_after=Pt(1))
    add_shape(slide, x+Inches(0.25), Inches(4.55), Inches(3.35), Inches(0.42), fill_color=RGBColor(0xFF,0xF1,0xF2), line_color=RGBColor(0xFD,0xD2,0xD8))
    add_textbox(slide, x+Inches(0.25), Inches(4.55), Inches(3.35), Inches(0.42), metric, font_size=8, bold=True, color=CRITICAL, alignment=PP_ALIGN.CENTER)
# bottom insight
add_shape(slide, Inches(0.6), Inches(6.25), Inches(12.1), Inches(0.65), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(0.85), Inches(6.4), Inches(11.6), Inches(0.4), "Insight → Banks underwrite on stale data. NIVA underwrites on live ReBIT telemetry — AA + Pots + Family in one Twin.", font_size=9, bold=False, color=LIME, alignment=PP_ALIGN.LEFT)

# SLIDE 3 - SOLUTION PILLARS
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "02  •  SOLUTION")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "NIVA = Twin + Gate + Action", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.35), "Not a dashboard. An Income Firewall OS — deterministic, explainable, vernacular.", font_size=10, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
pillars = [
    ("TWIN", "Financial Digital Twin", "Health 0-100 • DTI • Buffer (mo) • Stress factors\nDeterministic ReBIT arithmetic — zero hallucination.\nLive from AA / SMS / Statement", POSITIVE),
    ("GATE", "Responsible Gate", "POL-402: block 36% loan if DTI>40% or stress>55\n+340% risk if suppressed → divert, not nudge.\nMerkle-hashed for RBI audit", CRITICAL),
    ("ACTION", "At Payment + In Pots + In Family", "Checkout Copilot: 2-sec YES/NO on upi://\nPots auto-sweep/release vs loan\nHousehold buffer & school-fee alerts", DEEP),
]
for i, (kicker, title, desc, accent) in enumerate(pillars):
    x = Inches(0.6) + i*Inches(4.15)
    c = add_shape(slide, x, Inches(2.05), Inches(3.85), Inches(3.2), fill_color=WHITE, line_color=BORDER)
    add_shape(slide, x, Inches(2.05), Inches(3.85), Inches(0.06), fill_color=accent, line_color=None)
    add_textbox(slide, x+Inches(0.25), Inches(2.3), Inches(1.0), Inches(0.22), kicker, font_size=7, bold=True, color=accent, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, x+Inches(0.25), Inches(2.55), Inches(3.35), Inches(0.32), title, font_size=11, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
    tf = slide.shapes.add_textbox(x+Inches(0.25), Inches(2.95), Inches(3.35), Inches(1.6)).text_frame
    tf.word_wrap=True
    for line in desc.split("\n"):
        add_para(tf, line, font_size=8.5, color=MUTED, space_after=Pt(2))
# USP strip
add_shape(slide, Inches(0.6), Inches(5.55), Inches(12.1), Inches(0.8), fill_color=RGBColor(0xF4,0xF4,0xF0), line_color=BORDER)
add_textbox(slide, Inches(0.85), Inches(5.7), Inches(11.6), Inches(0.25), "USP  →  Only product that says NO to revenue to save the user — and gives money from Pots instead.", font_size=9, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(6.0), Inches(11.6), Inches(0.25), "Every verdict: SHAP-explained + Merkle-hashed + vernacular (EN / हिंदी / ગુજરાતી) + voice TTS", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)

# SLIDE 4 - USER FLOW
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "03  •  USER FLOW")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.55), "From Phone Number to Twin in 60 Seconds", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.4), Inches(12), Inches(0.3), "Frictionless, DPDP-compliant, real data via SMS or AA — no persona picker for real users", font_size=9, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# flow steps
steps = [
    ("1", "Phone OTP", "+91  •  6-digit\nJWT httpOnly\n5-min TTL"),
    ("2", "Ingest", "SMS-to-Twin\nUpload Statement\nLive Setu AA"),
    ("3", "DPDP Vault", "FI Types • 6M\nRevoke 1-click\nMerkle proof"),
    ("4", "Twin", "Health/DTI/Buffer\nBureau vs AA\nSHAP drivers"),
    ("5", "Pots", "Emergency/Rent/\nDukaan • Autopilot"),
    ("6", "Checkout", "upi:// am=48k\nYES/NO + Gate\nPots alternative"),
]
for i, (num, title, desc) in enumerate(steps):
    x = Inches(0.6) + i*Inches(1.95)
    # connector line
    if i < 5:
        add_shape(slide, x+Inches(1.35), Inches(2.85), Inches(0.6), Inches(0.04), fill_color=BORDER, line_color=None)
    add_shape(slide, x, Inches(2.55), Inches(1.35), Inches(1.35), fill_color=DEEP, line_color=None)
    add_textbox(slide, x, Inches(2.6), Inches(1.35), Inches(0.5), num, font_size=14, bold=True, color=LIME, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x+Inches(0.1), Inches(3.05), Inches(1.15), Inches(0.25), title, font_size=8, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
    # spacer
    # desc card
    add_shape(slide, x, Inches(4.05), Inches(1.35), Inches(0.95), fill_color=SUBTLE, line_color=BORDER)
    tf = slide.shapes.add_textbox(x+Inches(0.1), Inches(4.15), Inches(1.15), Inches(0.75)).text_frame
    tf.word_wrap=True
    for line in desc.split("\n"):
        p=tf.add_paragraph()
        p.text=line
        p.font.size=Pt(7)
        p.font.color.rgb=MUTED
        p.font.name="Calibri"
        p.alignment=PP_ALIGN.CENTER
        p.space_after=Pt(1)
# bottom note
add_shape(slide, Inches(0.6), Inches(5.35), Inches(12.1), Inches(0.7), fill_color=RGBColor(0xEE,0xF2,0xE8), line_color=BORDER)
add_textbox(slide, Inches(0.85), Inches(5.5), Inches(11.6), Inches(0.25), "Real data priority: SMS (10 sec, any phone)  →  Statement (ReBIT 1.1 proof)  →  Setu AA (most authentic, requires FIU approval for arbitrary users)", font_size=8, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(5.8), Inches(11.6), Inches(0.25), "Demo fallback: ?dev=1 shows persona picker (Rajesh / Anita / Vikram) — never the default for real users", font_size=7, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)

# SLIDE 5 - ARCHITECTURE
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "04  •  ARCHITECTURE")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Architecture — Deterministic Core, Wise-Grade Shell", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.35), "FastAPI + Next.js 16 (Turbopack) • Postgres/Redis via Docker • SQLite fallback • Gemini 2.0 Flash with tool-calling, never hallucinates numbers", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# left: ingestion
add_shape(slide, Inches(0.6), Inches(2.0), Inches(3.6), Inches(4.3), fill_color=SUBTLE, line_color=BORDER)
add_textbox(slide, Inches(0.8), Inches(2.15), Inches(3.2), Inches(0.22), "INGESTION  •  REBIT 1.1 NORMALIZER", font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.LEFT)
ing = ["📱 OTP + JWT (auth.py)", "💬 SMS-to-Twin (sms_parser)", "📄 Statement CSV/XLSX/PDF (pdfplumber)", "🔗 Setu Bridge (mock | live setu)", "👥 Demo Personas (Rajesh/Anita/Vikram)"]
for i, t in enumerate(ing):
    add_textbox(slide, Inches(0.85), Inches(2.5)+Inches(i*0.38), Inches(3.1), Inches(0.3), t, font_size=8, bold=False, color=DEEP, alignment=PP_ALIGN.LEFT)
# center: core
add_shape(slide, Inches(4.55), Inches(2.0), Inches(4.2), Inches(4.3), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(4.8), Inches(2.15), Inches(3.7), Inches(0.22), "CORE  •  DETERMINISTIC ENGINE", font_size=7, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
cores = ["Twin Service: health/DTI/buffer/stress (6-dim)", "Gate Service: POL-402/301/204 + DPDP-SEC6", "ML: XGBoost+SHAP • IsolationForest • RF Lifestage", "Pots Firewall • Family Twin • Checkout Copilot", "Merkle Audit Trail (SHA256 chain)"]
for i, t in enumerate(cores):
    add_textbox(slide, Inches(4.8), Inches(2.5)+Inches(i*0.38), Inches(3.7), Inches(0.3), t, font_size=8, bold=False, color=WHITE, alignment=PP_ALIGN.LEFT)
# right: frontends
add_shape(slide, Inches(9.1), Inches(2.0), Inches(3.6), Inches(4.3), fill_color=WHITE, line_color=BORDER)
add_textbox(slide, Inches(9.35), Inches(2.15), Inches(3.1), Inches(0.22), "FRONTENDS  •  WISE-GRADE", font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.LEFT)
fronts = ["Customer: 8 tabs — Twin/Pots/Afford/Spend", "Bank: Portfolio EWS + Gate Audit + ReBIT", "Family: Household merge + alerts", "Mobile: Bottom nav • Spring • 44px taps", "Copilot: Voice HI/GU + tool-calling"]
for i, t in enumerate(fronts):
    add_textbox(slide, Inches(9.35), Inches(2.5)+Inches(i*0.38), Inches(3.1), Inches(0.3), t, font_size=8, bold=False, color=DEEP, alignment=PP_ALIGN.LEFT)
# bottom bar
add_shape(slide, Inches(0.6), Inches(6.55), Inches(12.1), Inches(0.45), fill_color=RGBColor(0x16,0x33,0x00), line_color=None)
add_textbox(slide, Inches(0.6), Inches(6.65), Inches(12.1), Inches(0.3), "app/api/router.py  •  15 routers  •  42 endpoints  •  /api/v1  •  lifespan DB init + CORS allowlist  •  Fallback: SQLite if Postgres down", font_size=7, bold=True, color=LIME, alignment=PP_ALIGN.CENTER)

# SLIDE 6 - TWIN
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "05  •  FINANCIAL TWIN")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Financial Digital Twin — The Single Source of Truth", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
# 4 gauges
for i, (k, v, sub, col) in enumerate([("HEALTH", "74 /100", "6-dim weighted", POSITIVE), ("STRESS", "38 /100", "65% elevated for Rajesh", WARNING), ("BUFFER", "3.5 mo", "Emergency runway", DEEP), ("DTI", "28%", "Safe <40% RBI", POSITIVE)]):
    x = Inches(0.6)+ i*Inches(3.15)
    c = add_shape(slide, x, Inches(1.65), Inches(2.9), Inches(1.6), fill_color=WHITE, line_color=BORDER)
    add_textbox(slide, x+Inches(0.2), Inches(1.8), Inches(2.5), Inches(0.18), k, font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x, Inches(2.05), Inches(2.9), Inches(0.45), v, font_size=18, bold=True, color=col, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x, Inches(2.55), Inches(2.9), Inches(0.45), sub, font_size=7, bold=False, color=MUTED, alignment=PP_ALIGN.CENTER)
# bureau vs aa
add_shape(slide, Inches(0.6), Inches(3.55), Inches(6.0), Inches(2.0), fill_color=SUBTLE, line_color=BORDER)
add_textbox(slide, Inches(0.85), Inches(3.75), Inches(5.5), Inches(0.22), "BUREAU vs AA  •  38-DAY BLIND WINDOW", font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(4.05), Inches(5.5), Inches(0.4), "CIBIL 760 (flat 38 days)  →  hides -38% drawdown + 42% revolving spike", font_size=9, bold=True, color=CRITICAL, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(4.55), Inches(5.5), Inches(0.6), "AA live shows health 74 → 48 in 21 days. Delinquency multiplier 3.4×. Judges see the divergence bar live.", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# SHAP
add_shape(slide, Inches(6.85), Inches(3.55), Inches(5.85), Inches(2.0), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(7.1), Inches(3.75), Inches(5.35), Inches(0.22), "SHAP  •  WHY RISK LOOKS LIKE THIS", font_size=7, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
shaps = ["Apollo Hospital 38k  (+0.42)", "Night UPI velocity  (+0.28)", "Liquidity buffer  (-0.31)"]
for i, s in enumerate(shaps):
    y = Inches(4.1)+Inches(i*0.32)
    add_textbox(slide, Inches(7.1), y, Inches(3.8), Inches(0.25), "•  "+s, font_size=8, bold=False, color=WHITE, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(7.1), Inches(5.15), Inches(5.35), Inches(0.3), "SHAP TreeExplainer — RBI explainability, no LLM invention", font_size=7, bold=False, color=RGBColor(0x9A,0xA8,0x8E), alignment=PP_ALIGN.LEFT)
# bottom
add_shape(slide, Inches(0.6), Inches(5.85), Inches(12.1), Inches(0.65), fill_color=RGBColor(0xEE,0xF2,0xE8), line_color=BORDER)
add_textbox(slide, Inches(0.85), Inches(6.0), Inches(11.6), Inches(0.4), "Deterministic arithmetic in twin.py:429 calculate_affordability — future_balance, buffer_status, safer_range, EMI burden. LLM only formats vernacular.", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)

# SLIDE 7 - GATE
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, DEEP)
section_label(slide, Inches(0.6), Inches(0.45), "06  •  RESPONSIBLE GATE")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "The Gate That Says NO to Revenue", font_size=22, bold=True, color=WHITE, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.35), "Pipeline: Eligibility → Suitability → Stress → Affordability → SUPPRESS / RECOMMEND", font_size=9, bold=False, color=LIME, alignment=PP_ALIGN.LEFT)
# 4 policies
pols = [
    ("POL-402", "Anti-Predatory Overleveraging", "Block 36% loan if DTI>40% or savings<10%", "CRITICAL_BLOCK", "14/day"),
    ("POL-301", "Medical Shock Quarantine", "Freeze bureau flags if medical spike >50% income", "EMPATHETIC", "8/day"),
    ("POL-204", "Merchant Divert", "Redirect to PM SVANidhi 7% vs 36%", "CATALOG_DIVERT", "22/day"),
    ("DPDP-SEC6", "Purpose Limitation", "Auto-expire consent after evaluation", "STATUTORY", "35/day"),
]
for i, (pid, title, rule, sev, trig) in enumerate(pols):
    y = Inches(2.05)+Inches(i*0.92)
    add_shape(slide, Inches(0.6), y, Inches(12.1), Inches(0.78), fill_color=WHITE, line_color=None)
    add_textbox(slide, Inches(0.85), y+Inches(0.12), Inches(1.6), Inches(0.2), pid, font_size=7, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, Inches(0.85), y+Inches(0.32), Inches(3.0), Inches(0.25), title, font_size=9, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, Inches(3.9), y+Inches(0.12), Inches(5.0), Inches(0.5), rule, font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, Inches(9.4), y+Inches(0.12), Inches(1.7), Inches(0.22), sev, font_size=7, bold=True, color=CRITICAL, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(11.1), y+Inches(0.12), Inches(1.5), Inches(0.5), trig+"\ntriggered", font_size=7, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0.6), Inches(6.1), Inches(12.1), Inches(0.4), "Effect:  ₹40,840 interest saved per suppressed personal loan  •  Recovery 90 days  •  Every decision Merkle-hashed in Bank Audit", font_size=9, bold=True, color=LIME, alignment=PP_ALIGN.CENTER)

# SLIDE 8 - POTS
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "07  •  INCOME FIREWALL")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Pots — Wise Envelopes That Replace Loans", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.35), "Good month → auto-sweep 12%. Bad month → auto-release for rent. No CIBIL hit.", font_size=9, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
pots = [
    ("Emergency", "₹ 12,000", "Target 30k • 12%", "🛡️", "40%", POSITIVE),
    ("Rent", "₹ 18,000", "Due 3rd • Locked", "🏠", "100%", DEEP),
    ("Dukaan Stock", "₹ 15,000", "For shop inventory", "🏪", "75%", MUTED),
]
for i, (name, bal, meta, icon, prog, col) in enumerate(pots):
    x = Inches(0.6)+ i*Inches(4.15)
    c = add_shape(slide, x, Inches(2.0), Inches(3.85), Inches(2.2), fill_color=WHITE, line_color=BORDER)
    add_shape(slide, x, Inches(2.0), Inches(3.85), Inches(0.05), fill_color=col, line_color=None)
    add_textbox(slide, x+Inches(0.25), Inches(2.2), Inches(0.5), Inches(0.5), icon, font_size=18, bold=False, color=DEEP, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x+Inches(0.85), Inches(2.2), Inches(2.7), Inches(0.22), name.upper(), font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, x+Inches(0.85), Inches(2.42), Inches(2.7), Inches(0.32), bal, font_size=16, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, x+Inches(0.25), Inches(2.85), Inches(3.35), Inches(0.2), meta, font_size=7, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
    # progress
    add_shape(slide, x+Inches(0.25), Inches(3.25), Inches(3.35), Inches(0.12), fill_color=RGBColor(0xEE,0xEE,0xE9), line_color=None)
    add_shape(slide, x+Inches(0.25), Inches(3.25), Inches(3.35*float(prog.strip('%'))/100), Inches(0.12), fill_color=col, line_color=None)
    add_textbox(slide, x+Inches(0.25), Inches(3.45), Inches(3.35), Inches(0.2), prog+" of target", font_size=7, bold=False, color=MUTED, alignment=PP_ALIGN.CENTER)
# autopilot insight
add_shape(slide, Inches(0.6), Inches(4.55), Inches(12.1), Inches(0.95), fill_color=RGBColor(0xEE,0xF2,0xE8), line_color=BORDER)
add_textbox(slide, Inches(0.85), Inches(4.75), Inches(11.6), Inches(0.28), "⚡ Autopilot Logic  (pots.py:68) —  If Emergency < target and Dukaan > ₹4k → move min(balance-2k, target-balance, ₹5k) → Emergency", font_size=9, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(5.1), Inches(11.6), Inches(0.35), "Result:  Release ₹5k from Dukaan → Rent Pot vs taking 36% loan. Runway stays 3.5 mo. Zero hallucination — all balances from Twin.", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# custom pots note
add_textbox(slide, Inches(0.6), Inches(5.8), Inches(12.1), Inches(0.4), "Also:  Personalized Pots  •  🎓 School Fees  •  💊 Medical  •  ✈ Travel  —  create via + Create Pot (presets + icon picker)", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.CENTER)

# SLIDE 9 - CHECKOUT
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "08  •  CHECKOUT COPILOT")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(7), Inches(0.6), "Affordability at the Moment of Payment", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(7), Inches(0.4), "Paste any UPI link, QR amount, or price. Get 2-sec deterministic verdict.", font_size=9, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# input mock
add_shape(slide, Inches(0.6), Inches(2.0), Inches(7), Inches(1.0), fill_color=SUBTLE, line_color=BORDER)
add_shape(slide, Inches(0.85), Inches(2.25), Inches(4.8), Inches(0.5), fill_color=WHITE, line_color=BORDER)
add_textbox(slide, Inches(0.95), Inches(2.35), Inches(4.6), Inches(0.35), "upi://pay?pa=shop@okhdfc&am=48000&tn=Laptop", font_size=8, bold=False, color=DEEP, alignment=PP_ALIGN.LEFT)
add_shape(slide, Inches(5.85), Inches(2.25), Inches(1.5), Inches(0.5), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(5.85), Inches(2.35), Inches(1.5), Inches(0.35), "Can I Afford? →", font_size=8, bold=True, color=LIME, alignment=PP_ALIGN.CENTER)
# result mock
add_shape(slide, Inches(0.6), Inches(3.25), Inches(7), Inches(2.0), fill_color=RGBColor(0xFF,0xF1,0xF2), line_color=RGBColor(0xFD,0xD2,0xD8))
add_textbox(slide, Inches(0.85), Inches(3.45), Inches(4.5), Inches(0.3), "✗  CONDITIONALLY — Gate SUPPRESS POL-402", font_size=10, bold=True, color=CRITICAL, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(3.85), Inches(6.5), Inches(0.5), "Post-purchase buffer would fall to 1.1 mo (target 3). EMI burden 44% → predatory.", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(4.35), Inches(6.5), Inches(0.6), "Alternative:  Use Pots (₹14k) + delay 2 months → buffer 2.8 mo, safe range ₹32k.", font_size=8, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
# right - how it works
add_shape(slide, Inches(8.0), Inches(2.0), Inches(4.7), Inches(3.25), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(8.3), Inches(2.25), Inches(4.1), Inches(0.25), "HOW IT WORKS  •  checkout.py:15", font_size=7, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
steps_c = ["1. Regex parses upi://?am= or ₹ 48k or 48k", "2. calculate_affordability (Twin, deterministic)", "3. Gate evaluate_product(personal_loan)", "4. Pots total → alternative string", "5. Return YES / COND / NO + SHAP"]
for i, s in enumerate(steps_c):
    add_textbox(slide, Inches(8.3), Inches(2.65)+Inches(i*0.32), Inches(4.1), Inches(0.3), "•  "+s, font_size=7.5, bold=False, color=WHITE, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(8.3), Inches(4.7), Inches(4.1), Inches(0.35), "Also available as AffordWidget on dashboard — same logic, same trust.", font_size=7, bold=False, color=RGBColor(0x9A,0xA8,0x8E), alignment=PP_ALIGN.LEFT)

# SLIDE 10 - FAMILY
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "09  •  HOUSEHOLD")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Family Twin — Finance is Household, Not Individual", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.35), "Merge shop + spouse + fees into one DTI, one buffer, one health score.", font_size=9, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# merge diagram
add_shape(slide, Inches(0.6), Inches(2.05), Inches(3.2), Inches(1.2), fill_color=WHITE, line_color=BORDER)
add_textbox(slide, Inches(0.6), Inches(2.15), Inches(3.2), Inches(0.25), "Rajesh", font_size=10, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0.6), Inches(2.4), Inches(3.2), Inches(0.2), "Shop income ₹65k • DTI 44%", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0.6), Inches(2.65), Inches(3.2), Inches(0.2), "Health 62", font_size=8, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)

add_shape(slide, Inches(4.15), Inches(2.05), Inches(3.2), Inches(1.2), fill_color=WHITE, line_color=BORDER)
add_textbox(slide, Inches(4.15), Inches(2.15), Inches(3.2), Inches(0.25), "Anita", font_size=10, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(4.15), Inches(2.4), Inches(3.2), Inches(0.2), "Salaried ₹60k • Savings 42%", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(4.15), Inches(2.65), Inches(3.2), Inches(0.2), "Health 88", font_size=8, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)

add_shape(slide, Inches(7.7), Inches(2.05), Inches(1.1), Inches(1.2), fill_color=LIME, line_color=None)
add_textbox(slide, Inches(7.7), Inches(2.5), Inches(1.1), Inches(0.4), "+", font_size=18, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)

add_shape(slide, Inches(9.15), Inches(2.05), Inches(3.55), Inches(1.2), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(9.15), Inches(2.15), Inches(3.55), Inches(0.25), "Sharma Household", font_size=11, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(9.15), Inches(2.4), Inches(3.55), Inches(0.2), "Health 74  •  Buffer 2.1 mo  •  DTI 31%", font_size=8, bold=False, color=LIME, alignment=PP_ALIGN.CENTER)
add_textbox(slide, Inches(9.15), Inches(2.65), Inches(3.55), Inches(0.2), "family.py:35 merge", font_size=7, bold=False, color=RGBColor(0x9A,0xA8,0x8E), alignment=PP_ALIGN.CENTER)

add_shape(slide, Inches(0.6), Inches(3.65), Inches(12.1), Inches(1.0), fill_color=RGBColor(0xFF,0xFB,0xEB), line_color=RGBColor(0xF5,0x9E,0x0B))
add_textbox(slide, Inches(0.85), Inches(3.85), Inches(11.6), Inches(0.3), "⚠  Alert if household buffer < 2 mo →  \"School fees due in 12 days but buffer only 8 days — pause SIP or sweep Pots?\"", font_size=8, bold=True, color=RGBColor(0x92,0x40,0x0E), alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(4.25), Inches(11.6), Inches(0.3), "APIs:  POST /family/create {head, members, name}  •  GET /family/{id}  •  GET /family/list  —  family.py + family service", font_size=7, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# icons
add_textbox(slide, Inches(0.6), Inches(5.0), Inches(12.1), Inches(0.5), "Use case: Kirana + spouse salaried + child education = Household Twin prevents fake DTI approval on single account.", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.CENTER)

# SLIDE 11 - BANK EWS
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "10  •  BANK PORTFOLIO")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Bank Portfolio EWS — From 1 Customer to 10,000", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.35), "Not drilldown only. Heatmap + KPIs that matter to Risk Officers — blocked, saved, avoided.", font_size=9, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# KPIs
for i, (k,v,sub) in enumerate([("BLOCKED TODAY", "35", "Predatory offers suppressed"), ("INTEREST SAVED", "₹ 1.2L+", "At 36% APR avoided"), ("NPA AVOIDED", "₹ 2.16L", "90-day modeled (×1.8)"), ("FILES MONITORED", "3 → 10k", "ReBIT-linked accounts")]):
    x = Inches(0.6)+i*Inches(3.15)
    c = add_shape(slide, x, Inches(2.0), Inches(2.9), Inches(1.4), fill_color=WHITE, line_color=BORDER)
    add_shape(slide, x, Inches(2.0), Inches(2.9), Inches(0.04), fill_color=DEEP, line_color=None)
    add_textbox(slide, x+Inches(0.2), Inches(2.15), Inches(2.5), Inches(0.18), k, font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x, Inches(2.35), Inches(2.9), Inches(0.4), v, font_size=16, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x, Inches(2.75), Inches(2.9), Inches(0.3), sub, font_size=7, bold=False, color=MUTED, alignment=PP_ALIGN.CENTER)
# table mock
add_shape(slide, Inches(0.6), Inches(3.7), Inches(7.2), Inches(2.0), fill_color=WHITE, line_color=BORDER)
add_textbox(slide, Inches(0.85), Inches(3.85), Inches(6.7), Inches(0.2), "HEATMAP  •  Customer → Health → DTI → Gate", font_size=7, bold=True, color=MUTED, alignment=PP_ALIGN.LEFT)
rows = [("Rajesh Sharma", "62", "44%", "HOLD"), ("Anita Desai", "88", "22%", "CLEAR"), ("Vikram Patel", "41", "51%", "HOLD")]
for i, (name, health, dti, gate) in enumerate(rows):
    y = Inches(4.15)+Inches(i*0.42)
    bg = RGBColor(0xFF,0xF1,0xF2) if gate=="HOLD" else WHITE
    add_shape(slide, Inches(0.75), y, Inches(6.9), Inches(0.33), fill_color=bg, line_color=None)
    add_textbox(slide, Inches(0.85), y, Inches(2.2), Inches(0.33), name, font_size=8, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, Inches(3.1), y, Inches(1.0), Inches(0.33), health, font_size=8, bold=False, color=DEEP, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(4.2), y, Inches(1.0), Inches(0.33), dti, font_size=8, bold=False, color=DEEP, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(5.5), y, Inches(1.4), Inches(0.33), gate, font_size=7, bold=True, color=CRITICAL if gate=="HOLD" else POSITIVE, alignment=PP_ALIGN.CENTER)
# ReBIT + action
add_shape(slide, Inches(8.1), Inches(3.7), Inches(4.6), Inches(2.0), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(8.35), Inches(3.85), Inches(4.1), Inches(0.2), "BANK ACTIONS  •  MERKLE-HASHED", font_size=7, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
actions = ["✓ 60-Day EMI Moratorium (zero CIBIL hit)", "✓ Assign Counselor (Kavita Nair, HI/GU)", "✓ One-click Relief → Bank Audit chain"]
for i, a in enumerate(actions):
    add_textbox(slide, Inches(8.35), Inches(4.15)+Inches(i*0.32), Inches(4.1), Inches(0.3), a, font_size=8, bold=False, color=WHITE, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(8.35), Inches(5.2), Inches(4.1), Inches(0.3), "GET /portfolio/overview  •  GET /portfolio/bureau-lag/{id}", font_size=7, bold=False, color=RGBColor(0x9A,0xA8,0x8E), alignment=PP_ALIGN.LEFT)

# SLIDE 12 - ML / GOVERNANCE
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "11  •  AI GOVERNANCE")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Explainable AI — RBI Ready, Not Black Box", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.35), "13 Bharat behavioral features  •  XGBoost + SHAP  •  Isolation Forest  •  Merkle Audit  •  No demographic inputs", font_size=8, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
# 3 model cards
models = [
    ("Stress Predictor", "XGBoost • n_est 200", "ROC-AUC 0.9382\nPrec 0.78 Rec 0.84", "SHAP TreeExplainer"),
    ("Anomaly", "IsolationForest 100\ncont 0.03", "6-dim: amount/hour/velocity\n midnight + new beneficiary", "Z-score + flags"),
    ("Lifestage", "RandomForest 150\n5 classes", "Kirana • Gig • Salaried\nRural Agri", "Product baskets"),
]
for i, (title, algo, metrics, explain) in enumerate(models):
    x = Inches(0.6)+i*Inches(4.15)
    c = add_shape(slide, x, Inches(2.0), Inches(3.85), Inches(2.2), fill_color=WHITE, line_color=BORDER)
    add_textbox(slide, x+Inches(0.25), Inches(2.2), Inches(3.35), Inches(0.22), title.upper(), font_size=8, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, x+Inches(0.25), Inches(2.45), Inches(3.35), Inches(0.35), algo, font_size=7, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
    tf = slide.shapes.add_textbox(x+Inches(0.25), Inches(2.85), Inches(3.35), Inches(0.7)).text_frame
    tf.word_wrap=True
    for line in metrics.split("\n"):
        add_para(tf, line, font_size=7.5, color=DEEP, space_after=Pt(1))
    add_textbox(slide, x+Inches(0.25), Inches(3.65), Inches(3.35), Inches(0.25), explain, font_size=7, bold=True, color=POSITIVE, alignment=PP_ALIGN.LEFT)
# Merkle strip
add_shape(slide, Inches(0.6), Inches(4.55), Inches(12.1), Inches(0.85), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(0.85), Inches(4.75), Inches(11.6), Inches(0.25), "Merkle Audit Trail  •  SHA256(prev_hash + sorted decision)  •  GET /ml/audit-trail → chain_intact: true", font_size=8, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.85), Inches(5.05), Inches(11.6), Inches(0.35), "Every Gate verdict logged:  stress_prob, life_stage, suppressed_count  →  root_hash for RBI MRM. Bank Audit shows integrity_hash [:12] per entry.", font_size=7.5, bold=False, color=WHITE, alignment=PP_ALIGN.LEFT)

# SLIDE 13 - SECURITY & DPDP
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "12  •  TRUST")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Security & DPDP Act 2023 — Built In, Not Bolted On", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
checks = [
    ("Auth", "OTP SHA256 + 5m TTL + 5 attempts\nJWT HS256 24h • httpOnly lax • /auth/me", "✓"),
    ("Secrets", "SECRET_KEY ≥32 chars or ephemeral token_hex\nno hard-coded fallback in prod", "✓"),
    ("AA", "ReBIT 1.1 • FI Types • 6M DataLife • revoke\nSetu mock|live (x-client-id/secret/product)", "✓"),
    ("Upload", "5MB guard • ALLOWED .csv/.xlsx/.pdf\npassword PDF + empty check", "✓"),
    ("Explain", "SHAP + Gate policies verifiable\nBank /gate-policies 4 rules", "✓"),
    ("Privacy", "DPDP checkbox gates dashboard\nConsent artifact + Merkle + auto-expire", "✓"),
]
for i, (title, desc, mark) in enumerate(checks):
    x = Inches(0.6)+(i%3)*Inches(4.15)
    y = Inches(1.65)+(i//3)*Inches(1.75)
    c = add_shape(slide, x, y, Inches(3.85), Inches(1.5), fill_color=WHITE, line_color=BORDER)
    add_shape(slide, x+Inches(0.25), y+Inches(0.2), Inches(0.35), Inches(0.35), fill_color=RGBColor(0xE6,0xF9,0xDC), line_color=None)
    add_textbox(slide, x+Inches(0.25), y+Inches(0.2), Inches(0.35), Inches(0.35), mark, font_size=12, bold=True, color=POSITIVE, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x+Inches(0.75), y+Inches(0.18), Inches(2.8), Inches(0.22), title, font_size=9, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
    tf = slide.shapes.add_textbox(x+Inches(0.75), y+Inches(0.45), Inches(2.85), Inches(0.85)).text_frame
    tf.word_wrap=True
    for line in desc.split("\n"):
        add_para(tf, line, font_size=7, color=MUTED, space_after=Pt(1))

# SLIDE 14 - DEMO FLOW
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, DEEP)
section_label(slide, Inches(0.6), Inches(0.45), "13  •  LIVE DEMO")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "60-Second Demo — Try It Now", font_size=22, bold=True, color=WHITE, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(0.6), Inches(1.45), Inches(12), Inches(0.35), "http://localhost:3000   •   API 8001  •  NEXT_PUBLIC_API_URL", font_size=8, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
steps_d = [
    ("1", "Onboarding", "Enter +91 → Send OTP\nDev OTP visible\n→ Step 2"),
    ("2", "Ingest", "SMS: paste 3 lines\nor Upload CSV/PDF\nor Setu AA"),
    ("3", "Twin", "Health 74 • Buffer 3.5\nBureau vs AA bar\nSHAP top 3"),
    ("4", "Checkout", "Paste upi:// am=48k\n→ COND + Pots alt\n2-sec verdict"),
    ("5", "Pots", "Create 🎓 School Fees\nSweep 1k • Autopilot\nMove 5k"),
    ("6", "Bank", "Portfolio: 35 blocked\nApprove Moratorium\nMerkle toast"),
]
for i, (num, title, desc) in enumerate(steps_d):
    x = Inches(0.6)+i*Inches(2.05)
    add_shape(slide, x, Inches(2.0), Inches(1.75), Inches(1.75), fill_color=WHITE, line_color=None)
    add_shape(slide, x+Inches(0.55), Inches(2.2), Inches(0.65), Inches(0.35), fill_color=DEEP, line_color=None)
    add_textbox(slide, x+Inches(0.55), Inches(2.25), Inches(0.65), Inches(0.25), num, font_size=9, bold=True, color=LIME, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x, Inches(2.65), Inches(1.75), Inches(0.25), title, font_size=9, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)
    tf = slide.shapes.add_textbox(x+Inches(0.15), Inches(2.95), Inches(1.45), Inches(0.65)).text_frame
    tf.word_wrap=True
    for line in desc.split("\n"):
        p=tf.add_paragraph()
        p.text=line
        p.font.size=Pt(7)
        p.font.color.rgb=MUTED
        p.font.name="Calibri"
        p.alignment=PP_ALIGN.CENTER
        p.space_after=Pt(1)
# API curl mock
add_shape(slide, Inches(0.6), Inches(4.15), Inches(12.1), Inches(1.0), fill_color=RGBColor(0x0E,0x13,0x11), line_color=LIME)
add_textbox(slide, Inches(0.85), Inches(4.35), Inches(11.6), Inches(0.6), "curl -X POST http://localhost:8001/api/v1/checkout/quick-check  -d '{\"persona_id\":\"rajesh_sharma\",\"raw_input\":\"upi://pay?pa=shop@okhdfc&am=48000\"}'    •    curl -X POST /family/create  -d '{\"head_persona_id\":\"rajesh_sharma\",\"members\":[\"anita_desai\"]}'", font_size=6.5, bold=False, color=LIME, alignment=PP_ALIGN.LEFT)

# SLIDE 15 - WHY WE WIN
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "14  •  DIFFERENTIATION")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(12), Inches(0.6), "Why NIVA Wins vs 50 AA Dashboards", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
# table header
add_shape(slide, Inches(0.6), Inches(1.6), Inches(12.1), Inches(0.45), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(0.85), Inches(1.7), Inches(5), Inches(0.25), "THEM", font_size=8, bold=True, color=RGBColor(0x9A,0xA8,0x8E), alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(5.9), Inches(1.7), Inches(6.8), Inches(0.25), "NIVA", font_size=8, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
rows_w = [
    ("Single-user score + chatbot", "Household Twin + Portfolio EWS + Merkle"),
    ("Bureau score, no lag viz", "Bureau flat 760 vs AA live -38% bar"),
    ("Advice only", "Action at payment: checkout + Pots alternative"),
    ("No envelope, loan is only option", "Income Firewall: sweep/release vs 36% loan"),
    ("Desktop only, clunky tabs", "Wise-grade mobile: bottom nav, spring, glass"),
    ("Mock only, no real data path", "SMS-to-Twin (any phone, 10 sec) + Setu live"),
]
for i, (them, us) in enumerate(rows_w):
    y = Inches(2.15)+Inches(i*0.58)
    bg = SUBTLE if i%2==0 else WHITE
    add_shape(slide, Inches(0.6), y, Inches(12.1), Inches(0.48), fill_color=bg, line_color=BORDER)
    add_textbox(slide, Inches(0.85), y+Inches(0.08), Inches(5), Inches(0.32), "✗  "+them, font_size=7.5, bold=False, color=MUTED, alignment=PP_ALIGN.LEFT)
    add_textbox(slide, Inches(5.9), y+Inches(0.08), Inches(6.6), Inches(0.32), "✓  "+us, font_size=7.5, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)

# SLIDE 16 - ROADMAP / TEAM
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, WHITE)
section_label(slide, Inches(0.6), Inches(0.45), "15  •  ROADMAP")
add_textbox(slide, Inches(0.6), Inches(0.85), Inches(7), Inches(0.6), "What’s Next", font_size=22, bold=True, color=DEEP, alignment=PP_ALIGN.LEFT)
roads = ["Persist Pots/Family/OTP in Postgres (models ready)", "Family deep-link page (/family) + AffordWidget component", "Rate limit (slowapi) + CSP/HSTS + secure cookies", "Setu Data Session: POST /consents/{id}/sessions for live FI pull", "Alembic migration + snapshot tests for afford/Twin math"]
for i, r in enumerate(roads):
    y = Inches(1.65)+Inches(i*0.38)
    add_shape(slide, Inches(0.6), y, Inches(7), Inches(0.32), fill_color=WHITE, line_color=BORDER)
    add_textbox(slide, Inches(0.85), y+Inches(0.05), Inches(6.5), Inches(0.22), f"{i+1}.  {r}", font_size=8, bold=False, color=DEEP, alignment=PP_ALIGN.LEFT)
# right - impact
add_shape(slide, Inches(8.0), Inches(1.65), Inches(4.7), Inches(4.0), fill_color=DEEP, line_color=None)
add_textbox(slide, Inches(8.3), Inches(1.85), Inches(4.1), Inches(0.3), "IMPACT", font_size=9, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(8.3), Inches(2.2), Inches(4.1), Inches(1.1), "If NIVA blocks 1k predatory loans / month\n→ ₹ 4Cr interest saved\n→ ~600 families avoid NPA\n→ household buffers build, not debt.", font_size=9, bold=False, color=WHITE, alignment=PP_ALIGN.LEFT)
add_textbox(slide, Inches(8.3), Inches(3.6), Inches(4.1), Inches(0.4), "One-tap from phone to Twin.\nDeterministic. Explainable. Vernacular.", font_size=8, bold=True, color=LIME, alignment=PP_ALIGN.LEFT)
add_shape(slide, Inches(8.3), Inches(4.2), Inches(4.1), Inches(0.5), fill_color=LIME, line_color=None)
add_textbox(slide, Inches(8.3), Inches(4.3), Inches(4.1), Inches(0.3), "Thank you — Questions?", font_size=11, bold=True, color=DEEP, alignment=PP_ALIGN.CENTER)

out = os.path.join(os.getcwd(), "NIVA_Jury_Pitch.pptx")
prs.save(out)
print(f"Saved to {out}")
print(f"Slides: {len(prs.slides)}")
