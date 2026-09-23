import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

/** "Are you sure?" dialog. `onConfirm` may be async; the button shows a spinner meanwhile. `withReason` adds an optional text box. */
export default function ConfirmDialog({ open, title, message, confirmLabel, danger = false, withReason = false, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');

  const run = async () => {
    setBusy(true);
    try {
      await onConfirm(withReason ? reason.trim() : undefined);
      setReason('');
      onClose();
    } catch { /* the caller shows the error toast; keep the dialog open */ } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {withReason && (
        <div className="mt-4">
          <label htmlFor="reason" className="label">{t('common.reason')} <span className="font-normal text-slate-400">({t('common.optional')})</span></label>
          <textarea id="reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="field" />
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={run}>{confirmLabel || t('common.confirm')}</Button>
      </div>
    </Modal>
  );
}
