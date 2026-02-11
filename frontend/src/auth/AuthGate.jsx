import { useAuth0 } from "@auth0/auth0-react";
import { authEnabled } from "./authEnabled";
import SignInScreen from "./SignInScreen";

export default function AuthGate({ children }) {
  // If auth is off, just render the app
  if (!authEnabled) return children;

  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-gray-700">
          Loading…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <SignInScreen />;

  return children;
}
