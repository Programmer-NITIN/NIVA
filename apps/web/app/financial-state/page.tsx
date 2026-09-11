"use client";

import { useState, useEffect } from "react";
import { getFinancialTwin } from "@/lib/api";
import { getScoreColor, getStressColor, formatCurrency, getCategoryIcon } from "@/lib/utils";

type PersonaId = "rajesh_sharma" | "anita_desai" | "vikram_patel";

const PERSONAS: Record<PersonaId, { name: string }> = {
  rajesh_sharma: { name: "Rajesh Sharma" },
  anita_desai: { name: "Anita Desai" },
  vikram_patel: { name: "Vikram Patel" },
};

export default function FinancialStatePage() {
  const [persona, setPersona] = useState<PersonaId>("rajesh_sharma");
  const [twin, setTwin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData(persona);
  }, [persona]);

  async function loadData(pid: PersonaId) {
    setLoading(true);
    try {
      const data = await getFinancialTwin(pid);
      setTwin(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const stressFactors = twin?.stress_factors || [];
  const changes = twin?.changes || [];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand">
            <span className="navbar-brand-icon">N</span>
            NIVA
          </a>
          <ul className="navbar-tabs">
            <li><a href="/">Overview</a></li>
            <li><a href="/financial-state" className="active">Financial State</a></li>
            <li><a href="/spending">Spending</a></li>
            <li><a href="/ask-niva">Ask NIVA</a></li>
            <li><a href="/responsible-gate">Responsible Gate</a></li>
            <li><a href="/consent">Consent Center</a></li>
            <li><a href="/bank">Bank Portal</a></li>
          </ul>
          <div className="navbar-right">
            <div className="chip chip-neutral">EN | हिन्दी | ગુજ</div>
          </div>
        </div>
      </nav>

      <div className="page-container page-content">
        {loading ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>Loading Financial Twin...</div>
        ) : twin ? (
          <div className="stack-xl stagger">
            {/* Header */}
            <section>
              <span className="label-sm text-muted">FINANCIAL DIGITAL TWIN</span>
              <h1 className="headline-lg" style={{ marginTop: 4 }}>
                {twin.persona_id}&apos;s Complete Financial State
              </h1>
              <p className="body-md text-secondary" style={{ marginTop: 4 }}>
                Computed from {twin.window_days}-day window • Data source: {twin.data_source}
              </p>
            </section>

            {/* Composite Scores */}
            <div className="grid-3">
              <div className="card">
                <span className="label-sm text-muted">HEALTH INDEX</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "8px 0" }}>
                  <span className="score-value" style={{ color: `var(--niva-${getScoreColor(twin.health_score)})` }}>{twin.health_score}</span>
                  <span className="score-max">/ 100</span>
                </div>
                <div className="score-bar" style={{ marginBottom: 8 }}>
                  <div className={`score-bar-fill ${getScoreColor(twin.health_score)}`} style={{ width: `${twin.health_score}%` }} />
                </div>
                <p className="body-sm text-muted">Composite of income stability, savings, debt, liquidity</p>
              </div>

              <div className="card">
                <span className="label-sm" style={{ color: "var(--niva-critical)" }}>STRESS RISK INDEX</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "8px 0" }}>
                  <span className={`score-value text-${getStressColor(twin.stress_level)}`}>{twin.stress_score}</span>
                  <span className="score-max">/ 100</span>
                </div>
                <span className={`chip chip-${getStressColor(twin.stress_level)}`}>
                  {twin.stress_level?.toUpperCase()}
                </span>
              </div>

              <div className="card">
                <span className="label-sm text-muted">ANOMALY SCORE</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "8px 0" }}>
                  <span className="score-value">{twin.anomaly_score}</span>
                  <span className="score-max">/ 100</span>
                </div>
                <div className="score-bar">
                  <div className={`score-bar-fill ${getScoreColor(100 - twin.anomaly_score)}`} style={{ width: `${twin.anomaly_score}%` }} />
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid-4">
              <div className="metric-tile">
                <span className="metric-label">Monthly Income</span>
                <span className="metric-value">{formatCurrency(twin.income.monthly_income)}</span>
                <span className={`metric-change ${twin.income.growth_rate > 0 ? "up-good" : "down-bad"}`}>
                  {twin.income.growth_rate > 0 ? "↑" : "↓"} {Math.abs(twin.income.growth_rate)}% MoM
                </span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Total Expenses</span>
                <span className="metric-value">{formatCurrency(twin.expenses.total)}</span>
                <span className={`metric-change ${twin.expenses.trend > 0 ? "up" : "down"}`}>
                  {twin.expenses.trend > 0 ? "↑" : "↓"} {Math.abs(twin.expenses.trend)}% vs baseline
                </span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Savings Rate</span>
                <span className={`metric-value ${twin.savings.rate < 10 ? "text-critical" : twin.savings.rate < 20 ? "text-warning" : "text-positive"}`}>
                  {twin.savings.rate}%
                </span>
                <span className={`metric-change ${twin.savings.trend > 0 ? "up-good" : "down-bad"}`}>
                  {twin.savings.trend > 0 ? "↑" : "↓"} {Math.abs(twin.savings.trend)}% trend
                </span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">Emergency Buffer</span>
                <span className={`metric-value ${twin.liquidity.emergency_months < 2 ? "text-critical" : twin.liquidity.emergency_months < 3 ? "text-warning" : "text-positive"}`}>
                  {twin.liquidity.emergency_months} <span style={{ fontSize: 14, fontWeight: 400 }}>months</span>
                </span>
                <span className="body-sm text-muted">
                  Balance: {formatCurrency(twin.liquidity.available_balance)}
                </span>
              </div>
            </div>

            {/* Debt Metrics */}
            <div className="card">
              <span className="label-sm text-muted">DEBT & OBLIGATIONS</span>
              <h2 className="headline-sm" style={{ marginTop: 4, marginBottom: 16 }}>EMI & Credit Analysis</h2>
              <div className="grid-4">
                <div className="metric-tile">
                  <span className="metric-label">Total EMI</span>
                  <span className="metric-value">{formatCurrency(twin.debt.total_emi)}</span>
                </div>
                <div className="metric-tile">
                  <span className="metric-label">EMI-to-Income</span>
                  <span className={`metric-value ${twin.debt.emi_to_income > 0.35 ? "text-critical" : "text-positive"}`}>
                    {(twin.debt.emi_to_income * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="metric-tile">
                  <span className="metric-label">Credit Utilization</span>
                  <span className={`metric-value ${(twin.debt.credit_utilization || 0) > 0.5 ? "text-critical" : "text-positive"}`}>
                    {((twin.debt.credit_utilization || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="metric-tile">
                  <span className="metric-label">Utilization Change</span>
                  <span className={`metric-value ${(twin.debt.credit_utilization_change || 0) > 0 ? "text-critical" : "text-positive"}`}>
                    {(twin.debt.credit_utilization_change || 0) > 0 ? "+" : ""}{((twin.debt.credit_utilization_change || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stress Factors */}
            {stressFactors.length > 0 && (
              <div className="card">
                <span className="label-sm" style={{ color: "var(--niva-critical)" }}>STRESS CONTRIBUTING FACTORS</span>
                <h2 className="headline-sm" style={{ marginTop: 4, marginBottom: 16 }}>What&apos;s driving the stress score</h2>
                {stressFactors.map((f: any, i: number) => (
                  <div key={i} style={{ padding: "12px 0", borderBottom: i < stressFactors.length - 1 ? "1px solid var(--niva-border)" : "none" }}>
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <span className="title-md">{f.factor}</span>
                      <span className="chip chip-critical">+{f.contribution} pts</span>
                    </div>
                    <p className="body-sm text-muted">{f.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* What Changed */}
            {changes.length > 0 && (
              <div className="card">
                <span className="label-sm text-muted">CHANGE DETECTION</span>
                <h2 className="headline-sm" style={{ marginTop: 4, marginBottom: 16 }}>What changed from your 90-day baseline</h2>
                <div className="grid-2" style={{ gap: 12 }}>
                  {changes.map((c: any, i: number) => (
                    <div key={i} className={`info-banner ${c.severity === "critical" ? "critical" : c.severity === "warning" ? "warning" : "info"}`}>
                      <span>{c.direction === "up" ? "📈" : "📉"}</span>
                      <div>
                        <strong>{c.metric}</strong>
                        <p className="body-sm" style={{ marginTop: 4 }}>{c.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <footer className="footer">
        <div className="footer-brand">
          <span className="navbar-brand-icon" style={{ width: 24, height: 24, fontSize: 10 }}>N</span>
          NIVA
        </div>
        <div className="footer-aa-badge">
          <span className="status-dot positive pulse" />
          RBI Account Aggregator Compliant Sandbox
        </div>
      </footer>
    </>
  );
}
