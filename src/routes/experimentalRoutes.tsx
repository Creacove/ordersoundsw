import { lazy } from "react";
import { Route } from "react-router-dom";
import { renderLazyRoute } from "./renderLazyRoute";

const Sandbox = lazy(() => import("@/pages/Sandbox"));
const ProposalMocksLayout = lazy(() => import("@/pages/temp-proposal-mocks/ProposalMocksLayout"));

export function getExperimentalRoutes() {
  return (
    <>
      <Route
        path="/sandbox"
        element={renderLazyRoute(Sandbox)}
      />
      <Route
        path="/proposal-mocks"
        element={renderLazyRoute(ProposalMocksLayout)}
          message: "Loading Proposal Mocks...",
          variant: "inline",
        })}
      />
    </>
  );
}
