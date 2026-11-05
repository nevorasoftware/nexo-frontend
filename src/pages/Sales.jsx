import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircleDollarSign, Plus, Receipt, ShoppingBag, TrendingUp, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { dateTime, PAYMENT_METHODS } from '../lib/format';
import { Button, Card, EmptyState, ErrorAlert, Input, Modal, PageHeader, Select, Spinner, StatCard, Tabs, Textarea } from '../components/ui';
import { Cart, CatalogSearch, addToCart, useCatalog } from '../components/CatalogPicker';

function rangeFor(preset) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'today') return { from: start };
  if (preset === 'week') return { from: new Date(start.getTime() - 6 * 86400000) };
  if (preset === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1) };
  return {};
}

export default function Sales() {
  const { money, isOwner } = useAuth();
  const [params, setParams] = useSearchParams();
  const [preset, setPreset] = useState('today');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(params.get('nueva') === '1');
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    const { from } = rangeFor(preset);
    setData(null);
    api('/sales', { params: { from: from?.toISOString() } })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [preset]);

  useEffect(load, [load]);

  const closeNew = () => {
    setShowNew(false);
    if (params.get('nueva')) setParams({});
  };

  const s = data?.summary;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        subtitle="Registra ventas de productos y servicios y conoce tu ganancia neta"
        actions={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> Nueva venta
          </Button>
        }
      />

      <Tabs
        value={preset}
        onChange={setPreset}
        tabs={[
          { value: 'today', label: 'Hoy' },
          { value: 'week', label: 'Últimos 7 días' },
          { value: 'month', label: 'Este mes' },
          { value: 'all', label: 'Todo' },
        ]}
      />

      <ErrorAlert message={error} />
      {!data ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total vendido" value={money(s.total)} icon={CircleDollarSign} />
            <StatCard label="Costo" value={money(s.cost)} icon={Receipt} />
            <StatCard label="Ganancia neta" value={money(s.profit)} icon={TrendingUp} highlight />
            <StatCard label="N.º de ventas" value={s.count} icon={ShoppingBag} />
          </div>

          <Card>
            {data.sales.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No hay ventas en este periodo"
                description="Registra una venta rápida o desde tu catálogo."
                action={<Button onClick={() => setShowNew(true)}>Registrar venta</Button>}
              />
            ) : (
              <ul className="divide-y divide-rosa-100">
                {data.sales.map((sale) => (
                  <li key={sale.id}>
                    <button onClick={() => setDetail(sale)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-rosa-50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{sale.items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}</p>
                        <p className="text-xs text-ink-muted">
                          {dateTime(sale.createdAt)} · {PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod} · {sale.user?.name || '—'}
                          {sale.order && ` · ${sale.order.code}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ink">{money(sale.total)}</p>
                        <p className="text-xs font-medium text-emerald-700">+{money(sale.profit)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {showNew && (
        <NewSaleModal
          onClose={closeNew}
          onSaved={() => {
            closeNew();
            load();
          }}
        />
      )}

      {detail && (
        <SaleDetail
          sale={detail}
          canDelete={isOwner}
          onClose={() => setDetail(null)}
          onDeleted={() => {
            setDetail(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function NewSaleModal({ onClose, onSaved }) {
  const { money } = useAuth();
  const { catalog, loading, error: catalogError } = useCatalog();
  const [mode, setMode] = useState('catalog');
  const [items, setItems] = useState([]);
  const [quick, setQuick] = useState({ name: 'Venta', amount: '', cost: '' });
  const [meta, setMeta] = useState({ clientName: '', paymentMethod: 'EFECTIVO', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    if (mode === 'quick') {
      const total = Number(quick.amount || 0);
      const cost = Number(quick.cost || 0);
      return { total, cost, profit: total - cost };
    }
    const total = items.reduce((a, i) => a + Number(i.price || 0) * i.quantity, 0);
    const cost = items.reduce((a, i) => a + Number(i.cost || 0) * i.quantity, 0);
    return { total, cost, profit: total - cost };
  }, [mode, items, quick]);

  const save = async () => {
    setError('');
    const payloadItems =
      mode === 'quick'
        ? [{ type: 'CUSTOM', name: quick.name || 'Venta', quantity: 1, unitPrice: quick.amount, unitCost: quick.cost || 0 }]
        : items.map((i) => ({ type: i.type, variantId: i.variantId, serviceId: i.serviceId, quantity: i.quantity, unitPrice: i.price }));

    if (mode === 'quick' && !(Number(quick.amount) > 0)) return setError('Indica el monto de la venta');
    if (mode === 'catalog' && !items.length) return setError('Agrega al menos un ítem');

    setSaving(true);
    try {
      await api('/sales', { method: 'POST', body: { ...meta, items: payloadItems } });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Nueva venta"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} loading={saving}>
            Registrar {money(totals.total)}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Tabs
          value={mode}
          onChange={setMode}
          tabs={[
            { value: 'catalog', label: 'Desde catálogo' },
            { value: 'quick', label: 'Venta rápida' },
          ]}
        />

        {mode === 'catalog' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="label">Catálogo</p>
              {loading ? <Spinner className="py-6" /> : <CatalogSearch catalog={catalog} onAdd={(item) => addToCart(setItems, item)} />}
              <ErrorAlert message={catalogError} />
            </div>
            <div>
              <p className="label">Ítems de la venta (puedes ajustar el precio)</p>
              <Cart items={items} setItems={setItems} editablePrice />
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl bg-rosa-50 p-4">
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <Zap className="h-4 w-4 text-rosa-500" /> Registra el monto vendido y su costo; Nexo calcula tu ganancia.
            </p>
            <Input label="Descripción" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Monto de la venta" type="number" min="0" step="0.01" placeholder="800" value={quick.amount} onChange={(e) => setQuick({ ...quick, amount: e.target.value })} />
              <Input label="Costo" type="number" min="0" step="0.01" placeholder="400" value={quick.cost} onChange={(e) => setQuick({ ...quick, cost: e.target.value })} />
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Cliente (opcional)" value={meta.clientName} onChange={(e) => setMeta({ ...meta, clientName: e.target.value })} />
          <Select label="Método de pago" value={meta.paymentMethod} onChange={(e) => setMeta({ ...meta, paymentMethod: e.target.value })}>
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Textarea label="Notas" className="sm:col-span-2" value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-rosa-200 p-3 text-center">
          <div>
            <p className="text-xs text-ink-muted">Venta</p>
            <p className="font-semibold">{money(totals.total)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Costo</p>
            <p className="font-semibold">{money(totals.cost)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Ganancia neta</p>
            <p className={`font-semibold ${totals.profit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{money(totals.profit)}</p>
          </div>
        </div>
        <ErrorAlert message={error} />
      </div>
    </Modal>
  );
}

function SaleDetail({ sale, canDelete, onClose, onDeleted }) {
  const { money } = useAuth();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!window.confirm('¿Anular esta venta? El stock de los productos será devuelto.')) return;
    setDeleting(true);
    try {
      await api(`/sales/${sale.id}`, { method: 'DELETE' });
      onDeleted();
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Detalle de venta"
      footer={
        <>
          {canDelete && (
            <Button variant="danger" onClick={remove} loading={deleting}>
              Anular venta
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-2 text-ink-soft">
          <p>Fecha: <span className="text-ink">{dateTime(sale.createdAt)}</span></p>
          <p>Registró: <span className="text-ink">{sale.user?.name || '—'}</span></p>
          <p>Pago: <span className="text-ink">{PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod}</span></p>
          <p>Cliente: <span className="text-ink">{sale.clientName || '—'}</span></p>
          {sale.order && <p>Pedido: <span className="text-ink">{sale.order.code}</span></p>}
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              <th className="py-1 font-medium">Ítem</th>
              <th className="py-1 text-right font-medium">Cant.</th>
              <th className="py-1 text-right font-medium">Precio</th>
              <th className="py-1 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rosa-100">
            {sale.items.map((i) => (
              <tr key={i.id}>
                <td className="py-1.5">{i.name}</td>
                <td className="py-1.5 text-right">{i.quantity}</td>
                <td className="py-1.5 text-right">{money(i.unitPrice)}</td>
                <td className="py-1.5 text-right">{money(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1 rounded-xl bg-rosa-50 p-3">
          <p className="flex justify-between"><span>Total</span><span className="font-semibold">{money(sale.total)}</span></p>
          <p className="flex justify-between text-ink-soft"><span>Costo</span><span>{money(sale.cost)}</span></p>
          <p className="flex justify-between font-semibold text-emerald-700"><span>Ganancia neta</span><span>{money(sale.profit)}</span></p>
        </div>
        {sale.notes && <p className="text-ink-soft">Notas: {sale.notes}</p>}
        <ErrorAlert message={error} />
      </div>
    </Modal>
  );
}
