import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { useAuth0 } from "@auth0/auth0-react";
import RecipeWizard from "./RecipeWizard";

export default function EditRecipe() {
  const { apiFetch } = useApi();
  const { id } = useParams();
  const navigate = useNavigate();

  const authEnabled = import.meta.env.VITE_AUTH_ENABLED === "true";
  const auth0 = authEnabled ? useAuth0() : null; // ✅ safe because it won't run when disabled
  const getAccessTokenSilently = auth0?.getAccessTokenSilently;

  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);

  async function withAuthHeaders(extra = {}) {
    if (!authEnabled || !getAccessTokenSilently) return extra;
    const token = await getAccessTokenSilently();
    return { ...extra, Authorization: `Bearer ${token}` };
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const headers = await withAuthHeaders();
        const res = await apiFetch(`/api/v1/recipes/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        if (!ignore) setInitial(data.item || null);
      } catch {
        if (!ignore) setInitial(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id]); // intentionally NOT including auth deps to avoid rerun loops

  const onSave = async (recipePayload) => {
    const headers = await withAuthHeaders({
      "Content-Type": "application/json",
    });

    const res = await apiFetch(`/api/v1/recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(recipePayload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update recipe");
    }

    navigate(`/recipes/${id}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md text-sm text-gray-600">Loading…</div>
    );
  }

  if (!initial) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-600">
          Recipe not found.
        </div>
        <Link to="/recipes" className="text-sm font-semibold text-blue-600">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  return (
    <RecipeWizard mode="edit" initialRecipe={initial} onSubmitRecipe={onSave} />
  );
}
