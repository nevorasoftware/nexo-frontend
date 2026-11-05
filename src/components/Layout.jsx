import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { History, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Truck, UserCircle, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/format';
import { Avatar } from './ui';

const NAV = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/ventas', label: 'Ventas', icon: ShoppingBag, roles: ['OWNER', 'EMPLOYEE'] },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/pedidos', label: 'Pedidos', icon: Truck },
  { to: '/historial', label: 'Historial', icon: History, roles: ['OWNER'] },
  { to: '/equipo', label: 'Equipo', icon: Users, roles: ['OWNER'] },
  { to: '/perfil', label: 'Mi perfil', icon: UserCircle },
];

function Brand({ business }) {
  return (
    <div className="flex items-center gap-3">
      {business?.logoUrl ? (
        <img src={business.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rosa-200 text-lg font-bold text-rosa-700">N</div>
      )}
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none text-rosa-700">Nexo</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{business?.name}</p>
      </div>
    </div>
  );
}

function NavItems({ role, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.filter((n) => !n.roles || n.roles.includes(role)).map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-rosa-200 text-rosa-800' : 'text-ink-soft hover:bg-rosa-100 hover:text-rosa-700'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserBox({ user, onLogout }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-rosa-50 p-3">
      <Avatar user={user} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{user.name}</p>
        <p className="text-xs text-ink-muted">{ROLE_LABELS[user.role]}</p>
      </div>
      <button onClick={onLogout} className="rounded-lg p-1.5 text-ink-muted hover:bg-rosa-100 hover:text-rosa-700" title="Cerrar sesión">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Layout() {
  const { user, business, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-rosa-100 bg-white p-4 lg:flex">
        <div className="space-y-8">
          <Brand business={business} />
          <NavItems role={user.role} />
        </div>
        <UserBox user={user} onLogout={logout} />
      </aside>

      {/* Barra superior móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-rosa-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand business={business} />
        <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-rosa-700 hover:bg-rosa-100" aria-label="Abrir menú">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setOpen(false)}>
          <aside
            className="flex h-full w-72 max-w-[85%] flex-col justify-between bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Brand business={business} />
                <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-ink-muted hover:bg-rosa-100" aria-label="Cerrar menú">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavItems role={user.role} onNavigate={() => setOpen(false)} />
            </div>
            <UserBox user={user} onLogout={logout} />
          </aside>
        </div>
      )}

      <main className="px-4 py-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
