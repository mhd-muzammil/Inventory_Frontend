import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === "manager") {
    const path = location.pathname;

    // Block Managers from accessing admin-only user/manager management sections
    if (path === "/users" || path === "/managers") {
      return <Navigate to="/" replace />;
    }

    // List of checkable exact paths corresponding to sidebar tabs
    const pathMapping: Record<string, string> = {
      "/": "/",
      "/customers": "/customers",
      "/cso-entry": "/cso-entry",
      "/engineers": "/engineers",
      "/quotation": "/quotation",
      "/part-request": "/part-request",
      "/invoice": "/invoice",
      "/stock": "/stock",
      "/hp-stock": "/hp-stock",
      "/buffer": "/buffer",
      "/purchase-order": "/purchase-order",
      "/reports": "/reports",
      "/activity-charges": "/activity-charges",
      "/settings": "/settings",
    };

    // If it's a primary section path, check if it's explicitly allowed
    if (pathMapping[path] !== undefined) {
      const allowed = user.allowed_sections || [];
      if (!allowed.includes(pathMapping[path])) {
        // Find a fallback allowed path or default to home/settings
        const fallback = allowed.includes("/") ? "/" : (allowed[0] || "/settings");
        return <Navigate to={fallback} replace />;
      }
    }

    // Special verification for ticket details (requires CSO entry or Part Request permissions)
    if (path.startsWith("/tickets/")) {
      const allowed = user.allowed_sections || [];
      const hasAccess = allowed.includes("/cso-entry") || allowed.includes("/part-request");
      if (!hasAccess) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
