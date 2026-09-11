"use client";

import { useState, useEffect } from "react";
import { getRecommendations, getFinancialTwin } from "@/lib/api";
import { getStressColor, getScoreColor } from "@/lib/utils";

export default function ResponsibleGatePage() {
  const [twin, setTwin] = useState<any>(null);
  const [recs, setRecs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        getFinancialTwin("rajesh_sharma"),
        getRecommendations("rajesh_sharma"),
      ]);
      setTwin(t);
      setRecs(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const suppressed = recs?.recommendations?.filter((r: any) => r.decision === "SUPPRESS") || [];
  const recommended = recs?.recommendations?.filter((r: any) => r.decision === "RECOMMEND") || [];

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
            <li><a href="/spending">Spending</a></li>
            <li><a href="/ask-niva">Ask NIVA</a></li>
            <li><a href="/responsible-gate" className="active">Responsible Gate</a></li>
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
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>Loading Gate Analysis...</div>
        ) : (
          <div className="stack-xl stagger">
            {/* Header */}
            <section>
              <span className="label-sm text-muted">RESPONSIBLE AI RECOMMENDATION ENGINE</span>
              <h1 className="headline-lg" style={{ marginTop: 4 }}>The Responsible Gate</h1>
              <p className="body-md text-secondary" style={{ marginTop: 4, maxWidth: 600 }}>
                Every product recommendation passes through a multi-stage gate: Eligibility, Suitability, Stress Check, and Affordability. Only products that genuinely help the customer make it through.
              </p>
            </section>

            {/* Gate Summary */}
            <div className="grid-3">
              <div className="card-compact">
                <span className="label-sm text-muted">TOTAL EVALUATED</span>
                <span className="currency-lg" style={{ display: "block", marginTop: 8 }}>
                  {(recs?.recommended_count || 0) + (recs?.suppressed_count || 0)}
                </span>
                <span className="body-sm text-muted">products in catalog</span>
              </div>
              <div className="card-compact" style={{ background: "var(--niva-positive-bg)" }}>
                <span className="label-sm text-positive">RECOMMENDED</span>
                <span className="currency-lg text-positive" style={{ display: "block", marginTop: 8 }}>
                  {recs?.recommended_count || 0}
                </span>
                <span className="body-sm text-muted">passed all gates</span>
              </div>
              <div className="card-compact" style={{ background: "var(--niva-critical-bg)" }}>
                <span className="label-sm text-critical">SUPPRESSED</span>
                <span className="currency-lg text-critical" style={{ display: "block", marginTop: 8 }}>
                  {recs?.suppressed_count || 0}
                </span>
                <span className="body-sm text-muted">blocked by gate</span>
              </div>
            </div>

            {/* Suppressed Products */}
            {suppressed.length > 0 && (
              <div className="card-gate">
                <div className="flex-between" style={{ marginBottom: 16 }}>
                  <div>
                    <span className="card-gate-badge">SHIELD ACTIVE</span>
                    <h2 className="headline-sm" style={{ marginTop: 8, color: "#fff" }}>
                      Suppressed Recommendations
                    </h2>
                  </div>
                </div>

                {suppressed.map((rec: any, i: number) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-lg)",
                    marginBottom: i < suppressed.length - 1 ? 12 : 0,
                  }}>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <span className="title-md" style={{ color: "#fff" }}>{rec.product_name}</span>
                      <span className="card-gate-decision">SUPPRESSED</span>
                    </div>
                    <p className="body-md" style={{ color: "rgba(255,255,255,0.8)", marginBottom: 12 }}>
                      {rec.gate_reason}
                    </p>

                    {/* Eligibility & Suitability */}
                    <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                      <div>
                        <span className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>ELIGIBILITY CHECKS</span>
                        {rec.eligibility_factors?.map((f: any, j: number) => (
                          <div key={j} className="flex-between" style={{ marginTop: 8 }}>
                            <span className="body-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{f.factor}</span>
                            <span className={`label-md ${f.met ? "text-positive" : "text-critical"}`}>
                              {f.met ? "PASS" : "FAIL"} ({f.actual})
                            </span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>SUITABILITY CHECKS</span>
                        {rec.suitability_factors?.map((f: any, j: number) => (
                          <div key={j} className="flex-between" style={{ marginTop: 8 }}>
                            <span className="body-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{f.factor}</span>
                            <span className={`label-md ${f.met ? "text-positive" : "text-critical"}`}>
                              {f.met ? "PASS" : "FAIL"} ({f.actual})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rec.alternative_action && (
                      <div style={{
                        background: "rgba(142,242,68,0.1)",
                        borderRadius: "var(--radius-sm)",
                        padding: 12,
                        marginTop: 12,
                      }}>
                        <span className="label-sm" style={{ color: "var(--niva-gate-lime)" }}>RECOMMENDED ALTERNATIVE</span>
                        <p className="body-sm" style={{ color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                          {rec.alternative_action}
                        </p>
                      </div>
                    )}

                    {rec.risk_shift && (
                      <div className="grid-3" style={{ marginTop: 12, gap: 12 }}>
                        <div className="text-center">
                          <div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Risk Shift</div>
                          <div className="currency-md text-critical">{rec.risk_shift}</div>
                        </div>
                        <div className="text-center">
                          <div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Interest Saved</div>
                          <div className="currency-md" style={{ color: "var(--niva-gate-lime)" }}>
                            ₹{rec.interest_saved?.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="label-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Recovery</div>
                          <div className="currency-md" style={{ color: "#fff" }}>{rec.recovery_time_days} Days</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommended Products */}
            {recommended.length > 0 && (
              <div className="card">
                <span className="label-sm text-positive">APPROVED RECOMMENDATIONS</span>
                <h2 className="headline-sm" style={{ marginTop: 4, marginBottom: 16 }}>
                  Products that passed all gates
                </h2>
                <div className="grid-2" style={{ gap: 12 }}>
                  {recommended.map((rec: any, i: number) => (
                    <div key={i} className="card-compact" style={{ background: "var(--niva-positive-bg)", border: "1px solid var(--niva-positive)" }}>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <span className="title-md">{rec.product_name}</span>
                        <span className="chip chip-positive">APPROVED</span>
                      </div>
                      <p className="body-sm text-secondary">{rec.gate_reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How the Gate Works */}
            <div className="card">
              <span className="label-sm text-muted">PIPELINE ARCHITECTURE</span>
              <h2 className="headline-sm" style={{ marginTop: 4, marginBottom: 16 }}>How the Responsible Gate Works</h2>
              <div className="grid-4" style={{ gap: 12 }}>
                {[
                  { step: "1", title: "Eligibility", desc: "Income, account age, credit history thresholds", color: "var(--niva-info)" },
                  { step: "2", title: "Suitability", desc: "Stress score, debt ratios, savings rate checks", color: "var(--niva-warning)" },
                  { step: "3", title: "Affordability", desc: "Post-product emergency buffer simulation", color: "var(--niva-critical)" },
                  { step: "4", title: "Gate Decision", desc: "RECOMMEND, SUPPRESS, or ESCALATE to human", color: "var(--niva-positive)" },
                ].map((s, i) => (
                  <div key={i} className="card-compact" style={{ textAlign: "center" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: s.color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, margin: "0 auto 12px",
                    }}>
                      {s.step}
                    </div>
                    <span className="title-md">{s.title}</span>
                    <p className="body-sm text-muted" style={{ marginTop: 4 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
