import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";
import { renderLazyRoute } from "./renderLazyRoute";

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

export function getAdminRoutes() {
  return (
    <>
      <Route
        path="/admin"
        element={(
          <ProtectedAdminRoute>
            {renderLazyRoute(AdminDashboard)}
          </ProtectedAdminRoute>
        )}
      />
    </>
  );
}
