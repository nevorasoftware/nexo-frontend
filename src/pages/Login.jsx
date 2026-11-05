import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorAlert, Input } from '../components/ui';
import AuthShell from './AuthShell';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Bienvenida de nuevo" subtitle="Ingresa a tu cuenta para continuar">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Correo" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <ErrorAlert message={error} />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Ingresar
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-muted">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-rosa-600 hover:underline">
          Registra tu negocio
        </Link>
      </p>
    </AuthShell>
  );
}
