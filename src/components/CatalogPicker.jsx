import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Scissors, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

/** Convierte productos (con variantes) y servicios en una lista plana de ítems vendibles */
export function useCatalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/products'), api('/services')])
      .then(([products, services]) => {
        const items = [];
        products.forEach((p) =>
          p.variants.forEach((v) =>
            items.push({
              key: `P-${v.id}`,
              type: 'PRODUCT',
              variantId: v.id,
              name: v.name === 'Única' ? p.name : `${p.name} - ${v.name}`,
              category: p.category,
              price: Number(v.price),
              cost: Number(v.cost),
              stock: v.stock,
            })
          )
        );
        services.forEach((s) =>
          items.push({
            key: `S-${s.id}`,
            type: 'SERVICE',
            serviceId: s.id,
            name: s.name,
            category: s.category,
            price: Number(s.price),
            cost: Number(s.cost),
          })
        );
        setCatalog(items);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { catalog, loading, error };
}

export function CatalogSearch({ catalog, onAdd }) {
  const { money } = useAuth();
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog.filter((i) => !term || i.name.toLowerCase().includes(term) || (i.category || '').toLowerCase().includes(term)).slice(0, 40);
  }, [catalog, q]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input className="input pl-9" placeholder="Buscar producto o servicio…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-2 max-h-56 divide-y divide-rosa-100 overflow-y-auto rounded-xl border border-rosa-100">
        {filtered.length === 0 && <p className="p-3 text-center text-sm text-ink-muted">Sin resultados. Agrega ítems en Inventario.</p>}
        {filtered.map((item) => {
          const out = item.type === 'PRODUCT' && item.stock <= 0;
          return (
            <button
              key={item.key}
              type="button"
              disabled={out}
              onClick={() => onAdd(item)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-rosa-50 disabled:opacity-50"
            >
              <span className="rounded-lg bg-rosa-100 p-1.5 text-rosa-600">
                {item.type === 'PRODUCT' ? <ShoppingBag className="h-4 w-4" /> : <Scissors className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{item.name}</span>
                <span className="text-xs text-ink-muted">
                  {item.type === 'PRODUCT' ? (out ? 'Sin stock' : `Stock: ${item.stock}`) : 'Servicio'}
                </span>
              </span>
              <span className="font-medium text-ink">{money(item.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Cart({ items, setItems, editablePrice = false }) {
  const { money } = useAuth();
  const update = (key, patch) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const remove = (key) => setItems((prev) => prev.filter((i) => i.key !== key));

  if (!items.length) return <p className="rounded-xl bg-rosa-50 p-4 text-center text-sm text-ink-muted">Aún no agregas ítems.</p>;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-rosa-100 p-2">
          <p className="min-w-[120px] flex-1 truncate text-sm font-medium text-ink">{item.name}</p>
          <div className="flex items-center rounded-lg border border-rosa-200">
            <button type="button" className="p-1.5 text-rosa-600" onClick={() => update(item.key, { quantity: Math.max(1, item.quantity - 1) })} aria-label="Restar">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="p-1.5 text-rosa-600"
              onClick={() => update(item.key, { quantity: item.stock !== undefined ? Math.min(item.stock, item.quantity + 1) : item.quantity + 1 })}
              aria-label="Sumar"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {editablePrice ? (
            <input
              type="number"
              min="0"
              step="0.01"
              className="input w-24 py-1"
              value={item.price}
              onChange={(e) => update(item.key, { price: e.target.value })}
              aria-label="Precio unitario"
            />
          ) : (
            <span className="w-20 text-right text-sm text-ink-soft">{money(item.price)}</span>
          )}
          <span className="w-24 text-right text-sm font-semibold text-ink">{money(Number(item.price || 0) * item.quantity)}</span>
          <button type="button" onClick={() => remove(item.key)} className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label="Quitar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function addToCart(setItems, item) {
  setItems((prev) => {
    const found = prev.find((i) => i.key === item.key);
    if (found) {
      const max = item.stock !== undefined ? item.stock : Infinity;
      return prev.map((i) => (i.key === item.key ? { ...i, quantity: Math.min(max, i.quantity + 1) } : i));
    }
    return [...prev, { ...item, quantity: 1 }];
  });
}
