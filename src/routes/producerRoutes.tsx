import { lazy } from "react";
import ProtectedProducerRoute from "@/components/auth/ProtectedProducerRoute";
import { Route } from "react-router-dom";
import { renderLazyRoute } from "./renderLazyRoute";

const ProducerDashboard = lazy(() => import("@/pages/producer/Dashboard"));
const UploadBeat = lazy(() => import("@/pages/producer/UploadBeat"));
const ProducerBeats = lazy(() => import("@/pages/producer/Beats"));
const Earnings = lazy(() => import("@/pages/producer/Earnings"));
const ProducerSettings = lazy(() => import("@/pages/producer/Settings"));

export function getProducerRoutes() {
  return (
    <>
      <Route
        path="/producer/dashboard"
        element={<ProtectedProducerRoute>{renderLazyRoute(ProducerDashboard)}</ProtectedProducerRoute>}
      />
      <Route
        path="/producer/upload"
        element={<ProtectedProducerRoute>{renderLazyRoute(UploadBeat)}</ProtectedProducerRoute>}
      />
      <Route
        path="/producer/beats"
        element={<ProtectedProducerRoute>{renderLazyRoute(ProducerBeats)}</ProtectedProducerRoute>}
      />
      <Route
        path="/producer/earnings"
        element={<ProtectedProducerRoute>{renderLazyRoute(Earnings)}</ProtectedProducerRoute>}
      />
      <Route
        path="/producer/settings"
        element={<ProtectedProducerRoute>{renderLazyRoute(ProducerSettings)}</ProtectedProducerRoute>}
      />
    </>
  );
}
