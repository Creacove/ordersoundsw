import { Navigate, useParams } from "react-router-dom";

export function PlaylistRedirect() {
  const { playlistId } = useParams();

  if (!playlistId) {
    return <Navigate to="/playlists" replace />;
  }

  return <Navigate to={`/playlists/${playlistId}`} replace />;
}
