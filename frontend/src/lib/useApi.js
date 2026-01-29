import { useAuth0 } from "@auth0/auth0-react";

export function useApi() {
  const authEnabled = import.meta.env.VITE_AUTH_ENABLED === "true";
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const isFormData = options.body instanceof FormData;

    // Attach token only when auth is enabled
    if (authEnabled) {
      if (!isAuthenticated) throw new Error("Not authenticated");
      const token = await getAccessTokenSilently();
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Only set JSON content-type when we're not sending FormData
    if (!headers.has("Content-Type") && options.body && !isFormData) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(path, { ...options, headers });
  }

  return { apiFetch };
}
