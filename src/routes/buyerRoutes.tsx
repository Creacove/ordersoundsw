import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { renderLazyRoute } from "./renderLazyRoute";

const Cart = lazy(() => import("@/pages/buyer/Cart"));
const Library = lazy(() => import("@/pages/buyer/Library"));
const Orders = lazy(() => import("@/pages/buyer/Orders"));
const Settings = lazy(() => import("@/pages/user/Settings"));
const InviteAndEarn = lazy(() => import("@/pages/referrals/InviteAndEarn"));

export function getBuyerRoutes() {
  return (
    <>
      <Route path="/cart" element={renderLazyRoute(Cart)} />
      <Route path="/settings" element={renderLazyRoute(Settings)} />
      <Route path="/referrals" element={renderLazyRoute(InviteAndEarn)} />
      <Route path="/invite" element={<Navigate to="/referrals" replace />} />
      <Route path="/library" element={renderLazyRoute(Library)} />
      <Route path="/buyer/library" element={<Navigate to="/library" replace />} />
      <Route path="/favorites" element={renderLazyRoute(Library)} />
      <Route path="/purchased" element={<Navigate to="/library" replace />} />
      <Route path="/my-playlists" element={renderLazyRoute(Library)} />
      <Route path="/my-playlists/:playlistId" element={renderLazyRoute(Library)} />
      <Route path="/orders" element={renderLazyRoute(Orders)} />
    </>
  );
}
