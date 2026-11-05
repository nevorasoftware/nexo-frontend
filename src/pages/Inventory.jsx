import { useCallback, useEffect, useState } from 'react';
import { Clock, Package, Pencil, Plus, Scissors, Search, Trash2, ArrowDownUp } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, EmptyState, ErrorAlert, Input, Modal, PageHeader, Spinner, Tabs, Textarea } from '../components/ui';

const emptyVariant = () => ({ name: '', sku: '', price: '', cost: '', stock: '0' });

export default function Inventory() {
  const { money, isStaff, isOwner } = useAuth();
  const [tab, setTab] = useState('products');
  const [q, setQ] = useState('');
  const [products, setProducts] = useState(null);
  const [services, setServices] = useState(null);
  const [error, setError] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [editService, setEditService] = useState(null);
  const [stockVariant, setStockVariant] = useState(null);

  const load = useCallback(() => {
    setError('');
    Promise.all([api('/products'), api('/services')])
      .then(([p, s]) => {
        setProducts(p);
        setServices(s);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const term = q.trim().toLowerCase();
  const match = (x) => !term || x.name.toLowerCase().includes(term) || (x.category || '').toLowerCase().includes(term);

  const remove = async (kind, item) => {
    if (!window.confirm(`¿Eliminar "${item.name}"? Se conservará en el historial.`)) return;
    try {
      await api(`/${kind}/${item.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        subtitle={isStaff ? 'Productos con variantes y servicios de tu salón' : 'Catálogo disponible para tus pedidos'}
        actions={
          isStaff && (
            <Button onClick={() => (tab === 'products' ? setEditProduct({}) : setEditService({}))}>
              <Plus className="h-4 w-4" /> {tab === 'products' ? 'Nuevo producto' : 'Nuevo servicio'}
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'products', label: 'Productos', count: products?.length },
            { value: 'services', label: 'Servicios', count: services?.length },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9" placeholder="Buscar por nombre o categoría" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <ErrorAlert message={error} />
      {!products ? (
        <Spinner />
      ) : tab === 'products' ? (
        products.filter(match).length === 0 ? (
          <Card>
            <EmptyState icon={Package} title="Sin productos" description="Agrega productos como shampoo, tintes o esmaltes, con sus variantes (tamaño, color…)." />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {products.filter(match).map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-ink">{p.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.category && <Badge>{p.category}</Badge>}
                      <Badge className="bg-stone-100 text-ink-soft">{p.variants.length} variante(s)</Badge>
                    </div>
                  </div>
                  {isStaff && (
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => setEditProduct(p)} className="rounded-lg p-1.5 text-ink-muted hover:bg-rosa-100 hover:text-rosa-700" aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isOwner && (
                        <button onClick={() => remove('products', p)} className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {p.description && <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{p.description}</p>}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-ink-muted">
                        <th className="py-1 font-medium">Variante</th>
                        <th className="py-1 text-right font-medium">Precio</th>
                        {isStaff && <th className="py-1 text-right font-medium">Ganancia</th>}
                        <th className="py-1 text-right font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rosa-100">
                      {p.variants.map((v) => (
                        <tr key={v.id}>
                          <td className="py-1.5">
                            {v.name}
                            {v.sku && <span className="ml-1 text-xs text-ink-muted">({v.sku})</span>}
                          </td>
                          <td className="py-1.5 text-right">{money(v.price)}</td>
                          {isStaff && <td className="py-1.5 text-right text-emerald-700">{money(Number(v.price) - Number(v.cost))}</td>}
                          <td className="py-1.5 text-right">
                            {isStaff ? (
                              <button
                                onClick={() => setStockVariant({ ...v, productName: p.name })}
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${
                                  v.stock === 0 ? 'bg-red-50 text-red-700' : v.stock <= 5 ? 'bg-amber-50 text-amber-800' : 'bg-rosa-50 text-ink'
                                } hover:ring-2 hover:ring-rosa-200`}
                                title="Ajustar stock"
                              >
                                {v.stock} <ArrowDownUp className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-xs">{v.stock}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : services.filter(match).length === 0 ? (
        <Card>
          <EmptyState icon={Scissors} title="Sin servicios" description="Agrega servicios como corte, manicure, tinte o tratamientos." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.filter(match).map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink">{s.name}</h3>
                  {s.category && <Badge className="mt-1 bg-rosa-100 text-rosa-700">{s.category}</Badge>}
                </div>
                {isStaff && (
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => setEditService(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-rosa-100 hover:text-rosa-700" aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {isOwner && (
                      <button onClick={() => remove('services', s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {s.description && <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{s.description}</p>}
              <div className="mt-3 flex items-end justify-between">
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  <Clock className="h-3.5 w-3.5" /> {s.durationMin} min
                </span>
                <div className="text-right">
                  <p className="font-semibold text-ink">{money(s.price)}</p>
                  {isStaff && <p className="text-xs text-emerald-700">Ganancia {money(Number(s.price) - Number(s.cost))}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editProduct && <ProductModal product={editProduct} onClose={() => setEditProduct(null)} onSaved={() => { setEditProduct(null); load(); }} />}
      {editService && <ServiceModal service={editService} onClose={() => setEditService(null)} onSaved={() => { setEditService(null); load(); }} />}
      {stockVariant && <StockModal variant={stockVariant} onClose={() => setStockVariant(null)} onSaved={() => { setStockVariant(null); load(); }} />}
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const isNew = !product.id;
  const [form, setForm] = useState({
    name: product.name || '',
    category: product.category || '',
    description: product.description || '',
  });
  const [variants, setVariants] = useState(
    product.variants?.length
      ? product.variants.map((v) => ({ id: v.id, name: v.name, sku: v.sku || '', price: String(v.price), cost: String(v.cost), stock: String(v.stock) }))
      : [{ ...emptyVariant(), name: 'Única' }]
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setV = (idx, patch) => setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  const save = async () => {
    setError('');
    if (!form.name.trim()) return setError('El nombre es requerido');
    if (variants.some((v) => v.price === '' || Number(v.price) < 0)) return setError('Cada variante necesita un precio válido');
    setSaving(true);
    try {
      await api(isNew ? '/products' : `/products/${product.id}`, { method: isNew ? 'POST' : 'PUT', body: { ...form, variants } });
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
      size="lg"
      title={isNew ? 'Nuevo producto' : 'Editar producto'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={saving}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Shampoo hidratante" />
          <Input label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej. Cabello" />
          <Textarea label="Descripción" className="sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label mb-0">Variantes (tamaño, color, presentación…)</p>
            <Button size="sm" variant="secondary" onClick={() => setVariants([...variants, emptyVariant()])}>
              <Plus className="h-3.5 w-3.5" /> Variante
            </Button>
          </div>
          <div className="space-y-2">
            {variants.map((v, idx) => (
              <div key={v.id || idx} className="grid grid-cols-2 gap-2 rounded-xl border border-rosa-100 p-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_auto] sm:items-end">
                <Input label="Nombre" value={v.name} onChange={(e) => setV(idx, { name: e.target.value })} placeholder="500 ml" />
                <Input label="SKU" value={v.sku} onChange={(e) => setV(idx, { sku: e.target.value })} />
                <Input label="Precio" type="number" min="0" step="0.01" value={v.price} onChange={(e) => setV(idx, { price: e.target.value })} />
                <Input label="Costo" type="number" min="0" step="0.01" value={v.cost} onChange={(e) => setV(idx, { cost: e.target.value })} />
                <Input label="Stock" type="number" min="0" step="1" value={v.stock} onChange={(e) => setV(idx, { stock: e.target.value })} />
                <button
                  type="button"
                  disabled={variants.length === 1}
                  onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                  className="mb-1 justify-self-end rounded-lg p-2 text-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label="Quitar variante"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <ErrorAlert message={error} />
      </div>
    </Modal>
  );
}

function ServiceModal({ service, onClose, onSaved }) {
  const isNew = !service.id;
  const [form, setForm] = useState({
    name: service.name || '',
    category: service.category || '',
    description: service.description || '',
    price: service.price !== undefined ? String(service.price) : '',
    cost: service.cost !== undefined ? String(service.cost) : '0',
    durationMin: String(service.durationMin ?? 60),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setError('');
    if (!form.name.trim() || form.price === '') return setError('Nombre y precio son requeridos');
    setSaving(true);
    try {
      await api(isNew ? '/services' : `/services/${service.id}`, { method: isNew ? 'POST' : 'PUT', body: form });
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
      title={isNew ? 'Nuevo servicio' : 'Editar servicio'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={saving}>Guardar</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nombre" value={form.name} onChange={set('name')} placeholder="Ej. Manicure semipermanente" />
        <Input label="Categoría" value={form.category} onChange={set('category')} placeholder="Ej. Uñas" />
        <Input label="Precio" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
        <Input label="Costo (insumos, comisión…)" type="number" min="0" step="0.01" value={form.cost} onChange={set('cost')} />
        <Input label="Duración (min)" type="number" min="0" step="5" value={form.durationMin} onChange={set('durationMin')} />
        <Textarea label="Descripción" className="sm:col-span-2" value={form.description} onChange={set('description')} />
        <div className="sm:col-span-2">
          <ErrorAlert message={error} />
        </div>
      </div>
    </Modal>
  );
}

function StockModal({ variant, onClose, onSaved }) {
  const [direction, setDirection] = useState('in');
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = parseInt(qty, 10);
    if (!n || n < 1) return setError('Indica una cantidad válida');
    setSaving(true);
    try {
      await api(`/products/variants/${variant.id}/stock`, {
        method: 'PATCH',
        body: { delta: direction === 'in' ? n : -n, reason },
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
      size="sm"
      onClose={onClose}
      title="Ajustar stock"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={saving}>Aplicar</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">
          {variant.productName} · <span className="font-medium text-ink">{variant.name}</span> — stock actual: <b>{variant.stock}</b>
        </p>
        <Tabs value={direction} onChange={setDirection} tabs={[{ value: 'in', label: 'Entrada (+)' }, { value: 'out', label: 'Salida (−)' }]} />
        <Input label="Cantidad" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        <Input label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Compra a proveedor, merma, uso interno…" />
        <ErrorAlert message={error} />
      </div>
    </Modal>
  );
}
