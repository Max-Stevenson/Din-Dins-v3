import React, { useEffect, useMemo, useState } from "react";
import { useApiClient } from "../../api/client";
import { useToast } from "../../ui/toast";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { emptyRecipe, steps } from "./constants";
import StepPill from "./components/StepPill";

import BasicStep from "./steps/BasicStep";
import IngredientsStep from "./steps/IngredientsStep";
import MethodStep from "./steps/MethodStep";
import PhotoStep from "./steps/PhotoStep";
import ReviewStep from "./steps/ReviewStep";

import { uploadRecipeImage } from "./utils/uploadRecipeImage";

function normalizeForForm(initial) {
  if (!initial) return emptyRecipe;

  return {
    ...emptyRecipe,
    // Keep anything you may add later on emptyRecipe (like image)
    name: initial.name ?? "",
    protein: initial.protein ?? "",
    portions: Number(initial.portions ?? 1),
    cookTime: initial.cookTime ?? "",
    // In DB this is an array; in the form we store as comma-separated string
    tags: Array.isArray(initial.tags)
      ? initial.tags.join(", ")
      : (initial.tags ?? ""),
    ingredients:
      Array.isArray(initial.ingredients) && initial.ingredients.length
        ? initial.ingredients.map((i) => ({
            quantity: i?.quantity ?? "",
            unit: i?.unit ?? "",
            name: i?.name ?? "",
          }))
        : emptyRecipe.ingredients,
    method:
      Array.isArray(initial.method) && initial.method.length
        ? initial.method.map((s) => ({ text: s?.text ?? "" }))
        : emptyRecipe.method,
    imageUrl: initial.imageUrl ?? "",
    imagePublicId: initial.imagePublicId ?? "",
    image: null,
  };
}

