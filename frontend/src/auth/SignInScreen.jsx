import { useAuth0 } from "@auth0/auth0-react";

export default function SignInScreen() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-sm">
          <div className="text-2xl font-semibold text-gray-900">Din-Dins</div>
          <div className="mt-1 text-sm text-gray-600">
            Sign in to view recipes and build meal plans.
          </div>

          <button
            onClick={() => loginWithRedirect()}
            className="mt-5 w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm active:opacity-80"
          >
            Continue
          </button>

          <div className="mt-3 text-xs text-gray-500">
            Uses Auth0 (Google sign-in works great).
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          Tip: in dev you can set <span className="font-mono">VITE_AUTH_ENABLED=false</span>
        </div>
      </div>
    </div>
  );
}
