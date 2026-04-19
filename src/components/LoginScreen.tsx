import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { login, register } from '../services/supabaseApi';

type AuthMode = 'login' | 'register';

export function LoginScreen() {
  const { setAuth } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Skriv inn brukernavn.');
      return;
    }
    if (!password) {
      setError('Skriv inn passord.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setError('Passord ma vaere minst 8 tegn.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passordene matcher ikke.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = mode === 'login'
        ? await login(trimmedUsername, password)
        : await register(trimmedUsername, password);
      setAuth(response.sessionToken, response.username);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Innlogging feilet. Proev igjen.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 gap-6 text-center">
      <span className="text-6xl">🦋</span>
      <h1 className="text-2xl font-bold text-gray-800">Sommerfuglfanger</h1>
      <p className="text-gray-600 max-w-xs">
        Fotografer norske dagsommerfugler, få dem identifisert automatisk og bygg opp samlingen din!
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full max-w-sm text-left flex flex-col gap-3">
        <h2 className="font-semibold text-gray-700">{mode === 'login' ? 'Logg inn' : 'Opprett bruker'}</h2>
        <p className="text-sm text-gray-600">
          {mode === 'login'
            ? 'Logg inn med brukernavn og passord for aa starte spillet.'
            : 'Opprett en ny bruker med brukernavn og passord.'}
        </p>

        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Brukernavn"
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500"
          aria-label="Brukernavn"
          autoComplete="username"
        />

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Passord"
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500"
          aria-label="Passord"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {mode === 'register' && (
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Bekreft passord"
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500"
            aria-label="Bekreft passord"
            autoComplete="new-password"
          />
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-full py-3 transition-colors"
        >
          {loading
            ? (mode === 'login' ? 'Logger inn...' : 'Oppretter bruker...')
            : (mode === 'login' ? 'Logg inn' : 'Opprett bruker')}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(prev => prev === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="text-sm text-green-700 hover:text-green-800"
        >
          {mode === 'login'
            ? 'Har du ikke bruker? Opprett konto'
            : 'Har du allerede bruker? Logg inn'}
        </button>
      </div>

      <p className="text-xs text-gray-400 max-w-xs">
        Sesjonen lagres kun paa din enhet.
      </p>
    </div>
  );
}
