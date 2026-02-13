import { useAuth0 } from "@auth0/auth0-react";

export function useApi() {
  const authEnabled = import.meta.env.VITE_AUTH_ENABLED === "true";
  const apiBase = import.meta.env.VITE_API_BASE || "";
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const isFormData = options.body instanceof FormData;

    if (authEnabled) {
      if (!isAuthenticated) throw new Error("Not authenticated");

      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });

      // IMPORTANT: token must be raw "eyJ..." (no "Bearer " inside it)
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!headers.has("Content-Type") && options.body && !isFormData) {
      headers.set("Content-Type", "application/json");
    }

    const isAbsolute = /^https?:\/\//i.test(path);
    let url = path;
    if (!isAbsolute && apiBase) {
      url = `${apiBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    }

    return fetch(url, { ...options, headers });
  }

  return { apiFetch };
}
