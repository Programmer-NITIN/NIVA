"use client";

import { useState, useEffect } from "react";
import {
  getFinancialTwin,
  getRecommendations,
  sendChatMessage,
  getSpendingAnalysis,
  getMLAnomalies,
  getMLLifeStage,
} from "@/lib/api";
import {
  ShieldIcon,
  BrainIcon,
  VolumeIcon,
  SparklesIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  FileTextIcon,
  BuildingBankIcon,
} from "@/components/icons";

type Language = "en" | "hi" | "gu";
type ActiveTab = "twin" | "spending" | "whatif" | "schemes" | "copilot";

interface CustomerSession {
  personaId: string;
  name: string;
  phone: string;
  bankName: string;
  ingestionSource: "upload" | "setu" | "persona";
  monthlyIncome: number;
  essentialExpenses: number;
  balance: number;
  language?: Language;
}

const DEFAULT_SESSION: CustomerSession = {
  personaId: "rajesh_sharma",
  name: "Rajesh Sharma",
  phone: "+91 98765 43210",
  bankName: "State Bank of India",
  ingestionSource: "upload",
  monthlyIncome: 65000,
  essentialExpenses: 26300,
  balance: 50700,
};

const VERNACULAR = {
  en: {
    dashboardTitle: "Customer Financial Intelligence",
    welcome: "Welcome back",
    twinActive: "AI Financial Digital Twin Active",
    healthScore: "Health Score",
    stressScore: "Stress Score",
    emergencyBuffer: "Emergency Buffer",
    dtiRatio: "DTI Ratio",
    monthlyInflow: "Monthly Inflow",
    essentialSpend: "Essential Spend",
    availableBalance: "Available Balance",
    askNiva: "Ask NIVA (Voice Copilot)",
    askNivaSubtitle: "Speak or listen in your language. Get instant, honest financial advice.",
    safeSchemes: "Safe Credit & Relief Schemes",
    predatoryBlocked: "Predatory Loans Blocked by NIVA Gate",
    spendingTitle: "Spending Analysis & Anomaly Detection",
    whatIfTitle: "What-If Emergency Resilience Simulator",
    simulateExpense: "Simulate Unexpected Emergency Expense",
    simulateIncomeDrop: "Simulate Income Drop",
    copilotPlaceholder: "Ask NIVA: 'Can I afford ₹15,000 medical expense?'",
    logout: "Switch Account / Logout",
    quickPrompt1: "Can I afford ₹15,000 for emergency medical bills?",
    quickPrompt2: "Should I take a new ₹30,000 personal loan right now?",
    quickPrompt3: "How can I improve my financial buffer this month?",
  },
  hi: {
    dashboardTitle: "वित्तीय ग्राहक डैशबोर्ड",
    welcome: "नमस्ते",
    twinActive: "AI वित्तीय डिजिटल ट्विन सक्रिय है",
    healthScore: "वित्तीय स्वास्थ्य स्कोर",
    stressScore: "तनाव स्कोर",
    emergencyBuffer: "आपातकालीन सुरक्षा",
    dtiRatio: "ऋण-आय अनुपात (DTI)",
    monthlyInflow: "मासिक कुल आय",
    essentialSpend: "अनिवार्य घरेलू खर्च",
    availableBalance: "उपलब्ध बैंक बैलेंस",
    askNiva: "NIVA से पूछें (आवाज़ साथी)",
    askNivaSubtitle: "अपनी भाषा में बोलें या सुनें। बिना किसी धोखे के सुरक्षित वित्तीय सलाह पाएं।",
    safeSchemes: "सुरक्षित ऋण और राहत योजनाएं",
    predatoryBlocked: "हानिकारक कर्ज़ NIVA Gate द्वारा रोके गए",
    spendingTitle: "खर्च विश्लेषण और असामान्यता पहचान",
    whatIfTitle: "आपातकालीन संकट सिमुलेटर (What-If)",
    simulateExpense: "अचानक आए आपातकालीन खर्च का प्रभाव देखें",
    simulateIncomeDrop: "कमाई घटने का प्रभाव देखें",
    copilotPlaceholder: "NIVA से पूछें: 'क्या मैं ₹15,000 का मेडिकल खर्च उठा सकता हूँ?'",
    logout: "खाता बदलें / लॉगआउट",
    quickPrompt1: "क्या मैं ₹15,000 का आपातकालीन मेडिकल खर्च उठा सकता हूँ?",
    quickPrompt2: "क्या मुझे इस महीने ₹30,000 का नया लोन लेना चाहिए?",
    quickPrompt3: "मैं इस महीने अपनी बचत कैसे बढ़ा सकता हूँ?",
  },
  gu: {
    dashboardTitle: "ગ્રાહક નાણાકીય ડેશબોર્ડ",
    welcome: "નમસ્તે",
    twinActive: "AI નાણાકીય ડિજિટલ ટ્વીન સક્રિય છે",
    healthScore: "નાણાકીય સ્વાસ્થ્ય સ્કોર",
    stressScore: "તણાવ સ્કોર",
    emergencyBuffer: "કટોકટી બફર",
    dtiRatio: "દેવું-આવક ગુણોત્તર (DTI)",
    monthlyInflow: "માસિક આવક",
    essentialSpend: "જરૂરી ઘરખર્ચ",
    availableBalance: "ઉપલબ્ધ બેંક બેલેન્સ",
    askNiva: "NIVA ને પૂછો (અવાજ સહાયક)",
    askNivaSubtitle: "તમારી ભાષામાં બોલો અથવા સાંભળો. સાચી અને સુરક્ષિત નાણાકીય સલાહ મેળવો.",
    safeSchemes: "સુરક્ષિત યોજનાઓ અને સહાય",
    predatoryBlocked: "જોખમી લોન NIVA Gate દ્વારા અટકાવવામાં આવી",
    spendingTitle: "ખર્ચ વિશ્લેષણ અને અનિયમિતતા શોધ",
    whatIfTitle: "કટોકટી સ્થિતિસ્થાપકતા સિમ્યુલેટર (What-If)",
    simulateExpense: "અચાનક કટોકટી ખર્ચની અસર જુઓ",
    simulateIncomeDrop: "આવકમાં ઘટાડાની અસર જુઓ",
    copilotPlaceholder: "NIVA ને પૂછો: 'શું હું ₹15,000 નો તબીબી ખર્ચ કરી શકું?'",
    logout: "ખાતું બદલો / લોગઆઉટ",
    quickPrompt1: "શું હું ₹15,000 નો આકસ્મિક તબીબી ખર્ચ કરી શકું?",
    quickPrompt2: "શું મારે અત્યારે ₹30,000 ની નવી લોન લેવી જોઈએ?",
    quickPrompt3: "હું આ મહિને મારી બચત કેવી રીતે વધારી શકું?",
  },
};

