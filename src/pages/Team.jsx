import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, dateTime } from '../lib/format';
import { Avatar, Badge, Button, Card, EmptyState, ErrorAlert, Input, Modal, PageHeader, Select, Spinner } from '../components/ui';

const ROLE_HELP = {
  OWNER: 'Acceso total: ventas, inventario, equipo, historial y configuración.',
  EMPLOYEE: 'Registra ventas, gestiona inventario y procesa pedidos en Casa Matriz.',
  SELLER: 'Vendedor digital: crea pedidos para sus clientes y ve el catálogo.',
};

export default function Team() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    api('/users').then(setUsers).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const toggle = async (u) => {
    try {
      await api(`/users/${u.id}`, { method: 'PUT', body: { active: !u.active } });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        subtitle="Gestiona dueños, empleados y vendedores digitales"
        actions={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Agregar miembro</Button>}
      />
      <ErrorAlert message={error} />
      {!users ? (
        <Spinner />
      ) : users.length === 0 ? (
        <Card><EmptyState icon={Users} title="Sin miembros" /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <Card key={u.id} className={`p-4 ${u.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                <Avatar user={u} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{u.name}{u.id === me.id && <span className="text-xs font-normal text-ink-muted"> (tú)</span>}</p>
                  <p className="truncate text-xs text-ink-muted">{u.email}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge>{ROLE_LABELS[u.role]}</Badge>
                    {!u.active && <Badge className="bg-stone-100 text-stone-600">Inactivo</Badge>}
                  </div>
                </div>
                <button onClick={() => setEditing(u)} className="rounded-lg p-1.5 text-ink-muted hover:bg-rosa-100 hover:text-rosa-700" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                <span>{u.lastLoginAt ? `Último acceso: ${dateTime(u.lastLoginAt)}` : 'Sin accesos aún'}</span>
                {u.id !== me.id && (
                  <button onClick={() => toggle(u)} className="font-medium text-rosa-600 hover:underline">
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <UserModal user={editing} isSelf={editing.id === me.id} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function UserModal({ user, isSelf, onClose, onSaved }) {
  const isNew = !user.id;
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'EMPLOYEE',
    password: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setError('');
    if (isNew && form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      await api(isNew ? '/users' : `/users/${user.id}`, { method: isNew ? 'POST' : 'PUT', body });
      onSaved();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Nuevo miembro' : `Editar a ${user.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={saving}>Guardar</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nombre" value={form.name} onChange={set('name')} />
        <Input label="Correo" type="email" value={form.email} onChange={set('email')} />
        <Input label="Teléfono" value={form.phone} onChange={set('phone')} />
        <Select label="Rol" value={form.role} onChange={set('role')} disabled={isSelf}>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <p className="rounded-xl bg-rosa-50 p-3 text-xs text-ink-soft sm:col-span-2">{ROLE_HELP[form.role]}</p>
        <Input
          label={isNew ? 'Contraseña inicial' : 'Restablecer contraseña (opcional)'}
          type="password"
          autoComplete="new-password"
          className="sm:col-span-2"
          value={form.password}
          onChange={set('password')}
        />
        <div className="sm:col-span-2"><ErrorAlert message={error} /></div>
      </div>
    </Modal>
  );
}
