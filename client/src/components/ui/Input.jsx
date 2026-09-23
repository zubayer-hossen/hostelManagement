import { forwardRef, useId } from 'react';
import { useTranslation } from 'react-i18next';

/** Labeled text input. `error` may be an i18n key (from zod schemas) or a plain server message. */
const Input = forwardRef(function Input({ label, error, hint, optional, className = '', right, ...rest }, ref) {
  const { t } = useTranslation();
  const id = useId();
  const errorId = `${id}-error`;
  const message = error ? t(error, { defaultValue: error }) : null;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {optional && <span className="ml-1 font-normal text-slate-400">({t('common.optional')})</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={message ? 'true' : undefined}
          aria-describedby={message ? errorId : undefined}
          className={`field ${message ? 'field-error' : ''} ${right ? 'pr-11' : ''}`}
          {...rest}
        />
        {right && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{right}</div>}
      </div>
      {hint && !message && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {message && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </div>
  );
});

export default Input;
