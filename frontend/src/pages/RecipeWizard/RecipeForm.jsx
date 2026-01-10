import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { emptyRecipe, steps } from "./constants";
import StepPill from "./components/StepPill";

import BasicsStep from "./steps/BasicStep";
import IngredientsStep from "./steps/IngredientsStep";
import PhotoStep from "./steps/PhotoStep";
import ReviewStep from "./steps/ReviewStep";

export default function RecipeForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [recipe, setRecipe] = useState(emptyRecipe);

  const imageUrl = useMemo(() => {
    if (!recipe.image) return "";
    return URL.createObjectURL(recipe.image);
  }, [recipe.image]);

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

  const currentStep = steps[stepIndex];

  // validation per step
  const basicsValid =
    recipe.name.trim().length > 0 &&
    recipe.protein.trim().length > 0 &&
    Number(recipe.portions) > 0;

  const ingredientsValid = recipe.ingredients.some(
    (i) => i.name.trim().length > 0
  );

  const canGoNext =
    (currentStep.key === "basics" && basicsValid) ||
    (currentStep.key === "ingredients" && ingredientsValid) ||
    currentStep.key === "photo" ||
    currentStep.key === "review";

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNext = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1));

  const reset = () => {
    setRecipe(emptyRecipe);
    setStepIndex(0);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting recipe:", recipe);
    reset();
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
          Cancel
        </button>

        <div className="text-sm font-semibold text-gray-900">New Recipe</div>

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
          <BasicsStep
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
