import NotFound from "@/pages/NotFound";
import { publicEnv } from "@/config/publicEnv";
import { Route, Routes } from "react-router-dom";
import { getAdminRoutes } from "./adminRoutes";
import { getBuyerRoutes } from "./buyerRoutes";
import { getExperimentalRoutes } from "./experimentalRoutes";
import { getProducerRoutes } from "./producerRoutes";
import { getPublicRoutes } from "./publicRoutes";
import { PersistentLayout } from "@/components/layout/PersistentLayout";

const enableExperimentalRoutes = publicEnv.isDev || publicEnv.enableExperimentalRoutes;

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PersistentLayout />}>
        {getPublicRoutes()}
        {getBuyerRoutes()}
        {getProducerRoutes()}
        {getAdminRoutes()}
        {enableExperimentalRoutes ? getExperimentalRoutes() : null}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
