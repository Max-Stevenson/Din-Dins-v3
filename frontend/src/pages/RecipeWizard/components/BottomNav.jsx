import { NavLink } from "react-router-dom";
import { CalendarDays, BookOpen, PlusCircle } from "lucide-react";

function Tab({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
          isActive
            ? "bg-blue-50 text-blue-600"
            : "text-gray-600 hover:bg-gray-50",
        ].join(" ")
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-md px-3 py-2">
        <div className="grid grid-cols-3 gap-2">
          <Tab to="/meal-planner" label="Plan" Icon={CalendarDays} />
          <Tab to="/recipes" label="Recipes" Icon={BookOpen} />
          <Tab to="/recipes/new" label="New" Icon={PlusCircle} />
        </div>
      </div>
    </nav>
  );
}
