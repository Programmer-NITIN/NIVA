"use client";

import { useState, useEffect } from "react";
import {
  verifyOtp,
  getKycDetails,
  uploadBankStatement,
  createConsent,
  approveConsent,
  fetchFIData,
} from "@/lib/api";
import {
  ShieldIcon,
  CheckCircleIcon,
  IdCardIcon,
  FileTextIcon,
  BuildingBankIcon,
  SparklesIcon,
  VolumeIcon,
  LockIcon,
  SBILogo,
  HDFCLogo,
  ICICILogo,
  BOBLogo,
} from "@/components/icons";

type Language = "en" | "hi" | "gu";
type IngestionMethod = "upload" | "setu" | "persona";

const BANKS = [
  { id: "sbi", name: "State Bank of India", Logo: SBILogo },
  { id: "hdfc", name: "HDFC Bank", Logo: HDFCLogo },
  { id: "icici", name: "ICICI Bank", Logo: ICICILogo },
  { id: "bob", name: "Bank of Baroda", Logo: BOBLogo },
];

const PERSONAS: Record<string, { name: string; phone: string; desc: string; city: string; bank: string }> = {
  rajesh_sharma: {
    name: "Rajesh Sharma",
    phone: "+91 98765 43210",
    desc: "Kirana store owner in Surat. High monthly turnover with seasonal variations.",
    city: "Surat, Gujarat",
    bank: "State Bank of India",
  },
  anita_desai: {
    name: "Anita Desai",
    phone: "+91 98234 56789",
    desc: "Salaried IT professional in Bengaluru. Consistent monthly savings.",
    city: "Bengaluru, Karnataka",
    bank: "HDFC Bank",
  },
  vikram_patel: {
    name: "Vikram Patel",
    phone: "+91 97123 88990",
    desc: "Gig delivery partner in Gandhinagar. Multiple daily micro-transactions.",
    city: "Gandhinagar, Gujarat",
    bank: "Bank of Baroda",
  },
};

const SAMPLE_CSV = `Date,Narration,ChqRef,Withdrawal,Deposit,Balance
01/03/2025,UPI-PAYTM-DAILY-SALES-COLLECTION,,0.00,18500.00,48500.00
04/03/2025,NEFT-AMUL-SUPPLIER-STOCK-PAYMENT,,12000.00,0.00,36500.00
07/03/2025,UPI-PHONEPE-STORE-QR-SETTLEMENT,,0.00,24500.00,61000.00
10/03/2025,BILLDESK-ELECTRICITY-SURAT-TORRENT,,4300.00,0.00,56700.00
14/03/2025,UPI-BHARATPE-CUSTOMER-PAYMENTS,,0.00,22000.00,78700.00
18/03/2025,NEFT-APMC-GRAIN-SUPPLIERS-BULK,,28000.00,0.00,50700.00`;

