/**
 * NIVA — API Client
 * Centralized API calls to the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("niva_auth_token");
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("niva_auth_token", token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("niva_auth_token");
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

// ── Auth & Journey Endpoints ─────────────────────────────────

export async function sendOtp(phone: string, personaId?: string) {
  return fetchAPI<any>("/journey/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone, persona_id: personaId }),
  });
}

export async function verifyOtp(phone: string, otp: string, personaId: string) {
  const res = await fetchAPI<any>("/journey/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, otp, persona_id: personaId }),
  });
  if (res.access_token) {
    setAuthToken(res.access_token);
  }
  return res;
}

export async function loginBankOfficer(officerId = "SBI-OFFICER-7891", pin = "889900") {
  const res = await fetchAPI<any>("/journey/login-bank-officer", {
    method: "POST",
    body: JSON.stringify({ officer_id: officerId, pin }),
  });
  if (res.access_token) {
    setAuthToken(res.access_token);
  }
  return res;
}

export async function getUserProfile(personaId: string) {
  return fetchAPI<any>(`/journey/profile/${encodeURIComponent(personaId)}`);
}

export async function updateUserProfile(personaId: string, profileData: any) {
  return fetchAPI<any>(`/journey/profile/${encodeURIComponent(personaId)}`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
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

// (verifyOtp defined above with auth token handling)

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
  return fetchAPI<any>(`/twin/${personaId}/spending-analysis`);
}

export async function simulateStress(personaId: string, shockAmount: number, incomeDropPct: number, shockCategory = "medical") {
  return fetchAPI<any>(`/twin/${personaId}/simulate-stress`, {
    method: "POST",
    body: JSON.stringify({ shock_amount: shockAmount, income_drop_pct: incomeDropPct, shock_category: shockCategory }),
  });
}

export async function getGatePolicies() {
  return fetchAPI<any>("/bank/gate-policies");
}

export async function getRebitTelemetry(personaId: string) {
  return fetchAPI<any>(`/bank/rebit-telemetry/${personaId}`);
}

export async function executeBankAction(personaId: string, actionType: string, notes = "") {
  return fetchAPI<any>("/bank/actions/restructure", {
    method: "POST",
    body: JSON.stringify({ persona_id: personaId, action_type: actionType, notes }),
  });
}

export async function assignBankCounselor(personaId: string, counselorName = "Kavita Nair (Senior Credit Counselor)") {
  return fetchAPI<any>("/bank/actions/counselor", {
    method: "POST",
    body: JSON.stringify({ persona_id: personaId, counselor_name: counselorName }),
  });
}

// ── Bank Schemes Management Endpoints ──────────

export async function getBankSchemes(activeOnly = false) {
  return fetchAPI<{ schemes: any[]; total: number }>(`/bank/schemes${activeOnly ? "?active_only=true" : ""}`);
}

export async function createBankScheme(schemeData: any) {
  return fetchAPI<any>("/bank/schemes", {
    method: "POST",
    body: JSON.stringify(schemeData),
  });
}

export async function updateBankScheme(schemeId: string, updates: any) {
  return fetchAPI<any>(`/bank/schemes/${schemeId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteBankScheme(schemeId: string) {
  return fetchAPI<any>(`/bank/schemes/${schemeId}`, {
    method: "DELETE",
  });
}

