import { useMemo } from "react";
import { useApi } from "../lib/useApi";

export function createApiClient(apiFetch) {
  return {
    recipes: {
      list() {
        return apiFetch("/api/v1/recipes");
      },
      getById(id) {
        return apiFetch(`/api/v1/recipes/${id}`);
      },
      create(payload) {
        return apiFetch("/api/v1/recipes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
      update(id, payload) {
        return apiFetch(`/api/v1/recipes/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      },
      remove(id) {
        return apiFetch(`/api/v1/recipes/${id}`, {
          method: "DELETE",
        });
      },
    },
    mealPlans: {
      list() {
        return apiFetch("/api/v1/meal-plans");
      },
      getById(id) {
        return apiFetch(`/api/v1/meal-plans/${id}`);
      },
      generate(payload) {
        return apiFetch("/api/v1/meal-plans/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      },
      create(payload) {
        return apiFetch("/api/v1/meal-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      },
    },
    uploads: {
      uploadRecipeImage(file) {
        const form = new FormData();
        form.append("file", file);

        return apiFetch("/api/v1/uploads/recipe-image", {
          method: "POST",
          body: form,
        });
      },
    },
  };
}

export function useApiClient() {
  const { apiFetch } = useApi();
  return useMemo(() => createApiClient(apiFetch), [apiFetch]);
}
