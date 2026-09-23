import { useCallback, useEffect, useState } from 'react';
import { roomsApi } from '../api/rooms.js';
import { useAuth } from '../context/AuthContext.jsx';

/** Set of the signed-in user's favorite room ids, with a local updater so hearts respond instantly. */
export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthenticated) { setIds(new Set()); return undefined; }
    let cancelled = false;
    roomsApi.favoriteIds().then((res) => { if (!cancelled) setIds(new Set(res.data)); }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const setFavorite = useCallback((roomId, on) => {
    setIds((prev) => { const next = new Set(prev); if (on) next.add(roomId); else next.delete(roomId); return next; });
  }, []);

  return { ids, setFavorite };
}
