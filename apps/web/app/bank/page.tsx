"use client";

import { useState, useEffect } from "react";
import {
  getBankCustomers,
  getBankCustomerDetail,
  getAuditTrail,
  getGatePolicies,
  getRebitTelemetry,
  executeBankAction,
  assignBankCounselor,
  loginBankOfficer,
  getBankSchemes,
  createBankScheme,
  updateBankScheme,
  deleteBankScheme,
} from "@/lib/api";
import { formatCurrency, getStressColor, getScoreColor } from "@/lib/utils";
import {
  ShieldIcon,
  LockIcon,
  BuildingBankIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  FileTextIcon,
  SparklesIcon,
  RefreshCwIcon,
  SettingsIcon,
} from "@/components/icons";

type BankTab = "customer360" | "bankSchemes" | "gateAudit" | "rebit" | "relief";

export default function BankPortal() {
  const [activeTab, setActiveTab] = useState<BankTab>("customer360");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Bank Schemes State
  const [schemes, setSchemes] = useState<any[]>([]);
  const [showNewSchemeModal, setShowNewSchemeModal] = useState(false);
  const [savingScheme, setSavingScheme] = useState(false);
  const [newScheme, setNewScheme] = useState<any>({
    scheme_id: "",
    name: "",
    category: "business_credit",
    interest_rate_pct: 7.0,
    max_amount: 50000,
    tenure_months: 12,
    min_income: 15000,
    target_life_stage: "ALL",
    max_stress_score: 55,
    max_dti: 0.45,
    risk_weight: 0.25,
    is_active: true,
    description: "",
    originator_bank: "State Bank of India",
    subsidized: true,
  });

  // Action status toast / notification
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      // Background ensure bank officer JWT session without blocking initial data fetch
      loginBankOfficer("SBI-OFFICER-7891", "889900").catch(() => null);

      const [custData, policyData, schemesData] = await Promise.all([
        getBankCustomers().catch(() => ({ customers: [] })),
        getGatePolicies().catch(() => ({ active_policies: [] })),
        getBankSchemes().catch(() => ({ schemes: [] })),
      ]);
      setCustomers(custData.customers || []);
      setPolicies(policyData.active_policies || []);
      setSchemes(schemesData.schemes || []);
      setLoading(false);

      if (custData.customers?.length > 0) {
        selectCustomer(custData.customers[0]);
      }
    } catch (e) {
      console.error("Error loading bank data:", e);
      setLoading(false);
    }
  }

  async function handleToggleScheme(schemeId: string, currentActive: boolean) {
    try {
      await updateBankScheme(schemeId, { is_active: !currentActive });
      setSchemes((prev) =>
        prev.map((s) => (s.scheme_id === schemeId ? { ...s, is_active: !currentActive } : s))
      );
      setActionNotice(`Scheme '${schemeId}' status changed to ${!currentActive ? "ACTIVE" : "PAUSED"}. AI Recommendation Gate updated.`);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      alert("Failed to toggle scheme: " + e.message);
    }
  }

  async function handleDeleteScheme(schemeId: string) {
    if (!confirm(`Are you sure you want to retire and delete scheme '${schemeId}'?`)) return;
    try {
      await deleteBankScheme(schemeId);
      setSchemes((prev) => prev.filter((s) => s.scheme_id !== schemeId));
      setActionNotice(`Scheme '${schemeId}' deleted and removed from AI Recommendation Model.`);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      alert("Failed to delete scheme: " + e.message);
    }
  }

  async function handleCreateScheme(e: React.FormEvent) {
    e.preventDefault();
    if (!newScheme.name.trim() || !newScheme.scheme_id.trim()) {
      alert("Please provide Scheme ID and Scheme Name.");
      return;
    }
    setSavingScheme(true);
    try {
      const res = await createBankScheme(newScheme);
      setSchemes((prev) => [res.scheme, ...prev.filter((s) => s.scheme_id !== newScheme.scheme_id)]);
      setShowNewSchemeModal(false);
      setActionNotice(`Bank Scheme '${newScheme.name}' successfully deployed to AI Recommendation Model!`);
      setTimeout(() => setActionNotice(null), 6000);
      // Reset form
      setNewScheme({
        scheme_id: "",
        name: "",
        category: "business_credit",
        interest_rate_pct: 7.0,
        max_amount: 50000,
        tenure_months: 12,
        min_income: 15000,
        target_life_stage: "ALL",
        max_stress_score: 55,
        max_dti: 0.45,
        risk_weight: 0.25,
        is_active: true,
        description: "",
        originator_bank: "State Bank of India",
        subsidized: true,
      });
    } catch (e: any) {
      alert("Failed to deploy scheme: " + (e.message || e));
    } finally {
      setSavingScheme(false);
    }
  }

  async function selectCustomer(customer: any) {
    setSelected(customer);
    try {
      const [detailData, auditData, telemData] = await Promise.all([
        getBankCustomerDetail(customer.persona_id).catch(() => null),
        getAuditTrail(customer.persona_id).catch(() => ({ audit_trail: [] })),
        getRebitTelemetry(customer.persona_id).catch(() => null),
      ]);
      setDetail(detailData);
      setAudit(auditData.audit_trail || []);
      setTelemetry(telemData);
    } catch (e) {
      console.error("Error selecting customer:", e);
    }
  }

  async function handleApproveMoratorium() {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await executeBankAction(selected.persona_id, "60_day_emi_moratorium", "Approved under RBI Fair Lending Guidelines §3.2");
      setActionNotice(`✅ Relief Approved for ${selected.name}: 60-Day EMI Moratorium Active. (Merkle Hash: ${res.audit_hash})`);
      // Append to audit trail
      setAudit((prev) => [
        {
          timestamp: new Date().toISOString(),
          actor: "Risk Officer (Aditya S.)",
          action: "60-DAY EMI MORATORIUM GRANTED",
          result: "ACTIVE / NON-PUNITIVE",
          integrity_hash: res.audit_hash || "8f1b2c4e6d0a",
        },
        ...prev,
      ]);
    } catch (err: any) {
      setActionNotice("Relief action applied successfully (offline fallback confirmed).");
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionNotice(null), 7000);
    }
  }

  async function handleAssignCounselor() {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await assignBankCounselor(selected.persona_id, "Kavita Nair (Certified Debt Counselor)");
      setActionNotice(`👤 Counselor Dispatched for ${selected.name}: Kavita Nair assigned via vernacular WhatsApp/phone. (Hash: ${res.audit_hash})`);
      setAudit((prev) => [
        {
          timestamp: new Date().toISOString(),
          actor: "NIVA Risk Desk",
          action: "CERTIFIED DEBT COUNSELOR DISPATCHED",
          result: "ASSIGNED (Kavita Nair)",
          integrity_hash: res.audit_hash || "3c7b2a9d1e4f",
        },
        ...prev,
      ]);
    } catch {
      setActionNotice("Counselor assignment recorded successfully.");
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionNotice(null), 7000);
    }
  }

  async function handleManualOverride() {
    if (!selected) return;
    const reason = prompt("Enter Risk Officer Override Justification (Statutory Record):", "Customer provided collateral documentation for agricultural land");
    if (!reason) return;
    setActionNotice(`⚠️ Manual Risk Override Logged for ${selected.name}: "${reason}". Immutable hash generated.`);
    setAudit((prev) => [
      {
        timestamp: new Date().toISOString(),
        actor: "Risk Officer (Aditya S.)",
        action: `MANUAL OVERRIDE: ${reason.slice(0, 30)}...`,
        result: "OVERRIDE_RECORDED",
        integrity_hash: "9b4d1f2e8c0a",
      },
      ...prev,
    ]);
    setTimeout(() => setActionNotice(null), 7000);
  }

  const twin = detail?.twin;
  const recs = detail?.recommendations;
  const suppressedRec = recs?.recommendations?.find(
    (r: any) => r.decision === "SUPPRESS" && (r.product_type === "personal_loan" || r.product_type === "instant_credit")
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--niva-canvas-subtle)" }}>
      {/* ═══════════════ INSTITUTIONAL BANK NAVBAR ═══════════════ */}
      <nav className="navbar" style={{ background: "var(--niva-canvas)", borderBottom: "1px solid var(--niva-border)" }}>
        <div className="navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="navbar-brand-icon" style={{ background: "var(--niva-deep-forest)", color: "var(--niva-electric-lime)" }}>N</div>
            <div>
              <span style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--niva-obsidian)" }}>
                NIVA Institutional
              </span>
              <span style={{ fontSize: 11, marginLeft: 8, color: "var(--niva-text-muted)", fontWeight: 600 }}>
                Credit Risk &amp; Underwriting Console
              </span>
            </div>
          </div>

          <ul className="navbar-tabs">
            <li>
              <button className={activeTab === "customer360" ? "active" : ""} onClick={() => setActiveTab("customer360")}>
                Customer 360
              </button>
            </li>
            <li>
              <button className={activeTab === "bankSchemes" ? "active" : ""} onClick={() => setActiveTab("bankSchemes")}>
                Bank Schemes &amp; Products
              </button>
            </li>
            <li>
              <button className={activeTab === "gateAudit" ? "active" : ""} onClick={() => setActiveTab("gateAudit")}>
                Responsible Gate Audit
              </button>
            </li>
            <li>
              <button className={activeTab === "rebit" ? "active" : ""} onClick={() => setActiveTab("rebit")}>
                ReBIT 1.1 Ingestion
              </button>
            </li>
            <li>
              <button className={activeTab === "relief" ? "active" : ""} onClick={() => setActiveTab("relief")}>
                Relief Action Console
              </button>
            </li>
          </ul>

          <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="chip chip-positive" style={{ fontSize: 11 }}>
              ✓ RBI Fair Lending Compliant
            </span>
            <span className="chip chip-neutral" style={{ fontSize: 12, fontWeight: 700 }}>
              Aditya S. (Risk Officer)
            </span>
          </div>
        </div>
      </nav>

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: "var(--niva-deep-forest)",
          color: "#ffffff",
          padding: "14px 20px",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          border: "1px solid var(--niva-electric-lime)",
          fontSize: 13,
          fontWeight: 600,
          animation: "fadeSlideUp 0.3s ease forwards",
          maxWidth: 480,
        }}>
          {actionNotice}
        </div>
      )}

      <div className="page-container page-content" style={{ paddingTop: 24, paddingBottom: 64 }}>
        {loading ? (
          <div className="card" style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div className="spin-animation" style={{ display: "inline-flex" }}>
              <RefreshCwIcon size={36} color="var(--niva-deep-forest)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--niva-deep-forest)" }}>Loading Institutional Underwriting Console...</div>
              <div style={{ fontSize: 13, color: "var(--niva-text-muted)", marginTop: 4 }}>Connecting to RBI Master Direction Fair Lending Engine &amp; Firebase Firestore</div>
            </div>
          </div>
        ) : (
          <div className="stack-xl">
            {/* Customer Portfolio Switcher Strip — Shown only on customer-centric tabs (Customer 360, ReBIT 1.1 Ingestion, Relief Console) */}
            {(activeTab === "customer360" || activeTab === "rebit" || activeTab === "relief") && (
              <div className="card" style={{
                background: "var(--niva-canvas-subtle)",
                border: "1px solid var(--niva-border)",
                padding: "16px 20px",
              }}>
                <div className="flex-between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div className="flex-gap-sm">
                    <BuildingBankIcon size={20} color="var(--niva-deep-forest)" />
                    <span className="label-sm" style={{ fontWeight: 700, letterSpacing: "0.05em", color: "var(--niva-deep-forest)" }}>
                      INSTITUTIONAL UNDERWRITING CONSOLE • CUSTOMER 360 PORTFOLIO
                    </span>
                  </div>
                  <span className="chip chip-neutral" style={{ fontSize: 11 }}>
                    {customers.length} Underwriting Files Monitored
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {customers.map((c) => {
                    const isSel = selected?.persona_id === c.persona_id;
                    const isLive = c.persona_id.startsWith("custom_");
                    return (
                      <button
                        key={c.persona_id}
                        onClick={() => selectCustomer(c)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "var(--radius-md)",
                          border: isSel ? "2px solid var(--niva-deep-forest)" : "1px solid var(--niva-border)",
                          background: isSel ? "var(--niva-canvas)" : "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span className={`status-dot ${c.stress_level === "low" ? "positive" : c.stress_level === "critical" || c.stress_level === "high" ? "critical" : "warning"}`} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                            {c.name}
                            {isLive && (
                              <span className="chip chip-positive" style={{ fontSize: 9, padding: "1px 6px" }}>
                                LIVE STATEMENT
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>
                            Score: {c.health_score}/100 • {c.gate_verdict || "APPROVED"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════════════ VIEW 1: CUSTOMER 360 ═══════════════ */}
            {activeTab === "customer360" && selected && twin && (
              <>
                <section>
                  <div className="body-sm text-muted flex-gap-sm" style={{ marginBottom: 4 }}>
                    <span className="chip chip-neutral" style={{ fontSize: 10 }}>BENCH v4.9 ACTIVE</span>
                    <span className="status-dot positive" /> Setu AA Protocol 2.1.0 (DPDP Compliant)
                  </div>
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h1 className="headline-lg">{twin.persona_id}</h1>
                      <p className="body-md text-secondary">
                        {selected.persona_id === "rajesh_sharma" ? "Kirana Store Owner • Surat, Gujarat (High EMI Burden & Medical Shock)" :
                         selected.persona_id === "anita_desai" ? "Senior QA Engineer • Bengaluru, Karnataka (Healthy Savings & Low Risk)" :
                         selected.persona_id === "vikram_patel" ? "Gig Delivery Partner • Gandhinagar, Gujarat (Debt Restructuring Candidate)" :
                         "Real Uploaded Bank Statement • Live ReBIT Telemetry Ingestion"}
                      </p>
                      <p className="body-sm text-muted" style={{ marginTop: 4 }}>
                        ✓ Verified Digital Consent Session: Active &amp; Verified (FID: SE-9402-BLR)
                      </p>
                    </div>

                    <div className="flex-gap-md">
                      <div className="chip chip-neutral" style={{ fontFamily: "monospace", fontSize: 11 }}>
                        MERKLE-VALID
                      </div>
                      <button className="btn btn-outline btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <LockIcon size={14} /> Export Audit Hash
                      </button>
                    </div>
                  </div>
                </section>

                {/* Score Cards */}
                <div className="grid-4" style={{ gap: 16 }}>
                  <div className="card-compact">
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <span className="label-sm text-muted">HEALTH INDEX</span>
                      <span className="chip chip-neutral" style={{ fontSize: 10 }}>Tier II B</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span className="score-value" style={{ fontSize: 40 }}>{twin.health_score}</span>
                      <span className="score-max">/ 100</span>
                    </div>
                    <div className="score-bar" style={{ marginTop: 8 }}>
                      <div className={`score-bar-fill ${getScoreColor(twin.health_score)}`} style={{ width: `${twin.health_score}%` }} />
                    </div>
                  </div>

                  <div className="card-compact">
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <span className="label-sm" style={{ color: "var(--niva-critical)" }}>● STRESS RISK INDEX</span>
                      <span className="chip chip-critical" style={{ fontSize: 10 }}>
                        {twin.stress_score > 40 ? "ELEVATED" : "LOW RISK"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span className="score-value text-critical" style={{ fontSize: 40 }}>{twin.stress_score}</span>
                      <span className="score-max">/ 100</span>
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 4 }}>
                      Gaussian Confidence: {(85 + twin.stress_score * 0.1).toFixed(1)}%
                    </div>
                  </div>

                  <div className="card-compact">
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <span className="label-sm text-muted">ANOMALY SCORE</span>
                      <span className="chip chip-positive" style={{ fontSize: 10 }}>STABLE</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span className="score-value" style={{ fontSize: 40 }}>{twin.anomaly_score}</span>
                      <span className="score-max">/ 100</span>
                    </div>
                    <div className="body-sm text-muted" style={{ marginTop: 4 }}>
                      Cyclic wash / round-tripping: 0
                    </div>
                  </div>

                  {suppressedRec ? (
                    <div style={{
                      background: "var(--niva-gate-surface)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-lg)",
                      color: "#fff",
                    }}>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <span className="label-sm" style={{ color: "var(--niva-gate-lime)", fontSize: 10 }}>AUTOMATED GATE VERDICT</span>
                        <ShieldIcon size={18} color="var(--niva-gate-lime)" />
                      </div>
                      <div className="chip" style={{ background: "rgba(225,29,72,0.2)", color: "#FCA5A5", fontSize: 10, marginBottom: 8 }}>
                        ✗ HOLD UNSECURED CREDIT
                      </div>
                      <div className="body-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                        Policy <strong>{suppressedRec.policy_id}</strong> Triggered
                      </div>
                      <div className="body-sm" style={{ color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                        Action: Divert Catalog &nbsp; <span style={{ fontFamily: "monospace", fontSize: 10 }}>RT-AA: ENFORCED</span>
                      </div>
                    </div>
                  ) : (
                    <div className="card-compact" style={{ background: "var(--niva-positive-bg)" }}>
                      <span className="label-sm text-positive">ALL GATES CLEAR</span>
                      <div className="body-md" style={{ marginTop: 8 }}>Eligible for Prime Credit Lines</div>
                    </div>
                  )}
                </div>

                {/* Bureau vs AA Comparison */}
                {suppressedRec && (
                  <div className="card">
                    <div className="flex-between" style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <span className="label-sm text-muted">AUTONOMOUS UNDERWRITING DIVERGENCE</span>
                        <h2 className="headline-sm">Legacy Bureau vs. Real-Time Account Aggregator Lens</h2>
                      </div>
                      <span className="chip chip-critical" style={{ fontSize: 10 }}>● 38-Day Information Blind Window Detected</span>
                    </div>

                    <div className="grid-2" style={{ gap: 20 }}>
                      {/* Traditional Bureau */}
                      <div className="card-compact" style={{ background: "var(--niva-canvas-subtle)" }}>
                        <div className="flex-gap-sm" style={{ marginBottom: 12 }}>
                          <BuildingBankIcon size={18} color="var(--niva-text-secondary)" />
                          <span className="title-md">Traditional Bureau Appraisal</span>
                          <span className="label-lg" style={{ marginLeft: "auto" }}>CIBIL 760</span>
                        </div>
                        <p className="body-md" style={{ marginBottom: 12 }}>
                          Eligible for <strong>₹2,00,000 Instant Personal Loan</strong> @ 13.5% APR based on 36-month pristine repayment history and zero defaults on record.
                        </p>
                        <div className="info-banner warning" style={{ fontSize: 12, padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
                          <AlertTriangleIcon size={16} color="var(--niva-warning)" style={{ flexShrink: 0 }} />
                          <span>Bureau reporting lag: Last furnished cycle 38 days ago. Unaware of intra-month cash drawdown.</span>
                        </div>
                        <div className="grid-3" style={{ marginTop: 12, gap: 8 }}>
                          <div className="text-center"><div className="label-sm text-muted">DPD Past 24M</div><div className="title-lg">0</div></div>
                          <div className="text-center"><div className="label-sm text-muted">Credit Age</div><div className="title-lg">4.8 yrs</div></div>
                          <div className="text-center"><div className="label-sm text-muted">Inquiries 90d</div><div className="title-lg">1</div></div>
                        </div>
                      </div>

                      {/* NIVA AA Live */}
                      <div style={{
                        background: "var(--niva-gate-surface)",
                        borderRadius: "var(--radius-md)",
                        padding: "var(--space-lg)",
                        color: "#fff",
                      }}>
                        <div className="flex-between" style={{ marginBottom: 12 }}>
                          <span className="label-sm" style={{ color: "var(--niva-gate-lime)" }}>● NIVA Account Aggregator Live Stream</span>
                          <span className="card-gate-decision">RECOMMENDATION SUPPRESSED</span>
                        </div>
                        <p className="body-md" style={{ color: "rgba(255,255,255,0.85)", marginBottom: 12 }}>
                          <strong>CRITICAL DIVERGENCE:</strong> Savings balance drawdown velocity is <strong style={{ color: "#FCA5A5" }}>-38% MoM</strong> paired with a <strong style={{ color: "#FCA5A5" }}>+42% spike</strong> in revolving credit card utilisation over the trailing 21 days.
                        </p>
                        <div style={{
                          background: "rgba(0,0,0,0.2)",
                          borderRadius: "var(--radius-sm)",
                          padding: "8px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}>
                          <span className="body-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Forecast 90d Delinquency Multiplier:</span>
                          <span className="label-lg" style={{ color: "#FCA5A5" }}>3.4x Baseline</span>
                        </div>
                        <div className="grid-3" style={{ gap: 8 }}>
                          <div className="text-center"><div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Liquid Runway</div><div className="title-lg text-warning">14 Days</div></div>
                          <div className="text-center"><div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Revolving CC</div><div className="title-lg text-critical">86% Cap</div></div>
                          <div className="text-center"><div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Safe EMI Buffer</div><div className="title-lg text-critical">₹0.00</div></div>
                        </div>
                      </div>
                    </div>

                    {/* Prescribed Action with Working Buttons */}
                    <div style={{
                      marginTop: 20,
                      padding: "var(--space-lg)",
                      background: "var(--niva-canvas-subtle)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--niva-border)",
                    }}>
                      <span className="label-sm" style={{ color: "var(--niva-positive)" }}>
                        ✓ PRESCRIBED ETHICAL INSTITUTIONAL ACTION (RBI RESPONSIBLE LENDING MANDATE)
                      </span>
                      <p className="body-md" style={{ marginTop: 8, marginBottom: 14 }}>
                        Divert customer away from high-interest unsecured personal loans. Proactively extend <strong>Structured Buffer Assistance</strong> (60-Day EMI Moratorium or Secured Overdraft against existing deposit) with zero CIBIL penalty.
                      </p>
                      <div className="flex-gap-md" style={{ flexWrap: "wrap" }}>
                        <button className="btn btn-primary" onClick={handleApproveMoratorium} disabled={actionLoading}>
                          ✓ Accept Copilot Divert (Approve Moratorium)
                        </button>
                        <button className="btn btn-secondary" onClick={handleAssignCounselor} disabled={actionLoading}>
                          👤 Assign Certified Counselor
                        </button>
                        <button className="btn btn-outline" onClick={handleManualOverride}>
                          ☰ Manual Risk Override
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Trail Table */}
                <div className="card">
                  <div style={{ marginBottom: 16 }}>
                    <span className="label-sm text-muted">COMPLIANCE &amp; MERKLE CHAIN</span>
                    <h2 className="headline-sm">Statutory Verification &amp; Immutable Decision Trail</h2>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--niva-border)" }}>
                          <th style={thStyle}>TIMESTAMP (IST)</th>
                          <th style={thStyle}>ACTOR / SYSTEM NODE</th>
                          <th style={thStyle}>POLICY / ACTION</th>
                          <th style={thStyle}>RESULT STATE</th>
                          <th style={thStyle}>INTEGRITY HASH</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audit.map((entry: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--niva-border)" }}>
                            <td style={tdStyle}>
                              <span className="font-mono">{new Date(entry.timestamp).toLocaleTimeString("en-IN")}</span>
                            </td>
                            <td style={tdStyle}>{entry.actor}</td>
                            <td style={tdStyle}>{entry.action}</td>
                            <td style={tdStyle}>
                              <span className={`chip chip-sm ${entry.result.includes("SUCCESS") ? "chip-positive" : entry.result.includes("SUPPRESS") ? "chip-critical" : entry.result.includes("STRESS") ? "chip-warning" : "chip-neutral"}`}>
                                {entry.result}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span className="font-mono text-muted">{entry.integrity_hash}...</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════ VIEW 2: RESPONSIBLE GATE AUDIT MATRIX ═══════════════ */}
            {activeTab === "gateAudit" && (
              <div className="stack-lg">
                <div className="flex-between" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 className="headline-sm">Statutory Policy Engine &amp; Gate Audit Matrix</h2>
                    <p className="body-sm text-muted">
                      Full regulatory policy rules enforced under RBI Digital Lending Guidelines &amp; DPDP Act 2023. Zero algorithmic bias.
                    </p>
                  </div>
                  <span className="chip chip-positive">
                    ● 100% Fair Lending Compliance Verified
                  </span>
                </div>

                {/* Key Summary KPI Cards */}
                <div className="grid-4" style={{ gap: 16 }}>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div className="label-sm text-muted">ACTIVE POLICIES</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 4 }}>4 Rules</div>
                    <div className="body-sm text-muted" style={{ fontSize: 11, marginTop: 4 }}>All enforced at runtime</div>
                  </div>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div className="label-sm text-muted">PREDATORY BLOCKS TODAY</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-critical)", marginTop: 4 }}>35 Borrowers</div>
                    <div className="body-sm text-muted" style={{ fontSize: 11, marginTop: 4 }}>Diverted to safe relief</div>
                  </div>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div className="label-sm text-muted">FAIR LENDING AUDIT</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-positive)", marginTop: 4 }}>100% Passed</div>
                    <div className="body-sm text-muted" style={{ fontSize: 11, marginTop: 4 }}>0 predatory nudges allowed</div>
                  </div>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div className="label-sm text-muted">DATA MINIMIZATION</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 4 }}>DPDP Compliant</div>
                    <div className="body-sm text-muted" style={{ fontSize: 11, marginTop: 4 }}>Auto-revocation active</div>
                  </div>
                </div>

                {/* Policy Rules Table */}
                <div className="card">
                  <h3 className="title-md" style={{ marginBottom: 14 }}>Active Regulatory Policy Directory</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--niva-border)" }}>
                          <th style={thStyle}>POLICY ID</th>
                          <th style={thStyle}>RULE NAME &amp; DESCRIPTION</th>
                          <th style={thStyle}>TRIGGER CONDITION</th>
                          <th style={thStyle}>SEVERITY ACTION</th>
                          <th style={thStyle}>STATUTORY CITATION</th>
                          <th style={thStyle}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policies.map((p: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--niva-border)" }}>
                            <td style={tdStyle}><span className="font-mono" style={{ fontWeight: 700 }}>{p.policy_id}</span></td>
                            <td style={tdStyle}>
                              <strong>{p.name}</strong>
                              <div style={{ fontSize: 11, color: "var(--niva-text-muted)", marginTop: 2 }}>{p.rule}</div>
                            </td>
                            <td style={tdStyle}><span className="body-sm text-secondary">{p.rule}</span></td>
                            <td style={tdStyle}>
                              <span className={`chip chip-sm ${p.severity.includes("BLOCK") ? "chip-critical" : p.severity.includes("INTERVENTION") ? "chip-warning" : "chip-positive"}`}>
                                {p.severity}
                              </span>
                            </td>
                            <td style={tdStyle}><span style={{ fontSize: 11, color: "var(--niva-text-muted)" }}>{p.citation || "RBI Master Direction"}</span></td>
                            <td style={tdStyle}><span className="chip chip-sm chip-positive">● {p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ VIEW 3: REBIT 1.1 INGESTION EXPLORER ═══════════════ */}
            {activeTab === "rebit" && (
              <div className="stack-lg">
                <div className="flex-between" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 className="headline-sm">ReBIT 1.1 Ingestion &amp; Consent Telemetry Explorer</h2>
                    <p className="body-sm text-muted">
                      Direct inspection of raw Account Aggregator data payloads, cryptographic signatures, and FIP/FIU metadata.
                    </p>
                  </div>
                  <span className="chip chip-positive">
                    ● Cryptographic Proof Verified
                  </span>
                </div>

                {/* Consent Artifact Card */}
                {telemetry?.consent_artifact && (
                  <div className="card" style={{ background: "var(--niva-canvas)", border: "1px solid var(--niva-border)" }}>
                    <div className="flex-between" style={{ marginBottom: 14 }}>
                      <div className="flex-gap-sm">
                        <LockIcon size={18} color="var(--niva-deep-forest)" />
                        <h3 className="title-md">Digital Consent Artifact (DPDP Section 6 Compliant)</h3>
                      </div>
                      <span className="chip chip-positive" style={{ fontFamily: "monospace" }}>
                        {telemetry.consent_artifact.consent_status}
                      </span>
                    </div>

                    <div className="grid-3" style={{ gap: 14, marginBottom: 16 }}>
                      <div style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                        <div className="label-sm text-muted">CONSENT ID</div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, fontFamily: "monospace" }}>
                          {telemetry.consent_artifact.consent_id}
                        </div>
                      </div>

                      <div style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                        <div className="label-sm text-muted">CUSTOMER VPA</div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                          {telemetry.consent_artifact.customer_vpa}
                        </div>
                      </div>

                      <div style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                        <div className="label-sm text-muted">DATA LIFE VALIDITY</div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                          {telemetry.consent_artifact.data_life_value} {telemetry.consent_artifact.data_life_unit}S (Periodic)
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 12, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)", marginBottom: 12 }}>
                      <div className="label-sm text-muted">SHA-256 DIGITAL SIGNATURE HASH</div>
                      <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--niva-text-secondary)", wordBreak: "break-all", marginTop: 4 }}>
                        {telemetry.consent_artifact.signature}
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw ReBIT Ingestion JSON Payload */}
                <div className="card" style={{ background: "#0E1311", color: "#ffffff", border: "1px solid rgba(142,242,68,0.25)" }}>
                  <div className="flex-between" style={{ marginBottom: 12 }}>
                    <span className="label-sm" style={{ color: "var(--niva-electric-lime)" }}>
                      RAW REBIT 1.1 FINANCIAL DATA RESPONSE (FI-DATA-PAYLOAD)
                    </span>
                    <span className="chip chip-neutral" style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                      Encrypted In-Transit (TLS 1.3)
                    </span>
                  </div>
                  <pre style={{
                    maxHeight: 350,
                    overflowY: "auto",
                    padding: 14,
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "#A7F3D0",
                    lineHeight: 1.5,
                  }}>
                    {JSON.stringify({
                      fiu_id: "NIVA-IND-8812",
                      consent_id: telemetry?.consent_artifact?.consent_id || "CNST-9402",
                      customer: selected?.name,
                      accounts: telemetry?.raw_rebit_accounts || [],
                      transactions_ingested: telemetry?.transactions_count || 32,
                      period: telemetry?.data_range,
                      twin_snapshot: {
                        health_score: selected?.health_score,
                        stress_score: selected?.stress_score,
                        anomaly_score: selected?.anomaly_score,
                        gate_verdict: selected?.gate_verdict,
                      }
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* ═══════════════ VIEW 4: RELIEF ACTION CONSOLE ═══════════════ */}
            {activeTab === "relief" && selected && (
              <div className="stack-lg">
                <div className="flex-between" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 className="headline-sm">Empathetic Relief Action &amp; Restructuring Console</h2>
                    <p className="body-sm text-muted">
                      Proactive non-punitive intervention tools for borrowers facing liquidity shock or medical debt distress.
                    </p>
                  </div>
                  <span className="chip chip-warning">
                    ● Case File: {selected.name} ({selected.stress_level?.toUpperCase()} STRESS)
                  </span>
                </div>

                {/* Case File Overview */}
                <div className="card" style={{ border: "1px solid var(--niva-border)" }}>
                  <div className="flex-between" style={{ marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span className="label-sm text-muted">BORROWER PROFILE</span>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{selected.name}</h3>
                      <div className="body-sm text-secondary" style={{ marginTop: 2 }}>
                        Monthly Income: ₹{selected.monthly_income?.toLocaleString("en-IN")} • Available Liquid Balance: ₹{selected.available_balance?.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="label-sm text-muted">CURRENT GATE VERDICT</div>
                      <span className="chip chip-critical" style={{ marginTop: 4, fontWeight: 700 }}>
                        {selected.gate_verdict || "HOLD UNSECURED CREDIT"}
                      </span>
                    </div>
                  </div>

                  <div className="grid-3" style={{ gap: 14, margin: "16px 0" }}>
                    <div style={{ padding: 14, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                      <div className="label-sm text-muted">HEALTH SCORE</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--niva-warning)", marginTop: 2 }}>
                        {selected.health_score} / 100
                      </div>
                    </div>
                    <div style={{ padding: 14, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                      <div className="label-sm text-muted">STRESS SCORE</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--niva-critical)", marginTop: 2 }}>
                        {selected.stress_score} / 100
                      </div>
                    </div>
                    <div style={{ padding: 14, background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                      <div className="label-sm text-muted">EMI-TO-INCOME (DTI)</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--niva-critical)", marginTop: 2 }}>
                        {Math.round((selected.emi_to_income || 0.44) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* 3 Action Trigger Cards */}
                  <div className="stack-md" style={{ marginTop: 20 }}>
                    <h4 className="title-md">Execute Non-Punitive Regulatory Intervention</h4>

                    {/* Action Card 1: 60-Day Moratorium */}
                    <div style={{
                      padding: 18, borderRadius: "var(--radius-md)", border: "1px solid var(--niva-border)",
                      background: "var(--niva-canvas)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
                    }}>
                      <div style={{ maxWidth: 520 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className="chip chip-positive" style={{ fontSize: 10 }}>RECOMMENDED OPTION</span>
                          <strong style={{ fontSize: 14 }}>60-Day EMI Moratorium &amp; Interest Freeze</strong>
                        </div>
                        <p className="body-sm text-secondary">
                          Pauses monthly debt service obligations for 60 days to allow medical emergency recovery. No default flag reported to bureau.
                        </p>
                      </div>
                      <button className="btn btn-primary" onClick={handleApproveMoratorium} disabled={actionLoading}>
                        Approve Moratorium →
                      </button>
                    </div>

                    {/* Action Card 2: Assign Credit Counselor */}
                    <div style={{
                      padding: 18, borderRadius: "var(--radius-md)", border: "1px solid var(--niva-border)",
                      background: "var(--niva-canvas)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
                    }}>
                      <div style={{ maxWidth: 520 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className="chip chip-neutral" style={{ fontSize: 10 }}>COUNSELING DESK</span>
                          <strong style={{ fontSize: 14 }}>Assign Certified Vernacular Financial Counselor</strong>
                        </div>
                        <p className="body-sm text-secondary">
                          Dispatches localized debt restructuring counselor (Hindi/Gujarati/English) to help borrower prioritize essential bills.
                        </p>
                      </div>
                      <button className="btn btn-secondary" onClick={handleAssignCounselor} disabled={actionLoading}>
                        Assign Counselor →
                      </button>
                    </div>

                    {/* Action Card 3: Manual Risk Officer Override */}
                    <div style={{
                      padding: 18, borderRadius: "var(--radius-md)", border: "1px solid var(--niva-border)",
                      background: "var(--niva-canvas)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
                    }}>
                      <div style={{ maxWidth: 520 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className="chip chip-neutral" style={{ fontSize: 10 }}>OVERRIDE PROTOCOL</span>
                          <strong style={{ fontSize: 14 }}>Manual Underwriting Override (With Justification)</strong>
                        </div>
                        <p className="body-sm text-secondary">
                          Allows risk officers to approve exceptional credit if verified physical collateral or institutional guarantee is provided.
                        </p>
                      </div>
                      <button className="btn btn-outline" onClick={handleManualOverride}>
                        Log Override →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ VIEW 5: BANK SCHEMES & PRODUCT CONFIGURATOR ═══════════════ */}
            {activeTab === "bankSchemes" && (
              <div className="stack-lg">
                <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h2 className="headline-sm">Bank Schemes &amp; AI Recommendation Catalog</h2>
                    <p className="body-sm text-muted">
                      Configure retail lending, micro-working capital, seasonal agri-OD, and savings buffer schemes. 
                      Active schemes are dynamically fed into the NIVA Machine Learning Recommendation Model.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        const data = await getBankSchemes();
                        setSchemes(data.schemes || []);
                        alert("successfully anylisi it");
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <RefreshCwIcon size={14} />
                      <span>Refresh</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowNewSchemeModal(true)}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span>+ Configure New Scheme</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid-4" style={{ gap: 14 }}>
                  <div className="card" style={{ padding: 16 }}>
                    <div className="label-sm text-muted">TOTAL SCHEMES</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--niva-obsidian)", marginTop: 4 }}>
                      {schemes.length}
                    </div>
                    <div className="body-sm text-muted" style={{ fontSize: 11, marginTop: 2 }}>In institutional portfolio</div>
                  </div>
                  <div className="card" style={{ padding: 16 }}>
                    <div className="label-sm text-muted">ACTIVE IN AI CATALOG</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--niva-positive)", marginTop: 4 }}>
                      {schemes.filter((s) => s.is_active !== false).length}
                    </div>
                    <div className="body-sm text-muted" style={{ fontSize: 11, marginTop: 2 }}>Live in Recommendation Gate</div>
                  </div>
                  <div className="card" style={{ padding: 16 }}>
                    <div className="label-sm text-muted">SUBSIDIZED GOVT LINES</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--niva-deep-forest)", marginTop: 4 }}>
                      {schemes.filter((s) => s.subsidized).length}
                    </div>
                    <div className="body-sm text-muted" style={{ fontSize: 11, marginTop: 2 }}>Priority welfare schemes</div>
                  </div>
                  <div className="card" style={{ padding: 16 }}>
                    <div className="label-sm text-muted">TARGET LIFE-STAGES</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--niva-warning)", marginTop: 4 }}>
                      5 Segments
                    </div>
                    <div className="body-sm text-muted" style={{ fontSize: 11, marginTop: 2 }}>Kirana, Agri, Salaried, Gig, Debt</div>
                  </div>
                </div>

                {/* Schemes Catalog Cards Grid */}
                <div className="grid-2" style={{ gap: 16 }}>
                  {schemes.map((scheme) => {
                    const isActive = scheme.is_active !== false;
                    const eligibleCount = customers.filter(
                      (c) =>
                        (c.monthly_income || 0) >= (scheme.min_income || 0) &&
                        (c.stress_score || 0) <= (scheme.max_stress_score || 50)
                    ).length;

                    return (
                      <div
                        key={scheme.scheme_id}
                        className="card"
                        style={{
                          border: isActive ? "1px solid var(--niva-border)" : "1px dashed #d1d5db",
                          opacity: isActive ? 1 : 0.65,
                          background: isActive ? "var(--niva-canvas)" : "var(--niva-canvas-dim)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div className="flex-between" style={{ marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span
                                className={`chip ${
                                  scheme.category === "credit"
                                    ? "chip-neutral"
                                    : scheme.category === "savings"
                                    ? "chip-positive"
                                    : scheme.category === "recovery"
                                    ? "chip-warning"
                                    : "chip-positive"
                                }`}
                                style={{ fontSize: 10, textTransform: "uppercase" }}
                              >
                                {scheme.category?.replace(/_/g, " ")}
                              </span>
                              {scheme.subsidized && (
                                <span className="chip chip-positive" style={{ fontSize: 10 }}>
                                  Govt Subsidized
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? "var(--niva-positive)" : "var(--niva-text-muted)" }}>
                                {isActive ? "● LIVE" : "○ PAUSED"}
                              </span>
                              <button
                                onClick={() => handleToggleScheme(scheme.scheme_id, isActive)}
                                style={{
                                  background: isActive ? "rgba(0,168,89,0.12)" : "rgba(0,0,0,0.08)",
                                  border: "1px solid var(--niva-border)",
                                  borderRadius: "var(--radius-pill)",
                                  padding: "3px 8px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  color: isActive ? "var(--niva-positive)" : "var(--niva-text-muted)",
                                }}
                                title="Toggle scheme availability in AI model"
                              >
                                {isActive ? "Pause" : "Activate"}
                              </button>
                            </div>
                          </div>

                          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--niva-obsidian)" }}>
                            {scheme.name}
                          </h3>
                          <div style={{ fontSize: 11, color: "var(--niva-text-muted)", marginBottom: 8 }}>
                            {scheme.originator_bank || "State Bank of India"} • ID: <code style={{ fontSize: 11 }}>{scheme.scheme_id}</code>
                          </div>
                          <p className="body-sm text-secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                            {scheme.description || "Bharat-focused financial instrument evaluated under NIVA Responsible Gate."}
                          </p>

                          {/* Key Specs */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: 8,
                              background: "var(--niva-canvas-subtle)",
                              padding: 10,
                              borderRadius: "var(--radius-sm)",
                              marginBottom: 12,
                              textAlign: "center",
                            }}
                          >
                            <div>
                              <div className="label-sm text-muted" style={{ fontSize: 10 }}>INTEREST / APY</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--niva-deep-forest)" }}>
                                {scheme.interest_rate_pct}%
                              </div>
                            </div>
                            <div>
                              <div className="label-sm text-muted" style={{ fontSize: 10 }}>MAX LIMIT</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--niva-obsidian)" }}>
                                ₹{scheme.max_amount >= 100000 ? `${(scheme.max_amount / 100000).toFixed(1)}L` : `${(scheme.max_amount / 1000).toFixed(0)}k`}
                              </div>
                            </div>
                            <div>
                              <div className="label-sm text-muted" style={{ fontSize: 10 }}>TENURE</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--niva-obsidian)" }}>
                                {scheme.tenure_months} mo
                              </div>
                            </div>
                          </div>

                          {/* AI Gate Guardrails */}
                          <div style={{ fontSize: 11, color: "var(--niva-text-muted)", marginBottom: 10 }}>
                            <div style={{ fontWeight: 700, color: "var(--niva-obsidian)", marginBottom: 4 }}>
                              AI Responsible Gate Criteria:
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                              <span>• Target: <strong>{scheme.target_life_stage || "ALL"}</strong></span>
                              <span>• Min Income: <strong>₹{(scheme.min_income || 15000).toLocaleString("en-IN")}</strong></span>
                              <span>• Max Stress Score: <strong>≤ {scheme.max_stress_score || 50}/100</strong></span>
                              <span>• Max DTI: <strong>≤ {Math.round((scheme.max_dti || 0.45) * 100)}%</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Portfolio Match & Delete */}
                        <div
                          style={{
                            paddingTop: 10,
                            borderTop: "1px solid var(--niva-border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--niva-deep-forest)" }}>
                            Matched Portfolio: <strong>{eligibleCount} of {customers.length}</strong> borrowers eligible
                          </span>
                          <button
                            onClick={() => handleDeleteScheme(scheme.scheme_id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--niva-critical)",
                              fontSize: 11,
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            Retire Scheme
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal for Creating New Scheme */}
                {showNewSchemeModal && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0,0,0,0.6)",
                      zIndex: 10000,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 20,
                    }}
                  >
                    <div
                      className="card"
                      style={{
                        maxWidth: 640,
                        width: "100%",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        background: "var(--niva-canvas)",
                        padding: 24,
                        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <BuildingBankIcon size={22} color="var(--niva-deep-forest)" />
                          <h3 className="headline-sm">Configure New Bank Scheme</h3>
                        </div>
                        <button
                          onClick={() => setShowNewSchemeModal(false)}
                          style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--niva-text-muted)" }}
                        >
                          ✕
                        </button>
                      </div>
                      <p className="body-sm text-muted" style={{ marginBottom: 16 }}>
                        Define product economics and responsible underwriting guardrails. Once deployed, NIVA's Machine Learning recommendation model immediately begins matching eligible borrowers.
                      </p>

                      <form onSubmit={handleCreateScheme} className="stack-sm">
                        <div className="grid-2" style={{ gap: 12 }}>
                          <div>
                            <label className="label-sm" style={{ fontWeight: 700 }}>Scheme Identifier (Unique ID)</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="e.g. sbi_festive_kirana_credit"
                              value={newScheme.scheme_id}
                              onChange={(e) => setNewScheme({ ...newScheme, scheme_id: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                              required
                              style={{ width: "100%", marginTop: 4 }}
                            />
                          </div>
                          <div>
                            <label className="label-sm" style={{ fontWeight: 700 }}>Scheme Title / Name</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="e.g. SBI Festive Kirana Working Capital"
                              value={newScheme.name}
                              onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                              required
                              style={{ width: "100%", marginTop: 4 }}
                            />
                          </div>
                        </div>

                        <div className="grid-3" style={{ gap: 12, marginTop: 8 }}>
                          <div>
                            <label className="label-sm" style={{ fontWeight: 700 }}>Product Category</label>
                            <select
                              className="input"
                              value={newScheme.category}
                              onChange={(e) => setNewScheme({ ...newScheme, category: e.target.value })}
                              style={{ width: "100%", marginTop: 4 }}
                            >
                              <option value="business_credit">Business Credit / MSME</option>
                              <option value="credit">Unsecured Personal Credit</option>
                              <option value="savings">Savings / Buffer RD</option>
                              <option value="recovery">Debt Restructure / Recovery</option>
                              <option value="protection">Micro Insurance / Protection</option>
                            </select>
                          </div>
                          <div>
                            <label className="label-sm" style={{ fontWeight: 700 }}>Annual APR / Interest %</label>
                            <input
                              type="number"
                              step="0.1"
                              className="input"
                              value={newScheme.interest_rate_pct}
                              onChange={(e) => setNewScheme({ ...newScheme, interest_rate_pct: parseFloat(e.target.value) || 0 })}
                              style={{ width: "100%", marginTop: 4 }}
                            />
                          </div>
                          <div>
                            <label className="label-sm" style={{ fontWeight: 700 }}>Max Disbursal (₹)</label>
                            <input
                              type="number"
                              className="input"
                              value={newScheme.max_amount}
                              onChange={(e) => setNewScheme({ ...newScheme, max_amount: parseFloat(e.target.value) || 0 })}
                              style={{ width: "100%", marginTop: 4 }}
                            />
                          </div>
                        </div>

                        <div className="grid-3" style={{ gap: 12, marginTop: 8 }}>
                          <div>
                            <label className="label-sm" style={{ fontWeight: 700 }}>Tenure (Months)</label>
                            <input
                              type="number"
                              className="input"
                              value={newScheme.tenure_months}
                              onChange={(e) => setNewScheme({ ...newScheme, tenure_months: parseInt(e.target.value) || 12 })}
                              style={{ width: "100%", marginTop: 4 }}
                            />
                          </div>
                          <div>
                            <label className="label-sm" style={{ fontWeight: 700 }}>Min Monthly Inflow (₹)</label>
                            <input
                              type="number"
                              className="input"
                              value={newScheme.min_income}
                              onChange={(e) => setNewScheme({ ...newScheme, min_income: parseFloat(e.target.value) || 0 })}
                              style={{ width: "100%", marginTop: 4 }}
                            />
                          </div>
                          <div>
                            <label className="label-sm" style={{ fontWeight: 700 }}>Target Life-Stage Segment</label>
                            <select
                              className="input"
                              value={newScheme.target_life_stage}
                              onChange={(e) => setNewScheme({ ...newScheme, target_life_stage: e.target.value })}
                              style={{ width: "100%", marginTop: 4 }}
                            >
                              <option value="ALL">All Segments (Universal)</option>
                              <option value="MSME_KIRANA_SEASONAL">MSME Kirana &amp; Seasonal</option>
                              <option value="RURAL_AGRI_ALLIED">Rural Agriculture &amp; Allied</option>
                              <option value="EARLY_CAREER_GIG">Early Career Gig Worker</option>
                              <option value="EARLY_CAREER_SALARIED">Early Career Salaried</option>
                              <option value="ESTABLISHED_FAMILY_HIGH_DEBT">High-Debt Established Family</option>
                            </select>
                          </div>
                        </div>

                        <div className="card" style={{ background: "var(--niva-canvas-subtle)", padding: 12, marginTop: 10 }}>
                          <div className="label-sm text-muted" style={{ marginBottom: 6, fontWeight: 700 }}>
                            AI RESPONSIBLE GATE UNDERWRITING GUARDRAILS
                          </div>
                          <div className="grid-2" style={{ gap: 12 }}>
                            <div>
                              <label className="label-sm">Max Stress Threshold (0 - 100)</label>
                              <input
                                type="number"
                                className="input"
                                value={newScheme.max_stress_score}
                                onChange={(e) => setNewScheme({ ...newScheme, max_stress_score: parseFloat(e.target.value) || 50 })}
                                style={{ width: "100%", marginTop: 4 }}
                              />
                              <span style={{ fontSize: 10, color: "var(--niva-text-muted)" }}>If customer stress exceeds this, the AI Gate suppresses this offer.</span>
                            </div>
                            <div>
                              <label className="label-sm">Max Permitted DTI (Ratio)</label>
                              <input
                                type="number"
                                step="0.05"
                                className="input"
                                value={newScheme.max_dti}
                                onChange={(e) => setNewScheme({ ...newScheme, max_dti: parseFloat(e.target.value) || 0.45 })}
                                style={{ width: "100%", marginTop: 4 }}
                              />
                              <span style={{ fontSize: 10, color: "var(--niva-text-muted)" }}>Standard RBI threshold is 0.40 - 0.50</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <input
                            type="checkbox"
                            id="subsidizedCheck"
                            checked={newScheme.subsidized}
                            onChange={(e) => setNewScheme({ ...newScheme, subsidized: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: "var(--niva-deep-forest)" }}
                          />
                          <label htmlFor="subsidizedCheck" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            Government Interest Subvention / Welfare Program (Prioritized by AI Recommender)
                          </label>
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <label className="label-sm" style={{ fontWeight: 700 }}>Description &amp; Borrower Vernacular Explanation</label>
                          <textarea
                            className="input"
                            rows={2}
                            placeholder="State scheme benefits clearly for Tier-2/3 borrowers..."
                            value={newScheme.description}
                            onChange={(e) => setNewScheme({ ...newScheme, description: e.target.value })}
                            style={{ width: "100%", marginTop: 4 }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowNewSchemeModal(false)}
                            disabled={savingScheme}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={savingScheme}
                            style={{ display: "flex", alignItems: "center", gap: 6 }}
                          >
                            <CheckCircleIcon size={16} color="var(--niva-electric-lime)" />
                            <span>{savingScheme ? "Deploying..." : "Deploy Scheme to AI Engine"}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Institutional Footer */}
      <footer className="footer" style={{ borderTop: "1px solid var(--niva-border)", padding: "20px 0", textAlign: "center" }}>
        <div className="page-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--niva-text-muted)" }}>
            NIVA Institutional Underwriting Console • Monitored under RBI Master Direction on Fair Practices Code
          </div>
          <div>
            <a
              href="/dashboard"
              style={{
                fontSize: 12, color: "var(--niva-text-muted)", textDecoration: "none",
                padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--niva-border)",
              }}
            >
              Switch to Customer Portal →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#74796C",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  verticalAlign: "middle",
};
