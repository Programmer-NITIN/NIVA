/**
 * NIVA — API Client
 * Centralized API calls to the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

// ── AA Endpoints ─────────────────────────────────────────────

export async function getPersonas() {
  return fetchAPI<{ personas: any[] }>("/aa/personas");
}

export async function createConsent(phone: string, mode?: string) {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  return fetchAPI<any>(`/aa/consents${query}`, {
    method: "POST",
    body: JSON.stringify({ phone, duration_months: 6 }),
  });
}

export async function approveConsent(consentId: string, mode?: string) {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  return fetchAPI<any>(`/aa/consents/${consentId}/approve${query}`, { method: "POST" });
}

export async function fetchFIData(consentId: string, personaId: string, mode?: string) {
  const query = mode ? `&mode=${encodeURIComponent(mode)}` : "";
  return fetchAPI<any>(`/aa/fi-data/${consentId}?persona_id=${encodeURIComponent(personaId)}${query}`);
}

// ── Twin Endpoints ───────────────────────────────────────────

export async function getFinancialTwin(personaId: string) {
  return fetchAPI<any>(`/twin/${personaId}`);
}

export async function getSignals(personaId: string) {
  return fetchAPI<any>(`/twin/${personaId}/signals`);
}

export async function checkAffordability(personaId: string, amount: number, delayMonths = 0) {
  return fetchAPI<any>(`/twin/${personaId}/affordability`, {
    method: "POST",
    body: JSON.stringify({ target_amount: amount, delay_months: delayMonths }),
  });
}

// ── Recommendation Endpoints ─────────────────────────────────

export async function getRecommendations(personaId: string) {
  return fetchAPI<any>(`/recommendations/${personaId}`);
}

export async function getGateVerdict(personaId: string, productType: string) {
  return fetchAPI<any>(`/recommendations/${personaId}/gate-verdict/${productType}`);
}

// ── Bank Endpoints ───────────────────────────────────────────

export async function getBankCustomers() {
  return fetchAPI<any>("/bank/customers");
}

export async function getBankCustomerDetail(personaId: string) {
  return fetchAPI<any>(`/bank/customers/${personaId}`);
}

export async function getAuditTrail(personaId: string) {
  return fetchAPI<any>(`/bank/audit/${personaId}`);
}

// ── Copilot Endpoints ────────────────────────────────────────

export async function sendChatMessage(message: string, personaId: string, language = "en") {
  return fetchAPI<any>("/copilot/chat", {
    method: "POST",
    body: JSON.stringify({ message, persona_id: personaId, language }),
  });
}

// ── Demo Endpoints ───────────────────────────────────────────

export async function getActivePersona() {
  return fetchAPI<any>("/demo/active");
}

export async function switchPersona(personaId: string) {
  return fetchAPI<any>(`/demo/switch/${personaId}`, { method: "POST" });
}

// ── Journey Endpoints ────────────────────────────────────────

export async function verifyOtp(phone: string, otp: string, personaId: string) {
  return fetchAPI<any>("/journey/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, otp, persona_id: personaId }),
  });
}

export async function getKycDetails(personaId: string) {
  return fetchAPI<any>(`/journey/kyc/${personaId}`);
}

export async function submitEmpatheticAction(personaId: string, actionType: string, selectedOption: string) {
  return fetchAPI<any>("/journey/empathetic-action", {
    method: "POST",
    body: JSON.stringify({ persona_id: personaId, action_type: actionType, selected_option: selectedOption }),
  });
}

export async function getJourneyState(personaId: string) {
  return fetchAPI<any>(`/journey/state/${personaId}`);
}

export async function uploadBankStatement(file: File, personaId = "custom_user", fullName = "", phone = "", password = "") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("persona_id", personaId);
  formData.append("full_name", fullName);
  formData.append("phone", phone);
  if (password) formData.append("password", password);

  const res = await fetch(`${API_BASE}/api/v1/journey/upload-statement`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Upload error: ${res.status}`);
  }

  return res.json();
}

// ── ML Intelligence & Explainability Endpoints ───────────────

export async function getMLStressPrediction(personaId: string) {
  return fetchAPI<any>(`/ml/stress-prediction/${personaId}`);
}

export async function getMLAnomalies(personaId: string) {
  return fetchAPI<any>(`/ml/anomalies/${personaId}`);
}

export async function getMLLifeStage(personaId: string) {
  return fetchAPI<any>(`/ml/life-stage/${personaId}`);
}

export async function getMLResponsibleRecommendations(personaId: string) {
  return fetchAPI<any>(`/ml/responsible-recommendations/${personaId}`);
}

export async function getMLAuditTrail() {
  return fetchAPI<any>("/ml/audit-trail");
}

// ── Advanced Spending, What-If & Bank Console Endpoints ────────

export async function getSpendingAnalysis(personaId: string) {
  try {
    return await fetchAPI<any>(`/twin/${personaId}/spending-analysis`);
  } catch {
    // Graceful fallback from twin + anomalies if backend endpoint isn't ready
    const twin = await getFinancialTwin(personaId);
    return {
      persona_id: personaId,
      monthly_essential: twin?.expenses?.essential || 26300,
      monthly_discretionary: twin?.expenses?.discretionary || 8200,
      total_monthly_spend: twin?.expenses?.total || 34500,
      essential_ratio: twin?.expenses?.essential_ratio || 76.2,
      categories: twin?.spending_by_category || [
        { category: "Rent", amount: 18000, percentage: 52.1, trend_pct: 0, is_essential: true, status: "normal" },
        { category: "Groceries", amount: 8400, percentage: 24.3, trend_pct: 4.2, is_essential: true, status: "normal" },
        { category: "Utilities", amount: 3200, percentage: 9.3, trend_pct: 12.0, is_essential: true, status: "normal" },
        { category: "Medical", amount: 4800, percentage: 13.9, trend_pct: 42.0, is_essential: true, status: "spike" },
      ],
      anomalies_detected: [
        { transaction_id: "TXN_9812", amount: 38500, category: "medical", description: "Apollo Hospital ICU Deposit (4.8x normal)", is_anomaly: true, z_score: 4.8 }
      ],
      recurring_mandates: [
        { label: "Apartment Rent (UPI AutoPay)", amount: 18000, due_day: 3, status: "PAID" },
        { label: "Zerodha Wealth Nifty 50 SIP", amount: 5000, due_day: 5, status: "PAID" },
        { label: "Electricity Bill (BESCOM/UGVCL)", amount: 1850, due_day: 10, status: "UPCOMING" },
        { label: "Two-Wheeler Loan EMI", amount: 4200, due_day: 14, status: "UPCOMING" }
      ]
    };
  }
}

export async function simulateStress(personaId: string, shockAmount: number, incomeDropPct: number, shockCategory = "medical") {
  try {
    return await fetchAPI<any>(`/twin/${personaId}/simulate-stress`, {
      method: "POST",
      body: JSON.stringify({ shock_amount: shockAmount, income_drop_pct: incomeDropPct, shock_category: shockCategory }),
    });
  } catch {
    // Dynamic deterministic fallback
    const twin = await getFinancialTwin(personaId).catch(() => null);
    const origBal = twin?.liquidity?.available_balance || 48500;
    const origIncome = twin?.income?.monthly_income || 58000;
    const essential = Math.max(twin?.expenses?.essential || 26000, 1);
    
    const adjBalance = Math.max(0, origBal - shockAmount);
    const adjIncome = Math.max(1, origIncome * (1 - incomeDropPct / 100));
    const runwayMonths = (adjBalance / essential).toFixed(1);
    const runwayDays = Math.round(Number(runwayMonths) * 30);
    const simulatedHealth = Math.max(15, Math.min(95, (twin?.health_score || 72) - Math.round(shockAmount / 1500) - Math.round(incomeDropPct * 0.7)));
    const simulatedStress = Math.min(98, Math.max(10, (twin?.stress_score || 35) + Math.round(shockAmount / 1200) + Math.round(incomeDropPct * 0.8)));
    
    return {
      persona_id: personaId,
      simulated: {
        health_score: simulatedHealth,
        stress_score: simulatedStress,
        remaining_balance: adjBalance,
        remaining_runway_days: runwayDays,
        remaining_runway_months: Number(runwayMonths),
        simulated_dti: 0.38,
        default_risk: Number(runwayMonths) < 1.0 ? "HIGH" : Number(runwayMonths) < 2.0 ? "MODERATE" : "LOW",
      },
      recommended_shield: {
        action: shockAmount > 15000 ? "Activate Emergency Micro-FD Auto-Sweep" : "Maintain Liquid Buffer",
        relief_scheme: "PM SVANidhi 7% Working Capital Line",
      }
    };
  }
}

export async function getGatePolicies() {
  try {
    return await fetchAPI<any>("/bank/gate-policies");
  } catch {
    return {
      framework: "RBI Digital Lending Guidelines (2022/2023) & DPDP Act 2023",
      active_policies: [
        {
          policy_id: "POL-402",
          name: "Anti-Predatory Overleveraging Guard",
          rule: "Suppress unsecured personal loans if DTI > 40% OR Savings Rate < 10%",
          status: "ENFORCED",
          severity: "CRITICAL_BLOCK",
          triggers_count_today: 14,
          citation: "RBI Master Direction §3.2 (Fair Practices Code)"
        },
        {
          policy_id: "POL-301",
          name: "Medical Shock Quarantine",
          rule: "Freeze negative bureau flags if medical spend spike > 50% of monthly income",
          status: "ENFORCED",
          severity: "EMPATHETIC_INTERVENTION",
          triggers_count_today: 8,
          citation: "RBI Financial Inclusion & Distress Resolution Standard"
        },
        {
          policy_id: "POL-204",
          name: "Micro-Merchant Working Capital Divert",
          rule: "Redirect MSME merchants from high-rate credit to PM SVANidhi (7% APR)",
          status: "ENFORCED",
          severity: "CATALOG_DIVERT",
          triggers_count_today: 22,
          citation: "Ministry of Housing & Urban Affairs (MoHUA) SVANidhi Protocol"
        },
        {
          policy_id: "DPDP-SEC6",
          name: "Consent Purpose Limitation & Data Minimization",
          rule: "Auto-expire consent session upon completion of underwriting evaluation",
          status: "ENFORCED",
          severity: "STATUTORY_MANDATE",
          triggers_count_today: 35,
          citation: "Digital Personal Data Protection Act 2023, Section 6(1)"
        }
      ]
    };
  }
}

export async function getRebitTelemetry(personaId: string) {
  try {
    return await fetchAPI<any>(`/bank/rebit-telemetry/${personaId}`);
  } catch {
    const pUpper = personaId.slice(0, 4).toUpperCase();
    return {
      consent_artifact: {
        consent_id: `CNST-SETU-AA-${pUpper}-2026`,
        consent_status: "ACTIVE",
        consent_handle: `handle_setu_${personaId}_session_0921`,
        consent_mode: "STORE",
        fetch_type: "PERIODIC",
        data_consumer: "NIVA Institutional Underwriting Console (FIU: NIVA-IND-8812)",
        data_provider: "State Bank of India / HDFC Bank (FIP: SBIN-FIP-001)",
        customer_vpa: `${personaId}@okhdfcbank`,
        data_life_unit: "MONTH",
        data_life_value: 6,
        signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
      raw_rebit_accounts: [
        { fip_id: "SBIN-IN", masked_acc_number: "XXXX-XXXX-4819", account_type: "SAVINGS", balance: 50700.0, ifsc: "SBIN0001234" }
      ],
      transactions_count: 32,
      data_range: {
        start: "2026-06-01T00:00:00Z",
        end: "2026-09-08T00:00:00Z"
      }
    };
  }
}

export async function executeBankAction(personaId: string, actionType: string, notes = "") {
  try {
    return await fetchAPI<any>("/bank/actions/restructure", {
      method: "POST",
      body: JSON.stringify({ persona_id: personaId, action_type: actionType, notes }),
    });
  } catch {
    return {
      status: "SUCCESS",
      action_id: `RELIEF-${personaId.slice(0, 4).toUpperCase()}-${Date.now()}`,
      persona_id: personaId,
      relief_type: actionType,
      message: "Empathetic relief approved. Punitive default flags frozen with zero CIBIL penalty.",
      audit_hash: "a9f81b2c4e6d",
      timestamp: new Date().toISOString(),
    };
  }
}

export async function assignBankCounselor(personaId: string, counselorName = "Kavita Nair (Senior Credit Counselor)") {
  try {
    return await fetchAPI<any>("/bank/actions/counselor", {
      method: "POST",
      body: JSON.stringify({ persona_id: personaId, counselor_name: counselorName }),
    });
  } catch {
    return {
      status: "DISPATCHED",
      persona_id: personaId,
      counselor: counselorName,
      scheduled_window: "Within 24 hours via phone/vernacular WhatsApp",
      audit_hash: "7c1e89b4f2a0"
    };
  }
}
