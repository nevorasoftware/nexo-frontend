export function money(value, currency = 'USD') {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export const dateTime = (v) =>
  v ? new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '';

export const dateOnly = (v) => (v ? new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(v)) : '');

export const shortDay = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
};

export const ROLE_LABELS = { OWNER: 'Dueño', EMPLOYEE: 'Empleado', SELLER: 'Vendedor' };

export const STATUS_LABELS = {
  PENDING: 'Pendiente',
  AT_HQ: 'En Matriz',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  AT_HQ: 'bg-sky-50 text-sky-800 border-sky-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-stone-100 text-stone-600 border-stone-200',
};

export const PAYMENT_METHODS = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  OTRO: 'Otro',
};

export const ENTITY_LABELS = {
  Business: 'Negocio',
  User: 'Usuario',
  Product: 'Producto',
  Service: 'Servicio',
  Sale: 'Venta',
  Order: 'Pedido',
};

export const ACTION_LABELS = {
  CREATE: 'Creó',
  UPDATE: 'Modificó',
  DELETE: 'Eliminó',
  STATUS: 'Cambió estado',
  STOCK: 'Ajustó stock',
  LOGIN: 'Inició sesión',
};

export const AVATAR_COLORS = ['#F48FB1', '#F8BBD0', '#CE93D8', '#B39DDB', '#90CAF9', '#80CBC4', '#FFCC80', '#BCAAA4'];

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