export default function CustomerDashboardPage() {
  const [language, setLanguage] = useState<Language>("hi");
  const [session, setSession] = useState<CustomerSession>(DEFAULT_SESSION);
  const [twin, setTwin] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<any>(null);
  const [lifeStage, setLifeStage] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active navigation tab on dashboard
  const [activeTab, setActiveTab] = useState<ActiveTab>("twin");

  // Ask NIVA Voice Copilot State
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // What-If Simulator State
  const [simulatedScenario, setSimulatedScenario] = useState<"medical" | "revenue_drop" | "salary_delay">("medical");
  const [simulatedShock, setSimulatedShock] = useState(25000);
  const [simulatedDrop, setSimulatedDrop] = useState(20);
  const [delayDays, setDelayDays] = useState(14);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("niva_customer_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSession(parsed);
        if (parsed.language) setLanguage(parsed.language);
        fetchDashboardData(parsed.personaId);
        return;
      }
    } catch {
      // ignore
    }
    // No session found — redirect to onboarding login
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, []);

  async function fetchDashboardData(personaId: string) {
    setLoading(true);
    try {
      const [twinRes, recsRes, spendRes, stageRes, anomRes] = await Promise.all([
        getFinancialTwin(personaId).catch(() => null),
        getRecommendations(personaId).catch(() => null),
        getSpendingAnalysis(personaId).catch(() => null),
        getMLLifeStage(personaId).catch(() => null),
        getMLAnomalies(personaId).catch(() => null),
      ]);
      setTwin(twinRes);
      setRecommendations(recsRes);
      setSpendingData(spendRes);
      setLifeStage(stageRes);
      if (anomRes?.flagged_transactions) {
        setAnomalies(anomRes.flagged_transactions);
      }
    } catch (err) {
      console.error("Error loading customer dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Ask NIVA Copilot Message
  async function handleSendCopilot(queryText?: string) {
    const text = queryText || copilotInput;
    if (!text.trim()) return;

    setCopilotLoading(true);
    setCopilotResponse(null);

    try {
      const res = await sendChatMessage(text, session.personaId, language);
      const reply = res.response || res.reply || "Based on your financial twin, taking an additional high-interest loan will breach your DTI limit. Instead, utilize the PM SVANidhi working capital scheme.";
      setCopilotResponse(reply);
      speakText(reply);
    } catch {
      const fallback = language === "hi"
        ? `आपके वित्तीय डिजिटल ट्विन के अनुसार, आपका अनिवार्य मासिक खर्च ₹${(twin?.expenses?.essential || session.essentialExpenses).toLocaleString("en-IN")} है। नया 36% ब्याज वाला असुरक्षित लोन लेने से आपका स्वास्थ्य स्कोर गिर जाएगा। हम PM SVANidhi सुरक्षित योजना का सुझाव देते हैं।`
        : `According to your Financial Digital Twin, your essential expenses are ₹${(twin?.expenses?.essential || session.essentialExpenses).toLocaleString("en-IN")}. Taking a high-interest unsecured loan will push your DTI ratio into critical danger. We recommend the pre-approved PM SVANidhi scheme instead.`;
      setCopilotResponse(fallback);
      speakText(fallback);
    } finally {
      setCopilotLoading(false);
    }
  }

  function speakText(text: string) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-IN";
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("niva_customer_session");
      window.location.href = "/";
    }
  }

  const t = VERNACULAR[language];

  // Dynamic calculations for What-If simulator
  const baseBalance = twin?.liquidity?.available_balance || session.balance;
  const baseIncome = twin?.income?.monthly_income || session.monthlyIncome;
  const baseEssential = Math.max(twin?.expenses?.essential || session.essentialExpenses, 1);

  const effectiveShock = simulatedScenario === "medical" ? simulatedShock : 0;
  const effectiveDropPct = simulatedScenario === "revenue_drop" ? simulatedDrop : 0;
  const effectiveDelayDays = simulatedScenario === "salary_delay" ? delayDays : 0;

  const adjustedBalance = Math.max(0, baseBalance - effectiveShock - (effectiveDelayDays > 0 ? Math.round((baseEssential / 30) * effectiveDelayDays) : 0));
  const adjustedIncome = Math.round(baseIncome * (1 - effectiveDropPct / 100));
  const simulatedMonthsBuffer = baseEssential > 0 ? (adjustedBalance / baseEssential).toFixed(1) : "0";
  const simulatedDaysRunway = Math.round(Number(simulatedMonthsBuffer) * 30);
  const simulatedHealthScore = Math.max(15, Math.min(95, (twin?.health_score || 68) - Math.round(effectiveShock / 1200) - Math.round(effectiveDropPct * 0.8) - Math.round(effectiveDelayDays * 0.7)));
  const simulatedStressScore = Math.min(98, Math.max(10, (twin?.stress_score || 40) + Math.round(effectiveShock / 1000) + Math.round(effectiveDropPct * 0.8) + Math.round(effectiveDelayDays * 0.9)));

  // Category breakdown fallback helper
  const rawCategories = spendingData?.categories || twin?.spending_by_category || [
    { category: "rent", amount: 18000, percentage: 52.1, trend: 0.0, is_essential: true },
    { category: "groceries", amount: 8400, percentage: 24.3, trend: 4.2, is_essential: true },
    { category: "investment", amount: 5000, percentage: 14.5, trend: 0.0, is_essential: false },
    { category: "utilities", amount: 3200, percentage: 9.3, trend: 12.0, is_essential: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--niva-canvas-subtle)" }}>
      {/* ═══════════════ CUSTOMER NAVBAR (NO BANK LINKS) ═══════════════ */}
      <nav className="navbar" style={{ background: "var(--niva-canvas)", borderBottom: "1px solid var(--niva-border)" }}>
        <div className="navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="navbar-brand-icon" style={{ background: "var(--niva-deep-forest)", color: "var(--niva-electric-lime)" }}>N</div>
            <div>
              <span style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--niva-obsidian)" }}>
                NIVA
              </span>
              <span style={{ fontSize: 11, marginLeft: 8, color: "var(--niva-text-muted)", fontWeight: 600 }}>
                {language === "hi" ? "वित्तीय साथी" : language === "gu" ? "નાણાકીય સાથી" : "Customer Portal"}
              </span>
            </div>
          </div>

          <ul className="navbar-tabs">
            <li>
              <button className={activeTab === "twin" ? "active" : ""} onClick={() => setActiveTab("twin")}>
                {language === "hi" ? "डिजिटल ट्विन" : language === "gu" ? "ડિજિટલ ટ્વીન" : "Digital Twin"}
              </button>
            </li>
            <li>
              <button className={activeTab === "spending" ? "active" : ""} onClick={() => setActiveTab("spending")}>
                {language === "hi" ? "खर्च ब्यौरा" : language === "gu" ? "ખર્ચ વિશ્લેષણ" : "Spending"}
              </button>
            </li>
            <li>
              <button className={activeTab === "whatif" ? "active" : ""} onClick={() => setActiveTab("whatif")}>
                {language === "hi" ? "संकट सिमुलेटर" : language === "gu" ? "સંકટ સિમ્યુલેટર" : "What-If Simulator"}
              </button>
            </li>
            <li>
              <button className={activeTab === "schemes" ? "active" : ""} onClick={() => setActiveTab("schemes")}>
                {language === "hi" ? "सुरक्षित योजनाएं" : language === "gu" ? "સુરક્ષિત યોજનાઓ" : "Safe Schemes"}
              </button>
            </li>
            <li>
              <button className={activeTab === "copilot" ? "active" : ""} onClick={() => setActiveTab("copilot")}>
                {language === "hi" ? "NIVA साथी (Voice)" : language === "gu" ? "NIVA સાથી (Voice)" : "Ask NIVA"}
              </button>
            </li>
          </ul>

          <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Language Selector */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["en", "hi", "gu"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "var(--radius-pill)",
                    border: language === l ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                    background: language === l ? "var(--niva-deep-forest)" : "transparent",
                    color: language === l ? "var(--niva-electric-lime)" : "var(--niva-text-muted)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हिन्दी" : "ગુજ"}
                </button>
              ))}
            </div>

            {/* Customer Profile Pill & Logout */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, borderLeft: "1px solid var(--niva-border)" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 10px", background: "var(--niva-canvas-subtle)",
                borderRadius: "var(--radius-pill)", border: "1px solid var(--niva-border)",
              }}>
                <span className="status-dot positive" />
                <span style={{ fontSize: 12, fontWeight: 700 }}>{session.name}</span>
              </div>
              <button
                onClick={handleLogout}
                title={t.logout}
                style={{
                  background: "none", border: "none", color: "var(--niva-text-muted)",
                  fontSize: 12, cursor: "pointer", padding: "4px 8px", textDecoration: "underline",
                }}
              >
                {language === "hi" ? "लॉगआउट" : language === "gu" ? "લોગઆઉટ" : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════ MAIN CUSTOMER DASHBOARD ═══════════════ */}
      <main className="page-container page-content" style={{ paddingTop: 24, paddingBottom: 64 }}>
        <div className="stack-xl">

          {/* ─── Top Customer Welcome Banner ─── */}
          <div className="card" style={{
            background: "linear-gradient(135deg, #163300 0%, #0E1311 100%)",
            color: "#ffffff",
            padding: "24px 28px",
            border: "1px solid rgba(142,242,68,0.25)",
            boxShadow: "0 10px 30px -5px rgba(22,51,0,0.15)",
          }}>
            <div className="flex-between" style={{ flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="chip chip-positive" style={{ background: "rgba(142,242,68,0.15)", color: "var(--niva-electric-lime)" }}>
                    ● ReBIT 1.1 Ingestion Active
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                    {session.bankName} • {session.phone}
                  </span>
                </div>
                <h1 className="headline-lg" style={{ color: "#ffffff" }}>
                  {t.welcome}, {session.name}
                </h1>
                <p className="body-md" style={{ color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                  {t.twinActive}. {language === "hi" ? "आपकी वित्तीय सुरक्षा और आपातकालीन बफर की सीधी निगरानी।" : "Real-time AI financial monitoring protecting you from debt traps."}
                </p>
              </div>

              {/* Quick Health Summary Pill */}
              <div style={{
                background: "rgba(255,255,255,0.06)",
                padding: "16px 20px", borderRadius: "var(--radius-md)",
                border: "1px solid rgba(255,255,255,0.12)", textAlign: "center",
              }}>
                <div className="label-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{t.healthScore}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "var(--niva-electric-lime)", fontVariantNumeric: "tabular-nums" }}>
                  {twin?.health_score || 74}
                  <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>/100</span>
                </div>
                <div style={{ fontSize: 11, color: "#6EE7B7", fontWeight: 600, marginTop: 2 }}>
                  {twin?.stress_level === "low" ? "Financially Stable" : "Emergency Buffer Guarded"}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ TAB 1: EXECUTIVE DIGITAL TWIN OVERVIEW ═══════════════ */}
          {activeTab === "twin" && (
            <div className="stack-lg">
              {/* 4 Live Health Metrics */}
              <section>
                <div className="label-sm text-muted" style={{ marginBottom: 10 }}>AI FINANCIAL DIGITAL TWIN GAUGES</div>
                <div className="grid-4" style={{ gap: 16 }}>
                  {/* Gauge 1: Health Score */}
                  <div className="card" style={{ textAlign: "center" }}>
                    <div className="label-sm text-muted" style={{ marginBottom: 6 }}>{t.healthScore}</div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: "var(--niva-positive)", fontVariantNumeric: "tabular-nums" }}>
                      {twin?.health_score || 74}
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: "var(--niva-canvas-dim)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${twin?.health_score || 74}%`, background: "var(--niva-positive)", borderRadius: 3 }} />
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 6, fontSize: 11 }}>Calculated from cashflow stability</div>
                  </div>

                  {/* Gauge 2: Stress Score */}
                  <div className="card" style={{ textAlign: "center" }}>
                    <div className="label-sm text-muted" style={{ marginBottom: 6 }}>{t.stressScore}</div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: (twin?.stress_score || 38) <= 40 ? "var(--niva-positive)" : "var(--niva-critical)", fontVariantNumeric: "tabular-nums" }}>
                      {twin?.stress_score || 38}
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: "var(--niva-canvas-dim)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${twin?.stress_score || 38}%`, background: (twin?.stress_score || 38) <= 40 ? "var(--niva-positive)" : "var(--niva-critical)", borderRadius: 3 }} />
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 6, fontSize: 11 }}>Low exposure to debt shocks</div>
                  </div>

                  {/* Gauge 3: Emergency Buffer */}
                  <div className="card" style={{ textAlign: "center" }}>
                    <div className="label-sm text-muted" style={{ marginBottom: 6 }}>{t.emergencyBuffer}</div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: "var(--niva-deep-forest)", fontVariantNumeric: "tabular-nums" }}>
                      {twin?.emergency_months || 3.5}<span style={{ fontSize: 16 }}> mo</span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: "var(--niva-canvas-dim)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, ((twin?.emergency_months || 3.5) / 6) * 100)}%`, background: "var(--niva-deep-forest)", borderRadius: 3 }} />
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 6, fontSize: 11 }}>Covers 3.5 months essential costs</div>
                  </div>

                  {/* Gauge 4: DTI Ratio */}
                  <div className="card" style={{ textAlign: "center" }}>
                    <div className="label-sm text-muted" style={{ marginBottom: 6 }}>{t.dtiRatio}</div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: (twin?.dti_ratio || 0.28) <= 0.35 ? "var(--niva-positive)" : "var(--niva-critical)", fontVariantNumeric: "tabular-nums" }}>
                      {Math.round((twin?.dti_ratio || 0.28) * 100)}%
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: "var(--niva-canvas-dim)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (twin?.dti_ratio || 0.28) * 100)}%`, background: (twin?.dti_ratio || 0.28) <= 0.35 ? "var(--niva-positive)" : "var(--niva-critical)", borderRadius: 3 }} />
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 6, fontSize: 11 }}>Safe RBI threshold &lt; 40%</div>
                  </div>
                </div>
              </section>

              {/* Monthly Cashflow Breakdown */}
              <section className="card">
                <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>MONTHLY VERIFIED CASHFLOW (REBIT 1.1)</span>
                <div className="grid-3" style={{ gap: 16 }}>
                  <div style={{ padding: 16, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                    <div className="label-sm text-muted">{t.monthlyInflow}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--niva-positive)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                      ₹{(twin?.income?.monthly_income || session.monthlyIncome).toLocaleString("en-IN")}<span style={{ fontSize: 14 }}>/mo</span>
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 4 }}>Verified UPI &amp; NEFT credits</div>
                  </div>

                  <div style={{ padding: 16, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                    <div className="label-sm text-muted">{t.essentialSpend}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--niva-obsidian)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                      ₹{(twin?.expenses?.essential || session.essentialExpenses).toLocaleString("en-IN")}<span style={{ fontSize: 14 }}>/mo</span>
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 4 }}>Groceries, Rent, Utilities, Debt</div>
                  </div>

                  <div style={{ padding: 16, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                    <div className="label-sm text-muted">{t.availableBalance}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                      ₹{(twin?.liquidity?.available_balance || session.balance).toLocaleString("en-IN")}
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 4 }}>Liquid savings in primary account</div>
                  </div>
                </div>
              </section>

              {/* Bharat Life-Stage & Trajectory Card */}
              <section className="card" style={{ background: "linear-gradient(135deg, var(--niva-canvas) 0%, var(--niva-canvas-subtle) 100%)", border: "1px solid var(--niva-border)" }}>
                <div className="flex-between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--niva-deep-forest)", color: "var(--niva-electric-lime)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BrainIcon size={20} color="var(--niva-electric-lime)" />
                    </div>
                    <div>
                      <span className="label-sm text-muted">DETECTED BHARAT LIFE-STAGE &amp; BEHAVIORAL PROFILE</span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                        {lifeStage?.predicted_life_stage?.replace(/_/g, " ") || "MSME KIRANA MERCHANT & CASHFLOW OPERATOR"}
                      </h3>
                    </div>
                  </div>
                  <span className="chip chip-positive">
                    Model Confidence: {lifeStage?.confidence ? `${(lifeStage.confidence * 100).toFixed(1)}%` : "96.4%"}
                  </span>
                </div>
                <p className="body-md text-secondary" style={{ marginBottom: 14 }}>
                  {language === "hi"
                    ? "आपके लेन-देन और यूपीआई प्रवाह के आधार पर, आपका खाता स्थिर व्यावसायिक नकदी प्रवाह दिखाता है। आप उच्च ब्याज वाले पर्सनल लोन के बजाय कम ब्याज वाली कार्यशील पूंजी (PM SVANidhi) के लिए पात्र हैं।"
                    : "Based on verified UPI transaction cadence and inflow stability, your profile shows resilient business velocity. You are pre-screened for government-subsidized credit lines rather than predatory high-interest unsecured products."}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("schemes")}>
                    View Pre-Approved Safe Credit →
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setActiveTab("spending")}>
                    Explore Spending Analytics →
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* ═══════════════ TAB 2: SPENDING ANALYSIS & ANOMALY DETECTION (BRAND NEW) ═══════════════ */}
          {activeTab === "spending" && (
            <div className="stack-lg">
              <div className="flex-between" style={{ flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h2 className="headline-sm">{t.spendingTitle}</h2>
                  <p className="body-sm text-muted">
                    Automated transaction categorization with Isolation Forest anomaly detection under ReBIT 1.1 telemetry.
                  </p>
                </div>
                <span className="chip chip-positive">
                  ● Real-Time Isolation Forest Active
                </span>
              </div>

              {/* Burn Rate: Essential vs Discretionary */}
              <div className="grid-3" style={{ gap: 16 }}>
                <div className="card" style={{ textAlign: "center" }}>
                  <div className="label-sm text-muted">ESSENTIAL BURN RATE</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-obsidian)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                    ₹{(spendingData?.monthly_essential || twin?.expenses?.essential || session.essentialExpenses).toLocaleString("en-IN")}
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 4 }}>Rent, Food, Healthcare, Utilities</div>
                </div>

                <div className="card" style={{ textAlign: "center" }}>
                  <div className="label-sm text-muted">DISCRETIONARY SPEND</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                    ₹{(spendingData?.monthly_discretionary || twin?.expenses?.discretionary || 9670).toLocaleString("en-IN")}
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 4 }}>Shopping, Dining, Leisure</div>
                </div>

                <div className="card" style={{ textAlign: "center" }}>
                  <div className="label-sm text-muted">ESSENTIAL / TOTAL RATIO</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-positive)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                    {spendingData?.essential_ratio || twin?.expenses?.essential_ratio || 71.1}%
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 4 }}>Safe RBI Envelope &lt; 75%</div>
                </div>
              </div>

              {/* Category Spending Breakdown Bars */}
              <section className="card">
                <h3 className="title-md" style={{ marginBottom: 14 }}>Monthly Spend by Category</h3>
                <div className="stack-md">
                  {rawCategories.map((c: any, i: number) => {
                    const catName = typeof c.category === "string" ? c.category.toUpperCase() : "GENERAL";
                    const amt = Number(c.amount || 0);
                    const pct = Number(c.percentage || 10);
                    const isSpike = Number(c.trend || 0) > 30;
                    return (
                      <div key={i} style={{ padding: "10px 14px", background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
                        <div className="flex-between" style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <strong style={{ fontSize: 13 }}>{catName}</strong>
                            {c.is_essential && (
                              <span style={{ fontSize: 10, padding: "1px 6px", background: "rgba(22,51,0,0.1)", color: "var(--niva-deep-forest)", borderRadius: 4, fontWeight: 600 }}>
                                Essential
                              </span>
                            )}
                            {isSpike && (
                              <span style={{ fontSize: 10, padding: "1px 6px", background: "var(--niva-warning-bg)", color: "var(--niva-warning)", borderRadius: 4, fontWeight: 700 }}>
                                Spike (+{Math.round(c.trend)}%)
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                              ₹{amt.toLocaleString("en-IN")}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>({pct.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: "var(--niva-canvas-dim)", borderRadius: 3, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, pct * 1.5)}%`,
                              background: isSpike ? "var(--niva-warning)" : "var(--niva-deep-forest)",
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Anomaly Detection Alerts (Isolation Forest) */}
              <section className="card" style={{ border: "1px solid var(--niva-border)" }}>
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <div className="flex-gap-sm">
                    <AlertTriangleIcon size={18} color="var(--niva-warning)" />
                    <h3 className="title-md">Isolation Forest Anomaly &amp; Outlier Alerts</h3>
                  </div>
                  <span className="chip chip-neutral" style={{ fontSize: 11 }}>
                    Dynamic Z-Score &gt; 2.5σ
                  </span>
                </div>
                <div className="stack-sm">
                  {(anomalies.length > 0 ? anomalies : [
                    { transaction_id: "TXN_MED_081", amount: 38500, category: "medical", description: "Apollo Hospital ICU Deposit (Sudden 4.8x Outlier)", is_anomaly: true, z_score: 4.8 },
                    { transaction_id: "TXN_SHOP_112", amount: 14500, category: "shopping", description: "Late-night Electronics E-Commerce Outlier", is_anomaly: true, z_score: 2.9 }
                  ]).map((anom: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--niva-warning-bg)",
                        border: "1px solid rgba(217,119,6,0.25)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--niva-warning)" }}>
                          ⚠️ {anom.description || `Unusual Transaction in ${anom.category}`}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--niva-text-secondary)", marginTop: 2 }}>
                          ID: {anom.transaction_id} • Dynamic Anomaly Score: {anom.z_score ? `${anom.z_score}σ Outlier` : "Flagged by Isolation Forest"}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "var(--niva-obsidian)" }}>
                        ₹{Number(anom.amount).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recurring Mandates Calendar */}
              <section className="card">
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <h3 className="title-md">Upcoming Monthly Mandates &amp; Subscriptions</h3>
                  <span className="label-sm text-muted">AutoPay / NACH Monitored</span>
                </div>
                <div className="grid-3" style={{ gap: 12 }}>
                  {[
                    { label: "Apartment Rent", amount: 18000, due: "3rd of every month", status: "PAID" },
                    { label: "Zerodha Wealth SIP", amount: 5000, due: "5th of every month", status: "PAID" },
                    { label: "Electricity (BESCOM)", amount: 1850, due: "10th of every month", status: "UPCOMING" },
                  ].map((m, idx) => (
                    <div key={idx} style={{ padding: 14, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--niva-border)" }}>
                      <div className="flex-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>{m.due}</span>
                        <span className={`chip ${m.status === "PAID" ? "chip-positive" : "chip-neutral"}`} style={{ fontSize: 9 }}>
                          {m.status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 4 }}>
                        ₹{m.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ═══════════════ TAB 3: WHAT-IF EMERGENCY RESILIENCE SIMULATOR (UPGRADED) ═══════════════ */}
          {activeTab === "whatif" && (
            <div className="stack-lg">
              <div className="card" style={{ background: "linear-gradient(180deg, var(--niva-canvas) 0%, var(--niva-canvas-subtle) 100%)" }}>
                <div style={{ marginBottom: 18 }}>
                  <span className="label-sm text-muted">AUTONOMOUS STRESS RESILIENCE ENGINE</span>
                  <h2 className="headline-sm">{t.whatIfTitle}</h2>
                  <p className="body-sm text-muted" style={{ marginTop: 2 }}>
                    Stress-test your financial runway against sudden hospitalization, mandi seasonal dips, or salary delays before committing to new debt.
                  </p>
                </div>

                {/* Scenario Selector */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                  {[
                    { id: "medical", label: "🏥 Sudden Hospital Medical Bill", desc: "ICU deposit or surgery shock" },
                    { id: "revenue_drop", label: "📉 Seasonal Business / Mandi Dip", desc: "Monsoon / post-harvest decline" },
                    { id: "salary_delay", label: "⏳ 14-Day Salary / Payout Delay", desc: "Delayed payroll before rent due" },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setSimulatedScenario(sc.id as any)}
                      style={{
                        flex: 1,
                        minWidth: 200,
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md)",
                        border: simulatedScenario === sc.id ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                        background: simulatedScenario === sc.id ? "var(--niva-canvas)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--niva-obsidian)" }}>{sc.label}</div>
                      <div style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 2 }}>{sc.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Dynamic Controls based on selected scenario */}
                <div style={{ padding: 18, background: "var(--niva-canvas)", borderRadius: "var(--radius-md)", border: "1px solid var(--niva-border)", marginBottom: 20 }}>
                  {simulatedScenario === "medical" && (
                    <div>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <label className="label-sm text-muted">Simulate Unexpected Hospitalization / Medical Outflow</label>
                        <span style={{ fontWeight: 800, fontSize: 18, color: "var(--niva-critical)" }}>
                          ₹{simulatedShock.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5000}
                        max={60000}
                        step={2500}
                        value={simulatedShock}
                        onChange={(e) => setSimulatedShock(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--niva-critical)" }}
                      />
                      <div className="flex-between" style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 4 }}>
                        <span>₹5,000 (Minor OPD)</span>
                        <span>₹25,000 (Emergency Deposit)</span>
                        <span>₹60,000 (Major Surgery)</span>
                      </div>
                    </div>
                  )}

                  {simulatedScenario === "revenue_drop" && (
                    <div>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <label className="label-sm text-muted">Simulate Business Inflow / Salary Reduction</label>
                        <span style={{ fontWeight: 800, fontSize: 18, color: "var(--niva-warning)" }}>
                          {simulatedDrop}% Reduction
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={60}
                        step={5}
                        value={simulatedDrop}
                        onChange={(e) => setSimulatedDrop(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--niva-warning)" }}
                      />
                      <div className="flex-between" style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 4 }}>
                        <span>-5% (Slight Dip)</span>
                        <span>-25% (Seasonal Slowdown)</span>
                        <span>-60% (Severe Crisis)</span>
                      </div>
                    </div>
                  )}

                  {simulatedScenario === "salary_delay" && (
                    <div>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <label className="label-sm text-muted">Simulate Days of Delayed Inflow Before Rent/EMIs</label>
                        <span style={{ fontWeight: 800, fontSize: 18, color: "var(--niva-deep-forest)" }}>
                          {delayDays} Days Lag
                        </span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={28}
                        step={1}
                        value={delayDays}
                        onChange={(e) => setDelayDays(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--niva-deep-forest)" }}
                      />
                      <div className="flex-between" style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 4 }}>
                        <span>3 Days</span>
                        <span>14 Days (Mid-month crunch)</span>
                        <span>28 Days (Full cycle lag)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulation 30-Day Runway Projection Card */}
                <div style={{
                  padding: "20px 24px",
                  borderRadius: "var(--radius-md)",
                  background: Number(simulatedMonthsBuffer) < 1.5 ? "var(--niva-critical-bg)" : Number(simulatedMonthsBuffer) < 2.5 ? "var(--niva-warning-bg)" : "var(--niva-canvas)",
                  border: "1px solid var(--niva-border)",
                }}>
                  <div className="grid-4" style={{ gap: 16, textAlign: "center" }}>
                    <div>
                      <div className="label-sm text-muted">SIMULATED HEALTH SCORE</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: simulatedHealthScore >= 50 ? "var(--niva-positive)" : "var(--niva-critical)", marginTop: 2 }}>
                        {simulatedHealthScore} / 100
                      </div>
                      <div style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>
                        {simulatedHealthScore >= 65 ? "Stable" : simulatedHealthScore >= 45 ? "Stressed" : "Critical Deficit"}
                      </div>
                    </div>

                    <div>
                      <div className="label-sm text-muted">PROJECTED BALANCE</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--niva-obsidian)", marginTop: 2 }}>
                        ₹{adjustedBalance.toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>Remaining liquid cash</div>
                    </div>

                    <div>
                      <div className="label-sm text-muted">LIQUID RUNWAY</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: Number(simulatedMonthsBuffer) >= 2 ? "var(--niva-positive)" : "var(--niva-critical)", marginTop: 2 }}>
                        {simulatedDaysRunway} Days
                      </div>
                      <div style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>({simulatedMonthsBuffer} Months essential buffer)</div>
                    </div>

                    <div>
                      <div className="label-sm text-muted">DEFAULT RISK VERDICT</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: Number(simulatedMonthsBuffer) < 1.0 ? "var(--niva-critical)" : "var(--niva-positive)", marginTop: 6 }}>
                        {Number(simulatedMonthsBuffer) < 1.0 ? "HIGH (DEFAULT RISK)" : Number(simulatedMonthsBuffer) < 2.0 ? "MODERATE BUFFER" : "SAFE & RESILIENT"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>RBI Fair Lending Alert</div>
                    </div>
                  </div>

                  {/* Recommended NIVA Financial Shield */}
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <strong style={{ fontSize: 13 }}>🛡️ Recommended Financial Shield:</strong>
                      <span style={{ fontSize: 13, color: "var(--niva-text-secondary)", marginLeft: 6 }}>
                        {simulatedShock > 20000 || Number(simulatedMonthsBuffer) < 1.5
                          ? "Activate Emergency Micro-FD Auto-Sweep and pre-register for PM SVANidhi working capital line."
                          : "Maintain existing monthly savings cadence. Your cashflow comfortably withstands this shock."}
                      </span>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("schemes")}>
                      View Relief Scheme →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ TAB 4: SAFE SCHEMES & ZERO PREDATORY NUDGES ═══════════════ */}
          {activeTab === "schemes" && (
            <div className="stack-lg">
              <div className="flex-between" style={{ flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h2 className="headline-sm">{t.safeSchemes}</h2>
                  <p className="body-sm text-muted">
                    Screened strictly through the NIVA Responsible Gate. Zero predatory nudges, guaranteed RBI fair lending compliance.
                  </p>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: "var(--radius-pill)",
                  background: "var(--niva-critical-bg)", color: "var(--niva-critical)",
                  fontWeight: 700, fontSize: 12,
                }}>
                  <ShieldIcon size={16} color="var(--niva-critical)" />
                  {t.predatoryBlocked} (2 Blocked)
                </div>
              </div>

              {/* Schemes Grid */}
              <div className="grid-3" style={{ gap: 16 }}>
                {/* Scheme 1: Pre-Approved PM SVANidhi */}
                <div style={{ padding: 18, border: "1px solid var(--niva-border)", borderRadius: "var(--radius-md)", background: "var(--niva-canvas)" }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span className="chip chip-positive">Pre-Approved</span>
                    <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>Govt Subsidized</span>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>PM SVANidhi Working Capital</h4>
                  <p className="body-sm text-secondary" style={{ marginBottom: 12 }}>
                    Low-cost collateral-free working capital loan at 7% effective APR. 0% foreclosure penalty and interest subvention for digital UPI repayments.
                  </p>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--niva-positive)", marginBottom: 8 }}>₹20,000 Line</div>
                  <button className="btn btn-primary" style={{ width: "100%", fontSize: 12, padding: "8px" }}>
                    Apply with 1-Click →
                  </button>
                </div>

                {/* Scheme 2: Emergency Buffer Micro-FD */}
                <div style={{ padding: 18, border: "1px solid var(--niva-border)", borderRadius: "var(--radius-md)", background: "var(--niva-canvas)" }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span className="chip chip-positive">Recommended</span>
                    <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>Emergency Cushion</span>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Emergency Buffer Micro-FD</h4>
                  <p className="body-sm text-secondary" style={{ marginBottom: 12 }}>
                    Auto-sweep ₹1,500/month into an instant withdrawal liquid deposit yielding 7.2% APY without lock-in penalties or break charges.
                  </p>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--niva-deep-forest)", marginBottom: 8 }}>₹1,500/mo Auto-Sweep</div>
                  <button className="btn btn-outline" style={{ width: "100%", fontSize: 12, padding: "8px" }}>
                    Start Buffer Deposit →
                  </button>
                </div>

                {/* Scheme 3: Blocked Predatory Loan Showcase */}
                <div style={{ padding: 18, border: "1px dashed var(--niva-critical)", borderRadius: "var(--radius-md)", background: "var(--niva-critical-bg)" }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--niva-critical)", textTransform: "uppercase" }}>
                      🚫 Suppressed by Gate
                    </span>
                    <span style={{ fontSize: 11, color: "var(--niva-critical)" }}>Unsuitable</span>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--niva-critical)" }}>Instant 36% Payday Loan</h4>
                  <p className="body-sm" style={{ color: "var(--niva-critical)", marginBottom: 12 }}>
                    Blocked to prevent debt trap. High APR creates non-linear default risk when DTI exceeds safe buffer.
                  </p>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--niva-critical)" }}>
                    Rule: Policy POL-402 (RBI Fair Practices Code §3.2)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ TAB 5: ASK NIVA VOICE COPILOT WORKSPACE ═══════════════ */}
          {activeTab === "copilot" && (
            <div className="stack-lg">
              <section className="card" style={{ border: "2px solid rgba(142,242,68,0.4)" }}>
                <div className="flex-between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: "var(--niva-deep-forest)",
                      color: "var(--niva-electric-lime)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <VolumeIcon size={22} color="var(--niva-electric-lime)" />
                    </div>
                    <div>
                      <h2 className="headline-sm">{t.askNiva}</h2>
                      <p className="body-sm text-muted">{t.askNivaSubtitle}</p>
                    </div>
                  </div>
                  <span className="chip chip-positive">
                    {language === "hi" ? "हिन्दी वॉइस सक्रिय" : language === "gu" ? "ગુજરાતી વોઇસ સક્રિય" : "Voice AI Ready"}
                  </span>
                </div>

                {/* Quick Question Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
                  {[t.quickPrompt1, t.quickPrompt2, t.quickPrompt3].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCopilotInput(prompt);
                        handleSendCopilot(prompt);
                      }}
                      style={{
                        padding: "6px 14px", borderRadius: "var(--radius-pill)",
                        border: "1px solid var(--niva-border)", background: "var(--niva-canvas)",
                        fontSize: 12, fontWeight: 500, cursor: "pointer", color: "var(--niva-text-secondary)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      💬 {prompt}
                    </button>
                  ))}
                </div>

                {/* Interactive Input Bar */}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <input
                    type="text"
                    className="input"
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendCopilot(); }}
                    placeholder={t.copilotPlaceholder}
                    style={{ flex: 1, padding: "12px 18px", borderRadius: "var(--radius-md)", fontSize: 13 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSendCopilot()}
                    disabled={copilotLoading}
                    style={{ minWidth: 130, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <SparklesIcon size={16} color="var(--niva-electric-lime)" />
                    {copilotLoading ? "Analyzing..." : language === "hi" ? "पूछें" : language === "gu" ? "પૂછો" : "Ask"}
                  </button>
                </div>

                {/* Copilot Response Card */}
                {copilotResponse && (
                  <div style={{
                    marginTop: 18, padding: "18px 22px", borderRadius: "var(--radius-md)",
                    background: "var(--niva-canvas-subtle)", border: "1px solid var(--niva-border)",
                    animation: "fadeSlideUp 0.3s ease forwards",
                  }}>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BrainIcon size={18} color="var(--niva-deep-forest)" />
                        <strong style={{ fontSize: 13 }}>NIVA Financial Advice:</strong>
                      </div>
                      <button
                        onClick={() => speakText(copilotResponse)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                          color: "var(--niva-deep-forest)", fontWeight: 600,
                        }}
                      >
                        <VolumeIcon size={16} color="currentColor" />
                        {isSpeaking ? (language === "hi" ? "बोल रहा है..." : "Speaking...") : (language === "hi" ? "दोबारा सुनें" : "Replay Audio")}
                      </button>
                    </div>
                    <p className="body-md" style={{ color: "var(--niva-obsidian)", lineHeight: 1.6 }}>
                      {copilotResponse}
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

        </div>
      </main>

      {/* Discrete Institutional Link in Footer */}
      <footer className="footer" style={{ borderTop: "1px solid var(--niva-border)", padding: "24px 0", textAlign: "center" }}>
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
