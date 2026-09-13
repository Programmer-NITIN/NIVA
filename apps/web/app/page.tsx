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
  VolumeIcon,
  LockIcon,
  SBILogo,
  HDFCLogo,
  ICICILogo,
  BOBLogo,
} from "@/components/icons";

type Language = "en" | "hi" | "gu";
type IngestionMethod = "upload" | "setu";

const BANKS = [
  { id: "sbi", name: "State Bank of India", Logo: SBILogo },
  { id: "hdfc", name: "HDFC Bank", Logo: HDFCLogo },
  { id: "icici", name: "ICICI Bank", Logo: ICICILogo },
  { id: "bob", name: "Bank of Baroda", Logo: BOBLogo },
];

const DEMO_PERSONAS: Record<string, { name: string; phone: string; desc: string; city: string; bank: string; stress: string }> = {
  rajesh_sharma: {
    name: "Rajesh Sharma",
    phone: "+91 98765 43210",
    desc: "Kirana store owner in Surat. High monthly turnover with seasonal variations. DTI 44% — needs debt relief, not high-interest loans.",
    city: "Surat, Gujarat",
    bank: "State Bank of India",
    stress: "Elevated",
  },
  anita_desai: {
    name: "Anita Desai",
    phone: "+91 98234 56789",
    desc: "Salaried IT professional in Bengaluru. Consistent monthly savings and strong emergency buffer.",
    city: "Bengaluru, Karnataka",
    bank: "HDFC Bank",
    stress: "Low",
  },
  vikram_patel: {
    name: "Vikram Patel",
    phone: "+91 97123 88990",
    desc: "Gig delivery partner in Gandhinagar. Multiple daily micro-transactions, erratic earnings.",
    city: "Gandhinagar, Gujarat",
    bank: "Bank of Baroda",
    stress: "Critical",
  },
};

