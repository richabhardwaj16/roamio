const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function buildHeaders(token, extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function request(path, { method = "GET", token, body, headers } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export const backendApi = {
  baseUrl: API_BASE_URL,
  syncFirebaseProfile(payload) {
    return request("/api/profile/firebase-sync", { method: "POST", body: payload });
  },
  getFirebaseProfile(firebaseUid) {
    return request(`/api/profile/firebase/${firebaseUid}`);
  },
  updateFirebaseProfile(firebaseUid, payload) {
    return request(`/api/profile/firebase/${firebaseUid}`, { method: "PUT", body: payload });
  },
  getDiscoverProfilesByFirebase(firebaseUid) {
    return request(`/api/profile/firebase/discover/${firebaseUid}`);
  },
  getHealth() {
    return request("/api/health");
  },
};
