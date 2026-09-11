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
