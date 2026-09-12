"use client";

import { useState, useEffect, useRef } from "react";
import {
  verifyOtp,
  createConsent,
  approveConsent,
  getJourneyState,
  submitEmpatheticAction,
  sendChatMessage,
  uploadBankStatement,
} from "@/lib/api";
import {
  SBILogo,
  HDFCLogo,
  ICICILogo,
  BOBLogo,
  ShieldIcon,
  LockIcon,
  CheckCircleIcon,
  BanIcon,
  BrainIcon,
  HandshakeIcon,
  IdCardIcon,
  BuildingBankIcon,
  MessageSquareIcon,
  VolumeIcon,
  SparklesIcon,
  FileTextIcon,
} from "@/components/icons";

type PersonaId = "rajesh_sharma" | "anita_desai" | "vikram_patel";
type Language = "en" | "hi" | "gu";

const PERSONAS: Record<PersonaId, { name: string; phone: string; desc: string; stress: string; stressLabel: string; city: string }> = {
  rajesh_sharma: {
    name: "Rajesh Sharma",
    phone: "+91 98765 43210",
    desc: "Kirana store owner in Surat. Hit by a sudden hospital bill. High EMI burden.",
    stress: "high",
    stressLabel: "Stress Active",
    city: "Surat, Gujarat",
  },
  anita_desai: {
    name: "Anita Desai",
    phone: "+91 98234 56789",
    desc: "Software engineer in Bengaluru. Healthy savings, stable income. Ready for wealth building.",
    stress: "low",
    stressLabel: "Financially Healthy",
    city: "Bengaluru, Karnataka",
  },
  vikram_patel: {
    name: "Vikram Patel",
    phone: "+91 97123 88990",
    desc: "Gig delivery partner in Gandhinagar. Multiple debts, bounced fees, erratic income.",
    stress: "critical",
    stressLabel: "Severe Stress",
    city: "Gandhinagar, Gujarat",
  },
};

const STAGE_LABELS = [
  "Onboarding & Auth",
  "AA Consent & Data",
  "Financial Twin",
  "Responsible Gate",
  "Personalized Action",
  "Bank Portal",
];

const BANKS = [
  { id: "sbi", name: "State Bank of India", Logo: SBILogo },
  { id: "hdfc", name: "HDFC Bank", Logo: HDFCLogo },
  { id: "icici", name: "ICICI Bank", Logo: ICICILogo },
  { id: "bob", name: "Bank of Baroda", Logo: BOBLogo },
];

const VOICE_TEXT: Record<Language, string> = {
  en: "Hello! I am NIVA, your financial copilot. To give you the best advice, I need to securely access your bank statements through RBI's Account Aggregator framework. Your data is encrypted end-to-end. You can revoke consent at any time.",
  hi: "Namaste! Main NIVA hoon, aapka financial copilot. Aapko sabse achhi salah dene ke liye, mujhe RBI ke Account Aggregator framework ke zariye aapke bank statements tak surakshit pahunch chahiye. Aapka data end-to-end encrypted hai. Aap kabhi bhi consent revoke kar sakte hain.",
  gu: "Namaskar! Hu NIVA chhu, tamaro financial copilot. Tamane shreshth salah aapva mate, mane RBI na Account Aggregator framework dwara tamara bank statements surakshit rite access karva padse. Tamaro data end-to-end encrypted chhe. Tame gme tyare consent revoke kari shako chho.",
};

