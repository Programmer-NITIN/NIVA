"use client";

import { useState } from "react";
import { createConsent, approveConsent } from "@/lib/api";

export default function ConsentPage() {
  const [consentId, setConsentId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("none");
  const [phone, setPhone] = useState("9876543210");

  async function handleCreate() {
    try {
      const res = await createConsent(phone);
      setConsentId(res.consent_id);
      setStatus("pending");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleApprove() {
    if (!consentId) return;
    try {
      await approveConsent(consentId);
      setStatus("approved");
    } catch (e) {
      console.error(e);
    }
  }

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
            <li><a href="/responsible-gate">Responsible Gate</a></li>
            <li><a href="/consent" className="active">Consent Center</a></li>
            <li><a href="/bank">Bank Portal</a></li>
          </ul>
          <div className="navbar-right">
            <div className="chip chip-neutral">EN | हिन्दी</div>
          </div>
        </div>
      </nav>

      <div className="page-container page-content">
        <div className="stack-xl stagger">
          {/* Header */}
          <section>
            <span className="label-sm text-muted">RBI ACCOUNT AGGREGATOR FRAMEWORK</span>
            <h1 className="headline-lg" style={{ marginTop: 4 }}>Consent Center</h1>
            <p className="body-md text-secondary" style={{ marginTop: 4, maxWidth: 600 }}>
              Your financial data is shared only with your explicit, revocable consent as per RBI&apos;s Account Aggregator guidelines. No credentials are stored — data is encrypted end-to-end.
            </p>
          </section>

          {/* RBI Compliance Info */}
          <div className="info-banner info">
            <span>🛡️</span>
            <div>
              <strong>RBI Account Aggregator (AA) Framework</strong>
              <p className="body-sm" style={{ marginTop: 4 }}>
                Account Aggregators are licensed by RBI under the Data Empowerment and Protection Architecture (DEPA). Your data flows from FIPs (banks) through the AA to FIUs (NIVA) in an encrypted, consent-based pipeline. You control what data is shared, for how long, and can revoke consent at any time.
              </p>
            </div>
          </div>

          {/* Consent Flow */}
          <div className="grid-2">
            {/* Create Consent */}
            <div className="card">
              <span className="label-sm text-muted">STEP 1</span>
              <h2 className="headline-sm" style={{ marginTop: 4, marginBottom: 16 }}>Create Consent Request</h2>

              <div style={{ marginBottom: 16 }}>
                <label className="label-md" style={{ display: "block", marginBottom: 4 }}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid var(--niva-border)",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                    outline: "none",
                  }}
                  placeholder="Enter customer phone"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label-md" style={{ display: "block", marginBottom: 8 }}>Data Requested</label>
                <div className="stack" style={{ gap: 8 }}>
                  {[
                    { type: "DEPOSIT", label: "Savings & Current Accounts", enabled: true },
                    { type: "RECURRING_DEPOSIT", label: "Recurring Deposits", enabled: false },
                    { type: "TERM_DEPOSIT", label: "Fixed Deposits", enabled: false },
                    { type: "CREDIT_CARD", label: "Credit Card Statements", enabled: false },
                  ].map((fi, i) => (
                    <div key={i} className="flex-gap-sm" style={{ padding: "8px 0" }}>
                      <input type="checkbox" checked={fi.enabled} readOnly style={{ accentColor: "var(--niva-deep-forest)" }} />
                      <span className="body-md">{fi.label}</span>
                      <span className="label-sm text-muted" style={{ marginLeft: "auto" }}>{fi.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-between body-sm text-muted" style={{ marginBottom: 16 }}>
                <span>Duration: 6 months</span>
                <span>Frequency: On-demand</span>
              </div>

              <button className="btn btn-primary btn-lg" onClick={handleCreate} style={{ width: "100%" }}>
                Create Consent Request
              </button>
            </div>

            {/* Consent Status */}
            <div className="card">
              <span className="label-sm text-muted">STEP 2</span>
              <h2 className="headline-sm" style={{ marginTop: 4, marginBottom: 16 }}>Consent Status</h2>

              {status === "none" ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔐</div>
                  <p className="body-lg text-muted">No active consent request</p>
                  <p className="body-sm text-muted" style={{ marginTop: 4 }}>
                    Create a consent request to begin the AA flow
                  </p>
                </div>
              ) : (
                <div className="stack-lg animate-fade-in">
                  <div className="card-compact" style={{ background: status === "approved" ? "var(--niva-positive-bg)" : "var(--niva-warning-bg)" }}>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <span className="label-md">Consent ID</span>
                      <span className="font-mono">{consentId}</span>
                    </div>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <span className="label-md">Status</span>
                      <span className={`chip ${status === "approved" ? "chip-positive" : "chip-warning"}`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-between">
                      <span className="label-md">Phone</span>
                      <span>{phone}</span>
                    </div>
                  </div>

                  {status === "pending" && (
                    <>
                      <div className="info-banner warning">
                        <span>📱</span>
                        <div>
                          <strong>OTP Verification Required</strong>
                          <p className="body-sm" style={{ marginTop: 4 }}>
                            In production, the customer would receive an OTP on their phone via the AA app. In sandbox mode, any OTP is accepted.
                          </p>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-lg" onClick={handleApprove} style={{ width: "100%" }}>
                        Simulate OTP Approval
                      </button>
                    </>
                  )}

                  {status === "approved" && (
                    <div className="info-banner info">
                      <span>✅</span>
                      <div>
                        <strong>Consent Approved!</strong>
                        <p className="body-sm" style={{ marginTop: 4 }}>
                          Financial data is now accessible. The Financial Twin will be computed from the fetched transaction data. Go to the <a href="/" style={{ color: "var(--niva-info)" }}>Overview</a> to see it in action.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AA Architecture */}
          <div className="card">
            <span className="label-sm text-muted">ARCHITECTURE</span>
            <h2 className="headline-sm" style={{ marginTop: 4, marginBottom: 16 }}>
              RBI Account Aggregator Data Flow
            </h2>
            <div className="grid-4" style={{ gap: 12 }}>
              {[
                { icon: "🏦", label: "FIP", desc: "Financial Information Provider (HDFC, SBI)", badge: "Data Source" },
                { icon: "🔗", label: "AA", desc: "Account Aggregator (ReBIT Spec)", badge: "Consent Manager" },
                { icon: "🏢", label: "FIU", desc: "Financial Information User (NIVA)", badge: "Data Consumer" },
                { icon: "👤", label: "Customer", desc: "Data Owner (You)", badge: "Consent Owner" },
              ].map((node, i) => (
                <div key={i} className="card-compact" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{node.icon}</div>
                  <div className="title-md">{node.label}</div>
                  <div className="chip chip-neutral" style={{ marginTop: 4, marginBottom: 8, fontSize: 10 }}>
                    {node.badge}
                  </div>
                  <p className="body-sm text-muted">{node.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
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