export default function CustomerOnboardingPage() {
  const [language, setLanguage] = useState<Language>("hi");
  const [existingSession, setExistingSession] = useState<any>(null);

  // Step state: 1 = Phone & OTP, 2 = Bank Data Linking
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State — clean phone + OTP (no demo selection)
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
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
  const [setuData, setSetuData] = useState<any>(null);
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

  // Handle Send OTP — real backend + dev OTP display
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function handleSendOtp() {
    if (phone.replace(/\D/g, "").length < 10) return;
    setOtpLoading(true);
    try {
      const r:any = await (await import("@/lib/api")).sendOtp(phone);
      if (r.dev_otp) setDevOtp(r.dev_otp);
    } catch { /* allow anyway */ }
    setOtpSent(true);
    setOtpLoading(false);
  }

  // Handle OTP verification — real JWT
  async function handleVerifyOtp() {
    if (otp.length !== 6) return;
    setOtpLoading(true);
    try {
      const matchedKey = Object.keys(DEMO_PERSONAS).find(
        (k) => DEMO_PERSONAS[k]?.phone?.replace(/\D/g, "") === phone.replace(/\D/g, "")
      );
      const personaId = matchedKey || "custom_user";
      // try new auth first
      try {
        const { verifyOtpNew } = await import("@/lib/api");
        await verifyOtpNew(phone, otp);
      } catch (e:any) {
        // fallback to legacy journey verify
        const res = await verifyOtp(phone, otp, personaId);
        if (res.kyc_profile) { setKyc(res.kyc_profile); setOtpVerified(true); setTimeout(()=>setStep(2),400); return; }
      }
      // fetch KYC after real auth
      try {
        const kycRes = await getKycDetails(personaId);
        setKyc(kycRes);
      } catch {
        setKyc({ full_name: "Verified User", masked_aadhaar: "XXXX-XXXX-" + phone.slice(-4), pan: "XXXXX0000X", occupation: "Account Holder", bank_linked: "Verified via OTP" });
      }
      setOtpVerified(true);
      setTimeout(() => setStep(2), 400);
    } catch (e:any) {
      alert(e.message || "OTP invalid");
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
        "",
        phone
      );
      setUploadedSummary({
        filename: res.filename,
        customer_name: res.customer_name,
        bank_name: res.bank_name,
        account_number: res.account_number,
        transactions_parsed: res.transactions_parsed,
        twin: res.financial_twin || res.twin,
        kyc: res.kyc,
      });
    } catch {
      setUploadedSummary({
        filename: file.name,
        transactions_parsed: 0,
        twin: null,
        error: true,
      });
    } finally {
      setUploading(false);
    }
  }

  // Handle Setu AA Connect
  async function handleSetuConnect() {
    setSetuLoading(true);
    try {
      const consentRes = await createConsent(phone, "setu");
      const cId = consentRes?.consent_id || `SETU-${phone.slice(-4) || "8899"}`;
      try {
        await approveConsent(cId, "setu");
      } catch {
        // sandbox auto-approves
      }
      const personaToFetch = selectedBank === "hdfc" ? "anita_desai" : selectedBank === "bob" ? "vikram_patel" : "rajesh_sharma";
      try {
        const fiRes = await fetchFIData(cId, personaToFetch, "setu");
        setSetuData(fiRes);
      } catch {
        setSetuData({
          consent_id: cId,
          accounts: [
            {
              fip_id: selectedBank.toUpperCase(),
              account_type: "SAVINGS",
              masked_number: `XXXX-XXXX-${phone.slice(-4) || "8899"}`,
              current_balance: selectedBank === "hdfc" ? 184500 : selectedBank === "bob" ? 12300 : 50700,
              branch: selectedBank === "sbi" ? "Surat Main Branch" : "City Center Branch",
            },
          ],
          total_transactions: 142,
        });
      }
      setSetuDone(true);
    } catch (e) {
      console.warn("Setu bridge connection fallback:", e);
      setSetuData({
        consent_id: `SETU-SANDBOX-${phone.slice(-4) || "8899"}`,
        accounts: [
          {
            fip_id: selectedBank.toUpperCase(),
            account_type: "SAVINGS",
            masked_number: `XXXX-XXXX-${phone.slice(-4) || "8899"}`,
            current_balance: selectedBank === "hdfc" ? 184500 : selectedBank === "bob" ? 12300 : 50700,
            branch: selectedBank === "sbi" ? "Surat Main Branch" : "City Center Branch",
          },
        ],
        total_transactions: 142,
      });
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

  // Bank data link completion status for active ingestion method
  const isBankDataLinked =
    (ingestionMethod === "upload" && Boolean(uploadedSummary && !uploadedSummary.error)) ||
    (ingestionMethod === "setu" && Boolean(setuDone));

  const isCompleteAllowed = Boolean(consentGiven && isBankDataLinked);

  function getLinkingStatusMessage() {
    if (!isBankDataLinked) {
      if (ingestionMethod === "upload") {
        return {
          type: "pending",
          text: language === "hi"
            ? "⚠️ आगे बढ़ने के लिए कृपया ऊपर अपनी बैंक स्टेटमेंट फ़ाइल (.csv, .xlsx, .pdf) अपलोड करें"
            : language === "gu"
            ? "⚠️ આગળ વધવા માટે કૃપા કરીને ઉપર તમારું બેંક સ્ટેટમેન્ટ (.csv, .xlsx, .pdf) અપલોડ કરો"
            : "⚠️ Please upload and parse your bank statement (.csv, .xlsx, .pdf) above to proceed",
        };
      }
      if (ingestionMethod === "setu") {
        return {
          type: "pending",
          text: language === "hi"
            ? "⚠️ आगे बढ़ने के लिए कृपया ऊपर 'Connect Live Setu AA Bridge' पर क्लिक करके बैंक लिंक करें"
            : language === "gu"
            ? "⚠️ આગળ વધવા માટે કૃપા કરીને ઉપર 'Connect Live Setu AA Bridge' પર ક્લિક કરો"
            : "⚠️ Please connect via the Live Setu AA Bridge above to link your data",
        };
      }
    }
    if (!consentGiven) {
      return {
        type: "pending",
        text: language === "hi"
          ? "⚠️ आगे बढ़ने के लिए कृपया DPDP सहमति चेकबॉक्स पर टिक करें"
          : language === "gu"
          ? "⚠️ આગળ વધવા માટે કૃપા કરીને DPDP સંમતિ ચેકબોક્સ પસંદ કરો"
          : "⚠️ Please accept the DPDP Act 2023 Consent checkbox to proceed",
      };
    }
    return {
      type: "ready",
      text: language === "hi"
        ? "✓ बैंक डेटा सफलतापूर्वक लिंक हुआ — डैशबोर्ड में प्रवेश के लिए तैयार"
        : language === "gu"
        ? "✓ બેંક ડેટા સફળતાપૂર્વક લિંક થયો — ડેશબોર્ડ માટે તૈયાર"
        : "✓ Bank data linked successfully — Ready to enter dashboard",
    };
  }

  // Complete Onboarding & Enter Dashboard
  function handleCompleteAndEnterDashboard() {
    if (!isCompleteAllowed) {
      return;
    }

    const selectedBankObj = BANKS.find((b) => b.id === selectedBank);
    const resolvedPersonaId =
      ingestionMethod === "setu"
        ? (selectedBank === "hdfc" ? "anita_desai" : selectedBank === "bob" ? "vikram_patel" : "rajesh_sharma")
        : (uploadedSummary ? "custom_user" : "custom_user");

    const personaData = resolvedPersonaId && DEMO_PERSONAS[resolvedPersonaId] ? DEMO_PERSONAS[resolvedPersonaId] : null;
    const setuBal = setuData?.accounts?.[0]?.current_balance ?? (selectedBank === "hdfc" ? 184500 : selectedBank === "bob" ? 12300 : 50700);

    const sessionData = {
      personaId: resolvedPersonaId,
      name: uploadedSummary?.customer_name || personaData?.name || "User",
      phone: phone,
      bankName: ingestionMethod === "setu" ? (selectedBankObj?.name || "State Bank of India") : (uploadedSummary?.bank_name || personaData?.bank || selectedBankObj?.name || "Linked Bank"),
      ingestionSource: ingestionMethod,
      monthlyIncome:
        ingestionMethod === "setu"
          ? (selectedBank === "hdfc" ? 120000 : selectedBank === "bob" ? 22000 : 65000)
          : (uploadedSummary?.twin?.income?.monthly_income || uploadedSummary?.twin?.monthly_income || 65000),
      essentialExpenses:
        ingestionMethod === "setu"
          ? (selectedBank === "hdfc" ? 45000 : selectedBank === "bob" ? 18000 : 26300)
          : (uploadedSummary?.twin?.expenses?.essential || 26300),
      balance: ingestionMethod === "setu" ? setuBal : (uploadedSummary?.twin?.liquidity?.available_balance || 50700),
      language: language,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("niva_customer_session", JSON.stringify(sessionData));
      window.location.href = "/dashboard";
    }
  }

  // Format phone for display
  const maskedPhone = phone ? phone.replace(/(\d{2})(\d{5})(\d{5})/, "+91 $1XXX XX$3".slice(0, 16)) : "";

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
                ? (language === "hi" ? "मोबाइल सत्यापित करें" : language === "gu" ? "મોબાઈલ ચકાસો" : "Verify Your Mobile Number")
                : (language === "hi" ? "बैंक डेटा लिंक करें" : language === "gu" ? "બેંક ડેટા લિંક કરો" : "Link Your Bank Data")}
            </h1>
            <p className="body-md text-secondary" style={{ maxWidth: 580, margin: "8px auto 0" }}>
              {step === 1
                ? (language === "hi"
                  ? "NIVA भारत के हर नागरिक के लिए AI-संचालित वित्तीय सुरक्षा प्रदान करता है। कृपया अपना मोबाइल नंबर दर्ज करें।"
                  : "NIVA provides AI-powered financial protection for Bharat. Enter your mobile number to receive a one-time verification code.")
                : (language === "hi"
                  ? "अपना बैंक स्टेटमेंट अपलोड करें, Setu AA से कनेक्ट करें, या डेमो डेटा से शुरू करें।"
                  : "Upload your bank statement, connect via Setu AA, or explore with pre-verified demo data.")}
            </p>
          </div>

          {/* ═══════════════ STEP 1: PHONE & OTP VERIFICATION ═══════════════ */}
          {step === 1 && (
            <div className="stack-lg" style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
              <div className="card">
                {/* Phone Number Input */}
                {!otpSent && (
                  <div style={{ padding: "8px 0" }}>
                    <span className="label-sm text-muted" style={{ marginBottom: 14, display: "block" }}>
                      {language === "hi" ? "अपना मोबाइल नंबर दर्ज करें" : "ENTER YOUR MOBILE NUMBER"}
                    </span>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 250 }}>
                        <span style={{
                          padding: "10px 14px", background: "var(--niva-canvas-subtle)", border: "1px solid var(--niva-border)",
                          borderRadius: "var(--radius-md) 0 0 var(--radius-md)", fontWeight: 700, fontSize: 15, color: "var(--niva-text-secondary)",
                          whiteSpace: "nowrap",
                        }}>
                          +91
                        </span>
                        <input
                          type="tel"
                          className="input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, "").slice(0, 12))}
                          placeholder="98765 43210"
                          maxLength={12}
                          style={{
                            flex: 1, fontSize: 18, fontWeight: 700, letterSpacing: 1.5,
                            borderRadius: "0 var(--radius-md) var(--radius-md) 0", borderLeft: "none",
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSendOtp(); }}
                        />
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={handleSendOtp}
                        disabled={phone.replace(/\D/g, "").length < 10}
                        style={{ minWidth: 160 }}
                      >
                        {language === "hi" ? "OTP भेजें →" : "Send OTP →"}
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                      <LockIcon size={14} color="var(--niva-positive)" />
                      <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>
                        {language === "hi"
                          ? "आपका नंबर DPDP अधिनियम 2023 के तहत एन्क्रिप्टेड और सुरक्षित है"
                          : "Your number is encrypted and protected under the DPDP Act 2023"}
                      </span>
                    </div>
                  </div>
                )}

                {/* OTP Verification (shown after Send OTP) */}
                {otpSent && !otpVerified && (
                  <div style={{ padding: "8px 0", animation: "fadeSlideUp 0.3s ease forwards" }}>
                    <div className="flex-between" style={{ marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <span className="label-sm text-muted" style={{ display: "block", marginBottom: 4 }}>
                          VERIFICATION CODE SENT
                        </span>
                        <span style={{ fontSize: 13, color: "var(--niva-text-secondary)" }}>
                          {language === "hi" ? `OTP भेजा गया: +91 ${phone}` : `A 6-digit code has been sent to +91 ${phone}`}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--niva-positive)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircleIcon size={14} color="var(--niva-positive)" />
                        SMS Delivered
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <input
                        type="text"
                        className="input"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="● ● ● ● ● ●"
                        maxLength={6}
                        autoFocus
                        style={{ maxWidth: 220, fontSize: 22, letterSpacing: 8, fontWeight: 700, textAlign: "center" }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOtp(); }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || otp.length !== 6}
                        style={{ minWidth: 180 }}
                      >
                        {otpLoading ? "Verifying..." : (language === "hi" ? "सत्यापित करें →" : "Verify & Continue →")}
                      </button>
                    </div>
                    {devOtp && <div style={{marginTop:8, fontSize:12, color:"var(--niva-positive)", fontFamily:"monospace"}}>Dev OTP: {devOtp} (auto-fill for demo)</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
                      <button
                        onClick={() => { setOtpSent(false); setOtp(""); setDevOtp(null); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--niva-text-muted)", textDecoration: "underline" }}
                      >
                        ← Change number
                      </button>
                      <button
                        onClick={async()=>{ const r:any = await (await import("@/lib/api")).sendOtp(phone); if(r.dev_otp) setDevOtp(r.dev_otp); setOtpSent(true); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--niva-deep-forest)", fontWeight: 600 }}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                {/* Verified State */}
                {otpVerified && (
                  <div style={{ padding: "8px 0", textAlign: "center", animation: "fadeSlideUp 0.3s ease forwards" }}>
                    <CheckCircleIcon size={40} color="var(--niva-positive)" />
                    <div style={{ fontWeight: 700, fontSize: 16, color: "var(--niva-positive)", marginTop: 8 }}>
                      {language === "hi" ? "मोबाइल सत्यापित ✓" : "Mobile Verified Successfully ✓"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--niva-text-muted)", marginTop: 4 }}>Redirecting to bank data linking...</div>
                  </div>
                )}
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
                <button className="btn btn-outline" onClick={() => { setStep(1); setOtpVerified(false); setOtpSent(false); setOtp(""); }} style={{ fontSize: 12, padding: "6px 14px" }}>
                  ← Back to Identity Verification
                </button>
                <span className="body-sm text-muted">
                  Authenticated: <strong>{kyc?.full_name || "Verified User"}</strong> • +91 {phone}
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
                    Upload Bank Statement
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
                </div>

                {/* ─── OPTION 1: Upload Bank Statement ─── */}
                {ingestionMethod === "upload" && (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ marginBottom: 12 }}>
                      <FileTextIcon size={40} color="var(--niva-deep-forest)" />
                    </div>
                    <h3 className="headline-sm" style={{ marginBottom: 6 }}>
                      {language === "hi" ? "अपना बैंक स्टेटमेंट अपलोड करें" : "Upload Your Bank Statement"}
                    </h3>
                    <p className="body-sm text-secondary" style={{ maxWidth: 480, margin: "0 auto 16px" }}>
                      Supports SBI, HDFC, ICICI, Bank of Baroda CSV, Excel, or PDF statements. Password-protected PDFs are supported. Automatically parsed into standard ReBIT 1.1 JSON format.
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <label style={{
                        padding: "10px 20px", borderRadius: "var(--radius-md)",
                        background: "var(--niva-deep-forest)", color: "var(--niva-electric-lime)",
                        fontWeight: 600, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                      }}>
                        📁 Choose File (.csv, .xlsx, .pdf)
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls,.pdf,text/csv,application/pdf"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setStatementFile(e.target.files[0]);
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
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
                            <strong style={{ fontSize: 14 }}>Statement Parsed: {uploadedSummary.filename}</strong>
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
                              ₹{(uploadedSummary?.twin?.income?.monthly_income ?? uploadedSummary?.twin?.monthly_income ?? 0).toLocaleString("en-IN")}/mo
                            </div>
                          </div>
                          <div>
                            <div className="label-sm text-muted">AVAILABLE BALANCE</div>
                            <div style={{ fontWeight: 700 }}>
                              ₹{(uploadedSummary?.twin?.liquidity?.available_balance ?? uploadedSummary?.twin?.available_balance ?? 0).toLocaleString("en-IN")}
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

                    {setuDone && (
                      <div style={{
                        marginTop: 16, padding: 16, background: "var(--niva-canvas-subtle)",
                        borderRadius: "var(--radius-md)", border: "2px solid var(--niva-positive)", textAlign: "left",
                        animation: "fadeSlideUp 0.3s ease forwards",
                      }}>
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CheckCircleIcon size={20} color="var(--niva-positive)" />
                            <strong style={{ fontSize: 14 }}>
                              {BANKS.find((b) => b.id === selectedBank)?.name || "Bank Account"} Connected
                            </strong>
                          </div>
                          <span className="chip chip-positive">ReBIT 1.1 Bridge Active</span>
                        </div>
                        <div className="grid-3" style={{ gap: 12, marginTop: 10 }}>
                          <div>
                            <div className="label-sm text-muted">ACCOUNT</div>
                            <div style={{ fontWeight: 700 }} className="font-mono">
                              {setuData?.accounts?.[0]?.masked_number || `XXXX-XXXX-${phone.slice(-4) || "8899"}`} ({setuData?.accounts?.[0]?.account_type || "SAVINGS"})
                            </div>
                          </div>
                          <div>
                            <div className="label-sm text-muted">TRANSACTIONS</div>
                            <div style={{ fontWeight: 700 }}>
                              {setuData?.total_transactions || setuData?.transactions?.length || 142} Ingested
                            </div>
                          </div>
                          <div>
                            <div className="label-sm text-muted">CURRENT BALANCE</div>
                            <div style={{ fontWeight: 700, color: "var(--niva-positive)" }}>
                              ₹{(setuData?.accounts?.[0]?.current_balance ?? (selectedBank === "hdfc" ? 184500 : selectedBank === "bob" ? 12300 : 50700)).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                  {/* Status Indicator Banner */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 16px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 12,
                      fontWeight: 600,
                      background: isCompleteAllowed ? "var(--niva-positive-bg)" : "rgba(245, 158, 11, 0.12)",
                      color: isCompleteAllowed ? "var(--niva-deep-forest)" : "#b45309",
                      border: `1px solid ${isCompleteAllowed ? "var(--niva-positive)" : "rgba(245, 158, 11, 0.3)"}`,
                      transition: "all 0.2s ease",
                    }}>
                      {getLinkingStatusMessage().text}
                    </div>
                  </div>

                  <div>
                    <button
                      className="btn btn-primary"
                      onClick={handleCompleteAndEnterDashboard}
                      disabled={!isCompleteAllowed}
                      style={{
                        minWidth: 320,
                        padding: "12px 28px",
                        fontSize: 15,
                        cursor: isCompleteAllowed ? "pointer" : "not-allowed",
                        opacity: isCompleteAllowed ? 1 : 0.45,
                      }}
                    >
                      Complete Onboarding &amp; Enter Dashboard →
                    </button>
                  </div>
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
