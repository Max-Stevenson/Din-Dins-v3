import { useState } from "react";
import RecipeForm from "./pages/RecipeWizard/RecipeForm";
import RecipesList from "./pages/RecipeWizard/RecipesList";

export default function App() {
  const [view, setView] = useState("list");

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-md mb-4 flex gap-2">
        <button
          className="px-3 py-2 rounded bg-white"
          onClick={() => setView("list")}
        >
          Recipes
        </button>
        <button
          className="px-3 py-2 rounded bg-white"
          onClick={() => setView("new")}
        >
          New
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 text-gray-900">
        <div className="mx-auto w-full max-w-md px-4 py-6">
          {view === "list" ? <RecipesList /> : <RecipeForm />}
        </div>
      </div>
    </div>
  );
}
