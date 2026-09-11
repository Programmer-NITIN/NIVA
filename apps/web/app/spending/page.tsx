"use client";

import { useState, useEffect } from "react";
import { getFinancialTwin } from "@/lib/api";
import { formatCurrency, getCategoryIcon } from "@/lib/utils";

export default function SpendingPage() {
  const [twin, setTwin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getFinancialTwin("rajesh_sharma");
      setTwin(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const categories = twin?.spending_by_category || [];
  const essential = categories.filter((c: any) => c.is_essential);
  const discretionary = categories.filter((c: any) => !c.is_essential);

  // Colors for chart segments
  const chartColors = [
    "#163300", "#8EF244", "#F59E0B", "#E11D48", "#2563EB",
    "#10B981", "#8B5CF6", "#EC4899", "#F97316", "#06B6D4",
  ];

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
            <li><a href="/financial-state">Financial State</a></li>
            <li><a href="/spending" className="active">Spending</a></li>
            <li><a href="/ask-niva">Ask NIVA</a></li>
            <li><a href="/responsible-gate">Responsible Gate</a></li>
            <li><a href="/consent">Consent Center</a></li>
            <li><a href="/bank">Bank Portal</a></li>
          </ul>
          <div className="navbar-right">
            <div className="chip chip-neutral">EN | हिन्दी</div>
          </div>
        </div>
      </nav>

      <div className="page-container page-content">
        {loading ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>Loading Spending...</div>
        ) : twin ? (
          <div className="stack-xl stagger">
            <section>
              <span className="label-sm text-muted">SPENDING INTELLIGENCE</span>
              <h1 className="headline-lg" style={{ marginTop: 4 }}>Category Breakdown</h1>
              <p className="body-md text-secondary" style={{ marginTop: 4 }}>
                30-day window • {categories.length} categories detected
              </p>
            </section>

            {/* Summary */}
            <div className="grid-3">
              <div className="card-compact">
                <span className="label-sm text-muted">TOTAL SPENDING</span>
                <span className="currency-lg" style={{ display: "block", marginTop: 8 }}>
                  {formatCurrency(twin.expenses.total)}
                </span>
                <span className={`chip ${twin.expenses.trend > 0 ? "chip-critical" : "chip-positive"}`} style={{ marginTop: 8 }}>
                  {twin.expenses.trend > 0 ? "↑" : "↓"} {Math.abs(twin.expenses.trend)}% vs baseline
                </span>
              </div>
              <div className="card-compact">
                <span className="label-sm text-muted">ESSENTIAL</span>
                <span className="currency-lg" style={{ display: "block", marginTop: 8 }}>
                  {formatCurrency(twin.expenses.essential)}
                </span>
                <span className="body-sm text-muted" style={{ marginTop: 8 }}>
                  {twin.expenses.essential_ratio}% of total
                </span>
              </div>
              <div className="card-compact">
                <span className="label-sm text-muted">DISCRETIONARY</span>
                <span className="currency-lg" style={{ display: "block", marginTop: 8 }}>
                  {formatCurrency(twin.expenses.discretionary)}
                </span>
                <span className="body-sm text-muted" style={{ marginTop: 8 }}>
                  {(100 - twin.expenses.essential_ratio).toFixed(1)}% of total
                </span>
              </div>
            </div>

            {/* Segmented Bar */}
            <div className="card">
              <span className="label-sm text-muted" style={{ marginBottom: 12, display: "block" }}>SPENDING BY CATEGORY</span>
              <div className="segmented-bar" style={{ height: 16, marginBottom: 16 }}>
                {categories.map((cat: any, i: number) => (
                  <div
                    key={i}
                    className="segmented-bar-segment"
                    style={{
                      width: `${cat.percentage}%`,
                      background: chartColors[i % chartColors.length],
                    }}
                    title={`${cat.category}: ${cat.percentage}%`}
                  />
                ))}
              </div>

              {/* Category List */}
              {categories.map((cat: any, i: number) => (
                <div key={i} className="txn-row">
                  <div className="txn-icon" style={{ background: chartColors[i % chartColors.length] + "20" }}>
                    {getCategoryIcon(cat.category)}
                  </div>
                  <div className="txn-details">
                    <div className="txn-merchant" style={{ textTransform: "capitalize" }}>
                      {cat.category.replace(/_/g, " ")}
                    </div>
                    <div className="txn-meta">
                      {cat.percentage}% of total • {cat.is_essential ? "Essential" : "Discretionary"}
                    </div>
                  </div>
                  <div className="txn-amount">
                    <div className="amount debit">{formatCurrency(cat.amount)}</div>
                    <div className={`amount-label ${cat.trend > 15 ? "text-critical" : cat.trend < -10 ? "text-positive" : "text-muted"}`}>
                      {cat.trend > 0 ? "↑" : "↓"} {Math.abs(cat.trend)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
