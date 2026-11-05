import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, CheckCircle2, ChevronRight, Plus, Truck, User, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { dateTime, PAYMENT_METHODS, STATUS_LABELS } from '../lib/format';
import { Button, Card, EmptyState, ErrorAlert, Input, Modal, PageHeader, Select, Spinner, StatusBadge, Tabs, Textarea } from '../components/ui';
import { Cart, CatalogSearch, addToCart, useCatalog } from '../components/CatalogPicker';

const FLOW = [
  { status: 'PENDING', label: 'Vendedor', icon: User },
  { status: 'AT_HQ', label: 'Casa Matriz', icon: Building2 },
  { status: 'COMPLETED', label: 'Cliente final', icon: CheckCircle2 },
];

export default function Orders() {
  const { money, isSeller } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = params.get('estado') || '';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(() => {
    setData(null);
    api('/orders', { params: { status } })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [status]);
  useEffect(load, [load]);

  const counts = data?.counts || {};
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSeller ? 'Mis pedidos' : 'Pedidos de vendedores'}
        subtitle="Vendedor → Casa Matriz → Cliente final"
        actions={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> Nuevo pedido
          </Button>
        }
      />

      {/* Pipeline visual */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {FLOW.map((step, i) => (
          <button
            key={step.status}
            onClick={() => setParams({ estado: step.status })}
            className={`card relative flex flex-col items-center gap-1 p-3 text-center transition hover:border-rosa-300 ${status === step.status ? 'border-rosa-300 bg-rosa-100' : ''}`}
          >
            <step.icon className="h-5 w-5 text-rosa-500" />
            <span className="text-xs text-ink-soft">{step.label}</span>
            <span className="text-xl font-semibold text-ink">{counts[step.status] ?? 0}</span>
            <span className="text-[11px] text-ink-muted">{STATUS_LABELS[step.status]}</span>
            {i < FLOW.length - 1 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-rosa-300 sm:block" />}
          </button>
        ))}
      </div>

      <Tabs
        value={status}
        onChange={(v) => setParams(v ? { estado: v } : {})}
        tabs={[
          { value: '', label: 'Todos', count: totalCount },
          ...Object.keys(STATUS_LABELS).map((s) => ({ value: s, label: STATUS_LABELS[s], count: counts[s] ?? 0 })),
        ]}
      />

      <ErrorAlert message={error} />
      {!data ? (
        <Spinner />
      ) : data.orders.length === 0 ? (
        <Card>
          <EmptyState icon={Truck} title="No hay pedidos" description="Los pedidos creados por vendedores aparecerán aquí." />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-rosa-100">
            {data.orders.map((o) => (
              <li key={o.id}>
                <button onClick={() => setDetailId(o.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-rosa-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{o.customerName}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {o.code} · {dateTime(o.createdAt)}
                      {!isSeller && ` · Vendedor: ${o.seller?.name}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{money(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {showNew && (
        <NewOrderModal
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
      {detailId && <OrderDetail id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  );
}

function NewOrderModal({ onClose, onSaved }) {
  const { money } = useAuth();
  const { catalog, loading, error: catalogError } = useCatalog();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const total = items.reduce((a, i) => a + i.price * i.quantity, 0);

  const save = async () => {
    setError('');
    if (!form.customerName.trim()) return setError('Indica el nombre del cliente');
    if (!items.length) return setError('Agrega al menos un ítem');
    setSaving(true);
    try {
      await api('/orders', {
        method: 'POST',
        body: { ...form, items: items.map((i) => ({ type: i.type, variantId: i.variantId, serviceId: i.serviceId, quantity: i.quantity })) },
      });
      onSaved();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title="Nuevo pedido"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={saving}>Enviar pedido · {money(total)}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Cliente final" value={form.customerName} onChange={set('customerName')} />
          <Input label="Teléfono" value={form.customerPhone} onChange={set('customerPhone')} />
          <Input label="Dirección de entrega" className="sm:col-span-2" value={form.customerAddress} onChange={set('customerAddress')} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="label">Catálogo</p>
            {loading ? <Spinner className="py-6" /> : <CatalogSearch catalog={catalog} onAdd={(item) => addToCart(setItems, item)} />}
            <ErrorAlert message={catalogError} />
          </div>
          <div>
            <p className="label">Ítems del pedido</p>
            <Cart items={items} setItems={setItems} />
          </div>
        </div>
        <Textarea label="Notas para la Casa Matriz" value={form.notes} onChange={set('notes')} />
        <ErrorAlert message={error} />
      </div>
    </Modal>
  );
}

function OrderDetail({ id, onClose, onChanged }) {
  const { money, isStaff, isSeller } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    api(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  const change = async (status) => {
    if (status === 'CANCELLED' && !window.confirm('¿Cancelar este pedido?')) return;
    setBusy(status);
    setError('');
    try {
      await api(`/orders/${id}/status`, { method: 'PATCH', body: { status, note, paymentMethod } });
      setNote('');
      load();
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const actions = [];
  if (order) {
    if (isStaff && order.status === 'PENDING') actions.push({ status: 'AT_HQ', label: 'Recibir en Casa Matriz', icon: Building2 });
    if (isStaff && order.status === 'AT_HQ') actions.push({ status: 'COMPLETED', label: 'Entregar y completar', icon: CheckCircle2 });
    if ((isStaff && ['PENDING', 'AT_HQ'].includes(order.status)) || (isSeller && order.status === 'PENDING')) {
      actions.push({ status: 'CANCELLED', label: 'Cancelar', icon: XCircle, variant: 'danger' });
    }
  }
  const stepIndex = order ? FLOW.findIndex((f) => f.status === order.status) : -1;

  return (
    <Modal open size="lg" onClose={onClose} title={order ? `Pedido ${order.code}` : 'Pedido'}>
      {!order ? (
        error ? <ErrorAlert message={error} /> : <Spinner />
      ) : (
        <div className="space-y-5 text-sm">
          {/* Progreso del flujo */}
          {order.status === 'CANCELLED' ? (
            <div className="rounded-xl bg-stone-100 p-3 text-center text-ink-soft">Pedido cancelado</div>
          ) : (
            <div className="flex items-center">
              {FLOW.map((f, i) => (
                <div key={f.status} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${i <= stepIndex ? 'bg-rosa-500 text-white' : 'bg-rosa-100 text-rosa-400'}`}>
                      <f.icon className="h-4 w-4" />
                    </div>
                    <span className={`text-center text-[11px] ${i <= stepIndex ? 'font-medium text-ink' : 'text-ink-muted'}`}>{f.label}</span>
                  </div>
                  {i < FLOW.length - 1 && <div className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < stepIndex ? 'bg-rosa-400' : 'bg-rosa-100'}`} />}
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-2 rounded-xl bg-rosa-50 p-3 sm:grid-cols-2">
            <p>Cliente: <b>{order.customerName}</b></p>
            <p>Teléfono: {order.customerPhone || '—'}</p>
            <p className="sm:col-span-2">Dirección: {order.customerAddress || '—'}</p>
            <p>Vendedor: {order.seller?.name}</p>
            <p>Estado: <StatusBadge status={order.status} /></p>
            {order.notes && <p className="sm:col-span-2">Notas: {order.notes}</p>}
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="py-1 font-medium">Ítem</th>
                <th className="py-1 text-right font-medium">Cant.</th>
                <th className="py-1 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rosa-100">
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td className="py-1.5">{i.name}</td>
                  <td className="py-1.5 text-right">{i.quantity}</td>
                  <td className="py-1.5 text-right">{money(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-2 text-right font-semibold">Total</td>
                <td className="pt-2 text-right font-semibold">{money(order.total)}</td>
              </tr>
            </tfoot>
          </table>

          {order.sale && (
            <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
              Venta generada el {dateTime(order.sale.createdAt)} · ganancia {money(order.sale.profit)}
            </p>
          )}

          {actions.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-rosa-200 p-3">
              <Input label="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. Enviado con mensajería" />
              {actions.some((a) => a.status === 'COMPLETED') && (
                <Select label="Método de pago del cliente" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                {actions.map((a) => (
                  <Button key={a.status} variant={a.variant || 'primary'} loading={busy === a.status} disabled={!!busy} onClick={() => change(a.status)}>
                    <a.icon className="h-4 w-4" /> {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <ErrorAlert message={error} />

          <div>
            <p className="label">Historial del pedido</p>
            <ol className="space-y-2 border-l-2 border-rosa-200 pl-4">
              {order.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-rosa-400" />
                  <p className="text-ink">{h.summary}</p>
                  <p className="text-xs text-ink-muted">{h.userName} · {dateTime(h.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Modal>
  );
}