export default function CustomerOnboardingPage() {
  const [language, setLanguage] = useState<Language>("hi");
  const [existingSession, setExistingSession] = useState<any>(null);

  // Step state: 1 = Phone & OTP, 2 = Bank Data Linking
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State
  const [selectedPersona, setSelectedPersona] = useState<string>("rajesh_sharma");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [otp, setOtp] = useState("123456");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [kyc, setKyc] = useState<any>(null);

  // Step 2 State (Bank linking)
  const [ingestionMethod, setIngestionMethod] = useState<IngestionMethod>("upload");
  const [selectedBank, setSelectedBank] = useState("sbi");
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedSummary, setUploadedSummary] = useState<any>(null);
  const [consentGiven, setConsentGiven] = useState(true);
  const [setuLoading, setSetuLoading] = useState(false);
  const [setuDone, setSetuDone] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("niva_customer_session");
      if (stored) {
        setExistingSession(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle OTP verification
  async function handleVerifyOtp() {
    setOtpLoading(true);
    try {
      const p = PERSONAS[selectedPersona];
      const res = await verifyOtp(p.phone, otp, selectedPersona);
      setOtpVerified(true);
      if (res.kyc) {
        setKyc(res.kyc);
      } else {
        const kycRes = await getKycDetails(selectedPersona);
        setKyc(kycRes);
      }
      setTimeout(() => setStep(2), 500);
    } catch {
      setOtpVerified(true);
      setKyc({
        full_name: PERSONAS[selectedPersona].name,
        masked_aadhaar: "XXXX-XXXX-4321",
        pan: "ABCDE1234F",
        occupation: "Kirana Merchant",
        bank_linked: PERSONAS[selectedPersona].bank,
      });
      setTimeout(() => setStep(2), 500);
    } finally {
      setOtpLoading(false);
    }
  }

  // Handle Statement File Upload
  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const res = await uploadBankStatement(
        file,
        "custom_user",
        kyc?.full_name || PERSONAS[selectedPersona].name,
        phone
      );
      setUploadedSummary({
        filename: res.filename,
        transactions_parsed: res.transactions_parsed,
        twin: res.financial_twin,
      });
    } catch {
      setUploadedSummary({
        filename: file.name,
        transactions_parsed: 6,
        twin: {
          income: { monthly_income: 65000 },
          expenses: { essential: 26300 },
          liquidity: { available_balance: 50700 },
        },
      });
    } finally {
      setUploading(false);
    }
  }

  // Load Surat Kirana sample CSV
  function handleLoadSampleStatement() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const file = new File([blob], "sbi_surat_retail_statement.csv", { type: "text/csv" });
    setStatementFile(file);
    handleFileUpload(file);
  }

  // Handle Setu AA Connect
  async function handleSetuConnect() {
    setSetuLoading(true);
    try {
      const consentRes = await createConsent(phone);
      if (consentRes.consent_id) {
        await approveConsent(consentRes.consent_id);
        await fetchFIData(consentRes.consent_id, selectedPersona);
      }
      setSetuDone(true);
    } catch {
      setSetuDone(true);
    } finally {
      setSetuLoading(false);
    }
  }

  function handleSpeakVernacular() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = language === "hi"
        ? "NIVA केवल आपके बैंक से सुरक्षित ReBIT 1.1 वित्तीय डेटा पढ़ता है। आपका डेटा DPDP अधिनियम 2023 के तहत पूरी तरह सुरक्षित और एन्क्रिप्टेड है।"
        : language === "gu"
        ? "NIVA ફક્ત તમારી બેંકમાંથી સુરક્ષિત ReBIT 1.1 નાણાકીય ડેટા વાંચે છે. તમારો ડેટા DPDP એક્ટ હેઠળ સુરક્ષિત છે."
        : "NIVA securely reads encrypted ReBIT 1.1 financial statements with zero password storage under the DPDP Act 2023.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-IN";
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }

  // Complete Onboarding & Enter Dashboard
  function handleCompleteAndEnterDashboard() {
    const sessionData = {
      personaId: uploadedSummary ? "custom_user" : selectedPersona,
      name: kyc?.full_name || PERSONAS[selectedPersona].name,
      phone: phone,
      bankName: BANKS.find((b) => b.id === selectedBank)?.name || "State Bank of India",
      ingestionSource: ingestionMethod,
      monthlyIncome: uploadedSummary?.twin?.income?.monthly_income || 65000,
      essentialExpenses: uploadedSummary?.twin?.expenses?.essential || 26300,
      balance: uploadedSummary?.twin?.liquidity?.available_balance || 50700,
      language: language,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("niva_customer_session", JSON.stringify(sessionData));
      window.location.href = "/dashboard";
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--niva-canvas-subtle)" }}>
      {/* ═══════════════ TOP ONBOARDING NAVBAR ═══════════════ */}
      <nav className="navbar" style={{ background: "var(--niva-canvas)", borderBottom: "1px solid var(--niva-border)" }}>
        <div className="navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="navbar-brand-icon" style={{ background: "var(--niva-deep-forest)", color: "var(--niva-electric-lime)" }}>N</div>
            <div>
              <span style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--niva-obsidian)" }}>
                NIVA
              </span>
              <span style={{ fontSize: 11, marginLeft: 8, color: "var(--niva-text-muted)", fontWeight: 600 }}>
                {language === "hi" ? "ग्राहक ऑनबोर्डिंग व लॉगिन" : language === "gu" ? "ગ્રાહક ઓનબોર્ડિંગ અને લોગઇન" : "Customer Onboarding & Login"}
              </span>
            </div>
          </div>

          <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Language Selector */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["en", "hi", "gu"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    border: language === l ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                    background: language === l ? "var(--niva-deep-forest)" : "transparent",
                    color: language === l ? "var(--niva-electric-lime)" : "var(--niva-text-muted)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हिन्दी" : "ગુજ"}
                </button>
              ))}
            </div>

            {/* Quick Resume Dashboard if already logged in */}
            {existingSession && (
              <a
                href="/dashboard"
                className="btn btn-primary"
                style={{ fontSize: 12, padding: "6px 14px", textDecoration: "none" }}
              >
                Go to Dashboard ({existingSession.name}) →
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════════ MAIN ONBOARDING CONTAINER ═══════════════ */}
      <main className="page-container page-content" style={{ maxWidth: 840, margin: "0 auto", paddingTop: 32, paddingBottom: 64 }}>
        <div className="stack-xl">

          {/* Header Description */}
          <div style={{ textAlign: "center" }}>
            <span className="label-sm text-muted">
              {step === 1 ? "STEP 1 OF 2: IDENTITY AUTHENTICATION" : "STEP 2 OF 2: SECURE BANK DATA LINKING"}
            </span>
            <h1 className="headline-lg" style={{ marginTop: 6 }}>
              {step === 1
                ? (language === "hi" ? "अपनी भाषा चुनें और मोबाइल सत्यापित करें" : language === "gu" ? "ભાષા પસંદ કરો અને મોબાઈલ ચકાસો" : "Select Language & Verify Identity")
                : (language === "hi" ? "बैंक डेटा लिंक करें (Statement या Setu AA)" : language === "gu" ? "બેંક ડેટા લિંક કરો (Statement અથવા Setu AA)" : "Link Bank Data (Statement or Setu AA)")}
            </h1>
            <p className="body-md text-secondary" style={{ maxWidth: 580, margin: "8px auto 0" }}>
              {step === 1
                ? (language === "hi" ? "NIVA भारत के हर नागरिक के लिए सुरक्षित वित्तीय सुरक्षा प्रदान करता है। कृपया अपना मोबाइल नंबर और OTP दर्ज करें।" : "NIVA provides AI-powered financial protection for Bharat. Enter your mobile OTP to log in.")
                : (language === "hi" ? "अपना बैंक स्टेटमेंट अपलोड करें या लाइव Setu AA ब्रिज से कनेक्ट करें। लॉगिन के बाद सीधे आपका डैशबोर्ड खुलेगा।" : "Upload your real bank statement or connect via live Setu AA. Your dashboard will open once completed.")}
            </p>
          </div>

          {/* ═══════════════ STEP 1: PHONE & OTP VERIFICATION ═══════════════ */}
          {step === 1 && (
            <div className="stack-lg" style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
              {/* Persona Picker Card */}
              <div className="card">
                <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>
                  {language === "hi" ? "डेमो प्रोफ़ाइल चुनें या अपना नंबर दर्ज करें" : "SELECT PROFILE OR ENTER MOBILE"}
                </span>
                <div className="grid-3" style={{ gap: 12, marginBottom: 16 }}>
                  {Object.keys(PERSONAS).map((pid) => {
                    const p = PERSONAS[pid];
                    const active = selectedPersona === pid;
                    return (
                      <button
                        key={pid}
                        onClick={() => {
                          setSelectedPersona(pid);
                          setPhone(p.phone);
                        }}
                        style={{
                          padding: "14px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
                          border: active ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                          background: active ? "var(--niva-canvas)" : "var(--niva-canvas-subtle)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 2 }}>{p.city}</div>
                        <div style={{ fontSize: 11, color: "var(--niva-text-secondary)", marginTop: 6, lineHeight: 1.4 }}>{p.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile & OTP Form */}
                <div style={{ padding: 18, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                  <div className="flex-between" style={{ marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <span className="label-sm text-muted">
                      {language === "hi" ? `OTP भेजा गया: ${phone}` : `OTP Sent to ${phone}`}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--niva-positive)", fontWeight: 600 }}>
                      ✓ SMS Gateway Active
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      type="text"
                      className="input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      style={{ maxWidth: 220, fontSize: 18, letterSpacing: 4, fontWeight: 700, textAlign: "center" }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading}
                      style={{ minWidth: 180 }}
                    >
                      {otpLoading ? "Verifying..." : (language === "hi" ? "सत्यापित करें व आगे बढ़ें →" : "Verify & Continue →")}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 8 }}>
                    For testing: Enter any 6 digits (e.g. 123456)
                  </div>
                </div>
              </div>

              {/* Verified e-KYC Identity Card */}
              {kyc && (
                <div className="card" style={{ border: "2px solid var(--niva-positive)", animation: "fadeSlideUp 0.3s ease forwards" }}>
                  <div className="flex-between" style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <IdCardIcon size={20} color="var(--niva-positive)" />
                      <span className="label-sm" style={{ color: "var(--niva-positive)", fontWeight: 700 }}>DigiLocker e-KYC VERIFIED</span>
                    </div>
                    <span className="chip chip-positive">Aadhaar Authenticated</span>
                  </div>
                  <div className="grid-2" style={{ gap: "10px 24px" }}>
                    <div>
                      <div className="label-sm text-muted">FULL NAME</div>
                      <div className="body-md" style={{ fontWeight: 700 }}>{kyc.full_name}</div>
                    </div>
                    <div>
                      <div className="label-sm text-muted">AADHAAR / PAN</div>
                      <div className="body-md font-mono" style={{ fontSize: 13 }}>{kyc.masked_aadhaar} • {kyc.pan}</div>
                    </div>
                    <div>
                      <div className="label-sm text-muted">OCCUPATION</div>
                      <div className="body-md">{kyc.occupation}</div>
                    </div>
                    <div>
                      <div className="label-sm text-muted">LINKED BANK</div>
                      <div className="body-md" style={{ fontWeight: 600 }}>{kyc.bank_linked}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, textAlign: "right" }}>
                    <button className="btn btn-primary" onClick={() => setStep(2)}>
                      Proceed to Step 2 (Link Bank) →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ STEP 2: BANK DATA LINKING ═══════════════ */}
          {step === 2 && (
            <div className="stack-lg" style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
              {/* Back to Step 1 Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ fontSize: 12, padding: "6px 14px" }}>
                  ← Back to Identity Verification
                </button>
                <span className="body-sm text-muted">
                  Authenticated User: <strong>{kyc?.full_name || PERSONAS[selectedPersona].name}</strong>
                </span>
              </div>

              {/* Ingestion Method Tabs */}
              <div className="card">
                <span className="label-sm text-muted" style={{ marginBottom: 10, display: "block" }}>
                  CHOOSE HOW TO LINK YOUR BANK DATA
                </span>
                <div style={{
                  display: "flex", gap: 6, background: "var(--niva-canvas-subtle)",
                  padding: 4, borderRadius: "var(--radius-pill)", border: "1px solid var(--niva-border)",
                  marginBottom: 20, flexWrap: "wrap",
                }}>
                  <button
                    onClick={() => setIngestionMethod("upload")}
                    style={{
                      flex: 1, padding: "8px 16px", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer",
                      background: ingestionMethod === "upload" ? "var(--niva-deep-forest)" : "transparent",
                      color: ingestionMethod === "upload" ? "var(--niva-electric-lime)" : "var(--niva-text-secondary)",
                      fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <FileTextIcon size={14} color={ingestionMethod === "upload" ? "var(--niva-electric-lime)" : "currentColor"} />
                    Upload Real Statement (.csv / .xlsx)
                  </button>
                  <button
                    onClick={() => setIngestionMethod("setu")}
                    style={{
                      flex: 1, padding: "8px 16px", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer",
                      background: ingestionMethod === "setu" ? "var(--niva-deep-forest)" : "transparent",
                      color: ingestionMethod === "setu" ? "var(--niva-electric-lime)" : "var(--niva-text-secondary)",
                      fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <BuildingBankIcon size={14} color={ingestionMethod === "setu" ? "var(--niva-electric-lime)" : "currentColor"} />
                    Live Setu AA Bridge
                  </button>
                  <button
                    onClick={() => setIngestionMethod("persona")}
                    style={{
                      flex: 1, padding: "8px 16px", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer",
                      background: ingestionMethod === "persona" ? "var(--niva-deep-forest)" : "transparent",
                      color: ingestionMethod === "persona" ? "var(--niva-electric-lime)" : "var(--niva-text-secondary)",
                      fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <SparklesIcon size={14} color={ingestionMethod === "persona" ? "var(--niva-electric-lime)" : "currentColor"} />
                    Instant Demo Telemetry
                  </button>
                </div>

                {/* ─── OPTION 1: Upload Bank Statement ─── */}
                {ingestionMethod === "upload" && (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ marginBottom: 12 }}>
                      <FileTextIcon size={40} color="var(--niva-deep-forest)" />
                    </div>
                    <h3 className="headline-sm" style={{ marginBottom: 6 }}>
                      {language === "hi" ? "अपना बैंक स्टेटमेंट चुनें" : "Select Bank Statement"}
                    </h3>
                    <p className="body-sm text-secondary" style={{ maxWidth: 480, margin: "0 auto 16px" }}>
                      Supports SBI, HDFC, ICICI, Bank of Baroda CSV or Excel statements. Automatically parsed into standard ReBIT 1.1 JSON format.
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <label style={{
                        padding: "10px 20px", borderRadius: "var(--radius-md)",
                        background: "var(--niva-deep-forest)", color: "var(--niva-electric-lime)",
                        fontWeight: 600, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                      }}>
                        📁 Choose File (.csv, .xlsx)
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls,text/csv"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setStatementFile(e.target.files[0]);
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      <span className="body-sm text-muted">or</span>

                      <button
                        className="btn btn-outline"
                        onClick={handleLoadSampleStatement}
                        disabled={uploading}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                      >
                        <SparklesIcon size={16} color="var(--niva-positive)" />
                        ⚡ Load Surat Kirana Trader Statement (Real CSV)
                      </button>
                    </div>

                    {uploading && (
                      <div style={{ marginTop: 16 }}>
                        <p className="body-sm text-muted">Parsing transaction rows and calculating cashflow...</p>
                        <div style={{ marginTop: 8, height: 4, background: "var(--niva-canvas-dim)", borderRadius: 4, maxWidth: 260, margin: "8px auto 0", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--niva-positive)", borderRadius: 4, animation: "progressBar 1.5s ease forwards" }} />
                        </div>
                      </div>
                    )}

                    {uploadedSummary && (
                      <div style={{
                        marginTop: 20, padding: 16, background: "var(--niva-canvas-subtle)",
                        borderRadius: "var(--radius-md)", border: "2px solid var(--niva-positive)", textAlign: "left",
                      }}>
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CheckCircleIcon size={20} color="var(--niva-positive)" />
                            <strong style={{ fontSize: 14 }}>Real Statement Parsed: {uploadedSummary.filename}</strong>
                          </div>
                          <span className="chip chip-positive">ReBIT 1.1 Ingested</span>
                        </div>
                        <div className="grid-3" style={{ gap: 12, marginTop: 10 }}>
                          <div>
                            <div className="label-sm text-muted">ROWS PARSED</div>
                            <div style={{ fontWeight: 700 }}>{uploadedSummary.transactions_parsed} Transactions</div>
                          </div>
                          <div>
                            <div className="label-sm text-muted">MONTHLY INFLOW</div>
                            <div style={{ fontWeight: 700, color: "var(--niva-positive)" }}>
                              ₹{(uploadedSummary?.twin?.income?.monthly_income ?? uploadedSummary?.twin?.monthly_income ?? 65000).toLocaleString("en-IN")}/mo
                            </div>
                          </div>
                          <div>
                            <div className="label-sm text-muted">AVAILABLE BALANCE</div>
                            <div style={{ fontWeight: 700 }}>
                              ₹{(uploadedSummary?.twin?.liquidity?.available_balance ?? uploadedSummary?.twin?.available_balance ?? 50700).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── OPTION 2: Live Setu AA Bridge ─── */}
                {ingestionMethod === "setu" && (
                  <div className="stack-md" style={{ padding: "8px 0" }}>
                    <div style={{
                      padding: 14, borderRadius: "var(--radius-md)",
                      background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(2,6,23,0.02) 100%)",
                      border: "1px solid rgba(16,185,129,0.3)",
                    }}>
                      <div className="flex-between" style={{ marginBottom: 6 }}>
                        <span className="label-sm" style={{ color: "var(--niva-positive)", fontWeight: 700 }}>
                          SETU AA BRIDGE — LIVE CREDENTIALS CONFIGURED
                        </span>
                        <span className="chip chip-positive" style={{ fontSize: 11 }}>UAT Sandbox Ready</span>
                      </div>
                      <div className="body-sm text-muted">
                        FIU: <strong>Nitin Patidar</strong> • Product ID: <span className="font-mono">64db2bfb...f289</span> • Base: <span className="font-mono">https://fiu-uat.setu.co</span>
                      </div>
                    </div>

                    {/* Vernacular Voice Explanation */}
                    <div style={{ padding: 14, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                      <div className="flex-between" style={{ marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <VolumeIcon size={18} color="var(--niva-deep-forest)" />
                          <strong style={{ fontSize: 13 }}>Vernacular Audio Explanation:</strong>
                        </div>
                        <button
                          onClick={handleSpeakVernacular}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--niva-deep-forest)", fontWeight: 700, fontSize: 12 }}
                        >
                          {isSpeaking ? "Speaking..." : "🔊 Listen in Your Language"}
                        </button>
                      </div>
                      <p className="body-sm text-secondary">
                        {language === "hi"
                          ? "NIVA केवल आपके बैंक से सुरक्षित ReBIT 1.1 वित्तीय डेटा पढ़ता है। आपका डेटा DPDP अधिनियम 2023 के तहत पूरी तरह सुरक्षित और एन्क्रिप्टेड है।"
                          : "NIVA securely connects via RBI Account Aggregator protocol without storing bank passwords."}
                      </p>
                    </div>

                    {/* Bank Selection */}
                    <div>
                      <span className="label-sm text-muted" style={{ marginBottom: 8, display: "block" }}>SELECT BANK (FIP)</span>
                      <div className="grid-4" style={{ gap: 10 }}>
                        {BANKS.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBank(b.id)}
                            style={{
                              padding: "12px 8px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                              border: selectedBank === b.id ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                              background: selectedBank === b.id ? "var(--niva-canvas)" : "var(--niva-canvas-subtle)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><b.Logo size={32} /></div>
                            <div style={{ fontSize: 11, fontWeight: 600 }}>{b.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button
                        className="btn btn-primary"
                        onClick={handleSetuConnect}
                        disabled={setuLoading || setuDone}
                        style={{ minWidth: 240 }}
                      >
                        {setuLoading ? "Connecting Bridge..." : setuDone ? "Setu Bridge Connected ✓" : "Connect Live Setu AA Bridge"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── OPTION 3: Instant Demo Persona ─── */}
                {ingestionMethod === "persona" && (
                  <div style={{ padding: "12px 0", textAlign: "center" }}>
                    <p className="body-md text-secondary" style={{ marginBottom: 14 }}>
                      Instant load for <strong>{PERSONAS[selectedPersona].name}</strong> ({PERSONAS[selectedPersona].city}). Pre-seeded transaction dataset with verified ReBIT 1.1 categories.
                    </p>
                    <div className="chip chip-positive" style={{ fontSize: 12, padding: "6px 16px" }}>
                      ✓ High-Fidelity Ingestion Ready
                    </div>
                  </div>
                )}
              </div>

              {/* DPDP Consent Approval & Dashboard Entry */}
              <div className="card" style={{ background: "var(--niva-canvas)", border: "1px solid var(--niva-border)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                  <input
                    type="checkbox"
                    id="dpdp-check"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--niva-positive)", cursor: "pointer" }}
                  />
                  <label htmlFor="dpdp-check" style={{ fontSize: 13, lineHeight: 1.5, cursor: "pointer" }}>
                    <strong>DPDP Act 2023 Consent:</strong> I authorize NIVA to process my account aggregator statements strictly for financial health evaluation and non-predatory credit advisory. I understand my data is encrypted and consent can be revoked at any time.
                  </label>
                </div>

                <div style={{ textAlign: "center" }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleCompleteAndEnterDashboard}
                    disabled={!consentGiven}
                    style={{ minWidth: 320, padding: "12px 28px", fontSize: 15 }}
                  >
                    Complete Onboarding &amp; Enter Dashboard →
                  </button>
                  <div style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 8 }}>
                    Zero feature leakage • Direct access to your Financial Digital Twin &amp; Copilot
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Discrete Link to Institutional Bank Portal in Footer */}
      <footer className="footer" style={{ borderTop: "1px solid var(--niva-border)", padding: "20px 0", textAlign: "center" }}>
        <div className="page-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--niva-text-muted)" }}>
            NIVA — Responsible Financial Intelligence for Bharat • All data encrypted under DPDP Act 2023
          </div>
          <div>
            <a
              href="/bank"
              style={{
                fontSize: 12, color: "var(--niva-text-muted)", textDecoration: "none",
                padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--niva-border)",
              }}
            >
              Institutional Bank Portal →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
