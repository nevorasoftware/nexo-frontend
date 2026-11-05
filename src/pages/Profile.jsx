import { useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AVATAR_COLORS, ROLE_LABELS } from '../lib/format';
import { Avatar, Badge, Button, Card, ErrorAlert, Input, PageHeader, Textarea } from '../components/ui';

function Saved({ show }) {
  if (!show) return null;
  return <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><Check className="h-4 w-4" /> Guardado</span>;
}

export default function Profile() {
  const { user, setUser, business, setBusiness, isOwner } = useAuth();

  const [profile, setProfile] = useState({
    name: user.name,
    phone: user.phone || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    avatarColor: user.avatarColor || AVATAR_COLORS[0],
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [biz, setBiz] = useState({
    name: business?.name || '',
    phone: business?.phone || '',
    address: business?.address || '',
    currency: business?.currency || 'USD',
    logoUrl: business?.logoUrl || '',
  });
  const [state, setState] = useState({});

  const run = async (key, fn) => {
    setState((s) => ({ ...s, [key]: { saving: true } }));
    try {
      await fn();
      setState((s) => ({ ...s, [key]: { saved: true } }));
      setTimeout(() => setState((s) => ({ ...s, [key]: {} })), 2500);
    } catch (e) {
      setState((s) => ({ ...s, [key]: { error: e.message } }));
    }
  };

  const saveProfile = () =>
    run('profile', async () => {
      const data = await api('/auth/me', { method: 'PUT', body: profile });
      setUser(data.user);
    });

  const saveColor = (color) => {
    setProfile((p) => ({ ...p, avatarColor: color }));
    if (color === user.avatarColor) return;
    run('color', async () => {
      const data = await api('/auth/me', { method: 'PUT', body: { avatarColor: color } });
      setUser(data.user);
    });
  };

  const savePassword = () =>
    run('password', async () => {
      if (pw.newPassword.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      await api('/auth/me', { method: 'PUT', body: pw });
      setPw({ currentPassword: '', newPassword: '' });
    });

  const saveBusiness = () =>
    run('business', async () => {
      setBusiness(await api('/business', { method: 'PUT', body: biz }));
    });

  const setP = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });
  const setB = (k) => (e) => setBiz({ ...biz, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <PageHeader title="Mi perfil" subtitle="Personaliza tu cuenta y la de tu negocio" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center p-6 text-center">
          <Avatar user={{ ...user, ...profile }} size="lg" />
          <p className="mt-3 text-lg font-semibold text-ink">{profile.name}</p>
          <p className="text-sm text-ink-muted">{user.email}</p>
          <Badge className="mt-2 bg-rosa-100 text-rosa-700">{ROLE_LABELS[user.role]}</Badge>
          {profile.bio && <p className="mt-3 text-sm text-ink-soft">{profile.bio}</p>}
          <div className="mt-5 w-full">
            <p className="label">Color de tu avatar (se guarda al instante)</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => saveColor(c)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition hover:scale-110 ${
                    profile.avatarColor?.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-rosa-500' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                  aria-pressed={profile.avatarColor?.toLowerCase() === c.toLowerCase()}
                >
                  {profile.avatarColor?.toLowerCase() === c.toLowerCase() && <Check className="h-4 w-4 text-ink" />}
                </button>
              ))}
              <label
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-rosa-300 text-xs font-semibold text-rosa-600 hover:scale-110"
                title="Elegir otro color"
              >
                +
                <input
                  type="color"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  value={/^#[0-9a-f]{6}$/i.test(profile.avatarColor || '') ? profile.avatarColor : '#f48fb1'}
                  onChange={(e) => setProfile((p) => ({ ...p, avatarColor: e.target.value }))}
                  onBlur={(e) => saveColor(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-2 h-5 text-center">
              {state.color?.saving && <span className="text-xs text-ink-muted">Guardando…</span>}
              <Saved show={state.color?.saved} />
              {state.color?.error && <span className="text-xs text-red-600">{state.color.error}</span>}
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6 lg:col-span-2">
          <h2 className="font-semibold text-ink">Datos personales</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nombre" value={profile.name} onChange={setP('name')} />
            <Input label="Teléfono" value={profile.phone} onChange={setP('phone')} />
            <Input label="URL de foto (opcional)" className="sm:col-span-2" value={profile.avatarUrl} onChange={setP('avatarUrl')} placeholder="https://…" />
            <Textarea label="Biografía" className="sm:col-span-2" value={profile.bio} onChange={setP('bio')} placeholder="Estilista especializada en color…" />
          </div>
          <ErrorAlert message={state.profile?.error} />
          <div className="flex items-center justify-end gap-3">
            <Saved show={state.profile?.saved} />
            <Button onClick={saveProfile} loading={state.profile?.saving}>Guardar perfil</Button>
          </div>

          <hr className="border-rosa-100" />
          <h2 className="font-semibold text-ink">Cambiar contraseña</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Contraseña actual" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <Input label="Nueva contraseña" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          </div>
          <ErrorAlert message={state.password?.error} />
          <div className="flex items-center justify-end gap-3">
            <Saved show={state.password?.saved} />
            <Button variant="secondary" onClick={savePassword} loading={state.password?.saving}>Actualizar contraseña</Button>
          </div>
        </Card>
      </div>

      {isOwner && (
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold text-ink">Datos del negocio</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Nombre del salón" value={biz.name} onChange={setB('name')} />
            <Input label="Teléfono" value={biz.phone} onChange={setB('phone')} />
            <Input label="Moneda (código ISO)" value={biz.currency} maxLength={3} onChange={(e) => setBiz({ ...biz, currency: e.target.value.toUpperCase() })} hint="USD, MXN, COP, EUR…" />
            <Input label="Dirección" className="sm:col-span-2" value={biz.address} onChange={setB('address')} />
            <Input label="URL del logo" value={biz.logoUrl} onChange={setB('logoUrl')} placeholder="https://…" />
          </div>
          <ErrorAlert message={state.business?.error} />
          <div className="flex items-center justify-end gap-3">
            <Saved show={state.business?.saved} />
            <Button onClick={saveBusiness} loading={state.business?.saving}>Guardar negocio</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
