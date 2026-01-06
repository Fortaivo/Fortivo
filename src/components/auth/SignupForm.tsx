import { useState } from 'react';
import { signUp } from '../../lib/auth';
import { API_BASE_URL } from '../../lib/api';
import { Button } from '../ui/Button';

interface SignupFormProps {
  onSuccess: () => void;
  onSwitch: () => void;
}

export function SignupForm({ onSuccess, onSwitch }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      if (!acceptedTerms) {
        setError('Please accept the terms and conditions');
        return;
      }
      setLoading(true);
      setError(null);
      const result = await signUp({ email, password, acceptedTerms });
      if (API_BASE_URL) {
        // In API mode, user is immediately logged in after signup
        onSuccess();
      } else {
        // In Supabase mode, show verification message
        setVerificationSent(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      setError(message.includes('user_already_exists') ? 'An account with this email already exists' : message);
    } finally {
      setLoading(false);
    }
  }

  if (verificationSent) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Check your email</h2>
        <p className="text-gray-600">
          We've sent you an email with a verification link. Please check your inbox and click the link to verify your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Create an account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            I accept the{' '}
            <a href="/terms/en.html" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
              terms and conditions
            </a>
            {' '}(<a href="/terms/es.html" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">Español</a> | <a href="/terms/pt.html" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">Português</a>)
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}