export default function JourneyPage() {
  const [stage, setStage] = useState(0);
  const [persona, setPersona] = useState<PersonaId>("rajesh_sharma");
  const [language, setLanguage] = useState<Language>("en");

  // Stage 1 state
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [kyc, setKyc] = useState<any>(null);

  // Stage 2 state — Dual Ingestion
  const [ingestionMethod, setIngestionMethod] = useState<"upload" | "setu" | "persona">("upload");
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedSummary, setUploadedSummary] = useState<any>(null);
  const [setuConsentUrl, setSetuConsentUrl] = useState<string | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>("sbi");
  const [bankOtpDone, setBankOtpDone] = useState(false);
  const [dataFetching, setDataFetching] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // Stage 3-6 state
  const [journeyData, setJourneyData] = useState<any>(null);
  const [twinAnimating, setTwinAnimating] = useState(false);
  const [twinRevealed, setTwinRevealed] = useState(false);
  const [gateAnimating, setGateAnimating] = useState(false);
  const [gateRevealed, setGateRevealed] = useState(false);
  const [reliefAccepted, setReliefAccepted] = useState(false);
  const [reliefLoading, setReliefLoading] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotReply, setCopilotReply] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  // Reset state when persona changes
  function resetJourney() {
    setStage(0);
    setOtp("");
    setOtpVerified(false);
    setKyc(null);
    setConsentGiven(false);
    setSelectedBank("sbi");
    setBankOtpDone(false);
    setDataFetching(false);
    setDataFetched(false);
    setJourneyData(null);
    setTwinAnimating(false);
    setTwinRevealed(false);
    setGateAnimating(false);
    setGateRevealed(false);
    setReliefAccepted(false);
    setCopilotInput("");
    setCopilotReply("");
    setUploadedSummary(null);
    setStatementFile(null);
    setSetuConsentUrl(null);
  }

  // Scroll to top of stage content on stage change
  useEffect(() => {
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage]);


  // Stage 1: Verify OTP
  async function handleVerifyOtp() {
    if (otp.length !== 6) return;
    setOtpLoading(true);
    try {
      const res = await verifyOtp(PERSONAS[persona].phone, otp, persona);
      setKyc(res.kyc_profile);
      setOtpVerified(true);
    } catch (e: any) {
      alert(e.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  }

  // Stage 2: Voice explanation
  function speakExplanation() {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(VOICE_TEXT[language]);
    utterance.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synth.speak(utterance);
  }

  // Stage 2: Ingestion Handlers
  async function handleFileUpload(fileToUpload?: File) {
    const file = fileToUpload || statementFile;
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadBankStatement(file, "custom_user", kyc?.full_name || "Kailash Verma", PERSONAS[persona].phone);
      setUploadedSummary(res);
      setDataFetched(true);
      const fullData = await getJourneyState("custom_user");
      setJourneyData(fullData);
    } catch (e: any) {
      alert("Statement upload error: " + (e.message || e));
    } finally {
      setUploading(false);
    }
  }

  function handleLoadSampleStatement() {
    const sampleCsv = `Date,Narration,Withdrawal,Deposit,Balance
01/08/2026,SALARY CREDIT NEFT TECH CORP,0,65000,65000
05/08/2026,ACH DEBIT SBI HOME LOAN EMI,18500,0,46500
10/08/2026,UPI/DMART GROCERY STORE,4200,0,42300
15/08/2026,UPI/TORRENT POWER ELECTRICITY,1500,0,40800
20/08/2026,UPI/APOLLO PHARMACY MEDICAL,2100,0,38700
25/08/2026,UPI/CREDIT INFLOW STORE SALES,0,12000,50700`;

    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const file = new File([blob], "sbi_surat_retail_statement.csv", { type: "text/csv" });
    setStatementFile(file);
    handleFileUpload(file);
  }

  async function handleSetuBridgeConnect() {
    setDataFetching(true);
    try {
      const res = await createConsent(PERSONAS[persona].phone);
      if (res.redirect_url) {
        setSetuConsentUrl(res.redirect_url);
      }
      await new Promise((r) => setTimeout(r, 2200));
      setBankOtpDone(true);
      setDataFetched(true);
      const data = await getJourneyState(persona);
      setJourneyData(data);
    } catch (e: any) {
      alert("Setu Bridge connection: " + (e.message || e));
    } finally {
      setDataFetching(false);
    }
  }

  // Stage 2: Simulate AA data fetch
  async function handleBankOtp() {
    setBankOtpDone(true);
    setDataFetching(true);
    // Simulate encrypted data transfer animation
    await new Promise((r) => setTimeout(r, 2000));
    setDataFetching(false);
    setDataFetched(true);
  }

  // Stage 3: Load full journey data
  async function loadTwinData() {
    setTwinAnimating(true);
    try {
      const activeId = uploadedSummary ? "custom_user" : persona;
      const data = await getJourneyState(activeId);
      setJourneyData(data);
      // Animate reveal after a short delay
      await new Promise((r) => setTimeout(r, 1200));
      setTwinRevealed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setTwinAnimating(false);
    }
  }

  // Stage 4: Animate gate decisions
  async function animateGate() {
    setGateAnimating(true);
    await new Promise((r) => setTimeout(r, 1800));
    setGateRevealed(true);
    setGateAnimating(false);
  }

  // Stage 5: Accept empathetic relief
  async function handleAcceptRelief() {
    if (!journeyData) return;
    setReliefLoading(true);
    try {
      const activeId = uploadedSummary ? "custom_user" : persona;
      const offer = journeyData.empathetic_offer;
      await submitEmpatheticAction(activeId, offer.type, offer.title);
      setReliefAccepted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setReliefLoading(false);
    }
  }

  // Stage 5: Mini copilot
  async function handleCopilotSend() {
    if (!copilotInput.trim() || copilotLoading) return;
    setCopilotLoading(true);
    try {
      const activeId = uploadedSummary ? "custom_user" : persona;
      const res = await sendChatMessage(copilotInput, activeId, language);
      setCopilotReply(res.reply || "I could not process that. Please try again.");
    } catch {
      setCopilotReply("Backend unavailable. Please ensure the API server is running.");
    } finally {
      setCopilotLoading(false);
    }
  }


  // Auto-trigger data loading on stage enter
  useEffect(() => {
    if (stage >= 2 && !journeyData && !twinAnimating) {
      loadTwinData();
    }
    if (stage >= 3 && journeyData && !gateRevealed && !gateAnimating) {
      animateGate();
    }
  }, [stage, journeyData, twinAnimating, gateRevealed, gateAnimating]);

  const canAdvance = (): boolean => {
    switch (stage) {
      case 0: return otpVerified;
      case 1: return dataFetched;
      case 2: return twinRevealed;
      case 3: return gateRevealed;
      case 4: return true;
      default: return false;
    }
  };

  function advance() {
    if (stage < 5) {
      const next = stage + 1;
      setStage(next);
      if (next >= 2 && !journeyData) loadTwinData();
      if (next >= 3 && !gateRevealed) animateGate();
    }
  }

  const p = PERSONAS[persona];
  const ft = journeyData?.financial_twin;
  const gate = journeyData?.responsible_gate;

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand">
            <span className="navbar-brand-icon">N</span>
            NIVA
          </a>
          <ul className="navbar-tabs">
            <li><a href="/">Overview</a></li>
            <li><a href="/journey" className="active">Journey</a></li>
            <li><a href="/ask-niva">Ask NIVA</a></li>
            <li><a href="/bank">Bank Portal</a></li>
          </ul>
          <div className="navbar-right">
            <div className="flex-gap-sm">
              {(["en", "hi", "gu"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    border: language === l ? "2px solid var(--niva-electric-lime)" : "1px solid var(--niva-border)",
                    background: language === l ? "var(--niva-deep-forest)" : "transparent",
                    color: language === l ? "var(--niva-electric-lime)" : "var(--niva-text-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हिन्दी" : "ગુજ"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Stepper */}
      <div style={{
        background: "var(--niva-canvas)",
        borderBottom: "1px solid var(--niva-border)",
        padding: "16px 0",
        position: "sticky",
        top: 60,
        zIndex: 90,
      }}>
        <div className="page-container" style={{
          display: "flex", alignItems: "center", gap: 0,
          overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
        }}>
          {STAGE_LABELS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 120 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                opacity: i <= stage ? 1 : 0.6,
                transition: "opacity 0.2s ease",
              }} onClick={() => {
                setStage(i);
                if (i >= 2 && !journeyData) loadTwinData();
                if (i >= 3 && !gateRevealed) animateGate();
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                  background: i < stage ? "var(--niva-positive)" : i === stage ? "var(--niva-deep-forest)" : "var(--niva-canvas-dim)",
                  color: i <= stage ? "#fff" : "var(--niva-text-muted)",
                  transition: "all 0.3s ease",
                }}>
                  {i < stage ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: i === stage ? 700 : 500,
                  color: i === stage ? "var(--niva-deep-forest)" : "var(--niva-text-muted)",
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </div>
              {i < 5 && (
                <div style={{
                  flex: 1, height: 2, margin: "0 8px", minWidth: 16,
                  background: i < stage ? "var(--niva-positive)" : "var(--niva-border)",
                  transition: "background 0.5s ease",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage Content */}
      <div className="page-container page-content" ref={stageRef} style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="stack-xl">


          {/* ═══════════════ STAGE 0: Onboarding & Auth ═══════════════ */}
          {stage === 0 && (
            <div className="stack-xl" style={{ animation: "fadeSlideUp 0.5s ease forwards" }}>
              <section>
                <span className="label-sm text-muted">STAGE 1 OF 6</span>
                <h1 className="headline-lg" style={{ marginTop: 4 }}>
                  {language === "hi" ? "भाषा चुनें और अपनी पहचान सत्यापित करें" :
                   language === "gu" ? "ભાષા પસંદ કરો અને ઓળખ ચકાસો" :
                   "Select Language & Verify Identity"}
                </h1>
                <p className="body-md text-secondary" style={{ marginTop: 4 }}>
                  {language === "hi" ? "NIVA आपकी भाषा में काम करता है। अपना मोबाइल OTP दर्ज करें।" :
                   language === "gu" ? "NIVA તમારી ભાષામાં કામ કરે છે। તમારો મોબાઈલ OTP દાખલ કરો." :
                   "NIVA works in your language. Enter your mobile OTP to verify identity."}
                </p>
              </section>

              {/* Persona Picker */}
              <div className="card">
                <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>SELECT DEMO PERSONA</span>
                <div className="grid-3" style={{ gap: 12 }}>
                  {(Object.keys(PERSONAS) as PersonaId[]).map((pid) => {
                    const pp = PERSONAS[pid];
                    const active = persona === pid;
                    return (
                      <button key={pid} onClick={() => { if (pid !== persona) { setPersona(pid); resetJourney(); }}} style={{
                        padding: "16px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
                        border: active ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                        background: active ? "var(--niva-canvas)" : "var(--niva-canvas-subtle)",
                        transition: "all 0.2s ease",
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{pp.name}</div>
                        <div style={{ fontSize: 12, color: "var(--niva-text-muted)", marginBottom: 8 }}>{pp.city}</div>
                        <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--niva-text-secondary)" }}>{pp.desc}</div>
                        <div style={{
                          marginTop: 8, display: "inline-block", padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: 11, fontWeight: 600,
                          background: pp.stress === "low" ? "var(--niva-positive-bg)" : pp.stress === "high" ? "var(--niva-critical-bg)" : "var(--niva-warning-bg)",
                          color: pp.stress === "low" ? "var(--niva-positive)" : pp.stress === "high" ? "var(--niva-critical)" : "var(--niva-warning)",
                        }}>
                          {pp.stressLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OTP Input */}
              <div className="card">
                <span className="label-sm text-muted" style={{ marginBottom: 8, display: "block" }}>MOBILE OTP VERIFICATION</span>
                <p className="body-sm text-secondary" style={{ marginBottom: 16 }}>
                  {language === "hi" ? `OTP भेजा गया: ${p.phone}` :
                   language === "gu" ? `OTP મોકલ્યો: ${p.phone}` :
                   `OTP sent to ${p.phone}`}
                </p>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    disabled={otpVerified}
                    onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOtp(); }}
                    style={{
                      padding: "12px 16px", fontSize: 18, fontWeight: 700, letterSpacing: 8, textAlign: "center",
                      width: 220, borderRadius: "var(--radius-md)",
                      border: otpVerified ? "2px solid var(--niva-positive)" : "1px solid var(--niva-border)",
                      background: otpVerified ? "var(--niva-positive-bg)" : "var(--niva-canvas)",
                      fontFamily: "'Inter', monospace",
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || otpLoading || otpVerified}
                  >
                    {otpLoading ? "Verifying..." : otpVerified ? "Verified ✓" : "Verify OTP"}
                  </button>
                </div>
                <p className="body-sm text-muted">For demo: enter any 6 digits (e.g. 123456)</p>
              </div>

              {/* KYC Card */}
              {kyc && (
                <div className="card" style={{ animation: "fadeSlideUp 0.4s ease forwards", border: "2px solid var(--niva-positive)" }}>
                  <div className="flex-between" style={{ marginBottom: 16 }}>
                    <div className="flex-gap-sm">
                      <IdCardIcon size={20} color="var(--niva-positive)" />
                      <span className="label-sm" style={{ color: "var(--niva-positive)" }}>DigiLocker e-KYC VERIFIED</span>
                    </div>
                    <span className="chip chip-positive">Identity Confirmed</span>
                  </div>
                  <div className="grid-2" style={{ gap: "12px 32px" }}>
                    {[
                      ["Full Name", kyc.full_name],
                      ["Aadhaar", kyc.masked_aadhaar],
                      ["PAN", kyc.pan],
                      ["Date of Birth", kyc.dob],
                      ["Occupation", kyc.occupation],
                      ["Address", kyc.address],
                      ["Bank Linked", kyc.bank_linked],
                      ["KYC Source", kyc.kyc_source],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="label-sm text-muted" style={{ marginBottom: 2 }}>{label}</div>
                        <div className="body-md" style={{ fontWeight: 500 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ STAGE 1: AA Consent & Data Ingestion ═══════════════ */}
          {stage === 1 && (
            <div className="stack-xl" style={{ animation: "fadeSlideUp 0.5s ease forwards" }}>
              <section>
                <div className="flex-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <span className="label-sm text-muted">STAGE 2 OF 6</span>
                    <h1 className="headline-lg" style={{ marginTop: 4 }}>
                      {language === "hi" ? "डेटा इनपुट और RBI Account Aggregator सहमति" :
                       language === "gu" ? "ડેટા ઇનપુટ અને RBI Account Aggregator સંમતિ" :
                       "Data Ingestion & RBI Account Aggregator Consent"}
                    </h1>
                    <p className="body-md text-secondary" style={{ marginTop: 4 }}>
                      {language === "hi" ? "असली बैंक स्टेटमेंट अपलोड करें या लाइव Setu AA ब्रिज से कनेक्ट करें।" :
                       language === "gu" ? "વાસ્તવિક બેંક સ્ટેટમેન્ટ અપલોડ કરો અથવા લાઇવ Setu AA બ્રિજથી કનેક્ટ કરો." :
                       "Upload your real bank statement or connect directly via live Setu Account Aggregator."}
                    </p>
                  </div>
                  {/* Ingestion Mode Switcher */}
                  <div style={{
                    display: "flex", gap: 6, background: "var(--niva-canvas-subtle)",
                    padding: 4, borderRadius: "var(--radius-pill)", border: "1px solid var(--niva-border)",
                  }}>
                    <button
                      onClick={() => setIngestionMethod("upload")}
                      style={{
                        padding: "6px 14px", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer",
                        background: ingestionMethod === "upload" ? "var(--niva-deep-forest)" : "transparent",
                        color: ingestionMethod === "upload" ? "var(--niva-electric-lime)" : "var(--niva-text-secondary)",
                        fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <FileTextIcon size={14} color={ingestionMethod === "upload" ? "var(--niva-electric-lime)" : "currentColor"} />
                      Upload Statement
                    </button>
                    <button
                      onClick={() => setIngestionMethod("setu")}
                      style={{
                        padding: "6px 14px", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer",
                        background: ingestionMethod === "setu" ? "var(--niva-deep-forest)" : "transparent",
                        color: ingestionMethod === "setu" ? "var(--niva-electric-lime)" : "var(--niva-text-secondary)",
                        fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ShieldIcon size={14} color={ingestionMethod === "setu" ? "var(--niva-electric-lime)" : "currentColor"} />
                      Live Setu AA Bridge
                    </button>
                    <button
                      onClick={() => setIngestionMethod("persona")}
                      style={{
                        padding: "6px 14px", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer",
                        background: ingestionMethod === "persona" ? "var(--niva-deep-forest)" : "transparent",
                        color: ingestionMethod === "persona" ? "var(--niva-electric-lime)" : "var(--niva-text-secondary)",
                        fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <BrainIcon size={14} color={ingestionMethod === "persona" ? "var(--niva-electric-lime)" : "currentColor"} />
                      Demo Persona
                    </button>
                  </div>
                </div>
              </section>

              {/* ──────────────── PATH A: Upload Real Bank Statement ──────────────── */}
              {ingestionMethod === "upload" && (
                <div className="stack-lg" style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
                  <div className="card" style={{ border: "2px dashed var(--niva-border)", padding: "2.5rem 2rem", textAlign: "center" }}>
                    <div style={{ marginBottom: 12 }}>
                      <FileTextIcon size={44} color="var(--niva-electric-lime)" />
                    </div>
                    <h3 className="headline-sm" style={{ marginBottom: 6 }}>
                      {language === "hi" ? "अपना बैंक स्टेटमेंट अपलोड करें" :
                       language === "gu" ? "તમારું બેંક સ્ટેટમેન્ટ અપલોડ કરો" :
                       "Upload Real Bank Statement"}
                    </h3>
                    <p className="body-sm text-secondary" style={{ maxWidth: 520, margin: "0 auto 20px" }}>
                      Supports standard Indian Bank statements (.CSV, .XLSX, or Excel) from SBI, HDFC, ICICI, Bank of Baroda, Axis, and PNB. Normalized instantly into ReBIT 1.1 JSON format.
                    </p>

                    {/* File Input Controls */}
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

                      {/* Instant Sample Data Loader */}
                      <button
                        className="btn btn-outline"
                        onClick={handleLoadSampleStatement}
                        disabled={uploading}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                      >
                        <SparklesIcon size={16} color="var(--niva-electric-lime)" />
                        ⚡ Load Surat Kirana Trader Statement (Real CSV)
                      </button>
                    </div>

                    {uploading && (
                      <div style={{ marginTop: 20 }}>
                        <p className="body-sm text-muted">Parsing transaction rows and generating ReBIT 1.1 schema...</p>
                        <div style={{ marginTop: 10, height: 4, background: "var(--niva-canvas-dim)", borderRadius: 4, overflow: "hidden", maxWidth: 300, margin: "10px auto 0" }}>
                          <div style={{ height: "100%", background: "var(--niva-positive)", borderRadius: 4, animation: "progressBar 1.5s ease forwards" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Statement Result Banner */}
                  {uploadedSummary && (
                    <div className="card" style={{ border: "2px solid var(--niva-positive)", animation: "fadeSlideUp 0.4s ease forwards" }}>
                      <div className="flex-between" style={{ marginBottom: 12 }}>
                        <div className="flex-gap-sm">
                          <CheckCircleIcon size={24} color="var(--niva-positive)" />
                          <div>
                            <div className="headline-sm">Real Statement Parsed &amp; Ingested!</div>
                            <div className="body-sm text-muted">File: {uploadedSummary.filename} • {uploadedSummary.transactions_parsed} transactions mapped</div>
                          </div>
                        </div>
                        <span className="chip chip-positive">ReBIT 1.1 Verified</span>
                      </div>

                      <div className="grid-4" style={{ gap: 12, marginTop: 16 }}>
                        <div style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                          <div className="label-sm text-muted">TRANSACTIONS</div>
                          <div className="body-md" style={{ fontWeight: 700, marginTop: 2 }}>{uploadedSummary.transactions_parsed} Rows</div>
                        </div>
                        <div style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                          <div className="label-sm text-muted">ANALYZED INFLOW</div>
                          <div className="body-md" style={{ fontWeight: 700, marginTop: 2, color: "var(--niva-positive)" }}>
                            ₹{uploadedSummary.twin.income.monthly_income.toLocaleString("en-IN")}/mo
                          </div>
                        </div>
                        <div style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                          <div className="label-sm text-muted">ESSENTIAL SPEND</div>
                          <div className="body-md" style={{ fontWeight: 700, marginTop: 2 }}>
                            ₹{uploadedSummary.twin.expenses.essential.toLocaleString("en-IN")}/mo
                          </div>
                        </div>
                        <div style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                          <div className="label-sm text-muted">CURRENT BALANCE</div>
                          <div className="body-md" style={{ fontWeight: 700, marginTop: 2, color: "var(--niva-deep-forest)" }}>
                            ₹{uploadedSummary.twin.liquidity.available_balance.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="body-sm text-muted">
                          Telemetry synced with Financial Twin Engine and Bank Portal. Click Continue below to view Twin.
                        </span>
                        <button className="btn btn-primary" onClick={advance}>
                          Proceed to Financial Twin →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────── PATH B: Live Setu Account Aggregator ──────────────── */}
              {ingestionMethod === "setu" && (
                <div className="stack-lg" style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
                  {/* Setu FIU Credentials Badge */}
                  <div className="card" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(2,6,23,0.02) 100%)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <div className="flex-between" style={{ marginBottom: 10 }}>
                      <div className="flex-gap-sm">
                        <BuildingBankIcon size={20} color="var(--niva-positive)" />
                        <span className="label-sm" style={{ color: "var(--niva-positive)", fontWeight: 700 }}>SETU AA BRIDGE — LIVE CREDENTIALS CONFIGURED</span>
                      </div>
                      <span className="chip chip-positive" style={{ fontSize: 11 }}>UAT Sandbox Ready</span>
                    </div>
                    <div className="grid-3" style={{ gap: 12 }}>
                      <div>
                        <div className="label-sm text-muted">REGISTERED FIU</div>
                        <div className="body-sm" style={{ fontWeight: 600 }}>Nitin Patidar</div>
                      </div>
                      <div>
                        <div className="label-sm text-muted">PRODUCT INSTANCE ID</div>
                        <div className="body-sm font-mono" style={{ fontSize: 12 }}>64db2bfb...f289</div>
                      </div>
                      <div>
                        <div className="label-sm text-muted">GATEWAY BASE URL</div>
                        <div className="body-sm font-mono" style={{ fontSize: 12 }}>https://fiu-uat.setu.co</div>
                      </div>
                    </div>
                  </div>

                  {/* Voice Explanation */}
                  <div className="card">
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                      <div className="flex-gap-sm">
                        <VolumeIcon size={20} color="var(--niva-electric-lime)" />
                        <span className="label-sm text-muted">VERNACULAR VOICE EXPLANATION</span>
                      </div>
                      <button
                        className={`btn ${isSpeaking ? "btn-outline" : "btn-primary"}`}
                        onClick={speakExplanation}
                        style={{ minWidth: 140 }}
                      >
                        {isSpeaking ? "Speaking..." : language === "hi" ? "सुनें" : language === "gu" ? "સાંભળો" : "Listen"}
                      </button>
                    </div>
                    <div className="info-banner info">
                      <ShieldIcon size={18} color="var(--niva-electric-lime)" />
                      <div>
                        <p className="body-sm">{VOICE_TEXT[language]}</p>
                      </div>
                    </div>
                  </div>

                  {/* DPDP Consent Card */}
                  <div className="card">
                    <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>DPDP ACT 2023 — GRANULAR CONSENT</span>
                    <div className="grid-3" style={{ gap: 16, marginBottom: 16 }}>
                      <div style={{ padding: 16, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                        <div className="label-sm text-muted">PURPOSE</div>
                        <div className="body-md" style={{ fontWeight: 600, marginTop: 4 }}>
                          {language === "hi" ? "ऋण पात्रता और वित्तीय सलाह" : language === "gu" ? "લોન પાત્રતા અને નાણાકીય સલાહ" : "Loan Eligibility & Financial Advisory"}
                        </div>
                      </div>
                      <div style={{ padding: 16, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                        <div className="label-sm text-muted">DURATION</div>
                        <div className="body-md" style={{ fontWeight: 600, marginTop: 4 }}>6 Months</div>
                      </div>
                      <div style={{ padding: 16, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                        <div className="label-sm text-muted">DATA TYPES</div>
                        <div className="body-md" style={{ fontWeight: 600, marginTop: 4 }}>Savings, Deposits, EMI</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => setConsentGiven(true)}
                        disabled={consentGiven}
                        style={{ minWidth: 200 }}
                      >
                        {consentGiven ? "Consent Given ✓" : language === "hi" ? "मैं सहमत हूँ" : language === "gu" ? "હું સંમત છું" : "I Consent"}
                      </button>
                      <span className="body-sm text-muted">
                        {language === "hi" ? "आप कभी भी यह सहमति वापस ले सकते हैं" :
                         language === "gu" ? "તમે ગમે ત્યારે આ સંમતિ પાછી ખેંચી શકો છો" :
                         "You can revoke this consent at any time"}
                      </span>
                    </div>
                  </div>

                  {/* Bank Selector */}
                  {consentGiven && (
                    <div className="card" style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
                      <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>SELECT YOUR BANK (SETU AA BRIDGE)</span>
                      <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
                        {BANKS.map((bank) => (
                          <button key={bank.id} onClick={() => setSelectedBank(bank.id)} style={{
                            padding: 16, borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                            border: selectedBank === bank.id ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                            background: selectedBank === bank.id ? "var(--niva-canvas)" : "var(--niva-canvas-subtle)",
                            transition: "all 0.2s ease",
                          }}>
                            <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><bank.Logo size={36} /></div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{bank.name}</div>
                          </button>
                        ))}
                      </div>

                      {selectedBank && !bankOtpDone && (
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <button className="btn btn-primary" onClick={handleSetuBridgeConnect} disabled={dataFetching}>
                            {dataFetching ? "Connecting Setu Bridge..." : "Connect Live Setu AA Bridge & Ingest Data"}
                          </button>
                          <span className="body-sm text-muted">Triggers RBI Account Aggregator telemetry</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Data Fetch Animation */}
                  {dataFetching && (
                    <div className="card" style={{ textAlign: "center", padding: "2rem", animation: "fadeSlideUp 0.4s ease forwards" }}>
                      <div style={{ marginBottom: 12 }}><LockIcon size={36} color="var(--niva-electric-lime)" /></div>
                      <div className="headline-sm" style={{ marginBottom: 8 }}>
                        {language === "hi" ? "Setu AA ब्रिज से एन्क्रिप्टेड डेटा प्राप्त हो रहा है..." :
                         language === "gu" ? "Setu AA બ્રિજથી એન્ક્રિપ્ટેડ ડેટા મેળવી રહ્યા છીએ..." :
                         "Fetching Encrypted ReBIT 1.1 Data via Setu Bridge..."}
                      </div>
                      <div className="body-sm text-muted">FIP ({selectedBank?.toUpperCase() || "BANK"}) → Setu AA Gateway → NIVA (FIU)</div>
                      <div style={{ marginTop: 16, height: 4, background: "var(--niva-canvas-dim)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", background: "var(--niva-positive)", borderRadius: 4,
                          animation: "progressBar 2.2s ease forwards",
                        }} />
                      </div>
                    </div>
                  )}

                  {dataFetched && !dataFetching && (
                    <div className="card" style={{ border: "2px solid var(--niva-positive)", animation: "fadeSlideUp 0.4s ease forwards" }}>
                      <div className="flex-gap-sm" style={{ marginBottom: 8 }}>
                        <CheckCircleIcon size={22} color="var(--niva-positive)" />
                        <span className="headline-sm">
                          {language === "hi" ? "Setu AA डेटा सफलतापूर्वक प्राप्त!" :
                           language === "gu" ? "Setu AA ડેટા સફળતાપૂર્વક મેળવ્યો!" :
                           "Live AA Session Successfully Ingested!"}
                        </span>
                      </div>
                      <p className="body-sm text-muted">
                        ReBIT 1.1 standard JSON • End-to-end encrypted • Zero credential storage
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────── PATH C: Demo Persona ──────────────── */}
              {ingestionMethod === "persona" && (
                <div className="stack-lg" style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
                  <div className="card">
                    <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>SIMULATED DEMO TELEMETRY</span>
                    <p className="body-sm text-secondary" style={{ marginBottom: 16 }}>
                      Active Persona: <strong>{PERSONAS[persona].name}</strong> ({PERSONAS[persona].city})
                    </p>
                    <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
                      {BANKS.map((bank) => (
                        <button key={bank.id} onClick={() => setSelectedBank(bank.id)} style={{
                          padding: 16, borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                          border: selectedBank === bank.id ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                          background: selectedBank === bank.id ? "var(--niva-canvas)" : "var(--niva-canvas-subtle)",
                          transition: "all 0.2s ease",
                        }}>
                          <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><bank.Logo size={36} /></div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{bank.name}</div>
                        </button>
                      ))}
                    </div>
                    {!dataFetched && (
                      <button className="btn btn-primary" onClick={handleBankOtp}>
                        Load Persona Telemetry
                      </button>
                    )}
                  </div>

                  {dataFetched && (
                    <div className="card" style={{ border: "2px solid var(--niva-positive)", animation: "fadeSlideUp 0.4s ease forwards" }}>
                      <div className="flex-gap-sm" style={{ marginBottom: 8 }}>
                        <CheckCircleIcon size={22} color="var(--niva-positive)" />
                        <span className="headline-sm">Telemetry Loaded for {PERSONAS[persona].name}</span>
                      </div>
                      <p className="body-sm text-muted">
                        High-fidelity transaction dataset active. Click Continue to inspect Twin.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* ═══════════════ STAGE 2: Financial Twin ═══════════════ */}
          {stage === 2 && (
            <div className="stack-xl" style={{ animation: "fadeSlideUp 0.5s ease forwards" }}>
              <section>
                <span className="label-sm text-muted">STAGE 3 OF 6</span>
                <h1 className="headline-lg" style={{ marginTop: 4 }}>
                  {language === "hi" ? "AI वित्तीय डिजिटल ट्विन" : language === "gu" ? "AI નાણાકીય ડિજિટલ ટ્વીન" : "AI Financial Digital Twin"}
                </h1>
              </section>

              {!twinRevealed ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ marginBottom: 16 }}><BrainIcon size={44} color="var(--niva-electric-lime)" /></div>
                  <div className="headline-sm" style={{ marginBottom: 8 }}>
                    {language === "hi" ? "लेन-देन का विश्लेषण हो रहा है..." :
                     language === "gu" ? "વ્યવહારોનું વિશ્લેષણ થઈ રહ્યું છે..." :
                     "Analyzing Transactions..."}
                  </div>
                  <div className="body-sm text-muted">Behavioral segmentation • Stress scoring • Anomaly detection</div>
                  <div style={{ marginTop: 16, height: 4, background: "var(--niva-canvas-dim)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", background: "var(--niva-electric-lime)", borderRadius: 4,
                      animation: "progressBar 1.2s ease forwards",
                    }} />
                  </div>
                </div>
              ) : ft && (
                <>
                  {/* Segmentation Badge */}
                  <div className={`info-banner ${ft.stress_level === "low" ? "info" : "warning"}`} style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
                    <span className={`status-dot ${ft.stress_level === "low" ? "positive" : ft.stress_level === "critical" || ft.stress_level === "high" ? "critical" : "warning"}`} style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%" }} />
                    <div>
                      <strong>Behavioral Segmentation: </strong>
                      {ft.stress_level === "low" ? "Financially Stable — Ideal for Wealth Creation" :
                       ft.stress_level === "critical" ? "Severe Financial Stress — Debt Relief Priority" :
                       "Financial Stress Detected — Medical/Expense Anomaly"}
                    </div>
                  </div>

                  {/* Score Meters */}
                  <div className="card" style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
                    <div className="grid-4" style={{ gap: 20 }}>
                      {[
                        { label: "Health Score", value: ft.health_score, max: 100, color: ft.health_score >= 70 ? "var(--niva-positive)" : ft.health_score >= 50 ? "var(--niva-warning)" : "var(--niva-critical)" },
                        { label: "Stress Score", value: ft.stress_score, max: 100, color: ft.stress_score <= 40 ? "var(--niva-positive)" : ft.stress_score <= 60 ? "var(--niva-warning)" : "var(--niva-critical)" },
                        { label: "Emergency Buffer", value: ft.emergency_months, max: 6, suffix: " mo", color: ft.emergency_months >= 3 ? "var(--niva-positive)" : "var(--niva-critical)" },
                        { label: "DTI Ratio", value: Math.round(ft.dti_ratio * 100), max: 100, suffix: "%", color: ft.dti_ratio <= 0.35 ? "var(--niva-positive)" : "var(--niva-critical)" },
                      ].map((m) => (
                        <div key={m.label} style={{ textAlign: "center" }}>
                          <div className="label-sm text-muted" style={{ marginBottom: 8 }}>{m.label}</div>
                          <div style={{ fontSize: 36, fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums" }}>
                            {m.value}{m.suffix || ""}
                          </div>
                          <div style={{ marginTop: 8, height: 6, background: "var(--niva-canvas-dim)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", background: m.color, borderRadius: 3,
                              width: `${Math.min(100, (m.value / m.max) * 100)}%`,
                              transition: "width 1s ease",
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="card" style={{ animation: "fadeSlideUp 0.5s ease forwards" }}>
                    <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>DERIVED METRICS</span>
                    <div className="grid-3" style={{ gap: 16 }}>
                      {[
                        { label: "Monthly Income", value: `₹${ft.monthly_income?.toLocaleString("en-IN")}` },
                        { label: "Total Expenses", value: `₹${ft.total_expenses?.toLocaleString("en-IN")}` },
                        { label: "Savings Rate", value: `${ft.savings_rate?.toFixed(1)}%` },
                      ].map((m) => (
                        <div key={m.label} style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                          <div className="label-sm text-muted">{m.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stress Factors */}
                  {ft.stress_factors?.length > 0 && (
                    <div className="card" style={{ animation: "fadeSlideUp 0.6s ease forwards" }}>
                      <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>STRESS FACTORS DETECTED</span>
                      {ft.stress_factors.map((f: any, i: number) => (
                        <div key={i} style={{
                          padding: "10px 12px", background: "var(--niva-critical-bg)", borderRadius: "var(--radius-sm)", marginBottom: 8,
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <span className="body-sm">{f.description}</span>
                          <span className="chip chip-critical" style={{ fontSize: 10 }}>+{f.weight} stress</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══════════════ STAGE 3: Responsible Gate ═══════════════ */}
          {stage === 3 && (
            <div className="stack-xl" style={{ animation: "fadeSlideUp 0.5s ease forwards" }}>
              <section>
                <span className="label-sm text-muted">STAGE 4 OF 6</span>
                <h1 className="headline-lg" style={{ marginTop: 4 }}>
                  {language === "hi" ? "जिम्मेदार गेट (नैतिक सुरक्षा)" : language === "gu" ? "જવાબદાર ગેટ (નૈતિક સુરક્ષા)" : "The Responsible Gate (Ethical Guardrail)"}
                </h1>
                <p className="body-md text-secondary" style={{ marginTop: 4 }}>
                  Every product recommendation passes through policy-based suitability checks. Predatory offers are suppressed.
                </p>
              </section>

              {!gateRevealed ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ marginBottom: 16 }}><ShieldIcon size={44} color="var(--niva-electric-lime)" /></div>
                  <div className="headline-sm">Evaluating 6 Products Against Responsible Lending Policies...</div>
                  <div style={{ marginTop: 16, height: 4, background: "var(--niva-canvas-dim)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", background: "var(--niva-deep-forest)", borderRadius: 4,
                      animation: "progressBar 1.8s ease forwards",
                    }} />
                  </div>
                </div>
              ) : gate && (
                <>
                  {/* Summary */}
                  <div className="flex-gap-md" style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
                    <div className="chip chip-critical" style={{ fontSize: 13, padding: "6px 14px" }}>
                      {gate.suppressed_count} Suppressed
                    </div>
                    <div className="chip chip-positive" style={{ fontSize: 13, padding: "6px 14px" }}>
                      {gate.approved_count} Approved
                    </div>
                  </div>

                  {/* Suppressed Products */}
                  {gate.suppressed?.map((rec: any, i: number) => (
                    <div key={i} className="card-gate" style={{ animation: `fadeSlideUp ${0.3 + i * 0.15}s ease forwards` }}>
                      <div className="flex-between" style={{ marginBottom: 12 }}>
                        <div className="flex-gap-sm">
                          <BanIcon size={18} color="var(--niva-critical)" />
                          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{rec.product_name}</span>
                        </div>
                        <span className="card-gate-decision">SUPPRESSED</span>
                      </div>
                      <p className="body-sm" style={{ color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>{rec.gate_reason}</p>
                      {rec.policy_id && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Policy: {rec.policy_id}</span>
                      )}
                      {rec.alternative_action && (
                        <div style={{
                          marginTop: 12, padding: "10px 12px", background: "rgba(148,248,74,0.1)", borderRadius: "var(--radius-sm)",
                          border: "1px solid rgba(148,248,74,0.2)",
                        }}>
                          <span className="label-sm" style={{ color: "var(--niva-gate-lime)" }}>ALTERNATIVE: </span>
                          <span className="body-sm" style={{ color: "rgba(255,255,255,0.9)" }}>{rec.alternative_action}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Approved Products */}
                  {gate.approved?.map((rec: any, i: number) => (
                    <div key={i} className="card" style={{
                      border: "2px solid var(--niva-positive)", animation: `fadeSlideUp ${0.5 + i * 0.15}s ease forwards`,
                    }}>
                      <div className="flex-between">
                        <div className="flex-gap-sm">
                          <CheckCircleIcon size={18} color="var(--niva-positive)" />
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{rec.product_name}</span>
                        </div>
                        <span className="chip chip-positive">RECOMMENDED</span>
                      </div>
                      <p className="body-sm text-secondary" style={{ marginTop: 8 }}>{rec.gate_reason}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ═══════════════ STAGE 4: Personalized Action ═══════════════ */}
          {stage === 4 && (!journeyData ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ marginBottom: 16 }}><HandshakeIcon size={44} color="var(--niva-electric-lime)" /></div>
              <div className="headline-sm">Synthesizing Empathetic Financial Action...</div>
            </div>
          ) : (
            <div className="stack-xl" style={{ animation: "fadeSlideUp 0.5s ease forwards" }}>
              <section>
                <span className="label-sm text-muted">STAGE 5 OF 6</span>
                <h1 className="headline-lg" style={{ marginTop: 4 }}>
                  {language === "hi" ? "आपके लिए व्यक्तिगत कार्रवाई" : language === "gu" ? "તમારા માટે વ્યક્તિગત કાર્યવાહી" : "Hyper-Personalized Action For You"}
                </h1>
              </section>

              {/* Empathetic Intervention */}
              <div className="card" style={{
                border: ft?.stress_level === "low" ? "2px solid var(--niva-positive)" : "2px solid var(--niva-warning)",
              }}>
                <div className="flex-gap-sm" style={{ marginBottom: 12 }}>
                  {ft?.stress_level === "low" ? <SparklesIcon size={20} color="var(--niva-positive)" /> : <HandshakeIcon size={20} color="var(--niva-warning)" />}
                  <span className="label-sm" style={{ color: ft?.stress_level === "low" ? "var(--niva-positive)" : "var(--niva-warning)" }}>
                    {ft?.stress_level === "low" ? "PROACTIVE WEALTH NUDGE" : "EMPATHETIC INTERVENTION"}
                  </span>
                </div>
                <h2 className="headline-sm" style={{ marginBottom: 8 }}>
                  {journeyData.empathetic_offer.title}
                </h2>
                <p className="body-md text-secondary" style={{ marginBottom: 4 }}>
                  {journeyData.empathetic_offer.description}
                </p>
                <p className="body-md" style={{ fontWeight: 700, marginBottom: 16 }}>
                  {journeyData.empathetic_offer.relief_amount}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleAcceptRelief}
                  disabled={reliefAccepted || reliefLoading}
                  style={{ minWidth: 200 }}
                >
                  {reliefLoading ? "Processing..." : reliefAccepted ?
                    (language === "hi" ? "स्वीकार किया ✓" : language === "gu" ? "સ્વીકાર્યું ✓" : "Accepted ✓") :
                    (language === "hi" ? "स्वीकार करें" : language === "gu" ? "સ્વીકારો" : "Accept Relief")}
                </button>
                {reliefAccepted && (
                  <p className="body-sm text-positive" style={{ marginTop: 8 }}>
                    {language === "hi" ? "बैंक अंडरराइटर को सूचित किया गया। ऑडिट लॉग में दर्ज।" :
                     language === "gu" ? "બેંક અંડરરાઈટરને સૂચિત કર્યું. ઓડિટ લોગમાં નોંધ્યું." :
                     "Bank underwriter notified. Recorded in regulatory audit log."}
                  </p>
                )}
              </div>

              {/* Mini Copilot */}
              <div className="card">
                <div className="flex-gap-sm" style={{ marginBottom: 12 }}>
                  <MessageSquareIcon size={20} color="var(--niva-electric-lime)" />
                  <span className="label-sm text-muted">ASK NIVA — VERNACULAR COPILOT</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCopilotSend(); }}
                    placeholder={language === "hi" ? "कुछ भी पूछें..." : language === "gu" ? "કંઈપણ પૂછો..." : "Ask anything... e.g. Can I afford a ₹65,000 laptop?"}
                    style={{
                      flex: 1, padding: "10px 14px", borderRadius: "var(--radius-md)",
                      border: "1px solid var(--niva-border)", background: "var(--niva-canvas-subtle)",
                      fontSize: 14,
                    }}
                  />
                  <button className="btn btn-primary" onClick={handleCopilotSend} disabled={copilotLoading}>
                    {copilotLoading ? "..." : "Send"}
                  </button>
                </div>
                {copilotReply && (
                  <div style={{
                    marginTop: 12, padding: 14, background: "var(--niva-canvas-subtle)",
                    borderRadius: "var(--radius-md)", border: "1px solid var(--niva-border)",
                  }}>
                    <span className="label-sm" style={{ color: "var(--niva-positive)", marginBottom: 4, display: "block" }}>NIVA</span>
                    <p className="body-md" style={{ whiteSpace: "pre-wrap" }}>{copilotReply}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* ═══════════════ STAGE 5: Bank Portal ═══════════════ */}
          {stage === 5 && (!journeyData ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ marginBottom: 16 }}><BuildingBankIcon size={44} color="var(--niva-electric-lime)" /></div>
              <div className="headline-sm">Loading Bank Underwriter View...</div>
            </div>
          ) : (
            <div className="stack-xl" style={{ animation: "fadeSlideUp 0.5s ease forwards" }}>
              <section>
                <span className="label-sm text-muted">STAGE 6 OF 6</span>
                <h1 className="headline-lg" style={{ marginTop: 4 }}>
                  {language === "hi" ? "बैंक अंडरराइटर पोर्टल" : language === "gu" ? "બેંક અંડરરાઈટર પોર્ટલ" : "Bank Risk & Underwriting Portal"}
                </h1>
                <p className="body-md text-secondary" style={{ marginTop: 4 }}>
                  How the same customer appears to a bank risk officer. The Responsible Gate ensures zero predatory nudging.
                </p>
              </section>

              {/* Customer Risk Card */}
              <div className="card" style={{
                background: "var(--niva-deep-forest)", color: "#fff",
                border: "1px solid rgba(148,248,74,0.2)",
              }}>
                <div className="flex-between" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>CUSTOMER RISK PROFILE</div>
                    <div className="headline-sm" style={{ color: "#fff", marginTop: 4 }}>{journeyData.kyc.full_name}</div>
                    <div className="body-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{journeyData.kyc.occupation} • {journeyData.kyc.bank_linked}</div>
                  </div>
                  <div style={{
                    padding: "8px 16px", borderRadius: "var(--radius-pill)",
                    background: ft?.stress_level === "low" ? "rgba(0,168,89,0.2)" : "rgba(225,29,72,0.2)",
                    color: ft?.stress_level === "low" ? "#6EE7B7" : "#FCA5A5",
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {ft?.stress_level === "low" ? "LOW RISK" : ft?.stress_level === "critical" ? "HIGH RISK — PRE-NPA WATCH" : "ELEVATED RISK"}
                  </div>
                </div>
                <div className="grid-4" style={{ gap: 16 }}>
                  {[
                    { label: "Health", value: `${ft?.health_score}/100` },
                    { label: "Stress", value: `${ft?.stress_score}/100` },
                    { label: "DTI", value: `${Math.round((ft?.dti_ratio || 0) * 100)}%` },
                    { label: "Buffer", value: `${ft?.emergency_months} mo` },
                  ].map((m) => (
                    <div key={m.label} style={{ textAlign: "center" }}>
                      <div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{m.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--niva-gate-lime)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gate Decisions Summary */}
              <div className="card">
                <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>RESPONSIBLE GATE DECISIONS</span>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div style={{ padding: 16, background: "var(--niva-critical-bg)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--niva-critical)" }}>{gate?.suppressed_count}</div>
                    <div className="body-sm text-muted">Products Suppressed</div>
                  </div>
                  <div style={{ padding: 16, background: "var(--niva-positive-bg)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--niva-positive)" }}>{gate?.approved_count}</div>
                    <div className="body-sm text-muted">Products Approved</div>
                  </div>
                </div>
              </div>

              {/* Relief Record */}
              {reliefAccepted && (
                <div className="card" style={{ border: "2px solid var(--niva-positive)", animation: "fadeSlideUp 0.4s ease forwards" }}>
                  <div className="flex-gap-sm" style={{ marginBottom: 8 }}>
                    <FileTextIcon size={18} color="var(--niva-positive)" />
                    <span className="label-sm" style={{ color: "var(--niva-positive)" }}>EMPATHETIC RELIEF AUDIT LOG ENTRY</span>
                  </div>
                  <p className="body-md">
                    <strong>{journeyData.empathetic_offer.title}</strong> — Accepted by customer via NIVA Empathetic Journey.
                    Non-punitive intervention per Responsible Lending Guidelines.
                  </p>
                  <p className="body-sm text-muted" style={{ marginTop: 4 }}>
                    Policy: POL-RELIEF-01 • Timestamp: {new Date().toISOString()} • Status: ACTIVE
                  </p>
                </div>
              )}

              {/* Compliance Badge */}
              <div className="info-banner info">
                <ShieldIcon size={20} color="var(--niva-positive)" />
                <div>
                  <strong>Zero Predatory Nudging Compliance</strong>
                  <p className="body-sm" style={{ marginTop: 4 }}>
                    All product recommendations passed through NIVA Responsible Gate. {gate?.suppressed_count} products suppressed due to suitability violations. Full audit trail immutable and RBI-ready.
                  </p>
                </div>
              </div>

              {/* Link to full Bank Portal */}
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <a href="/bank" className="btn btn-primary" style={{ minWidth: 250 }}>
                  Open Full Bank Underwriter Portal →
                </a>
              </div>
            </div>
          ))}

          {/* Navigation Controls */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 0", marginTop: 24, borderTop: "1px solid var(--niva-border)",
            flexWrap: "wrap", gap: 10,
          }}>
            <button
              className="btn btn-outline"
              onClick={() => setStage(Math.max(0, stage - 1))}
              disabled={stage === 0}
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              ← Back
            </button>
            <span className="body-sm text-muted" style={{ fontSize: 12 }}>
              Stage {stage + 1} of 6
            </span>
            {stage < 5 ? (
              <button
                className="btn btn-primary"
                onClick={advance}
                disabled={!canAdvance()}
                style={{ minWidth: 160, fontSize: 13, padding: "8px 16px" }}
              >
                {language === "hi" ? "आगे बढ़ें →" : language === "gu" ? "આગળ વધો →" : "Continue →"}
              </button>
            ) : (
              <a href="/" className="btn btn-primary" style={{ minWidth: 160, fontSize: 13, padding: "8px 16px" }}>
                Dashboard →
              </a>
            )}
          </div>
        </div>
      </div>


      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <span className="navbar-brand-icon" style={{ width: 24, height: 24, fontSize: 10 }}>N</span>
          NIVA
          <span className="text-muted" style={{ marginLeft: 8 }}>Real-World Journey Demo</span>
        </div>
        <div className="footer-aa-badge">
          <span className="status-dot positive pulse" />
          <span>RBI Account Aggregator Compliant Sandbox</span>
        </div>
      </footer>
    </>
  );
}
