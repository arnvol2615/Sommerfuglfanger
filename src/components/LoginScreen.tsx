import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { login } from '../services/supabaseApi';

/**
 * LoginScreen lets the user paste their iNaturalist API token (JWT).
 * Instructions guide them to https://www.inaturalist.org/users/api_token
 */
export function LoginScreen() {
  const { setAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Skriv inn brukernavn.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Call backend login to get session token
      const response = await login(trimmed);
      setAuth(response.sessionToken, response.username);
    } catch {
      setError('Innlogging feilet. Prøv igjen.');
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
        <h2 className="font-semibold text-gray-700">Logg inn</h2>
        <p className="text-sm text-gray-600">
          Skriv inn ditt brukernavn for å starte spillet.
        </p>
        <textarea
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Skriv inn brukernavn…"
          rows={3}
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500 resize-none"
            aria-label="Brukernavn"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-full py-3 transition-colors"
        >
          {loading ? 'Logger inn…' : 'Start spillet'}
        </button>
      </div>

      <p className="text-xs text-gray-400 max-w-xs">
        Tokenet lagres kun på din enhet. Det brukes kun til å sende bilder til iNaturalists gjenkjenningstjeneste.
      </p>
    </div>
  );
}
