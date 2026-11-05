import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorAlert, Input, Select } from '../components/ui';
import AuthShell from './AuthShell';

const CURRENCIES = ['USD', 'MXN', 'COP', 'PEN', 'CLP', 'ARS', 'GTQ', 'EUR', 'DOP', 'HNL', 'CRC'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: '', name: '', email: '', password: '', currency: 'USD' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Crea tu negocio" subtitle="Serás el Dueño y podrás invitar a tu equipo">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Nombre del salón" required value={form.businessName} onChange={set('businessName')} placeholder="Ej. Salón Bella Rosa" />
        <Input label="Tu nombre" required value={form.name} onChange={set('name')} />
        <Input label="Correo" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        <Input label="Contraseña" type="password" autoComplete="new-password" minLength={6} required value={form.password} onChange={set('password')} hint="Mínimo 6 caracteres" />
        <Select label="Moneda" value={form.currency} onChange={set('currency')}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <ErrorAlert message={error} />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Crear cuenta
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-rosa-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
