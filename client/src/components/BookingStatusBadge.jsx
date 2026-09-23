import { useTranslation } from 'react-i18next';
import Badge from './ui/Badge.jsx';

const TONES = { pending: 'amber', on_hold: 'slate', approved: 'green', rejected: 'red', cancelled: 'slate', expired: 'slate', moved_in: 'primary', moved_out: 'slate' };

export default function BookingStatusBadge({ status }) {
  const { t } = useTranslation();
  return <Badge tone={TONES[status] || 'slate'}>{t(`bookings.status.${status}`)}</Badge>;
}
