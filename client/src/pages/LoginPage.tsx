import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isDemoMode } from '../lib/demoMode';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('ravi@helloweirdough.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/orders');
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-brown p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[14px] bg-brand-card p-8 shadow-card"
      >
        <h1 className="font-display text-2xl text-brand-brown">
          hello<span className="text-brand-amber">weird</span>dough
        </h1>
        <p className="mt-1 text-sm text-brand-muted">Bakery CRM · Faridabad</p>
        {isDemoMode && (
          <p className="mt-2 rounded-lg bg-badge-amber-bg px-2 py-1 text-[10px] text-badge-amber-text">
            Demo mode — sign in with the pre-filled credentials
          </p>
        )}
        <div className="mt-6 space-y-3">
          <label className="block text-xs text-brand-muted">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-brand-brown/10 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-xs text-brand-muted">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-brand-brown/10 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-xs text-badge-red-text">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-amber py-2.5 text-sm font-medium text-brand-brown"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}
