import { useTranslation } from 'react-i18next';
import Badge from './ui/Badge.jsx';

const TONES = { available: 'green', almost_full: 'amber', fully_booked: 'red', maintenance: 'slate', inactive: 'slate' };

/** BOOKED / LIMITED AVAILABILITY / AVAILABLE badge, so people do not waste time on unavailable rooms. */
export default function AvailabilityBadge({ status, availableBeds, className = '' }) {
  const { t } = useTranslation();
  const text = t(`rooms.availability.${status}`);
  return (
    <Badge tone={TONES[status] || 'slate'} className={`uppercase tracking-wide ${className}`}>
      {text}
      {status === 'almost_full' && typeof availableBeds === 'number' && ` · ${t('rooms.bedsLeft', { count: availableBeds })}`}
    </Badge>
  );
}
