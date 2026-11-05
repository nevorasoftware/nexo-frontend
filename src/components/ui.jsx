import { useEffect } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { STATUS_LABELS, STATUS_STYLES, initials } from '../lib/format';

const BUTTON_VARIANTS = {
  primary: 'bg-rosa-500 text-white hover:bg-rosa-600 shadow-soft',
  secondary: 'bg-rosa-100 text-rosa-700 hover:bg-rosa-200',
  outline: 'border border-rosa-200 bg-white text-rosa-700 hover:bg-rosa-50',
  ghost: 'text-ink-soft hover:bg-rosa-100',
  danger: 'bg-white border border-red-200 text-red-600 hover:bg-red-50',
};

export function Button({ variant = 'primary', size = 'md', loading, className = '', children, ...props }) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export function Input({ label, hint, className = '', ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input className="input" {...props} />
    </Field>
  );
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <Field label={label} className={className}>
      <textarea className="input min-h-[80px]" {...props} />
    </Field>
  );
}

export function Select({ label, className = '', children, ...props }) {
  return (
    <Field label={label} className={className}>
      <select className="input" {...props}>
        {children}
      </select>
    </Field>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl ${widths[size]}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rosa-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-muted hover:bg-rosa-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-rosa-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({ children, className = 'bg-rosa-100 text-rosa-700' }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 text-rosa-400 ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {Icon && (
        <div className="mb-3 rounded-2xl bg-rosa-100 p-3 text-rosa-500">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, highlight }) {
  return (
    <Card className={`p-4 ${highlight ? 'border-rosa-300 bg-gradient-to-br from-rosa-100 to-white' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-rosa-400" />}
      </div>
      <p className="mt-2 truncate text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </Card>
  );
}

export function Avatar({ user, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-20 w-20 text-2xl' };
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`} />;
  }
  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full font-semibold text-ink ring-2 ring-white`}
      style={{ backgroundColor: user?.avatarColor || '#F8BBD0' }}
    >
      {initials(user?.name)}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-rosa-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition ${
            value === t.value ? 'bg-white text-rosa-700 shadow-sm' : 'text-ink-soft hover:text-rosa-700'
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-xs text-ink-muted">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
