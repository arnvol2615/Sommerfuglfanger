import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { login, register } from '../services/supabaseApi';
import { PrivacyPolicy } from './PrivacyPolicy';

type AuthMode = 'login' | 'register';

const MIN_PASSWORD_LENGTH = 8;

export function LoginScreen() {
  const { setAuth } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

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
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError('Skriv inn e-post.');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        setError('Skriv inn en gyldig e-postadresse.');
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Passord ma vaere minst ${MIN_PASSWORD_LENGTH} tegn.`);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passordene matcher ikke.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = mode === 'login'
        ? await login(trimmedUsername, password)
        : await register(trimmedUsername, email.trim(), password);
      setAuth(response.sessionToken, response.username);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Innlogging feilet. Proev igjen.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isAuthMode = mode === 'login' || mode === 'register';

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 gap-6 text-center">
      <span className="text-6xl">🦋</span>
      <h1 className="text-2xl font-bold text-gray-800">Sommerfuglfanger</h1>
      <p className="text-gray-600 max-w-xs">
        Fotografer norske dagsommerfugler, få dem identifisert automatisk og bygg opp samlingen din!
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full max-w-sm text-left flex flex-col gap-3">
        <h2 className="font-semibold text-gray-700">
          {mode === 'login' && 'Logg inn'}
          {mode === 'register' && 'Opprett bruker'}
        </h2>
        <p className="text-sm text-gray-600">
          {mode === 'login' && 'Logg inn med brukernavn og passord for aa starte spillet.'}
          {mode === 'register' && 'Opprett en ny bruker med brukernavn, e-post og passord.'}
        </p>

        {(
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Brukernavn"
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500"
            aria-label="Brukernavn"
            autoComplete="username"
          />
        )}

        {(mode === 'register') && (
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-post"
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500"
            aria-label="E-post"
            autoComplete="email"
          />
        )}

        {isAuthMode && (
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Passord"
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500"
            aria-label="Passord"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        )}

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
        {message && <p className="text-green-700 text-sm">{message}</p>}

        {isAuthMode && (
          <button
            onClick={handleAuth}
            disabled={loading}
            className="bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-full py-3 transition-colors"
          >
            {loading
              ? (mode === 'login' ? 'Logger inn...' : 'Oppretter bruker...')
              : (mode === 'login' ? 'Logg inn' : 'Opprett bruker')}
          </button>
        )}

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setMessage('');
            }}
            className="text-sm text-green-700 hover:text-green-800"
          >
            Har du ikke bruker? Opprett konto
          </button>
        )}

        {mode === 'register' && (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setMessage('');
            }}
            className="text-sm text-green-700 hover:text-green-800"
          >
            Har du allerede bruker? Logg inn
          </button>
        )}

      </div>

      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => setShowInstall(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>📲 Installer som app</span>
          <span className="text-gray-400 text-xs">{showInstall ? '▲' : '▼'}</span>
        </button>

        {showInstall && (
          <div className="mt-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-sm text-gray-600 space-y-4">
            <div className="space-y-1.5">
              <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                <span>🤖</span> Android (Chrome)
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Trykk på menyknappen <span className="font-mono bg-gray-100 px-1 rounded">⋮</span> øverst til høyre</li>
                <li>Velg <span className="font-medium">«Legg til på startskjermen»</span></li>
                <li>Trykk <span className="font-medium">«Legg til»</span></li>
              </ol>
            </div>

            <div className="border-t border-gray-100" />

            <div className="space-y-1.5">
              <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                <span>🍎</span> iPhone/iPad (Safari)
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Trykk på del-knappen <span className="font-mono bg-gray-100 px-1 rounded">⎋</span> nederst i nettleseren</li>
                <li>Scroll ned og velg <span className="font-medium">«Legg til på Hjem-skjerm»</span></li>
                <li>Trykk <span className="font-medium">«Legg til»</span></li>
              </ol>
              <p className="text-xs text-gray-400">Merk: Åpne siden i Safari, ikke Chrome, for denne muligheten.</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 max-w-xs">
        Sesjonen lagres kun på din enhet.{' '}
        <button
          type="button"
          onClick={() => setShowPrivacy(true)}
          className="underline hover:text-gray-600"
        >
          Personvernerklæring
        </button>
      </p>

      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}
