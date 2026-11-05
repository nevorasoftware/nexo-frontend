import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CircleDollarSign, Package, Plus, Receipt, TrendingUp, Truck, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { dateTime, STATUS_LABELS } from '../lib/format';
import { Button, Card, EmptyState, ErrorAlert, PageHeader, Spinner, StatCard, StatusBadge } from '../components/ui';
import BarChart from '../components/BarChart';

const STATUS_ORDER = ['PENDING', 'AT_HQ', 'COMPLETED', 'CANCELLED'];

export default function Dashboard() {
  const { user, money, isSeller, business } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard', { params: { tzOffset: new Date().getTimezoneOffset() } })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();

  if (error) return <ErrorAlert message={error} />;
  if (!data) return <Spinner />;

  const margin = data.today.total > 0 ? Math.round((data.today.profit / data.today.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user.name.split(' ')[0]}`}
        subtitle={`Resumen de ${business?.name} · ${new Intl.DateTimeFormat('es', { dateStyle: 'full' }).format(new Date())}`}
        actions={
          isSeller ? (
            <Link to="/pedidos">
              <Button>
                <Plus className="h-4 w-4" /> Nuevo pedido
              </Button>
            </Link>
          ) : (
            <Link to="/ventas?nueva=1">
              <Button>
                <Plus className="h-4 w-4" /> Nueva venta
              </Button>
            </Link>
          )
        }
      />

      {/* Resumen del día */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={isSeller ? 'Mis ventas hoy' : 'Ventas de hoy'} value={money(data.today.total)} icon={CircleDollarSign} hint={`${data.today.count} venta(s)`} />
        <StatCard label="Costo de hoy" value={money(data.today.cost)} icon={Receipt} />
        <StatCard label="Ganancia neta hoy" value={money(data.today.profit)} icon={TrendingUp} hint={`Margen ${margin}%`} highlight />
        <StatCard label="Ganancia del mes" value={money(data.month.profit)} icon={Wallet} hint={`Ventas del mes: ${money(data.month.total)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-ink">Ventas de los últimos 7 días</h2>
          <p className="text-xs text-ink-muted">Pasa el cursor sobre una barra para ver costo y ganancia</p>
          <div className="mt-2">
            <BarChart data={data.series} money={money} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">{isSeller ? 'Mis pedidos' : 'Pedidos de vendedores'}</h2>
            <Truck className="h-4 w-4 text-rosa-400" />
          </div>
          <div className="space-y-2">
            {STATUS_ORDER.map((s) => (
              <Link key={s} to={`/pedidos?estado=${s}`} className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-rosa-50">
                <StatusBadge status={s} />
                <span className="text-lg font-semibold text-ink">{data.orders[s]}</span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-muted">Flujo: Vendedor → Casa Matriz → Cliente final</p>
        </Card>
      </div>

      {isSeller ? (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-ink">Pedidos recientes</h2>
          {data.recentOrders.length === 0 ? (
            <EmptyState icon={Truck} title="Sin pedidos aún" description="Crea tu primer pedido para enviarlo a la Casa Matriz." />
          ) : (
            <ul className="divide-y divide-rosa-100">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{o.customerName}</p>
                    <p className="text-xs text-ink-muted">{o.code} · {dateTime(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{money(o.total)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-ink">Más vendidos (30 días)</h2>
            {data.topItems.length === 0 ? (
              <p className="text-sm text-ink-muted">Aún no hay ventas.</p>
            ) : (
              <ol className="space-y-2.5">
                {data.topItems.map((t, i) => (
                  <li key={`${t.name}-${i}`} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rosa-100 text-xs font-semibold text-rosa-700">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{t.name}</span>
                    <span className="text-xs text-ink-muted">×{t.quantity}</span>
                    <span className="font-medium">{money(t.total)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-ink">Stock bajo</h2>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-ink-muted">Todo el inventario está en orden.</p>
            ) : (
              <ul className="space-y-2">
                {data.lowStock.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">
                      {v.product.name}
                      {v.name !== 'Única' && <span className="text-ink-muted"> · {v.name}</span>}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${v.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                      {v.stock === 0 ? 'Agotado' : `${v.stock} uds.`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/inventario" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-rosa-600 hover:underline">
              <Package className="h-3.5 w-3.5" /> Ir a inventario
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-ink">Ventas recientes</h2>
            {data.recentSales.length === 0 ? (
              <p className="text-sm text-ink-muted">Registra tu primera venta.</p>
            ) : (
              <ul className="divide-y divide-rosa-100">
                {data.recentSales.map((s) => (
                  <li key={s.id} className="py-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="truncate font-medium">{s.items.map((i) => i.name).join(', ')}</span>
                      <span className="shrink-0 font-semibold">{money(s.total)}</span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      {dateTime(s.createdAt)} · {s.user?.name || '—'} · ganancia {money(s.profit)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <p className="sr-only">Estados: {Object.values(STATUS_LABELS).join(', ')}</p>
    </div>
  );
}
