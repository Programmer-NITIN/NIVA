"use client";

import { useState, useEffect } from "react";
import {
  getFinancialTwin,
  getRecommendations,
  sendChatMessage,
  getSpendingAnalysis,
  getMLAnomalies,
  getMLLifeStage,
  getUserProfile,
  updateUserProfile,
  getPots,
  sweepPot,
  releasePot,
  createPot,
  deletePot,
  runPotsAutopilot,
  ingestSms,
  getSubscriptions,
  getMLStressPrediction,
  checkAffordability,
  getBureauLag,
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
  IdCardIcon,
  RefreshCwIcon,
  SettingsIcon,
  TrendingDownIcon,
} from "@/components/icons";

type Language = "en" | "hi" | "gu";
type ActiveTab = "twin" | "spending" | "whatif" | "schemes" | "copilot" | "pots" | "afford" | "subs" | "settings";

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

const SHAP_FEATURE_INFO: Record<string, { label: string; desc: string }> = {
  merchant_category_entropy: {
    label: "Spending Variety & Category Spread",
    desc: "Balanced cadence across diverse merchant categories",
  },
  savings_rate: {
    label: "Monthly Net Savings Buffer",
    desc: "Surplus cash saved as liquid reserve after essentials",
  },
  dti_ratio: {
    label: "Debt-to-Income (DTI) Leverage",
    desc: "Monthly debt obligations compared to total inflow",
  },
  balance_trend_slope: {
    label: "Account Balance Trajectory",
    desc: "30-day liquid reserve growth velocity",
  },
  night_txn_ratio: {
    label: "Late-Night Spending Discipline",
    desc: "Transactions made during off-hours (11 PM - 5 AM)",
  },
  discretionary_spend_ratio: {
    label: "Discretionary Spending Ratio",
    desc: "Non-essential leisure and discretionary retail spend",
  },
  expense_trend_pct: {
    label: "Monthly Expense Growth Trend",
    desc: "Month-over-month trajectory in essential burn rate",
  },
  income_stability: {
    label: "Monthly Inflow Stability",
    desc: "Regularity of verified UPI business and salary credits",
  },
  bounce_count_30d: {
    label: "AutoPay / Mandate Health",
    desc: "Zero returns or failed NACH payment debits",
  },
  credit_limit_utilization: {
    label: "Credit Line Utilization",
    desc: "Outstanding balances vs total sanctioned limits",
  },
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
  const [pots, setPots] = useState<any[]>([]);
  const [subs, setSubs] = useState<any>(null);
  const [shap, setShap] = useState<any>(null);
  const [affordAmt, setAffordAmt] = useState(45000);
  const [affordRes, setAffordRes] = useState<any>(null);
  const [smsText, setSmsText] = useState("");
  const [bureau, setBureau] = useState<any>(null);

  // Personalized Pots State
  const [showNewPotModal, setShowNewPotModal] = useState(false);
  const [newPotName, setNewPotName] = useState("");
  const [newPotTarget, setNewPotTarget] = useState(25000);
  const [newPotInitial, setNewPotInitial] = useState(2000);
  const [newPotSweepPct, setNewPotSweepPct] = useState(10);
  const [newPotIcon, setNewPotIcon] = useState("🏺");
  const [potActionMsg, setPotActionMsg] = useState<string | null>(null);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [potCreating, setPotCreating] = useState(false);

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

  // User Profile & Analysis Settings State
  const [profileData, setProfileData] = useState<any>({
    full_name: "",
    phone: "",
    occupation: "",
    address: "",
    dob: "",
    gender: "",
    dependents: 2,
    declared_income: 65000,
    declared_essential_expenses: 26300,
    declared_monthly_emi: 14200,
    target_buffer_months: 6,
    risk_tolerance: "moderate",
    data_sync_frequency: "monthly",
    allow_responsible_analysis: true,
    language_preference: "en",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

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
    // No session found — initialize default Rajesh Sharma demo session
    setSession(DEFAULT_SESSION);
    try {
      localStorage.setItem("niva_customer_session", JSON.stringify(DEFAULT_SESSION));
    } catch {}
    fetchDashboardData(DEFAULT_SESSION.personaId);
  }, []);

  async function fetchDashboardData(personaId: string) {
    setLoading(true);
    try {
      const [twinRes, recsRes, spendRes, stageRes, anomRes, profileRes, potsRes, subsRes, shapRes, bureauRes] = await Promise.all([
        getFinancialTwin(personaId).catch(() => null),
        getRecommendations(personaId).catch(() => null),
        getSpendingAnalysis(personaId).catch(() => null),
        getMLLifeStage(personaId).catch(() => null),
        getMLAnomalies(personaId).catch(() => null),
        getUserProfile(personaId).catch(() => null),
        getPots(personaId).catch(() => null),
        getSubscriptions(personaId).catch(() => null),
        getMLStressPrediction(personaId).catch(() => null),
        getBureauLag(personaId).catch(() => null),
      ]);
      setTwin(twinRes);
      setRecommendations(recsRes);
      setSpendingData(spendRes);
      setLifeStage(stageRes);
      const rawAnomalies = anomRes?.flagged_transactions || spendRes?.anomalies_detected || [];
      setAnomalies(Array.isArray(rawAnomalies) ? rawAnomalies : []);
      if (profileRes) {
        setProfileData({
          full_name: profileRes.full_name || session.name || "Customer",
          phone: profileRes.phone || session.phone || "+91 98765 00000",
          occupation: profileRes.occupation || "Account Holder",
          address: profileRes.address || "Verified Banking Address, India",
          dob: profileRes.dob || "1988-05-18",
          gender: profileRes.gender || "Verified",
          dependents: profileRes.dependents !== undefined ? profileRes.dependents : 2,
          declared_income: profileRes.declared_income !== undefined ? profileRes.declared_income : (twinRes?.income?.monthly_income || session.monthlyIncome || 65000),
          declared_essential_expenses: profileRes.declared_essential_expenses !== undefined ? profileRes.declared_essential_expenses : (twinRes?.expenses?.essential || session.essentialExpenses || 26300),
          declared_monthly_emi: profileRes.declared_monthly_emi !== undefined ? profileRes.declared_monthly_emi : (twinRes?.debt?.total_emi || 14200),
          target_buffer_months: profileRes.target_buffer_months !== undefined ? profileRes.target_buffer_months : 6,
          risk_tolerance: profileRes.risk_tolerance || "moderate",
          data_sync_frequency: profileRes.data_sync_frequency || "monthly",
          allow_responsible_analysis: profileRes.allow_responsible_analysis !== undefined ? profileRes.allow_responsible_analysis : true,
          language_preference: profileRes.language_preference || language,
        });
      }
      if (potsRes?.pots) setPots(potsRes.pots);
      if (subsRes) setSubs(subsRes);
      if (shapRes?.ml_prediction) setShap(shapRes.ml_prediction);
      if (bureauRes) setBureau(bureauRes);
    } catch (err) {
      console.error("Error loading customer dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefreshAnalysis() {
    setRefreshing(true);
    try {
      await fetchDashboardData(session.personaId);
    } catch (err) {
      console.error("Error refreshing analysis:", err);
    } finally {
      setRefreshing(false);
      alert("successfully anylisi it");
    }
  }

  async function handleSaveProfile() {
    setSavingSettings(true);
    try {
      const res = await updateUserProfile(session.personaId, profileData);
      setSettingsNotice(
        language === "hi"
          ? "प्रोफ़ाइल और वित्तीय विश्लेषण पैरामीटर सफलतापूर्वक सहेजे गए। AI डिजिटल ट्विन पुनः परिकलित हुआ।"
          : language === "gu"
          ? "પ્રોફાઇલ અને વિશ્લેષણ પરિમાણો સાચવવામાં આવ્યા. AI ડિજિટલ ટ્વીન અપડેટ થયું."
          : "Profile & analysis parameters saved. AI Financial Digital Twin recalculated successfully."
      );
      if (res.recalculated_twin) {
        setTwin(res.recalculated_twin);
      }
      if (profileData.full_name) {
        const updatedSession = { ...session, name: profileData.full_name, monthlyIncome: profileData.declared_income, essentialExpenses: profileData.declared_essential_expenses };
        setSession(updatedSession);
        localStorage.setItem("niva_customer_session", JSON.stringify(updatedSession));
      }
      setTimeout(() => setSettingsNotice(null), 6000);
    } catch (err: any) {
      alert("Failed to update profile: " + (err.message || err));
    } finally {
      setSavingSettings(false);
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

  async function handleCreateCustomPot() {
    if (!newPotName.trim()) {
      alert("Please enter a name for your personalized pot.");
      return;
    }
    setPotCreating(true);
    try {
      const res = await createPot(
        session.personaId,
        newPotName.trim(),
        Number(newPotTarget) || 25000,
        Number(newPotInitial) || 0,
        Number(newPotSweepPct) || 10,
        newPotIcon || "🏺"
      );
      if (res.pots) {
        setPots(res.pots);
      }
      setPotActionMsg(`🎉 Created personalized pot "${newPotName.trim()}"!`);
      setShowNewPotModal(false);
      setNewPotName("");
      setNewPotTarget(25000);
      setNewPotInitial(2000);
      setNewPotSweepPct(10);
      setTimeout(() => setPotActionMsg(null), 4000);
    } catch (e: any) {
      alert("Failed to create pot: " + (e.message || e));
    } finally {
      setPotCreating(false);
    }
  }

  async function handleDeletePot(potId: string, potName: string) {
    if (!confirm(`Are you sure you want to delete "${potName}"? Any remaining balance will be released to available funds.`)) return;
    try {
      const res = await deletePot(session.personaId, potId);
      if (res.pots) {
        setPots(res.pots);
      }
      setPotActionMsg(`Deleted pot "${potName}".`);
      setTimeout(() => setPotActionMsg(null), 4000);
    } catch (e: any) {
      alert("Failed to delete pot: " + (e.message || e));
    }
  }

  async function handleRunAutopilot() {
    setAutopilotRunning(true);
    try {
      const res = await runPotsAutopilot(session.personaId);
      if (res.pots) {
        setPots(res.pots);
      }
      setPotActionMsg(res.action || "Autopilot balanced pots successfully!");
      setTimeout(() => setPotActionMsg(null), 5000);
    } catch (e: any) {
      alert("Autopilot error: " + (e.message || e));
    } finally {
      setAutopilotRunning(false);
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
                {language === "hi" ? "डिजिटल ट्विन" : language === "gu" ? "ડિજિટલ ટ્વીન" : "Twin"}
              </button>
            </li>
            <li>
              <button className={activeTab === "pots" ? "active" : ""} onClick={() => setActiveTab("pots")}>
                {language === "hi" ? "पॉट्स" : language === "gu" ? "પોટ્સ" : "Pots"}
              </button>
            </li>
            <li>
              <button className={activeTab === "afford" ? "active" : ""} onClick={() => setActiveTab("afford")}>
                {language === "hi" ? "सामर्थ्य" : language === "gu" ? "સામર્થ્ય" : "Affordability"}
              </button>
            </li>
            <li>
              <button className={activeTab === "spending" ? "active" : ""} onClick={() => setActiveTab("spending")}>
                {language === "hi" ? "खर्च ब्यौरा" : language === "gu" ? "ખર્ચ વિશ્લેષણ" : "Spending"}
              </button>
            </li>
            <li>
              <button className={activeTab === "subs" ? "active" : ""} onClick={() => setActiveTab("subs")}>
                {language === "hi" ? "सदस्यताएं" : language === "gu" ? "સબ્સ્ક્રિપ્શન્સ" : "Subscriptions"}
              </button>
            </li>
            <li>
              <button className={activeTab === "whatif" ? "active" : ""} onClick={() => setActiveTab("whatif")}>
                {language === "hi" ? "संकट सिमुलेटर" : language === "gu" ? "સંકટ સિમ્યુલેટર" : "What-If"}
              </button>
            </li>
            <li>
              <button className={activeTab === "schemes" ? "active" : ""} onClick={() => setActiveTab("schemes")}>
                {language === "hi" ? "सुरक्षित योजनाएं" : language === "gu" ? "સુરક્ષિત યોજનાઓ" : "Schemes"}
              </button>
            </li>
            <li>
              <button className={activeTab === "copilot" ? "active" : ""} onClick={() => setActiveTab("copilot")}>
                {language === "hi" ? "NIVA साथी (Voice)" : language === "gu" ? "NIVA સાથી (Voice)" : "Ask NIVA"}
              </button>
            </li>
            <li>
              <button
                id="navbar-profile-settings-tab"
                className={activeTab === "settings" ? "active" : ""}
                onClick={() => setActiveTab("settings")}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <SettingsIcon size={14} color="currentColor" />
                <span>{language === "hi" ? "प्रोफ़ाइल व सेटिंग्स" : language === "gu" ? "પ્રોફાઇલ અને સેટિંગ્સ" : "Profile & Settings"}</span>
              </button>
            </li>
          </ul>

          {/* Mobile: keep navbar brand + language, desktop tabs hidden via CSS; bottom nav handles navigation */}
          <div className="bottom-nav-spacer" style={{display:"none"}} />

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

            {/* Refresh Analysis Button (No Emoji) */}
            <button
              id="navbar-refresh-btn"
              onClick={handleRefreshAnalysis}
              disabled={refreshing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: "var(--niva-deep-forest)",
                color: "var(--niva-electric-lime)",
                borderRadius: "var(--radius-pill)",
                border: "1px solid rgba(142,242,68,0.4)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Refresh and analyze financial telemetry"
            >
              <RefreshCwIcon
                size={13}
                color="var(--niva-electric-lime)"
                className={refreshing ? "spin-animation" : ""}
              />
              <span>{refreshing ? "Analyzing..." : "Refresh"}</span>
            </button>

            {/* Customer Profile Pill & Logout */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, borderLeft: "1px solid var(--niva-border)" }}>
              <button
                onClick={() => setActiveTab("settings")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px",
                  background: activeTab === "settings" ? "var(--niva-deep-forest)" : "var(--niva-canvas-subtle)",
                  color: activeTab === "settings" ? "var(--niva-electric-lime)" : "var(--niva-obsidian)",
                  borderRadius: "var(--radius-pill)",
                  border: activeTab === "settings" ? "1px solid var(--niva-electric-lime)" : "1px solid var(--niva-border)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title="View & update profile and analysis settings"
              >
                <span className="status-dot positive" />
                <span style={{ fontSize: 12, fontWeight: 700 }}>{session.name}</span>
                <SettingsIcon size={13} color="currentColor" style={{ opacity: 0.7 }} />
              </button>
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

              {/* Quick Health Summary Pill & Refresh Action */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button
                  id="welcome-refresh-btn"
                  onClick={handleRefreshAnalysis}
                  disabled={refreshing}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(142,242,68,0.15)",
                    border: "1px solid rgba(142,242,68,0.4)",
                    color: "var(--niva-electric-lime)",
                    borderRadius: "var(--radius-pill)",
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  title="Refresh and re-analyze financial data"
                >
                  <RefreshCwIcon
                    size={16}
                    color="var(--niva-electric-lime)"
                    className={refreshing ? "spin-animation" : ""}
                  />
                  <span>{refreshing ? "Analyzing..." : "Refresh"}</span>
                </button>

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

              {/* XAI & Bureau Intelligence */}
              {shap && (
                <div className="card">
                  <div className="flex-between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span className="label-sm text-muted">XAI • SHAP TREEEXPLAINER</span>
                      <h3 className="title-md" style={{ marginTop: 2 }}>Why Your Risk Looks Like This</h3>
                    </div>
                    <span className="chip chip-neutral" style={{ fontSize: 11 }}>RBI explainability ✓</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[...(shap.top_risk_factors || []), ...(shap.top_protective_factors || [])].slice(0, 5).map((f: any, i: number) => {
                      const val = (f.shap_value ?? f.value ?? f.impact ?? 0);
                      const isRisk = Number(val) > 0;
                      const featKey = String(f.feature || f.name || "").toLowerCase();
                      const featMeta = SHAP_FEATURE_INFO[featKey] || {
                        label: (f.feature || f.name || `Factor ${i + 1}`).toString().replace(/_/g, " ").toUpperCase(),
                        desc: "Algorithmic feature contribution",
                      };
                      const absImpact = Math.abs(Number(val));
                      const barWidth = Math.min(100, Math.max(12, absImpact * 180));

                      return (
                        <div
                          key={i}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "220px 1fr 140px",
                            gap: 14,
                            alignItems: "center",
                            padding: "10px 14px",
                            background: "var(--niva-canvas-subtle)",
                            borderRadius: 10,
                            border: "1px solid var(--niva-border)",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--niva-obsidian)" }}>
                              {featMeta.label}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 1 }}>
                              {featMeta.desc}
                            </div>
                          </div>

                          <div style={{ height: 8, background: "var(--niva-canvas-dim)", borderRadius: 999, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${barWidth}%`,
                                background: isRisk ? "var(--niva-critical)" : "var(--niva-positive)",
                                marginLeft: isRisk ? "0" : "auto",
                                borderRadius: 999,
                              }}
                            />
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span
                              className={`chip ${isRisk ? "chip-critical" : "chip-positive"}`}
                              style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px" }}
                            >
                              {isRisk ? `+${Number(val).toFixed(2)} Risk` : `🛡️ -${absImpact.toFixed(2)} Buffer`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 10, fontSize: 12 }}>
                    RBI-compliant deterministic contributions from XGBoost stress model. Green factors fortify your health score; red factors indicate areas needing envelope buffering.
                  </div>
                </div>
              )}

              {bureau && (
                <div className="card">
                  <div className="flex-between" style={{ marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span className="label-sm text-muted">38-DAY BLIND WINDOW</span>
                      <h3 className="title-md" style={{ marginTop: 2 }}>Bureau vs AA — What Traditional Banks Miss</h3>
                    </div>
                    {bureau.status === "stressed" || Number(bureau.aa_live_health) < 65 ? (
                      <span className="chip chip-critical" style={{ fontSize: 11 }}>
                        ● {bureau.delinquency_multiplier || 3.4}× Risk Masked by Bureau Lag
                      </span>
                    ) : (
                      <span className="chip chip-positive" style={{ fontSize: 11 }}>
                        ✓ Real-Time AA Verified Healthy ({bureau.aa_live_health}/100)
                      </span>
                    )}
                  </div>
                  <p className="body-sm text-muted" style={{ marginBottom: 12 }}>
                    {bureau.insight || `Traditional CIBIL updates on a 38-day lag, while NIVA Account Aggregator reads live cashflow.`}
                  </p>
                  <div style={{ display: "flex", gap: 6, alignItems: "end", height: 90, padding: "8px 10px", background: "var(--niva-canvas-subtle)", borderRadius: 10, border: "1px solid var(--niva-border)" }}>
                    {bureau.series.map((s: any, i: number) => {
                      const isToday = i === bureau.series.length - 1;
                      const isHealthyToday = isToday && (bureau.status === "healthy" || Number(bureau.aa_live_health) >= 65);
                      const barColor = isToday
                        ? isHealthyToday ? "var(--niva-positive)" : "var(--niva-critical)"
                        : "var(--niva-deep-forest)";
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ display: "flex", gap: 4, alignItems: "end", height: 62 }}>
                            <div title={`Bureau ${s.bureau}`} style={{ width: 12, height: `${(s.bureau / 760) * 36 + 6}px`, background: "var(--niva-border-strong)", borderRadius: 4 }} />
                            <div title={`AA Live ${s.aa}`} style={{ width: 12, height: `${(s.aa / 100) * 60 + 4}px`, background: barColor, borderRadius: 4 }} />
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--niva-text-muted)" }}>{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 10, fontSize: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, background: "var(--niva-border-strong)", borderRadius: 3, display: "inline-block" }} /> 
                      Bureau flat (Static 760)
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, background: Number(bureau.aa_live_health) >= 65 ? "var(--niva-positive)" : "var(--niva-deep-forest)", borderRadius: 3, display: "inline-block" }} /> 
                      AA live ReBIT ({bureau.aa_live_health}/100)
                    </span>
                  </div>
                </div>
              )}

              <div className="card" style={{ border: "1px solid var(--niva-border)", background: "var(--niva-canvas-subtle)" }}>
                <div className="flex-between" style={{ marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span className="label-sm text-muted">SMS-TO-TWIN • BHARAT INBOX PARSER</span>
                    <h3 className="title-md" style={{ marginTop: 2 }}>Instant Statement Sync via SMS</h3>
                  </div>
                  <span className="chip chip-neutral" style={{ fontSize: 11 }}>Supports 6 National Banks</span>
                </div>
                <p className="body-sm text-muted" style={{ marginBottom: 10 }}>
                  No PDF download needed. Paste recent bank SMS alerts to instantaneously update your Digital Twin cashflow.
                </p>
                <textarea
                  value={smsText}
                  onChange={e => setSmsText(e.target.value)}
                  placeholder={"Rs 42,000 credited to A/c XX1234 on 12-Sep-26 UPI Ref 123...\nRs 3,850 debited UPI/DMART Groceries STATION RD"}
                  style={{ width: "100%", minHeight: 70, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--niva-border)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.5, background: "var(--niva-canvas)" }}
                />
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    try {
                      const r = await ingestSms(session.personaId, smsText);
                      setSmsText("");
                      const msg = `Parsed ${r.transactions_parsed} SMS txns — Twin refreshed. Health ${r.twin?.health_score ?? ""}/100`;
                      (window as any).__nivaToast?.(msg);
                      fetchDashboardData(session.personaId);
                    } catch (e: any) {
                      alert(e.message);
                    }
                  }}>
                    Sync SMS to Digital Twin →
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setSmsText("Rs 42,000 credited to A/c XX1234 on 12-Sep-26\nRs 3,850 debited UPI/DMART Groceries STATION RD")}>
                    Sample SMS
                  </button>
                </div>
              </div>
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
                    ₹{(Number(spendingData?.monthly_essential || twin?.expenses?.essential || session.essentialExpenses) || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 4 }}>Rent, Food, Healthcare, Utilities</div>
                </div>

                <div className="card" style={{ textAlign: "center" }}>
                  <div className="label-sm text-muted">DISCRETIONARY SPEND</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                    ₹{(Number(spendingData?.monthly_discretionary || twin?.expenses?.discretionary || 9670) || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 4 }}>Shopping, Dining, Leisure</div>
                </div>

                <div className="card" style={{ textAlign: "center" }}>
                  <div className="label-sm text-muted">ESSENTIAL / TOTAL RATIO</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-positive)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(Number(spendingData?.essential_ratio ?? twin?.expenses?.essential_ratio ?? 71.1))}%
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
                    const trendVal = Number(c.trend ?? c.trend_pct ?? 0);
                    const isSpike = trendVal > 30;
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
                                Spike (+{Math.round(trendVal)}%)
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
                  {anomalies.length > 0 ? (
                    anomalies.map((anom: any, idx: number) => {
                      const amt = Number(anom.amount) || 0;
                      const cat = anom.category ? String(anom.category).toUpperCase() : "SPENDING";
                      const desc = anom.description || anom.narration || anom.merchant_name || `Unusual Transaction in ${cat}`;
                      const zScore = anom.z_score !== undefined && anom.z_score !== null ? `${Number(anom.z_score).toFixed(1)}σ Outlier` : "Flagged by Isolation Forest";
                      return (
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
                              ⚠️ {desc}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--niva-text-secondary)", marginTop: 2 }}>
                              ID: {anom.transaction_id} • Category: {cat} • Dynamic Anomaly Score: {zScore}
                              {anom.transaction_date && ` • ${anom.transaction_date}`}
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--niva-obsidian)", fontVariantNumeric: "tabular-nums" }}>
                            ₹{amt.toLocaleString("en-IN")}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{
                      padding: "16px 20px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(142,242,68,0.08)",
                      border: "1px solid rgba(22,51,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 24 }}>🛡️</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--niva-deep-forest)" }}>
                            All Transactions In-Envelope — Zero Statistical Anomalies
                          </div>
                          <div style={{ fontSize: 11, color: "var(--niva-text-secondary)", marginTop: 2 }}>
                            Isolation Forest and Dynamic Z-Score verified all debit transactions conform to your baseline spending envelopes.
                          </div>
                        </div>
                      </div>
                      <span className="chip chip-positive" style={{ fontSize: 11 }}>100% In-Envelope</span>
                    </div>
                  )}
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

          {/* POTS — Wise-style Smart Envelopes & Income Firewall */}
          {activeTab === "pots" && (
            <div className="stack-lg">
              {/* Header & High-Level Metrics */}
              <div className="flex-between" style={{ flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                <div>
                  <span className="label-sm text-muted">INCOME FIREWALL • SMART ENVELOPES</span>
                  <h2 className="headline-sm" style={{ marginTop: 4 }}>NIVA Pots — Never Borrow for Rent</h2>
                  <p className="body-sm text-muted" style={{ marginTop: 4, maxWidth: 680 }}>
                    Auto-sweep surplus cash on good months, auto-release for rent and essentials on bad months. 
                    The Gate protects you from predatory 36% APR loans by funding emergencies from your own smart envelopes.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowNewPotModal(!showNewPotModal)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <span>{showNewPotModal ? "✕ Close Form" : "+ Create Personalized Pot"}</span>
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={handleRunAutopilot}
                    disabled={autopilotRunning}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <span>{autopilotRunning ? "Running Autopilot…" : "⚡ Run Autopilot Balance"}</span>
                  </button>
                </div>
              </div>

              {/* Notification / Action Message Toast */}
              {potActionMsg && (
                <div style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  background: "var(--niva-deep-forest)",
                  color: "var(--niva-electric-lime)",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 12px rgba(22,51,0,0.15)",
                }}>
                  <span>{potActionMsg}</span>
                  <button onClick={() => setPotActionMsg(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
              )}

              {/* Overall Summary Bar */}
              <div className="grid-3" style={{ gap: 16 }}>
                <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}>
                  <div className="label-sm text-muted">TOTAL ENVELOPE SAVINGS</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: "var(--niva-obsidian)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                    ₹{pots.reduce((s: number, p: any) => s + (Number(p.balance) || 0), 0).toLocaleString("en-IN")}
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 2, fontSize: 11 }}>Liquid & ready for auto-release</div>
                </div>

                <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}>
                  <div className="label-sm text-muted">TARGET BUFFER GOAL</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                    ₹{pots.reduce((s: number, p: any) => s + (Number(p.target) || 0), 0).toLocaleString("en-IN")}
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 2, fontSize: 11 }}>Cumulative goal across {pots.length} envelopes</div>
                </div>

                <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}>
                  <div className="label-sm text-muted">OVERALL BUFFER FUNDED</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: "var(--niva-positive)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                    {pots.length ? Math.min(100, Math.round((pots.reduce((s: number, p: any) => s + (Number(p.balance) || 0), 0) / Math.max(1, pots.reduce((s: number, p: any) => s + (Number(p.target) || 0), 0))) * 100)) : 0}%
                  </div>
                  <div className="body-sm text-muted" style={{ marginTop: 2, fontSize: 11 }}>Guarded against seasonal shocks</div>
                </div>
              </div>

              {/* ─── ADD PERSONALIZED POT FORM / CARD ─── */}
              {showNewPotModal && (
                <div className="card" style={{
                  padding: "24px 28px",
                  border: "2px solid var(--niva-deep-forest)",
                  background: "var(--niva-canvas-subtle)",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                }}>
                  <div className="flex-between" style={{ marginBottom: 14 }}>
                    <div>
                      <span className="chip chip-positive" style={{ fontSize: 11 }}>+ NEW PERSONALIZED ENVELOPE</span>
                      <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Create Your Custom Savings Jar</h3>
                    </div>
                    <button 
                      onClick={() => setShowNewPotModal(false)}
                      style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--niva-text-muted)" }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Preset Goal Quick-Picks */}
                  <div style={{ marginBottom: 18 }}>
                    <div className="label-sm text-muted" style={{ marginBottom: 8 }}>QUICK PRESETS (CLICK TO AUTO-FILL)</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        { label: "🎓 Child School Fees", target: 40000, initial: 3000, sweep: 15, icon: "🎓" },
                        { label: "🏍️ Two-Wheeler / Bike", target: 25000, initial: 2000, sweep: 10, icon: "🏍️" },
                        { label: "💊 Medical Emergency", target: 30000, initial: 4000, sweep: 12, icon: "💊" },
                        { label: "💍 Gold & Family Savings", target: 50000, initial: 5000, sweep: 10, icon: "💍" },
                        { label: "🌾 Kirana / Inventory Stock", target: 20000, initial: 2500, sweep: 8, icon: "🌾" },
                        { label: "🎉 Festival & Diwali Buffer", target: 15000, initial: 1500, sweep: 5, icon: "🎉" },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 12, background: "var(--niva-canvas)", borderRadius: 20, padding: "6px 14px" }}
                          onClick={() => {
                            setNewPotName(preset.label.slice(2).trim());
                            setNewPotTarget(preset.target);
                            setNewPotInitial(preset.initial);
                            setNewPotSweepPct(preset.sweep);
                            setNewPotIcon(preset.icon);
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="grid-2" style={{ gap: 16 }}>
                    <div>
                      <label className="label-sm text-muted" style={{ display: "block", marginBottom: 6 }}>POT / ENVELOPE NAME *</label>
                      <input 
                        type="text" 
                        value={newPotName} 
                        onChange={e => setNewPotName(e.target.value)}
                        placeholder="e.g., Child School Fees, Bike EMI, Diwali Stock"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--niva-border)", fontSize: 14, background: "var(--niva-canvas)" }}
                      />
                    </div>

                    <div>
                      <label className="label-sm text-muted" style={{ display: "block", marginBottom: 6 }}>TARGET BUFFER AMOUNT (₹) *</label>
                      <input 
                        type="number" 
                        value={newPotTarget} 
                        onChange={e => setNewPotTarget(Number(e.target.value))}
                        placeholder="e.g., 30000"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--niva-border)", fontSize: 14, background: "var(--niva-canvas)" }}
                      />
                    </div>

                    <div>
                      <label className="label-sm text-muted" style={{ display: "block", marginBottom: 6 }}>INITIAL SEED DEPOSIT (₹)</label>
                      <input 
                        type="number" 
                        value={newPotInitial} 
                        onChange={e => setNewPotInitial(Number(e.target.value))}
                        placeholder="e.g., 2000"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--niva-border)", fontSize: 14, background: "var(--niva-canvas)" }}
                      />
                    </div>

                    <div>
                      <label className="label-sm text-muted" style={{ display: "block", marginBottom: 6 }}>
                        AUTO-SWEEP % ON SURPLUS MONTHS ({newPotSweepPct}%)
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="30" 
                        step="1"
                        value={newPotSweepPct} 
                        onChange={e => setNewPotSweepPct(Number(e.target.value))}
                        style={{ width: "100%", marginTop: 10 }}
                      />
                    </div>
                  </div>

                  {/* Icon Selector */}
                  <div style={{ marginTop: 16 }}>
                    <label className="label-sm text-muted" style={{ display: "block", marginBottom: 6 }}>CHOOSE POT ICON</label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {["🛡️", "🏠", "🏪", "🎓", "💊", "🏍️", "💍", "🌾", "🎉", "🏺", "📱", "🚗"].map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setNewPotIcon(ic)}
                          style={{
                            width: 40, height: 40, borderRadius: 10, fontSize: 18,
                            border: newPotIcon === ic ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                            background: newPotIcon === ic ? "var(--niva-electric-lime)" : "var(--niva-canvas)",
                            cursor: "pointer"
                          }}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ marginTop: 22, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setShowNewPotModal(false)}
                      disabled={potCreating}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleCreateCustomPot}
                      disabled={potCreating || !newPotName.trim()}
                    >
                      {potCreating ? "Creating Pot…" : "Create Pot & Enable Sweep →"}
                    </button>
                  </div>
                </div>
              )}

              {/* Pots Grid */}
              <div className="grid-3" style={{ gap: 16 }}>
                {pots.length ? pots.map((p: any) => {
                  const progress = Math.min(100, Math.round(((p.balance || 0) / Math.max(p.target || 1, 1)) * 100));
                  const isEmergency = p.name.toLowerCase().includes("emergency");
                  const icon = p.icon || (isEmergency ? "🛡️" : p.name.toLowerCase().includes("rent") ? "🏠" : p.name.toLowerCase().includes("stock") ? "🏪" : "🏺");

                  return (
                    <div key={p.id} className="card" style={{ padding: 0, overflow: "hidden", border: isEmergency ? "1.5px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)", display: "flex", flexDirection: "column" }}>
                      <div style={{ height: 6, background: isEmergency ? "var(--niva-electric-lime)" : progress >= 80 ? "var(--niva-positive)" : "var(--niva-border-strong)", width: `${progress}%`, transition: "width 400ms ease" }} />
                      
                      <div style={{ padding: "18px 18px 16px", textAlign: "left", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div className="flex-between" style={{ marginBottom: 6 }}>
                          <span className="chip" style={{ fontSize: 10, background: isEmergency ? "var(--niva-deep-forest)" : p.is_custom ? "rgba(142,242,68,0.15)" : "var(--niva-canvas-subtle)", color: isEmergency ? "var(--niva-electric-lime)" : p.is_custom ? "var(--niva-deep-forest)" : "var(--niva-text-secondary)", border: isEmergency ? "none" : "1px solid var(--niva-border)", fontWeight: 700 }}>
                            {isEmergency ? "SAFETY JAR" : p.is_custom ? "PERSONALIZED POT" : "ENVELOPE"}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="label-sm text-muted" style={{ fontSize: 11, fontWeight: 700 }}>{progress}% of goal</span>
                            {p.is_custom && (
                              <button 
                                onClick={() => handleDeletePot(p.id, p.name)}
                                title="Delete Pot"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--niva-text-muted)", fontSize: 14, padding: "0 2px" }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 4px" }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: isEmergency ? "var(--niva-positive-bg)" : "var(--niva-canvas-subtle)", border: "1px solid var(--niva-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                            {icon}
                          </div>
                          <div>
                            <div className="label-sm text-muted" style={{ fontSize: 11, fontWeight: 700 }}>{p.name.toUpperCase()}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                              ₹{Number(p.balance || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>

                        <div className="body-sm text-muted" style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span>Target: <strong>₹{Number(p.target || 0).toLocaleString("en-IN")}</strong></span>
                          <span>Auto-sweep: <strong>{p.auto_sweep_pct || 0}%</strong></span>
                        </div>

                        <div style={{ height: 6, background: "var(--niva-canvas-dim)", borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
                          <div style={{ height: "100%", width: `${progress}%`, background: progress >= 100 ? "var(--niva-positive)" : isEmergency ? "var(--niva-deep-forest)" : "var(--niva-text-secondary)", borderRadius: 999 }} />
                        </div>

                        {/* Interactive Buttons */}
                        <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ flex: 1, fontSize: 11 }}
                              onClick={async () => {
                                await sweepPot(session.personaId, 1000, p.name);
                                const up = await getPots(session.personaId);
                                setPots(up.pots);
                                setPotActionMsg(`Swept +₹1,000 into ${p.name}`);
                                setTimeout(() => setPotActionMsg(null), 3000);
                              }}
                            >
                              + ₹1k Sweep
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ flex: 1, fontSize: 11 }}
                              onClick={async () => {
                                await sweepPot(session.personaId, 2000, p.name);
                                const up = await getPots(session.personaId);
                                setPots(up.pots);
                                setPotActionMsg(`Swept +₹2,000 into ${p.name}`);
                                setTimeout(() => setPotActionMsg(null), 3000);
                              }}
                            >
                              + ₹2k Sweep
                            </button>
                          </div>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ width: "100%", fontSize: 11 }}
                            disabled={p.balance <= 0}
                            onClick={async () => {
                              if (p.balance <= 0) return;
                              const amt = Math.min(1500, p.balance);
                              await releasePot(session.personaId, amt, p.name);
                              const up = await getPots(session.personaId);
                              setPots(up.pots);
                              setPotActionMsg(`Released ₹${amt.toLocaleString("en-IN")} from ${p.name} to available funds.`);
                              setTimeout(() => setPotActionMsg(null), 3000);
                            }}
                          >
                            ↗ Release ₹1,500 Buffer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="card" style={{ gridColumn: "1/-1", textAlign: "center", padding: 32 }}>
                    Loading Smart Pots…
                  </div>
                )}
              </div>

              {/* Autopilot Explanation Card */}
              <div className="card" style={{ padding: "18px 20px", background: "var(--niva-canvas-subtle)", border: "1px solid var(--niva-border)", display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "var(--niva-text-secondary)", maxWidth: 680 }}>
                  <strong style={{ color: "var(--niva-obsidian)" }}>🛡️ Why Pots Protect You from Debt:</strong>{" "}
                  Instead of taking a 36% APR payday loan or drawing down credit cards for unexpected shocks, NIVA automatically sweeps surplus in peak inflow weeks and releases money to cover your rent and essentials. Zero credit inquiry, zero penalty, and your emergency buffer remains intact.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={handleRunAutopilot}
                    disabled={autopilotRunning}
                  >
                    {autopilotRunning ? "Balancing…" : "⚡ Test Autopilot Sweep"}
                  </button>
                  <span className="chip chip-positive" style={{ whiteSpace: "nowrap" }}>
                    ● Autopilot Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "afford" && (
            <div className="stack-lg">
              <div>
                <span className="label-sm text-muted">AFFORDABILITY AT SOURCE • QR / LINK CHECK</span>
                <h2 className="headline-sm" style={{marginTop:4}}>Can You Afford It? — Ask Before You Tap UPI</h2>
                <p className="body-sm text-muted" style={{marginTop:4}}>Paste any product price, EMI plan or QR amount. Deterministic arithmetic tells you buffer impact + safer price + EMI burden before you pay.</p>
              </div>

              <div className="card" style={{padding:18, border:"1.5px solid var(--niva-deep-forest)"}}>
                <div className="label-sm text-muted" style={{marginBottom:8}}>ENTER AMOUNT YOU'RE ABOUT TO PAY</div>
                <div style={{display:"flex", gap:12, alignItems:"center", flexWrap:"wrap"}}>
                  <div style={{position:"relative", flex:1, minWidth:240}}>
                    <span style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontWeight:800, color:"var(--niva-text-muted)"}}>₹</span>
                    <input type="number" value={affordAmt} onChange={e=>setAffordAmt(Number(e.target.value))} style={{width:"100%", padding:"14px 16px 14px 32px", borderRadius:12, border:"1.5px solid var(--niva-border)", fontSize:22, fontWeight:800, letterSpacing:"-0.02em", background:"var(--niva-canvas-subtle)"}}/>
                  </div>
                  <button className="btn btn-primary btn-lg" style={{minWidth:180}} onClick={async()=>{const r=await checkAffordability(session.personaId,affordAmt); setAffordRes(r);}}>Can I Afford? →</button>
                </div>
                <div style={{display:"flex", gap:8, marginTop:10, flexWrap:"wrap"}}>
                  {[15000,30000,48000,75000].map(v=>(
                    <button key={v} onClick={()=>setAffordAmt(v)} className="btn btn-outline btn-sm" style={{borderRadius:999, background: affordAmt===v?"var(--niva-deep-forest)":"transparent", color: affordAmt===v?"var(--niva-electric-lime)":undefined}}>₹{v.toLocaleString("en-IN")}</button>
                  ))}
                  <span className="body-sm text-muted" style={{marginLeft:4, alignSelf:"center"}}>Base: Balance ₹{(twin?.liquidity?.available_balance ?? session.balance).toLocaleString("en-IN")} • Essential ₹{(twin?.expenses?.essential ?? session.essentialExpenses).toLocaleString("en-IN")}/mo</span>
                </div>

                {affordRes && (
                  <div style={{marginTop:16, padding:16, borderRadius:12, border:"1px solid var(--niva-border)", background: affordRes.affordable==="YES"?"#E6F9DC": affordRes.affordable==="CONDITIONALLY"?"#FEF3C7":"#FFF1F2"}}>
                    <div style={{display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap", alignItems:"center"}}>
                      <div style={{fontWeight:800, fontSize:20, color: affordRes.affordable==="YES"?"var(--niva-positive)": affordRes.affordable==="CONDITIONALLY"?"#92400E":"var(--niva-critical)"}}>{affordRes.affordable==="YES"?"✓ YES — Go ahead": affordRes.affordable==="CONDITIONALLY"?"~ CONDITIONALLY — Tight buffer":"✗ NO — Hold, choose safer range"}</div>
                      <span className="chip" style={{background: affordRes.affordable==="YES"?"var(--niva-positive)": affordRes.affordable==="CONDITIONALLY"?"var(--niva-warning)":"var(--niva-critical)", color:"#fff"}}>Buffer {affordRes.buffer_status}</span>
                    </div>
                    <div style={{marginTop:8, fontSize:13, lineHeight:1.5, color:"var(--niva-obsidian)"}}>{affordRes.reasoning}</div>
                    <div className="grid-3" style={{marginTop:12, gap:10}}>
                      <div style={{padding:10, background:"var(--niva-canvas)", borderRadius:8, border:"1px solid var(--niva-border)"}}><div className="label-sm text-muted" style={{fontSize:10}}>POST-PURCHASE BUFFER</div><div style={{fontWeight:800}}>{affordRes.post_purchase_emergency_months} mo <span className="text-muted" style={{fontWeight:600}}>(target {affordRes.target_emergency_months} mo)</span></div></div>
                      <div style={{padding:10, background:"var(--niva-canvas)", borderRadius:8, border:"1px solid var(--niva-border)"}}><div className="label-sm text-muted" style={{fontSize:10}}>SAFER PRICE RANGE</div><div style={{fontWeight:800}}>{affordRes.safer_range_low?`₹${affordRes.safer_range_low.toLocaleString("en-IN")} – ₹${affordRes.safer_range_high.toLocaleString("en-IN")}`:"— within budget"}</div></div>
                      <div style={{padding:10, background:"var(--niva-canvas)", borderRadius:8, border:"1px solid var(--niva-border)"}}><div className="label-sm text-muted" style={{fontSize:10}}>RECOMMENDED WAIT</div><div style={{fontWeight:800}}>{affordRes.recommended_delay_months||0} mo{affordRes.emi_burden_status?` • EMI ${affordRes.emi_burden_status}`:""}</div></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "subs" && (
            <div className="stack-lg">
              <div>
                <span className="label-sm text-muted">AUTOPAY RADAR • MANDATE KILLER</span>
                <h2 className="headline-sm" style={{marginTop:4}}>Subscription Killer — Reclaim Your Runway</h2>
                <p className="body-sm text-muted" style={{marginTop:4}}>Auto-detected NACH/UPI mandates from your AA transactions. Pausing one adds days to your emergency buffer instantly.</p>
              </div>
              {subs ? (
                <>
                  <div className="card" style={{background:"linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)", border:"1px solid #F59E0B", display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap", alignItems:"center", padding:"16px 18px"}}>
                    <div>
                      <div className="label-sm" style={{color:"#92400E"}}>TOTAL AUTO-DEBITS THIS MONTH</div>
                      <div style={{fontSize:22, fontWeight:800, color:"#92400E"}}>₹{subs.total_autodebit.toLocaleString("en-IN")}/mo <span style={{fontWeight:600, fontSize:14, color:"var(--niva-text-muted)"}}>• {subs.runway_days_equivalent} days runway</span></div>
                    </div>
                    <div className="body-sm" style={{maxWidth:380, color:"var(--niva-text-secondary)"}}>{subs.insight}</div>
                  </div>
                  <div className="grid-3" style={{gap:12}}>
                    {subs.mandates.map((m:any,i:number)=>(
                      <div key={i} className="card" style={{padding:16}}>
                        <div className="flex-between" style={{marginBottom:6}}><span className="label-sm text-muted" style={{fontSize:10}}>DUE {m.due_day} • AUTOPAY</span><span className={`chip ${m.status==="PAID"?"chip-positive":"chip-warning"}`} style={{fontSize:10}}>{m.status}</span></div>
                        <div style={{fontWeight:700, fontSize:14}}>{m.label}</div>
                        <div style={{fontWeight:800, fontSize:20, marginTop:2}}>₹{m.amount.toLocaleString("en-IN")}</div>
                        <button className="btn btn-outline btn-sm" style={{marginTop:10, width:"100%"}} onClick={()=>alert("Demo: Mandate pause requested. In production, NACH revoke via bank.")}>Pause this mandate</button>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="card" style={{textAlign:"center", padding:24}}>Scanning mandates from transactions…</div>}
            </div>
          )}

          {/* ═══════════════ TAB 4: SAFE SCHEMES & ZERO PREDATORY NUDGES ═══════════════ */}
          {activeTab === "schemes" && (() => {
            const allRecs = recommendations?.recommendations || [];
            const approvedRecs = allRecs.filter((r: any) => r.decision === "RECOMMEND");
            const suppressedRecs = allRecs.filter((r: any) => r.decision === "SUPPRESS");

            return (
              <div className="stack-lg">
                <div className="flex-between" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 className="headline-sm">{t.safeSchemes}</h2>
                    <p className="body-sm text-muted">
                      Personalized schemes set by your bank and screened through the NIVA Responsible AI Gate. Zero predatory nudges.
                    </p>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: "var(--radius-pill)",
                    background: suppressedRecs.length > 0 ? "var(--niva-critical-bg)" : "var(--niva-positive-bg)",
                    color: suppressedRecs.length > 0 ? "var(--niva-critical)" : "var(--niva-positive)",
                    fontWeight: 700, fontSize: 12,
                  }}>
                    <ShieldIcon size={16} color="currentColor" />
                    <span>{suppressedRecs.length} Predatory Offers Blocked by Gate</span>
                  </div>
                </div>

                {/* Section 1: Pre-Approved & Recommended Bank Schemes */}
                <div>
                  <div className="label-sm text-muted" style={{ marginBottom: 10, fontWeight: 700 }}>
                    AI-RECOMMENDED PRE-APPROVED BANK SCHEMES ({approvedRecs.length} AVAILABLE)
                  </div>
                  <div className="grid-3" style={{ gap: 16 }}>
                    {approvedRecs.length > 0 ? (
                      approvedRecs.map((rec: any, idx: number) => (
                        <div
                          key={rec.product_type || idx}
                          style={{
                            padding: 18,
                            border: "1px solid var(--niva-border)",
                            borderRadius: "var(--radius-md)",
                            background: "var(--niva-canvas)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div className="flex-between" style={{ marginBottom: 8 }}>
                              <span className="chip chip-positive">Pre-Approved</span>
                              <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>
                                {rec.product_type?.replace(/_/g, " ").toUpperCase()}
                              </span>
                            </div>
                            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                              {rec.product_name}
                            </h4>
                            <p className="body-sm text-secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                              {rec.gate_reason}
                            </p>
                            {rec.interest_rate_pct && (
                              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--niva-positive)", marginBottom: 8 }}>
                                {rec.interest_rate_pct}% APR • Up to ₹{(rec.max_amount || 50000).toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn btn-primary"
                            style={{ width: "100%", fontSize: 12, padding: "9px" }}
                            onClick={() => alert(`Application submitted for ${rec.product_name}. Your State Bank of India advisor will reach out.`)}
                          >
                            Apply with 1-Click →
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="card" style={{ gridColumn: "span 3", textAlign: "center", padding: 24 }}>
                        <p className="body-sm text-muted">Currently evaluating bank schemes for your profile. Click Refresh above to re-sync.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Blocked / Suppressed Predatory Products Drawer */}
                {suppressedRecs.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div className="label-sm text-muted" style={{ marginBottom: 10, fontWeight: 700, color: "var(--niva-critical)" }}>
                      NIVA RESPONSIBLE GATE: SUPPRESSED PRODUCTS ({suppressedRecs.length} BLOCKED)
                    </div>
                    <div className="grid-2" style={{ gap: 16 }}>
                      {suppressedRecs.map((rec: any, idx: number) => (
                        <div
                          key={rec.product_type || idx}
                          style={{
                            padding: 18,
                            border: "1px dashed var(--niva-critical)",
                            borderRadius: "var(--radius-md)",
                            background: "var(--niva-critical-bg)",
                          }}
                        >
                          <div className="flex-between" style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--niva-critical)", textTransform: "uppercase" }}>
                              BLOCKED BY GUARDRAIL
                            </span>
                            <span style={{ fontSize: 11, color: "var(--niva-critical)", fontWeight: 600 }}>
                              {rec.policy_id || "POL-402"}
                            </span>
                          </div>
                          <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--niva-critical)" }}>
                            {rec.product_name}
                          </h4>
                          <p className="body-sm" style={{ color: "var(--niva-critical)", fontSize: 12, marginBottom: 10 }}>
                            {rec.gate_reason}
                          </p>
                          {rec.alternative_action && (
                            <div style={{ padding: 8, background: "rgba(255,255,255,0.7)", borderRadius: "var(--radius-sm)", fontSize: 11, color: "var(--niva-obsidian)", marginBottom: 8 }}>
                              <strong>Safe Alternative:</strong> {rec.alternative_action}
                            </div>
                          )}
                          {rec.interest_saved && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--niva-positive)" }}>
                              Interest Saved from Overleveraging: ₹{rec.interest_saved.toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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

          {/* ═══════════════ TAB 6: USER PROFILE & FINANCIAL ANALYSIS SETTINGS ═══════════════ */}
          {activeTab === "settings" && (
            <div className="stack-lg">
              {/* Header Banner */}
              <section className="card" style={{ background: "linear-gradient(135deg, var(--niva-deep-forest) 0%, #0d2818 100%)", color: "#ffffff", border: "1px solid var(--niva-border)" }}>
                <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <span className="chip" style={{ background: "rgba(142,242,68,0.15)", color: "var(--niva-electric-lime)", border: "1px solid rgba(142,242,68,0.3)", marginBottom: 8, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <SettingsIcon size={12} color="var(--niva-electric-lime)" />
                      <span>{language === "hi" ? "नियंत्रण और पैरामीटर सेटिंग्स" : language === "gu" ? "નિયંત્રણ અને પરિમાણ સેટિંગ્સ" : "Customer Control Center"}</span>
                    </span>
                    <h2 className="headline-md" style={{ color: "#ffffff", marginTop: 4 }}>
                      {language === "hi" ? "उपयोगकर्ता प्रोफ़ाइल और वित्तीय विश्लेषण सेटिंग्स" : language === "gu" ? "વપરાશકર્તા પ્રોફાઇલ અને વિશ્લેષણ સેટિંગ્સ" : "User Profile & Financial Analysis Settings"}
                    </h2>
                    <p className="body-sm" style={{ color: "rgba(255,255,255,0.8)", maxWidth: 680, marginTop: 4 }}>
                      {language === "hi" 
                        ? "वे सभी विवरण और पैरामीटर देखें और बदलें जिनका उपयोग NIVA आपके वित्तीय डिजिटल ट्विन, तनाव स्कोर और सुरक्षित ऋण सीमा को मापने के लिए करता है।"
                        : language === "gu"
                        ? "તે તમામ વિગતો અને પરિમાણો જુઓ અને અપડેટ કરો જેનો ઉપયોગ NIVA તમારા નાણાકીય ડિજિટલ ટ્વીન અને ક્રેડિટ સ્કોરની ગણતરી માટે કરે છે."
                        : "Inspect and tune the exact demographic and financial baseline parameters NIVA uses to evaluate your credit health, liquid buffer, and safe product limits."}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <button
                      id="settings-header-refresh-btn"
                      onClick={handleRefreshAnalysis}
                      disabled={refreshing}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(142,242,68,0.2)",
                        border: "1px solid var(--niva-electric-lime)",
                        color: "var(--niva-electric-lime)",
                        borderRadius: "var(--radius-pill)",
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title="Refresh and analyze financial telemetry"
                    >
                      <RefreshCwIcon size={14} color="var(--niva-electric-lime)" className={refreshing ? "spin-animation" : ""} />
                      <span>{refreshing ? "Analyzing..." : "Refresh"}</span>
                    </button>
                    <span className="chip chip-positive">
                      DigiLocker Verified
                    </span>
                    <span className="chip chip-neutral" style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                      ID: {session.personaId}
                    </span>
                  </div>
                </div>

                {settingsNotice && (
                  <div style={{
                    marginTop: 16, padding: "12px 16px", borderRadius: "var(--radius-md)",
                    background: "rgba(142,242,68,0.2)", border: "1px solid var(--niva-electric-lime)",
                    color: "#ffffff", fontSize: 13, fontWeight: 600,
                  }}>
                    {settingsNotice}
                  </div>
                )}
              </section>

              {/* 3 Main Settings Columns */}
              <div className="grid-2" style={{ gap: 20 }}>
                {/* Column 1: Personal & Demographics */}
                <div className="stack-md">
                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <IdCardIcon size={20} color="var(--niva-deep-forest)" />
                      <h3 className="headline-sm">
                        {language === "hi" ? "1. व्यक्तिगत और पहचान विवरण" : language === "gu" ? "1. વ્યક્તિગત અને ઓળખ વિગતો" : "1. Personal & DigiLocker KYC"}
                      </h3>
                    </div>
                    <div className="stack-sm">
                      <div>
                        <label className="label-sm text-muted">Full Name</label>
                        <input
                          type="text"
                          className="input"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                          style={{ width: "100%", marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label className="label-sm text-muted">Mobile Number (Linked to Aadhaar)</label>
                        <input
                          type="text"
                          className="input"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          style={{ width: "100%", marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label className="label-sm text-muted">Occupation / Business Category</label>
                        <input
                          type="text"
                          className="input"
                          value={profileData.occupation}
                          onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                          placeholder="e.g. Kirana Store Owner, Software Engineer"
                          style={{ width: "100%", marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label className="label-sm text-muted">Operating Address / City</label>
                        <input
                          type="text"
                          className="input"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          style={{ width: "100%", marginTop: 4 }}
                        />
                      </div>
                      <div className="grid-2" style={{ gap: 10 }}>
                        <div>
                          <label className="label-sm text-muted">Family Dependents</label>
                          <input
                            type="number"
                            className="input"
                            value={profileData.dependents}
                            onChange={(e) => setProfileData({ ...profileData, dependents: parseInt(e.target.value) || 0 })}
                            style={{ width: "100%", marginTop: 4 }}
                          />
                        </div>
                        <div>
                          <label className="label-sm text-muted">Date of Birth</label>
                          <input
                            type="text"
                            className="input"
                            value={profileData.dob}
                            onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                            style={{ width: "100%", marginTop: 4 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DPDP 2023 Card */}
                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <ShieldIcon size={20} color="var(--niva-deep-forest)" />
                      <h3 className="headline-sm">
                        {language === "hi" ? "3. डेटा गोपनीयता व DPDP सहमति" : language === "gu" ? "3. ડેટા ગોપનીયતા અને DPDP સંમતિ" : "3. Privacy & DPDP 2023 Consent"}
                      </h3>
                    </div>
                    <div className="stack-sm">
                      <div>
                        <label className="label-sm text-muted">Account Aggregator Sync Frequency</label>
                        <select
                          className="input"
                          value={profileData.data_sync_frequency}
                          onChange={(e) => setProfileData({ ...profileData, data_sync_frequency: e.target.value })}
                          style={{ width: "100%", marginTop: 4 }}
                        >
                          <option value="weekly">Weekly Automated Ingestion</option>
                          <option value="monthly">Monthly Periodic Sync (Recommended)</option>
                          <option value="on_demand">On-Demand Manual Refresh Only</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                        <input
                          type="checkbox"
                          id="allowResp"
                          checked={profileData.allow_responsible_analysis}
                          onChange={(e) => setProfileData({ ...profileData, allow_responsible_analysis: e.target.checked })}
                          style={{ width: 18, height: 18, accentColor: "var(--niva-deep-forest)" }}
                        />
                        <label htmlFor="allowResp" style={{ fontSize: 13, fontWeight: 600, color: "var(--niva-obsidian)", cursor: "pointer" }}>
                          Enforce Responsible AI Anti-Predatory Gate
                        </label>
                      </div>
                      <p className="body-sm text-muted" style={{ fontSize: 11, marginLeft: 28 }}>
                        Automatically suppresses high-interest loans if emergency buffer drops or debt burden spikes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Financial Baseline Parameters (Used for AI Analysis) */}
                <div className="stack-md">
                  <div className="card" style={{ border: "2px solid rgba(142,242,68,0.5)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <BrainIcon size={20} color="var(--niva-deep-forest)" />
                      <h3 className="headline-sm">
                        {language === "hi" ? "2. AI विश्लेषण के आधारभूत वित्तीय पैरामीटर" : language === "gu" ? "2. AI વિશ્લેષણ માટેના નાણાકીય પરિમાણો" : "2. Financial Parameters Used for AI Analysis"}
                      </h3>
                    </div>
                    <p className="body-sm text-muted" style={{ fontSize: 12, marginBottom: 16 }}>
                      These values directly calibrate your <strong>Debt-to-Income (DTI) ratio</strong>, <strong>Liquid Runway Months</strong>, and <strong>XGBoost Stress Predictions</strong>.
                    </p>

                    <div className="stack-sm">
                      <div>
                        <div className="flex-between">
                          <label className="label-sm" style={{ fontWeight: 700 }}>Declared Monthly Inflow (₹)</label>
                          <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>Gross / Net Take-Home</span>
                        </div>
                        <input
                          type="number"
                          className="input"
                          value={profileData.declared_income}
                          onChange={(e) => setProfileData({ ...profileData, declared_income: parseFloat(e.target.value) || 0 })}
                          style={{ width: "100%", marginTop: 4, fontWeight: 700, fontSize: 16 }}
                        />
                        <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>
                          Overrides or complements detected bank salary with cash / merchant receipts.
                        </span>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div className="flex-between">
                          <label className="label-sm" style={{ fontWeight: 700 }}>Essential Monthly Living Expenses (₹)</label>
                          <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>Mandatory Household Spend</span>
                        </div>
                        <input
                          type="number"
                          className="input"
                          value={profileData.declared_essential_expenses}
                          onChange={(e) => setProfileData({ ...profileData, declared_essential_expenses: parseFloat(e.target.value) || 0 })}
                          style={{ width: "100%", marginTop: 4, fontWeight: 700, fontSize: 16 }}
                        />
                        <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>
                          Rent, groceries, utility bills, school fees, and medical insurance.
                        </span>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div className="flex-between">
                          <label className="label-sm" style={{ fontWeight: 700 }}>Active Monthly EMI Debt Commitments (₹)</label>
                          <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>Existing External Loans</span>
                        </div>
                        <input
                          type="number"
                          className="input"
                          value={profileData.declared_monthly_emi}
                          onChange={(e) => setProfileData({ ...profileData, declared_monthly_emi: parseFloat(e.target.value) || 0 })}
                          style={{ width: "100%", marginTop: 4, fontWeight: 700, fontSize: 16 }}
                        />
                        <span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>
                          Total EMIs paid across all banks, credit cards, or NBFCs.
                        </span>
                      </div>

                      <div className="grid-2" style={{ gap: 12, marginTop: 10 }}>
                        <div>
                          <label className="label-sm" style={{ fontWeight: 700 }}>Target Buffer (Months)</label>
                          <select
                            className="input"
                            value={profileData.target_buffer_months}
                            onChange={(e) => setProfileData({ ...profileData, target_buffer_months: parseFloat(e.target.value) || 3 })}
                            style={{ width: "100%", marginTop: 4 }}
                          >
                            <option value={3}>3 Months (Standard)</option>
                            <option value={6}>6 Months (Recommended for Bharat)</option>
                            <option value={9}>9 Months (High Safety)</option>
                            <option value={12}>12 Months (Conservative)</option>
                          </select>
                        </div>
                        <div>
                          <label className="label-sm" style={{ fontWeight: 700 }}>Risk Appetite</label>
                          <select
                            className="input"
                            value={profileData.risk_tolerance}
                            onChange={(e) => setProfileData({ ...profileData, risk_tolerance: e.target.value })}
                            style={{ width: "100%", marginTop: 4 }}
                          >
                            <option value="conservative">Conservative (Safety First)</option>
                            <option value="moderate">Moderate (Balanced)</option>
                            <option value="growth">Growth (Wealth Accrual)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Live AI Impact Preview Card */}
                  <div className="card" style={{ background: "var(--niva-canvas-subtle)", border: "1px dashed var(--niva-deep-forest)" }}>
                    <div className="label-sm text-muted" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <SparklesIcon size={14} color="var(--niva-deep-forest)" />
                      <span>LIVE AI TWIN IMPACT PREVIEW</span>
                    </div>
                    <div className="grid-3" style={{ gap: 10, textAlign: "center" }}>
                      <div style={{ background: "var(--niva-canvas)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--niva-border)" }}>
                        <div className="label-sm text-muted">Projected DTI</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: (profileData.declared_monthly_emi / Math.max(profileData.declared_income, 1)) > 0.4 ? "var(--niva-critical)" : "var(--niva-positive)", marginTop: 4 }}>
                          {Math.round((profileData.declared_monthly_emi / Math.max(profileData.declared_income, 1)) * 100)}%
                        </div>
                      </div>
                      <div style={{ background: "var(--niva-canvas)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--niva-border)" }}>
                        <div className="label-sm text-muted">Liquid Runway</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 4 }}>
                          {(baseBalance / Math.max(profileData.declared_essential_expenses, 1)).toFixed(1)} mo
                        </div>
                      </div>
                      <div style={{ background: "var(--niva-canvas)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--niva-border)" }}>
                        <div className="label-sm text-muted">Surplus / Mo</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: (profileData.declared_income - profileData.declared_essential_expenses - profileData.declared_monthly_emi) >= 0 ? "var(--niva-positive)" : "var(--niva-critical)", marginTop: 4 }}>
                          ₹{(profileData.declared_income - profileData.declared_essential_expenses - profileData.declared_monthly_emi).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save & Refresh Buttons */}
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    <button
                      id="settings-save-profile-btn"
                      className="btn btn-primary"
                      onClick={handleSaveProfile}
                      disabled={savingSettings}
                      style={{ flex: 1, padding: "14px 20px", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <CheckCircleIcon size={18} color="var(--niva-electric-lime)" />
                      {savingSettings ? "Saving & Recalculating..." : (language === "hi" ? "सेव करें और AI ट्विन पुनः परिकलित करें" : language === "gu" ? "સાચવો અને AI ટ્વીન અપડેટ કરો" : "Save & Recalculate AI Twin")}
                    </button>
                    <button
                      id="settings-refresh-analysis-btn"
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleRefreshAnalysis}
                      disabled={refreshing}
                      style={{ padding: "14px 20px", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                      title="Refresh and re-analyze"
                    >
                      <RefreshCwIcon size={18} color="currentColor" className={refreshing ? "spin-animation" : ""} />
                      <span>{refreshing ? "Analyzing..." : "Refresh Analysis"}</span>
                    </button>
                  </div>
                </div>
              </div>
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

      {/* ── Mobile Bottom Nav (Wise-style: icons + labels) — desktop hidden via CSS ── */}
      <nav className="bottom-nav" aria-label="Primary">
        {[
          {id:"twin", label:"Twin", icon: ShieldIcon},
          {id:"pots", label:"Pots", icon: BuildingBankIcon},
          {id:"afford", label:"Afford", icon: TrendingUpIcon},
          {id:"spending", label:"Spend", icon: FileTextIcon},
          {id:"whatif", label:"What-If", icon: TrendingDownIcon},
          {id:"schemes", label:"Schemes", icon: CheckCircleIcon},
          {id:"subs", label:"Subs", icon: AlertTriangleIcon},
          {id:"copilot", label:"Ask NIVA", icon: BrainIcon},
          {id:"settings", label:"Profile", icon: SettingsIcon},
        ].map(({id,label,icon:Icon})=>(
          <button key={id} className={`bottom-nav-item ${activeTab===id?"active":""}`} onClick={()=>{ setActiveTab(id as any); window.scrollTo({top:0, behavior:"smooth"}); }} aria-current={activeTab===id?"page":undefined}>
            <Icon size={18} color={activeTab===id?"var(--niva-deep-forest)":"var(--niva-text-muted)"} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
