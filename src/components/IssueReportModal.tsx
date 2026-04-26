import { useState } from 'react';

type IssueCategory = 'bug' | 'feature' | 'other';

interface IssueReportModalProps {
  currentPage: 'camera' | 'collection' | 'leaderboard';
  onClose: () => void;
  onSubmit: (payload: { title: string; description: string; category: IssueCategory; page: string }) => Promise<{ issue_url: string }>;
}

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  bug: 'Feil',
  feature: 'Forslag',
  other: 'Annet',
};

export function IssueReportModal({ currentPage, onClose, onSubmit }: IssueReportModalProps) {
  const [category, setCategory] = useState<IssueCategory>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issueUrl, setIssueUrl] = useState('');

  async function handleSubmit() {
    if (loading) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length < 6) {
      setError('Tittel må være minst 6 tegn.');
      return;
    }
    if (trimmedDescription.length < 10) {
      setError('Beskrivelse må være minst 10 tegn.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await onSubmit({
        title: trimmedTitle,
        description: trimmedDescription,
        category,
        page: currentPage,
      });
      setIssueUrl(result.issue_url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke sende inn meldingen.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">Meld feil eller forslag</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Lukk</button>
        </div>

        <div className="p-4 space-y-3">
          {issueUrl ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Issue opprettet.{' '}
              <a href={issueUrl} target="_blank" rel="noreferrer" className="underline font-semibold">
                Åpne i GitHub
              </a>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                >
                  {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((value) => (
                    <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tittel</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Kort oppsummering"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Hva skjedde, og hva forventet du?"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm min-h-32"
                  maxLength={4000}
                />
              </div>

              <input
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || Boolean(honeypot.trim())}
                className="w-full bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-full py-3"
              >
                {loading ? 'Sender...' : 'Send til GitHub'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
