import { useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { useAuthStore } from "@/store/authStore";
import { getMe } from "@/api/auth";
import { canAccessSection, bypassesSectionCheck, fallbackPath } from "@/lib/sections";

// Managing users and permissions stays with the super admin.
const SUPER_ADMIN_ONLY = ["/users", "/managers"];

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const setUser = useAuthStore((s) => s.setUser);
  const location = useLocation();

  // The cached user is persisted from login, so permission changes an admin makes
  // would otherwise not reach them until they logged out and back in. Re-fetch once
  // per app load so a granted/revoked section takes effect on the next refresh.
  useEffect(() => {
    if (!isAuthenticated) return;
    getMe()
      .then(setUser)
      .catch(() => {
        /* offline or token refresh in flight — keep the cached user */
      });
  }, [isAuthenticated, setUser]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const path = location.pathname;

  if (SUPER_ADMIN_ONLY.includes(path) && user?.role !== "super_admin") {
    return <Navigate to={fallbackPath(user?.allowed_sections)} replace />;
  }

  // Section permissions apply to every role except the admins, who bypass.
  if (!bypassesSectionCheck(user?.role) && !canAccessSection(user, path)) {
    return <Navigate to={fallbackPath(user?.allowed_sections)} replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
