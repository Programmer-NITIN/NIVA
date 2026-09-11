"use client";

import { useState, useEffect } from "react";
import { getFinancialTwin, getRecommendations } from "@/lib/api";
import {
  formatCurrency,
  formatPercentChange,
  getCategoryIcon,
  getStressColor,
  getScoreColor,
  formatRelativeDate,
} from "@/lib/utils";

type PersonaId = "rajesh_sharma" | "anita_desai" | "vikram_patel";

const PERSONAS: Record<PersonaId, { name: string; label: string; stress: string }> = {
  rajesh_sharma: { name: "Rajesh", label: "Stress Active", stress: "high" },
  anita_desai: { name: "Anita", label: "Healthy", stress: "low" },
  vikram_patel: { name: "Vikram", label: "Debt Watch", stress: "moderate" },
};

export default function HomePage() {
  const [persona, setPersona] = useState<PersonaId>("rajesh_sharma");
  const [twin, setTwin] = useState<any>(null);
  const [recs, setRecs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData(persona);
  }, [persona]);

  async function loadData(pid: PersonaId) {
    setLoading(true);
    setError(null);
    try {
      const [twinData, recsData] = await Promise.all([
        getFinancialTwin(pid),
        getRecommendations(pid),
      ]);
      setTwin(twinData);
      setRecs(recsData);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const suppressedRec = recs?.recommendations?.find(
    (r: any) => r.decision === "SUPPRESS" && r.product_type === "personal_loan"
  );

  const topCategories = twin?.spending_by_category?.slice(0, 6) || [];
  const topChanges = twin?.changes?.slice(0, 4) || [];

  const stressInfo = PERSONAS[persona];
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      {/* Demo Persona Bar */}
      <div className="demo-bar">
        <span className="demo-label">Demo scenario</span>
        {(Object.keys(PERSONAS) as PersonaId[]).map((pid) => (
          <button
            key={pid}
            className={`demo-persona-btn ${persona === pid ? "active" : ""}`}
            onClick={() => setPersona(pid)}
          >
            <span
              className={`status-dot ${getStressColor(PERSONAS[pid].stress)}`}
            />
            {PERSONAS[pid].label}
          </button>
        ))}
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand">
            <span className="navbar-brand-icon">N</span>
            NIVA
          </a>
          <ul className="navbar-tabs">
            <li><a href="/" className="active">Overview</a></li>
            <li><a href="/financial-state">Financial State</a></li>
            <li><a href="/spending">Spending</a></li>
            <li><a href="/ask-niva">Ask NIVA</a></li>
            <li><a href="/responsible-gate">Responsible Gate</a></li>
            <li><a href="/consent">Consent Center</a></li>
            <li><a href="/bank">Bank Portal</a></li>
          </ul>
          <div className="navbar-right">
            <div className="flex-gap-sm">
              <span
                className={`status-dot pulse ${getStressColor(stressInfo.stress)}`}
              />
              <span className="label-md">{stressInfo.label}</span>
            </div>
            <div className="chip chip-neutral">EN | हिन्दी | ગુજ</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="page-container page-content">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <p className="headline-sm" style={{ color: "var(--niva-critical)" }}>
              ⚠️ {error}
            </p>
            <p className="body-md text-muted" style={{ marginTop: "0.5rem" }}>
              Make sure the backend is running at localhost:8000
            </p>
          </div>
        ) : (
          <div className="stack-xl stagger">
            {/* Hero Section */}
            <HeroSection greeting={greeting} name={stressInfo.name} twin={twin} />

            {/* Sentinel Alert */}
            {twin?.stress_level !== "low" && (
              <SentinelAlert twin={twin} changes={topChanges} />
            )}

            {/* Responsible Gate Card */}
            {suppressedRec && <GateCard rec={suppressedRec} />}

            {/* Month in View */}
            <MonthView twin={twin} categories={topCategories} />

            {/* Recent Transactions */}
            <RecentTransactions twin={twin} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <span className="navbar-brand-icon" style={{ width: 24, height: 24, fontSize: 10 }}>
            N
          </span>
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

/* ─── Sub-Components ─────────────────────────────────────── */

function HeroSection({ greeting, name, twin }: any) {
  const balanceChange = twin?.income?.monthly_income
    ? twin.income.monthly_income - twin.expenses.total
    : 0;
  const changeText = balanceChange >= 0 ? `+₹${Math.abs(balanceChange).toLocaleString("en-IN")} this month` : `-₹${Math.abs(balanceChange).toLocaleString("en-IN")} this month`;

  return (
    <section>
      <div className="body-sm text-muted flex-gap-sm" style={{ marginBottom: 4 }}>
        <span className="status-dot positive" />
        AA LIVE SYNCED &nbsp;·&nbsp; HDFC •••• 4521, SBI •••• 8812
      </div>
      <h1 className="display-hero" style={{ marginBottom: 8 }}>
        {greeting}, {name}
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span className="currency-display">
          ₹{twin?.liquidity?.available_balance?.toLocaleString("en-IN") || "0"}
        </span>
        <span
          className={`chip ${balanceChange >= 0 ? "chip-positive" : "chip-critical"}`}
        >
          📈 {changeText}
        </span>
      </div>
      <p className="body-md text-muted" style={{ marginTop: 4 }}>
        Across 2 connected savings reserves. Real-time consent valid until 18 Nov 2026.
      </p>
      <div className="flex-gap-md" style={{ marginTop: 16 }}>
        <a href="/ask-niva" className="btn btn-primary">💬 Ask NIVA</a>
        <a href="/ask-niva" className="btn btn-outline">🏠 Simulate Purchase</a>
        <a href="/consent" className="btn btn-outline">☑️ Inspect Consent</a>
      </div>
    </section>
  );
}

function SentinelAlert({ twin, changes }: any) {
  const metrics = [
    { label: "Savings Rate", value: `${twin?.savings?.trend > 0 ? "+" : ""}${twin?.savings?.trend?.toFixed(0)}%`, sub: "vs 60-day baseline", color: twin?.savings?.trend < 0 ? "critical" : "positive" },
    { label: "Card Utilization", value: `${((twin?.debt?.credit_utilization || 0) * 100).toFixed(0)}%`, sub: "of total limit", color: (twin?.debt?.credit_utilization || 0) > 0.5 ? "critical" : "positive" },
    { label: "Discretionary Spend", value: `+${twin?.expenses?.trend?.toFixed(0) || 0}%`, sub: "Dining & E-commerce", color: twin?.expenses?.trend > 15 ? "critical" : "positive" },
    { label: "Cashflow Volatility", value: "31%", sub: "Micropayments drift", color: "warning" },
  ];

  return (
    <div className="card animate-fade-in">
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <span className="label-sm" style={{ color: "var(--niva-text-muted)" }}>
            EARLY SENTINEL SIGNAL • SETTLEMENT CYCLE #48
          </span>
          <h2 className="headline-sm" style={{ marginTop: 4 }}>
            Behavioral stress indicators detected over the last 3 settlement cycles.
          </h2>
        </div>
        <span className="chip chip-critical">Action Recommended</span>
      </div>
      <div className="grid-4">
        {metrics.map((m, i) => (
          <div key={i} className="metric-tile">
            <span className="metric-label">{m.label}</span>
            <span className={`metric-value text-${m.color}`}>{m.value}</span>
            <span className="body-sm text-muted">{m.sub}</span>
          </div>
        ))}
      </div>
      <div className="info-banner warning" style={{ marginTop: 16 }}>
        <span>ℹ️</span>
        <div>
          <strong>Why this matters:</strong> Inflow remains steady at ₹{twin?.income?.monthly_income?.toLocaleString("en-IN")}, but accelerated outflows shorten your liquidity cushion from <strong>2.1 to {twin?.liquidity?.emergency_months} months</strong>.
          <a href="/financial-state" style={{ marginLeft: 8, color: "var(--niva-info)" }}>
            View Drift Vectors →
          </a>
        </div>
      </div>
    </div>
  );
}

function GateCard({ rec }: any) {
  return (
    <div className="card-gate animate-fade-in">
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div className="flex-gap-sm">
          <span style={{ fontSize: 20 }}>🛡️</span>
          <span className="label-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            AUTONOMOUS SAFETY INTERCEPT
          </span>
        </div>
        <span className="card-gate-badge">● SHIELD ENGAGED</span>
      </div>

      <h2
        className="headline-md"
        style={{ color: "#ffffff", marginBottom: 16 }}
      >
        The Responsible Gate
      </h2>

      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-lg)",
          marginBottom: 16,
        }}
      >
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <span className="label-sm" style={{ color: "var(--niva-gate-lime)" }}>
            NIVA GUARDIAN GATE
          </span>
          <span className="card-gate-decision">RECOMMENDATION SUPPRESSED</span>
        </div>
        <div className="flex-gap-sm" style={{ marginBottom: 12 }}>
          <span className="chip-positive chip" style={{ background: "rgba(0,168,89,0.2)", color: "#6EE7B7" }}>
            ✓ Eligible: YES
          </span>
          <span>•</span>
          <span className="chip-critical chip" style={{ background: "rgba(225,29,72,0.2)", color: "#FCA5A5" }}>
            ✗ Suitable: NO
          </span>
        </div>
        <p className="body-md" style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
          Taking unsecured credit now creates an estimated <strong style={{ textDecoration: "underline" }}>3.4x forward default probability</strong>. Your discretionary burn is transient and will stabilize without incurring unnecessary 12.5% debt service. We recommend activating a 90-day cash buffer strategy instead.
        </p>
        <div className="grid-3" style={{ marginTop: 16, gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Risk Shift</div>
            <div className="currency-md" style={{ color: "var(--niva-critical)" }}>
              {rec.risk_shift || "+340%"}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Interest Saved</div>
            <div className="currency-md" style={{ color: "var(--niva-gate-lime)" }}>
              ₹{rec.interest_saved?.toLocaleString("en-IN") || "40,840"}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Recovery Time</div>
            <div className="currency-md" style={{ color: "#ffffff" }}>
              {rec.recovery_time_days || 90} Days
            </div>
          </div>
        </div>
      </div>

      <div className="flex-gap-md">
        <button className="btn btn-primary">View 90-Day Buffer Plan</button>
        <button className="btn btn-outline" style={{ borderColor: "rgba(255,255,255,0.3)", color: "#ffffff" }}>
          Talk to Human Counselor
        </button>
      </div>
    </div>
  );
}

function MonthView({ twin, categories }: any) {
  const income = twin?.income?.monthly_income || 0;
  const essential = twin?.expenses?.essential || 0;
  const discretionary = twin?.expenses?.discretionary || 0;
  const total = essential + discretionary;
  const free = Math.max(0, income - total);

  const essentialPct = income > 0 ? (essential / income) * 100 : 0;
  const discretionaryPct = income > 0 ? (discretionary / income) * 100 : 0;
  const freePct = income > 0 ? (free / income) * 100 : 0;

  return (
    <div className="card animate-fade-in">
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <span className="label-sm text-muted">AUTONOMOUS METRIC</span>
          <h2 className="headline-sm">Financial Health</h2>
        </div>
        <div>
          <span className="label-sm text-muted">MONTH IN VIEW</span>
          <h2 className="headline-sm" style={{ textAlign: "right" }}>
            {new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </h2>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 32 }}>
        {/* Health Score */}
        <div>
          <div className="score-display">
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="score-value">{twin?.health_score || 0}</span>
              <span className="score-max">/ 100</span>
            </div>
          </div>
          <div className="chip chip-warning" style={{ marginTop: 8, marginBottom: 16 }}>
            Moderate Attention
          </div>
          {[
            { label: "Income Stability", score: twin?.income?.stability || 0 },
            { label: "Debt Health", score: Math.max(0, 100 - (twin?.debt?.emi_to_income || 0) * 200) },
            { label: "Expense Stability", score: Math.max(0, 100 - Math.abs(twin?.expenses?.trend || 0) * 2) },
            { label: "Buffer Cushion", score: Math.min(100, (twin?.liquidity?.emergency_months || 0) * 25) },
          ].map((dim, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div className="flex-between" style={{ marginBottom: 4 }}>
                <span className="body-sm">{dim.label}</span>
                <span className={`label-md text-${getScoreColor(dim.score)}`}>
                  {Math.round(dim.score)} / 100
                </span>
              </div>
              <div className="score-bar">
                <div
                  className={`score-bar-fill ${getScoreColor(dim.score)}`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Month Stats */}
        <div>
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div>
              <span className="chip chip-positive" style={{ marginBottom: 4 }}>📥 INFLOW</span>
              <div className="currency-md">₹{income.toLocaleString("en-IN")}</div>
              <div className="body-sm text-muted">Salary</div>
            </div>
            <div>
              <span className="chip chip-critical" style={{ marginBottom: 4 }}>📤 OUTFLOW</span>
              <div className="currency-md">₹{total.toLocaleString("en-IN")}</div>
              <div className="body-sm text-muted">Discretionary</div>
            </div>
            <div>
              <span className="chip chip-warning" style={{ marginBottom: 4 }}>🔒 FIXED</span>
              <div className="currency-md">₹{essential.toLocaleString("en-IN")}</div>
              <div className="body-sm text-muted">EMIs & Rent</div>
            </div>
          </div>

          {/* Segmented bar */}
          <div className="segmented-bar" style={{ marginBottom: 8 }}>
            <div
              className="segmented-bar-segment"
              style={{
                width: `${essentialPct}%`,
                background: "var(--niva-critical)",
              }}
            />
            <div
              className="segmented-bar-segment"
              style={{
                width: `${discretionaryPct}%`,
                background: "var(--niva-warning)",
              }}
            />
            <div
              className="segmented-bar-segment"
              style={{
                width: `${freePct}%`,
                background: "var(--niva-positive)",
              }}
            />
          </div>
          <div className="flex-between body-sm text-muted">
            <span>{essentialPct.toFixed(0)}% Spent</span>
            <span>{discretionaryPct.toFixed(0)}% Fixed</span>
            <span>{freePct.toFixed(0)}% Free</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentTransactions({ twin }: any) {
  // Use seed data transaction examples
  const transactions = [
    { merchant: "Swiggy Instamart", meta: "SBI Debit • Today, 6:42 PM", amount: -1247, category: "groceries" },
    { merchant: "HDFC Personal Loan EMI", meta: "Auto-debit • Yesterday", amount: -14350, category: "emi", tag: "Scheduled" },
    { merchant: "TechCorp India Payroll", meta: "HDFC • 01 Sep, NEFT", amount: 78500, category: "salary", tag: "Verified Recurring" },
    { merchant: "Zomato", meta: "UPI • 10 Sep", amount: -3500, category: "dining" },
    { merchant: "Amazon", meta: "Credit Card • 09 Sep", amount: -22000, category: "shopping" },
  ];

  return (
    <div className="card animate-fade-in">
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <span className="label-sm text-muted">ACCOUNT AGGREGATOR LEDGER</span>
          <h2 className="headline-sm">Recent Normalized Stream</h2>
        </div>
        <a href="/spending" className="btn btn-ghost">Full Statement →</a>
      </div>

      {transactions.map((txn, i) => (
        <div key={i} className="txn-row">
          <div className="txn-icon">{getCategoryIcon(txn.category)}</div>
          <div className="txn-details">
            <div className="txn-merchant">{txn.merchant}</div>
            <div className="txn-meta">{txn.meta}</div>
          </div>
          <div className="txn-amount">
            <div className={`amount ${txn.amount > 0 ? "credit" : "debit"}`}>
              {txn.amount > 0 ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString("en-IN")}
            </div>
            {txn.tag && (
              <div className="amount-label" style={{ color: txn.amount > 0 ? "var(--niva-positive)" : "var(--niva-text-muted)" }}>
                {txn.tag}
              </div>
            )}
          </div>
        </div>
      ))}

      <div
        className="flex-between body-sm text-muted"
        style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--niva-border)" }}
      >
        <span>🔒 RBI-Regulated Account Aggregator Data • Zero credential storage</span>
        <span>Revoke Consent anytime</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="stack-xl">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="card"
          style={{ height: i === 1 ? 200 : 300, opacity: 0.5 }}
        >
          <div
            style={{
              width: "40%",
              height: 20,
              background: "var(--niva-canvas-dim)",
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
          <div
            style={{
              width: "60%",
              height: 40,
              background: "var(--niva-canvas-dim)",
              borderRadius: 8,
            }}
          />
        </div>
      ))}
    </div>
  );
}