export default function RecipeForm({
  mode = "create", // "create" | "edit"
  initialRecipe = null,
  onSubmitRecipe = null, // optional override (used by EditRecipe wrapper)
}) {
  const api = useApiClient();
  const toast = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  const [recipe, setRecipe] = useState(() =>
    mode === "edit" ? normalizeForForm(initialRecipe) : emptyRecipe,
  );

  // If initialRecipe arrives async (edit page fetch), update form state once.
  useEffect(() => {
    if (mode !== "edit") return;
    if (!initialRecipe) return;

    setRecipe(normalizeForForm(initialRecipe));
    setStepIndex(0);
  }, [mode, initialRecipe]);

  const imageUrl = useMemo(() => {
    if (recipe.image) return URL.createObjectURL(recipe.image); // local preview
    return recipe.imageUrl || ""; // existing Cloudinary image (edit mode)
  }, [recipe.image, recipe.imageUrl]);

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index][field] = value;
    setRecipe({ ...recipe, ingredients: updatedIngredients });
  };

  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [
        ...recipe.ingredients,
        { quantity: "", unit: "", name: "" },
      ],
    });
  };

  const removeIngredient = (index) => {
    const updated = recipe.ingredients.filter((_, i) => i !== index);
    setRecipe({
      ...recipe,
      ingredients: updated.length ? updated : recipe.ingredients,
    });
  };

  const handleMethodChange = (index, value) => {
    const updated = [...recipe.method];
    updated[index] = { ...updated[index], text: value };
    setRecipe({ ...recipe, method: updated });
  };

  const addMethodStep = () => {
    setRecipe({
      ...recipe,
      method: [...recipe.method, { text: "" }],
    });
  };

  const removeMethodStep = (index) => {
    const updated = recipe.method.filter((_, i) => i !== index);
    setRecipe({
      ...recipe,
      method: updated.length ? updated : recipe.method,
    });
  };

  const currentStep = steps[stepIndex];

  const basicsValid =
    recipe.name.trim().length > 0 &&
    recipe.protein.trim().length > 0 &&
    Number(recipe.portions) > 0;

  const ingredientsValid = recipe.ingredients.some(
    (i) => (i?.name || "").trim().length > 0,
  );

  const methodValid = recipe.method.some(
    (s) => (s?.text || "").trim().length > 0,
  );

  const canGoNext =
    (currentStep.key === "basics" && basicsValid) ||
    (currentStep.key === "ingredients" && ingredientsValid) ||
    (currentStep.key === "method" && methodValid) ||
    currentStep.key === "photo" ||
    currentStep.key === "review";

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNext = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1));

  const reset = () => {
    // In edit mode, reset back to the loaded recipe rather than empty
    if (mode === "edit") {
      setRecipe(normalizeForForm(initialRecipe));
      setStepIndex(0);
      return;
    }
    setRecipe(emptyRecipe);
    setStepIndex(0);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const tagsArray = String(recipe.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    let imageUrlToSave = recipe.imageUrl || "";
    let imagePublicIdToSave = recipe.imagePublicId || "";

    if (recipe.image) {
      const uploaded = await uploadRecipeImage(api, recipe.image);
      imageUrlToSave = uploaded.url;
      imagePublicIdToSave = uploaded.publicId;
    }

    const payload = {
      name: recipe.name,
      protein: recipe.protein,
      portions: Number(recipe.portions),
      cookTime: recipe.cookTime,
      tags: tagsArray,
      ingredients: recipe.ingredients,
      method: recipe.method,
      imageUrl: imageUrlToSave,
      imagePublicId: imagePublicIdToSave,
    };

    try {
      // If parent passes submit handler (edit wrapper), use it
      if (typeof onSubmitRecipe === "function") {
        await onSubmitRecipe(payload);
        return;
      }

      // Default create behavior
      const res = await api.recipes.create(payload);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save recipe");
      }

      reset();
      toast.success("Saved");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={reset}
          className="text-sm font-semibold text-gray-600 active:opacity-70"
        >
          {mode === "edit" ? "Reset" : "Cancel"}
        </button>

        <div className="text-sm font-semibold text-gray-900">
          {mode === "edit" ? "Edit Recipe" : "New Recipe"}
        </div>

        {currentStep.key === "review" ? (
          <button
            form="recipeWizard"
            type="submit"
            className="text-sm font-semibold text-green-700 active:opacity-70"
          >
            Save
          </button>
        ) : (
          <span className="w-12" />
        )}
      </div>

      {/* Step pills */}
      <div className="flex flex-wrap gap-2">
        {steps.map((s, idx) => (
          <StepPill
            key={s.key}
            active={idx === stepIndex}
            done={idx < stepIndex}
          >
            {s.label}
          </StepPill>
        ))}
      </div>

      <form id="recipeWizard" onSubmit={onSubmit} className="space-y-4">
        {currentStep.key === "basics" && (
          <BasicStep
            recipe={recipe}
            setRecipe={setRecipe}
            basicsValid={basicsValid}
          />
        )}

        {currentStep.key === "ingredients" && (
          <IngredientsStep
            recipe={recipe}
            handleIngredientChange={handleIngredientChange}
            addIngredient={addIngredient}
            removeIngredient={removeIngredient}
            ingredientsValid={ingredientsValid}
          />
        )}

        {currentStep.key === "method" && (
          <MethodStep
            recipe={recipe}
            handleMethodChange={handleMethodChange}
            addMethodStep={addMethodStep}
            removeMethodStep={removeMethodStep}
            methodValid={methodValid}
          />
        )}

        {currentStep.key === "photo" && (
          <PhotoStep
            recipe={recipe}
            setRecipe={setRecipe}
            imageUrl={imageUrl}
          />
        )}

        {currentStep.key === "review" && (
          <ReviewStep recipe={recipe} imageUrl={imageUrl} />
        )}

        {/* Bottom nav */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 disabled:opacity-40 disabled:cursor-not-allowed active:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext || stepIndex === steps.length - 1}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:opacity-80"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
