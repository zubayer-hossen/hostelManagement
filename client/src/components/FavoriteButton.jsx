import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { roomsApi } from '../api/rooms.js';
import { getErrorMessage } from '../utils/errors.js';

export default function FavoriteButton({ roomId, active, onChange, className = '' }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login', { state: { from: { pathname: `/rooms/${roomId}` } } }); return; }
    setBusy(true);
    try {
      if (active) await roomsApi.removeFavorite(roomId); else await roomsApi.addFavorite(roomId);
      onChange?.(!active);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={active} aria-label={active ? t('rooms.removeFavorite') : t('rooms.addFavorite')}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow backdrop-blur transition hover:scale-110 dark:bg-slate-900/80 ${className}`}>
      <Heart size={18} className={active ? 'fill-red-500 text-red-500' : 'text-slate-500'} />
    </button>
  );
}
