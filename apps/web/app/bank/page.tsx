"use client";

import { useState, useEffect } from "react";
import { getBankCustomers, getBankCustomerDetail, getAuditTrail } from "@/lib/api";
import { formatCurrency, getStressColor, getScoreColor } from "@/lib/utils";
import {
  ShieldIcon,
  LockIcon,
  BuildingBankIcon,
  AlertTriangleIcon,
} from "@/components/icons";

export default function BankPortal() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await getBankCustomers();
      setCustomers(data.customers || []);
      if (data.customers?.length > 0) {
        selectCustomer(data.customers[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function selectCustomer(customer: any) {
    setSelected(customer);
    try {
      const [detailData, auditData] = await Promise.all([
        getBankCustomerDetail(customer.persona_id),
        getAuditTrail(customer.persona_id),
      ]);
      setDetail(detailData);
      setAudit(auditData.audit_trail || []);
    } catch (e) {
      console.error(e);
    }
  }

  const twin = detail?.twin;
  const recs = detail?.recommendations;
  const suppressedRec = recs?.recommendations?.find((r: any) => r.decision === "SUPPRESS" && r.product_type === "personal_loan");

  return (
    <>
      {/* Bank Nav */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand">
            <span className="navbar-brand-icon">N</span>
            NIVA
          </a>
          <ul className="navbar-tabs">
            <li><a href="/">Overview</a></li>
            <li><a href="/financial-state">Financial State</a></li>
            <li><a href="/spending">Spending</a></li>
            <li><a href="/ask-niva">Ask NIVA</a></li>
            <li><a href="/responsible-gate">Responsible Gate</a></li>
            <li><a href="/consent">Consent Center</a></li>
            <li><a href="/bank" className="active">Bank Portal</a></li>
          </ul>
          <div className="navbar-right">
            <span className="chip chip-neutral">Aditya S.</span>
          </div>
        </div>
      </nav>

      <div className="page-container page-content">
        {loading ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>Loading bank data...</div>
        ) : (
          <div className="stack-xl stagger">
            {/* Customer Header */}
            {selected && twin && (
              <>
                <section>
                  <div className="body-sm text-muted flex-gap-sm" style={{ marginBottom: 4 }}>
                    <span className="chip chip-neutral" style={{ fontSize: 10 }}>BENCH v4.9 ACTIVE</span>
                    <span className="status-dot positive" /> Setu AA Protocol 2.1.0
                  </div>
                  <div className="flex-between">
                    <div>
                      <h1 className="headline-lg">{twin.persona_id}</h1>
                      <p className="body-md text-secondary">
                        {selected.persona_id === "rajesh_sharma" ? "Lead Staff Systems Engineer • TechCorp India Ltd." :
                         selected.persona_id === "anita_desai" ? "Kirana Store Owner • Self-employed" :
                         "Freelance Designer + Delivery Partner"}
                      </p>
                      <p className="body-sm text-muted" style={{ marginTop: 4 }}>
                        ✓ Verified Digital Consent Session: Expires in 132 days (FID: SE-9402-BLR)
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
                <div className="grid-4">
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
                      <span className="chip chip-critical" style={{ fontSize: 10 }}>HIGH RISK</span>
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
                      <div className="body-md" style={{ marginTop: 8 }}>No restrictions active</div>
                    </div>
                  )}
                </div>

                {/* Bureau vs AA Comparison */}
                {suppressedRec && (
                  <div className="card">
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                      <div>
                        <span className="label-sm text-muted">AUTONOMOUS UNDERWRITING DIVERGENCE</span>
                        <h2 className="headline-sm">Legacy Bureau vs. Real-Time Account Aggregator Lens</h2>
                      </div>
                      <span className="chip chip-critical" style={{ fontSize: 10 }}>● 38-Day Information Blind Window Detected</span>
                    </div>

                    <div className="grid-2">
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

                    {/* Prescribed Action */}
                    <div style={{
                      marginTop: 20,
                      padding: "var(--space-lg)",
                      background: "var(--niva-canvas-subtle)",
                      borderRadius: "var(--radius-md)",
                    }}>
                      <span className="label-sm" style={{ color: "var(--niva-positive)" }}>
                        ✓ PRESCRIBED ETHICAL INSTITUTIONAL ACTION (RBI RESPONSIBLE LENDING MANDATE)
                      </span>
                      <p className="body-md" style={{ marginTop: 8, marginBottom: 12 }}>
                        Divert customer away from high-interest unsecured personal loans. Proactively extend <strong>Structured Buffer Assistance</strong> (Secured Overdraft against ₹4.5L existing Fixed Deposit) or offer zero-penalty Debt Consolidation counseling.
                      </p>
                      <div className="flex-gap-md">
                        <button className="btn btn-primary">✓ Accept Copilot Divert</button>
                        <button className="btn btn-secondary">👤 Assign Counselor</button>
                        <button className="btn btn-outline">☰ Manual Override</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Trail */}
                <div className="card">
                  <div style={{ marginBottom: 16 }}>
                    <span className="label-sm text-muted">COMPLIANCE & MERKLE CHAIN</span>
                    <h2 className="headline-sm">Statutory Verification & Immutable Decision Trail</h2>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--niva-border)" }}>
                          <th style={thStyle}>TIMESTAMP (IST)</th>
                          <th style={thStyle}>ACTOR / SYSTEM NODE</th>
                          <th style={thStyle}>POLICY / ACTION</th>
                          <th style={thStyle}>RESULT STATE</th>
                          <th style={thStyle}>HASH</th>
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
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="footer-brand">
          <span className="navbar-brand-icon" style={{ width: 24, height: 24, fontSize: 10 }}>N</span>
          NIVA
          <span className="text-muted" style={{ marginLeft: 8 }}>
            Autonomous Financial Intelligence &amp; AA Gateway
          </span>
        </div>
        <div className="footer-aa-badge">
          <span className="status-dot positive pulse" />
          <span>RBI Account Aggregator Compliant Sandbox</span>
        </div>
      </footer>
    </>
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
