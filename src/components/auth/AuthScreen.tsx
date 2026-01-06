import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { API_BASE_URL } from '../../lib/api';

interface AuthScreenProps {
  onSuccess: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);

  if (API_BASE_URL) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-4">
            {isLogin ? (
              <ApiLogin onSuccess={onSuccess} onSwitch={() => setIsLogin(false)} />
            ) : (
              <ApiSignup onSuccess={onSuccess} onSwitch={() => setIsLogin(true)} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isLogin ? (
            <LoginForm
              onSuccess={onSuccess}
              onSwitch={() => setIsLogin(false)}
            />
          ) : (
            <SignupForm
              onSuccess={onSuccess}
              onSwitch={() => setIsLogin(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ApiLogin({ onSuccess, onSwitch }: { onSuccess: () => void; onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        setLoading(false);
        if (!res.ok) {
          setError('Invalid email or password');
          return;
        }
        onSuccess();
        window.location.reload();
      }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">Sign in</h2>
      {error && <div className="bg-red-50 p-2 text-sm text-red-700 rounded">{error}</div>}
      <input className="w-full border rounded p-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full border rounded p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="flex justify-between items-center">
        <button type="button" className="text-indigo-600 text-sm" onClick={onSwitch}>Create account</button>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </div>
    </form>
  );
}

function ApiSignup({ onSuccess, onSwitch }: { onSuccess: () => void; onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        setLoading(false);
        if (!res.ok) {
          setError('Failed to create account');
          return;
        }
        setOk(true);
        onSuccess();
        window.location.reload();
      }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">Create account</h2>
      {error && <div className="bg-red-50 p-2 text-sm text-red-700 rounded">{error}</div>}
      {ok && <div className="bg-green-50 p-2 text-sm text-green-700 rounded">Account created. You are signed in.</div>}
      <input className="w-full border rounded p-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full border rounded p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="flex justify-between items-center">
        <button type="button" className="text-indigo-600 text-sm" onClick={onSwitch}>Sign in</button>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
      </div>
    </form>
  );
}

import { Logo } from '../layout/Logo';