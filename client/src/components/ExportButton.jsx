import { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Button from './ui/Button.jsx';
import { api } from '../api/client.js';
import { saveBlob } from '../utils/download.js';
import { getErrorMessage } from '../utils/errors.js';

/** Downloads GET /exports/:type as a CSV file (same permission as the screen it sits on). `params` = current filters. */
export default function ExportButton({ type, params = {} }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await api.get(`/exports/${type}`, { params, responseType: 'blob', timeout: 120000 });
      saveBlob(res.data, `${type}-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      // a failed blob request carries the JSON error as a Blob
      let message = getErrorMessage(err);
      try { message = JSON.parse(await err.response.data.text()).message || message; } catch { /* keep the generic message */ }
      toast.error(message);
    } finally { setBusy(false); }
  };

  return <Button variant="secondary" loading={busy} onClick={run}><Download size={16} />{t('export.csv')}</Button>;
}
