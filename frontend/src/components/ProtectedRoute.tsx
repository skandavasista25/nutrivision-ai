import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spinner } from "./ui";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Login, signup and forgot-password: logged-in users go to the dashboard. */
export function PublicRoute() {
  const { user, loading, registering } = useAuth();
  if (loading) return <Spinner full />;
  return user && !registering ? <Navigate to="/" replace /> : <Outlet />;
}
