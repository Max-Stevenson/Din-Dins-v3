import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RecipeWizard from "./pages/RecipeWizard/RecipeForm";
import RecipesList from "./pages/RecipeWizard/RecipesList";
import MealPlanner from "./pages/RecipeWizard/MealPlanner";
import MealPlanHistory from "./pages/MealPlanHistory";
import MealPlanDetail from "./pages/MealPlanDetail";
import RecipeDetail from "./pages/RecipeDetail";
import BottomNav from "./pages/RecipeWizard/components/BottomNav";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/meal-planner" replace />} />
          <Route path="/meal-planner" element={<MealPlanner />} />
          <Route path="/meal-plans" element={<MealPlanHistory />} />
          <Route path="/meal-plans/:id" element={<MealPlanDetail />} />
          <Route path="/recipes" element={<RecipesList />} />
          <Route path="/recipes/new" element={<RecipeWizard />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
