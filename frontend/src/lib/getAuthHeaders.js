export async function getAuthHeaders(getAccessTokenSilently) {
  const authEnabled = import.meta.env.VITE_AUTH_ENABLED === "true";
  if (!authEnabled) return {};
  const token = await getAccessTokenSilently();
  return { Authorization: `Bearer ${token}` };
}
