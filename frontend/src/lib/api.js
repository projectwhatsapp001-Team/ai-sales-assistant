// frontend/src/lib/api.js
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL && import.meta.env.PROD) {
  console.error("VITE_API_URL is not set. API calls will fail in production.");
}

const BASE = API_URL || "";

async function getAuthHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw new Error("Failed to get session");
  if (!session?.access_token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function request(method, endpoint, body = null, retry = true) {
  try {
    const headers = await getAuthHeaders();
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}/api${endpoint}`, opts);

    // Token expired — try refreshing once
    if (res.status === 401 && retry) {
      const {
        data: { session },
      } = await supabase.auth.refreshSession();
      if (session) return request(method, endpoint, body, false);
      throw new Error("Session expired. Please log in again.");
    }

    if (res.status === 402) {
      throw new Error("Subscription required");
    }

    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`;
      try {
        const json = await res.json();
        if (json?.error) errMsg = json.error;
      } catch (_) {}
      throw new Error(errMsg);
    }

    try {
      return await res.json();
    } catch {
      throw new Error("Invalid response from server");
    }
  } catch (err) {
    console.error(`${method} /api${endpoint}:`, err.message);
    throw err;
  }
}

export const apiGet = (ep) => request("GET", ep);
export const apiPost = (ep, data) => request("POST", ep, data);
export const apiPatch = (ep, data) => request("PATCH", ep, data);
export const apiPut = (ep, data) => request("PUT", ep, data);
export const apiDelete = (ep) => request("DELETE", ep);

// SSE stream URL — token passed in Authorization header via a one-time token exchange
// To avoid token in URL, we use a short-lived stream token from the session
export async function getStreamUrl(message, customerId) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  // Pass token via header is not possible with EventSource (browser limitation).
  // Mitigation: access_token is short-lived (1hr) and HTTPS encrypts the URL.
  // This is the accepted pattern for SSE with JWT auth.
  const params = new URLSearchParams({
    message: message.trim(),
    customerId: customerId,
  });
  return `${BASE}/api/stream?${params}`;
}

// Return headers for EventSource workaround — use fetch-based SSE instead of native EventSource
export async function getStreamHeaders() {
  return getAuthHeaders();
}

export default {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  put: apiPut,
  delete: apiDelete,
};
