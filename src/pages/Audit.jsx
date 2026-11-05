import { useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { api } from '../lib/api';
import { ACTION_LABELS, ENTITY_LABELS, ROLE_LABELS, dateTime } from '../lib/format';
import { Badge, Button, Card, EmptyState, ErrorAlert, PageHeader, Select, Spinner } from '../components/ui';

const ACTION_STYLES = {
  CREATE: 'bg-emerald-50 text-emerald-800',
  UPDATE: 'bg-sky-50 text-sky-800',
  DELETE: 'bg-red-50 text-red-700',
  STATUS: 'bg-violet-50 text-violet-800',
  STOCK: 'bg-amber-50 text-amber-800',
  LOGIN: 'bg-stone-100 text-stone-600',
};

const show = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

function Changes({ changes }) {
  if (!changes) return <p className="text-xs text-ink-muted">Sin detalles.</p>;
  const entries = Object.entries(changes);
  return (
    <div className="space-y-1.5">
      {entries.map(([field, value]) => {
        const isDiff = value && typeof value === 'object' && ('antes' in value || 'despues' in value);
        return (
          <div key={field} className="rounded-lg bg-rosa-50 p-2 text-xs">
            <span className="font-semibold text-ink">{field}</span>
            {isDiff ? (
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                <p className="break-all text-red-700"><span className="text-ink-muted">Antes: </span>{show(value.antes)}</p>
                <p className="break-all text-emerald-700"><span className="text-ink-muted">Después: </span>{show(value.despues)}</p>
              </div>
            ) : (
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all text-ink-soft">{JSON.stringify(value, null, 2)}</pre>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Audit() {
  const [filters, setFilters] = useState({ entity: '', action: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    setData(null);
    api('/audit', { params: { ...filters, page } })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [filters, page]);

  const setFilter = (k) => (e) => {
    setPage(1);
    setFilters({ ...filters, [k]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Historial de modificaciones" subtitle="Quién hizo qué y cuándo en tu negocio" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="Módulo" value={filters.entity} onChange={setFilter('entity')}>
          <option value="">Todos</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select label="Acción" value={filters.action} onChange={setFilter('action')}>
          <option value="">Todas</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>

      <ErrorAlert message={error} />
      {!data ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <Card><EmptyState icon={History} title="Sin registros" description="Aquí aparecerá cada cambio realizado." /></Card>
      ) : (
        <Card>
          <ul className="divide-y divide-rosa-100">
            {data.items.map((log) => (
              <li key={log.id}>
                <button onClick={() => setOpen(open === log.id ? null : log.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-rosa-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={ACTION_STYLES[log.action] || 'bg-stone-100 text-stone-600'}>{ACTION_LABELS[log.action] || log.action}</Badge>
                      <Badge className="bg-rosa-100 text-rosa-700">{ENTITY_LABELS[log.entity] || log.entity}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink">{log.summary}</p>
                    <p className="text-xs text-ink-muted">
                      {log.userName}{log.userRole ? ` (${ROLE_LABELS[log.userRole] || log.userRole})` : ''} · {dateTime(log.createdAt)}
                    </p>
                  </div>
                  <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-ink-muted transition ${open === log.id ? 'rotate-180' : ''}`} />
                </button>
                {open === log.id && (
                  <div className="px-4 pb-4">
                    <Changes changes={log.changes} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-rosa-100 px-4 py-3 text-sm">
            <span className="text-ink-muted">{data.total} registro(s) · página {data.page} de {data.pages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage(page + 1)} aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
