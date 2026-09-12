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

export async function createConsent(phone: string) {
  return fetchAPI<any>("/aa/consents", {
    method: "POST",
    body: JSON.stringify({ phone, duration_months: 6 }),
  });
}

export async function approveConsent(consentId: string) {
  return fetchAPI<any>(`/aa/consents/${consentId}/approve`, { method: "POST" });
}

export async function fetchFIData(consentId: string, personaId: string) {
  return fetchAPI<any>(`/aa/fi-data/${consentId}?persona_id=${personaId}`);
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

export async function uploadBankStatement(file: File, personaId = "custom_user", fullName = "Kailash Verma", phone = "+91 98980 12345", password = "") {
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

export async function getMLModelMetrics() {
  return fetchAPI<any>("/ml/model-metrics");
}
