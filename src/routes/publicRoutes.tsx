import { lazy } from "react";
import { Route } from "react-router-dom";
import { PlaylistRedirect } from "./PlaylistRedirect";
import { renderLazyRoute } from "./renderLazyRoute";

const Home = lazy(() => import("@/pages/buyer/Home"));
const Trending = lazy(() => import("@/pages/buyer/Trending"));
const New = lazy(() => import("@/pages/buyer/New"));
const GamingSoundtrack = lazy(() => import("@/pages/buyer/GamingSoundtrack"));
const Playlists = lazy(() => import("@/pages/buyer/Playlists"));
const Genres = lazy(() => import("@/pages/buyer/Genres"));
const Producers = lazy(() => import("@/pages/buyer/Producers"));
const Charts = lazy(() => import("@/pages/buyer/Charts"));
const Search = lazy(() => import("@/pages/buyer/Search"));
const Contact = lazy(() => import("@/pages/Contact"));
const BuyerProfile = lazy(() => import("@/pages/buyer/BuyerProfile"));
const ProducerProfile = lazy(() => import("@/pages/producer/ProducerProfile"));
const BeatDetail = lazy(() => import("@/pages/buyer/BeatDetail"));
const SoundpackDetail = lazy(() => import("@/pages/buyer/SoundpackDetail"));
const Licenses = lazy(() => import("@/pages/Licenses"));
const Animations = lazy(() => import("@/pages/Animations"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const AuthCallback = lazy(() => import("@/pages/auth/Callback"));
const ProducerActivation = lazy(() => import("@/pages/auth/ProducerActivation"));

export function getPublicRoutes() {
  return (
    <>
      <Route path="/" element={renderLazyRoute(Home)} />
      <Route path="/trending" element={renderLazyRoute(Trending)} />
      <Route path="/new" element={renderLazyRoute(New)} />
      <Route path="/gaming-soundtrack" element={renderLazyRoute(GamingSoundtrack)} />
      <Route path="/playlists" element={renderLazyRoute(Playlists)} />
      <Route path="/playlists/:playlistId" element={renderLazyRoute(Playlists)} />
      <Route path="/playlist/:playlistId" element={<PlaylistRedirect />} />
      <Route path="/genres" element={renderLazyRoute(Genres)} />
      <Route path="/producers" element={renderLazyRoute(Producers)} />
      <Route path="/charts" element={renderLazyRoute(Charts)} />
      <Route path="/search" element={renderLazyRoute(Search)} />
      <Route path="/contact" element={renderLazyRoute(Contact)} />
      <Route path="/beat/:beatId" element={renderLazyRoute(BeatDetail)} />
      <Route path="/soundpack/:soundpackId" element={renderLazyRoute(SoundpackDetail)} />
      <Route path="/licenses" element={renderLazyRoute(Licenses)} />
      <Route path="/buyer/:buyerId" element={renderLazyRoute(BuyerProfile)} />
      <Route path="/producer/:producerId" element={renderLazyRoute(ProducerProfile)} />
      <Route path="/login" element={renderLazyRoute(Login)} />
      <Route path="/signup" element={renderLazyRoute(Signup)} />
      <Route path="/reset-password" element={renderLazyRoute(ResetPassword)} />
      <Route path="/auth/callback" element={renderLazyRoute(AuthCallback)} />
      <Route path="/producer-activation" element={renderLazyRoute(ProducerActivation)} />
      <Route path="/animations" element={renderLazyRoute(Animations)} />
    </>
  );
}
