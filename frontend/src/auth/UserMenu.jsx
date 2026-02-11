import { useAuth0 } from "@auth0/auth0-react";
import { authEnabled } from "./authEnabled";

export default function UserMenu() {
  if (!authEnabled) return null;

  const { user, logout } = useAuth0();

  return (
    <button
      type="button"
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/5 active:opacity-80"
      title={user?.email || user?.name || ""}
    >
      <span className="truncate max-w-[10rem]">
        {user?.nickname || user?.name || "Account"}
      </span>
      <span className="text-gray-400">·</span>
      <span className="text-red-600">Logout</span>
    </button>
  );
}
