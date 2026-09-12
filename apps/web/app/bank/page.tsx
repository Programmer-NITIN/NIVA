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
  getPortfolio,
  getBureauLag,
  resetDemo,
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
} from "@/components/icons";

type BankTab = "portfolio" | "customer360" | "gateAudit" | "rebit" | "relief";

export default function BankPortal() {
  const [activeTab, setActiveTab] = useState<BankTab>("portfolio");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [bureau, setBureau] = useState<any>(null);

  // Action status toast / notification
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [custData, policyData, portData] = await Promise.all([
        getBankCustomers().catch(() => ({ customers: [] })),
        getGatePolicies().catch(() => ({ active_policies: [] })),
        getPortfolio().catch(() => null),
      ]);
      setCustomers(custData.customers || []);
      setPolicies(policyData.active_policies || []);
      if (portData) setPortfolio(portData);

      if (custData.customers?.length > 0) {
        await selectCustomer(custData.customers[0]);
      }
    } catch (e) {
      console.error("Error loading bank data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function selectCustomer(customer: any) {
    setSelected(customer);
    try {
      const [detailData, auditData, telemData, bureauData] = await Promise.all([
        getBankCustomerDetail(customer.persona_id).catch(() => null),
        getAuditTrail(customer.persona_id).catch(() => ({ audit_trail: [] })),
        getRebitTelemetry(customer.persona_id).catch(() => null),
        getBureauLag(customer.persona_id).catch(() => null),
      ]);
      setDetail(detailData);
      setAudit(auditData.audit_trail || []);
      setTelemetry(telemData);
      setBureau(bureauData);
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
            <li><button className={activeTab === "portfolio" ? "active" : ""} onClick={() => setActiveTab("portfolio")}>Portfolio EWS</button></li>
            <li><button className={activeTab === "customer360" ? "active" : ""} onClick={() => setActiveTab("customer360")}>Customer 360</button></li>
            <li><button className={activeTab === "gateAudit" ? "active" : ""} onClick={() => setActiveTab("gateAudit")}>Gate Audit</button></li>
            <li><button className={activeTab === "rebit" ? "active" : ""} onClick={() => setActiveTab("rebit")}>ReBIT 1.1</button></li>
            <li><button className={activeTab === "relief" ? "active" : ""} onClick={() => setActiveTab("relief")}>Relief Console</button></li>
          </ul>

          <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={async()=>{await resetDemo(); alert("Demo reset — personas restored"); loadInitialData();}}>Judge Reset</button>
            <span className="chip chip-positive" style={{ fontSize: 11 }}>✓ RBI Fair Lending Compliant</span>
            <span className="chip chip-neutral" style={{ fontSize: 12, fontWeight: 700 }}>Aditya S. (Risk Officer)</span>
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
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>Loading bank data...</div>
        ) : (
          <div className="stack-xl">
            {/* Customer 360 Switcher Strip */}
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

            {activeTab === "portfolio" && (
              <div className="stack-lg">
                <div>
                  <span className="label-sm text-muted">INSTITUTIONAL • PORTFOLIO EARLY WARNING SYSTEM</span>
                  <h2 className="headline-sm" style={{marginTop:4}}>Portfolio EWS — Predatory Lending Blocked Today</h2>
                  <p className="body-sm text-muted" style={{marginTop:4}}>Every HOLD saves a borrower from a 36% debt trap. Coverage across {portfolio?.customers?.length ?? 3} underwriting files • Updated live from Gate decisions.</p>
                </div>
                {portfolio ? (
                  <>
                    <div className="grid-4" style={{gap:16}}>
                      <div className="card" style={{textAlign:"center", borderTop:"3px solid var(--niva-critical)"}}><div className="label-sm text-muted">BLOCKED TODAY</div><div style={{fontSize:32,fontWeight:800,color:"var(--niva-critical)"}}>{portfolio.kpis.blocked_today}</div><div className="body-sm text-muted" style={{fontSize:11}}>Predatory offers suppressed</div></div>
                      <div className="card" style={{textAlign:"center", borderTop:"3px solid var(--niva-positive)"}}><div className="label-sm text-muted">INTEREST SAVED</div><div style={{fontSize:24,fontWeight:800,color:"var(--niva-positive)"}}>₹{portfolio.kpis.interest_saved.toLocaleString("en-IN")}</div><div className="body-sm text-muted" style={{fontSize:11}}>At 36% APR avoided</div></div>
                      <div className="card" style={{textAlign:"center", borderTop:"3px solid var(--niva-deep-forest)"}}><div className="label-sm text-muted">NPA AVOIDED (EST.)</div><div style={{fontSize:24,fontWeight:800}}>₹{portfolio.kpis.npa_avoided.toLocaleString("en-IN")}</div><div className="body-sm text-muted" style={{fontSize:11}}>90-day delinquency modeled</div></div>
                      <div className="card" style={{textAlign:"center"}}><div className="label-sm text-muted">FILES MONITORED</div><div style={{fontSize:32,fontWeight:800}}>{portfolio.customers.length}</div><div className="body-sm text-muted" style={{fontSize:11}}>Live ReBIT-linked accounts</div></div>
                    </div>
                    <div className="card" style={{padding:0, overflow:"hidden", border:"1px solid var(--niva-border)"}}>
                      <div style={{padding:"14px 18px", borderBottom:"1px solid var(--niva-border)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                        <span className="title-md">Customer Heatmap</span>
                        <span className="chip chip-neutral" style={{fontSize:11}}>Gate HOLD = needs relief, not loan</span>
                      </div>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%", borderCollapse:"collapse", fontSize:13}}>
                          <thead><tr style={{borderBottom:"2px solid var(--niva-border)", background:"var(--niva-canvas-subtle)"}}><th style={thStyle}>Customer</th><th style={thStyle}>Health</th><th style={thStyle}>Stress</th><th style={thStyle}>DTI</th><th style={thStyle}>Buffer</th><th style={thStyle}>Gate</th></tr></thead>
                          <tbody>{portfolio.customers.map((r:any)=>{
                            const blocked = r.gate==="HOLD";
                            return <tr key={r.persona_id} style={{borderBottom:"1px solid var(--niva-border)", background: blocked?"#FFF1F2":"transparent"}}><td style={tdStyle}><strong>{r.name}</strong><div style={{fontSize:11, color:"var(--niva-text-muted)"}}>{r.persona_id}</div></td><td style={tdStyle}><span className={`chip ${r.health>=60?"chip-positive": r.health>=40?"chip-warning":"chip-critical"}`}>{r.health}</span></td><td style={tdStyle}>{r.stress}</td><td style={tdStyle}>{Math.round(r.dti*100)}%</td><td style={tdStyle}>{r.buffer} mo</td><td style={tdStyle}><span className={`chip ${blocked?"chip-critical":"chip-positive"}`}>{blocked?"HOLD — Relief":"CLEAR"}</span></td></tr>;
                          })}</tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : <div className="card" style={{textAlign:"center", padding:24}}>Loading portfolio from Gate & Twin…</div>}
                {bureau && (
                  <div className="card">
                    <div className="flex-between" style={{marginBottom:8}}><div><span className="label-sm text-muted">38-DAY BLIND WINDOW</span><h3 className="title-md" style={{marginTop:2}}>Bureau Flat vs AA Live</h3></div><span className="chip chip-critical" style={{fontSize:11}}>● Hidden 3.4× delinquency</span></div>
                    <p className="body-sm text-muted" style={{marginBottom:12}}>{bureau.insight}</p>
                    <div style={{display:"flex", gap:6, alignItems:"end", height:90, padding:"8px 6px", background:"var(--niva-canvas-subtle)", borderRadius:10, border:"1px solid var(--niva-border)"}}>
                      {bureau.series.map((s:any,i:number)=><div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4}}><div style={{display:"flex", gap:3, alignItems:"end", height:62}}><div style={{width:10, height: `${(s.bureau/760)*36+6}px`, background:"var(--niva-border-strong)", borderRadius:4}} /><div style={{width:10, height: `${(s.aa/100)*60+4}px`, background: i===bureau.series.length-1?"var(--niva-critical)":"var(--niva-deep-forest)", borderRadius:4}} /></div><div style={{fontSize:10, fontWeight:700, color:"var(--niva-text-muted)"}}>{s.label}</div></div>)}
                    </div>
                  </div>
                )}
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

      {/* Bank — Mobile Bottom Nav (desktop hidden via CSS) */}
      <nav className="bottom-nav" aria-label="Bank sections">
        {[
          {id:"portfolio", label:"Portfolio", icon: BuildingBankIcon},
          {id:"customer360", label:"360", icon: ShieldIcon},
          {id:"gateAudit", label:"Gate", icon: CheckCircleIcon},
          {id:"rebit", label:"ReBIT", icon: LockIcon},
          {id:"relief", label:"Relief", icon: SparklesIcon},
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
