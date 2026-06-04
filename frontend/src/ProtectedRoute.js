import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "./authStore";

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the nested child route
  return <Outlet />;
}
