/**
 * NIVA — API Client
 * Centralized API calls to the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeader(): Record<string,string> {
  if (typeof window==="undefined") return {};
  const t = localStorage.getItem("niva_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options?.headers,
    },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

// ── Auth Endpoints ───────────────────────────────────────────
export async function sendOtp(phone:string){ return fetchAPI<any>("/auth/send-otp",{method:"POST",body:JSON.stringify({phone})});}
export async function verifyOtpNew(phone:string, otp:string){
  const res = await fetchAPI<any>("/auth/verify-otp",{method:"POST",body:JSON.stringify({phone,otp})});
  if(res.access_token) localStorage.setItem("niva_token", res.access_token);
  return res;
}
export async function getMe(){ return fetchAPI<any>("/auth/me");}
export async function resetDemo(){ return fetchAPI<any>("/demo/reset",{method:"POST"});}
export async function getPots(personaId:string){ return fetchAPI<any>(`/pots/${personaId}`);}
export async function sweepPot(personaId:string, amount:number, to_pot="Emergency"){ return fetchAPI<any>("/pots/sweep",{method:"POST",body:JSON.stringify({persona_id:personaId, amount, to_pot})});}
export async function releasePot(personaId:string, amount:number, from_pot="Dukaan Stock"){ return fetchAPI<any>("/pots/release",{method:"POST",body:JSON.stringify({persona_id:personaId, amount, from_pot})});}
export async function createPot(personaId:string, name:string, target:number, initial_balance=0, auto_sweep_pct=10, icon="🏺"){
  return fetchAPI<any>("/pots/create", {method:"POST", body:JSON.stringify({persona_id:personaId, name, target, initial_balance, auto_sweep_pct, icon})});
}
export async function deletePot(personaId:string, potId:string){
  return fetchAPI<any>(`/pots/${personaId}/${potId}`, {method:"DELETE"});
}
export async function runPotsAutopilot(personaId:string){
  return fetchAPI<any>(`/pots/autopilot/${personaId}`, {method:"POST"});
}
export async function ingestSms(personaId:string, sms_text:string){ return fetchAPI<any>("/sms/ingest",{method:"POST",body:JSON.stringify({persona_id: personaId, sms_text})});}
export async function getPortfolio(){ return fetchAPI<any>("/portfolio/overview");}
export async function getBureauLag(personaId:string){ return fetchAPI<any>(`/portfolio/bureau-lag/${personaId}`);}
export async function getSubscriptions(personaId:string){ return fetchAPI<any>(`/subscriptions/${personaId}`);}

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

export async function uploadBankStatement(file: File, personaId = "custom_user", fullName = "", phone = "+91 98980 12345", password = "") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("persona_id", personaId);
  if (fullName) formData.append("full_name", fullName);
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
  return await fetchAPI<any>(`/twin/${personaId}/spending-analysis`);
}

export async function simulateStress(personaId: string, shockAmount: number, incomeDropPct: number, shockCategory = "medical") {
  return await fetchAPI<any>(`/twin/${personaId}/simulate-stress`, {
    method: "POST",
    body: JSON.stringify({ shock_amount: shockAmount, income_drop_pct: incomeDropPct, shock_category: shockCategory }),
  });
}

export async function getGatePolicies() {
  return await fetchAPI<any>("/bank/gate-policies");
}

export async function getRebitTelemetry(personaId: string) {
  return await fetchAPI<any>(`/bank/rebit-telemetry/${personaId}`);
}

export async function executeBankAction(personaId: string, actionType: string, notes = "") {
  return await fetchAPI<any>("/bank/actions/restructure", {
    method: "POST",
    body: JSON.stringify({ persona_id: personaId, action_type: actionType, notes }),
  });
}

export async function assignBankCounselor(personaId: string, counselorName = "Kavita Nair (Senior Credit Counselor)") {
  return await fetchAPI<any>("/bank/actions/counselor", {
    method: "POST",
    body: JSON.stringify({ persona_id: personaId, counselor_name: counselorName }),
  });
}
