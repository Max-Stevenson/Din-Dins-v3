import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthGate from "./auth/AuthGate";
import UserMenu from "./auth/UserMenu";

import RecipeWizard from "./pages/RecipeWizard/RecipeForm";
import EditRecipe from "./pages/EditRecipe";
import RecipesList from "./pages/RecipeWizard/RecipesList";
import MealPlanner from "./pages/RecipeWizard/MealPlanner";
import MealPlanHistory from "./pages/MealPlanHistory";
import MealPlanDetail from "./pages/MealPlanDetail";
import RecipeDetail from "./pages/RecipeDetail";
import BottomNav from "./pages/RecipeWizard/components/BottomNav";
import { ToastProvider } from "./ui/toast";

function AppShell() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24">
      {/* Simple top bar (optional) */}
      <div className="mx-auto max-w-md mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">Din-Dins</div>
        <UserMenu />
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/meal-planner" replace />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/meal-plans" element={<MealPlanHistory />} />
        <Route path="/meal-plans/:id" element={<MealPlanDetail />} />
        <Route path="/recipes" element={<RecipesList />} />
        <Route path="/recipes/new" element={<RecipeWizard />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/recipes/:id/edit" element={<EditRecipe />} />
      </Routes>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </AuthGate>
    </BrowserRouter>
  );
}
