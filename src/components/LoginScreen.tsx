import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * LoginScreen lets the user paste their iNaturalist API token (JWT).
 * Instructions guide them to https://www.inaturalist.org/users/api_token
 */
export function LoginScreen() {
  const { setAuth } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Lim inn API-tokenet ditt.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Verify the token by fetching /users/me
      const res = await fetch('https://api.inaturalist.org/v1/users/me', {
        headers: { Authorization: trimmed },
      });
      if (!res.ok) throw new Error('Ugyldig token');
      const data = await res.json() as { results: Array<{ login: string }> };
      const username = data.results[0]?.login ?? 'bruker';
      setAuth(trimmed, username);
    } catch {
      setError('Klarte ikke å verifisere token. Sjekk at du kopierte hele tokenet.');
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
        <h2 className="font-semibold text-gray-700">Logg inn med iNaturalist</h2>
        <ol className="text-sm text-gray-600 list-decimal pl-4 space-y-1">
          <li>
            Gå til{' '}
            <a
              href="https://www.inaturalist.org/users/api_token"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline"
            >
              inaturalist.org/users/api_token
            </a>
          </li>
          <li>Logg inn med din iNaturalist-konto</li>
          <li>Kopier tokenet og lim det inn her</li>
        </ol>
        <textarea
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Lim inn API-token her…"
          rows={3}
          className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono focus:outline-none focus:border-green-500 resize-none"
          aria-label="iNaturalist API-token"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-full py-3 transition-colors"
        >
          {loading ? 'Verifiserer…' : 'Start spillet'}
        </button>
      </div>

      <p className="text-xs text-gray-400 max-w-xs">
        Tokenet lagres kun på din enhet. Det brukes kun til å sende bilder til iNaturalists gjenkjenningstjeneste.
      </p>
    </div>
  );
}
