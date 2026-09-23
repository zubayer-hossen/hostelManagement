import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';

/** Logo + hostel name, both driven by Admin → Settings (nothing hard-coded). */
export default function BrandMark({ to = '/', compact = false, className = '' }) {
  const { settings } = useSettings();
  const { hostelName, logoUrl } = settings.general;
  return (
    <Link to={to} className={`flex items-center gap-2.5 font-bold text-slate-900 dark:text-white ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white shadow-glow">
          <Building2 size={20} />
        </span>
      )}
      {!compact && <span className="truncate text-lg">{hostelName}</span>}
    </Link>
  );
}
