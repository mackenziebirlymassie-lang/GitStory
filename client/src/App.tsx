import { useState, useEffect, useCallback } from 'react';
import { GitBranch, GitCommit, FileText, Layers, RefreshCw, Clock, ArrowRight, AlertCircle, Copy, Check } from 'lucide-react';

interface RepoOverview {
  repoName: string;
  repoPath: string;
  currentBranch: string;
  totalBranches: number;
  totalCommits: number;
  clean: boolean;
  modifiedFiles: number;
}

interface CommitItem {
  hash: string;
  shortHash: string;
  date: string;
  message: string;
  author_name: string;
  parents: string[];
}

interface ChurnItem {
  path: string;
  churnCount: number;
}

export function App() {
  const [overview, setOverview] = useState<RepoOverview | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [churn, setChurn] = useState<ChurnItem[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<CommitItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'churn'>('timeline');
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchData = useCallback(async (branchToFetch?: string) => {
    setLoading(true);
    setError(null);
    try {
      const branchQuery = branchToFetch ? `?branch=${encodeURIComponent(branchToFetch)}&limit=100` : '?limit=100';

      const [ovRes, brRes, cmRes, chRes] = await Promise.all([
        fetch('/api/overview').then(async (r) => {
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            throw new Error(data.error || `Failed to fetch overview (HTTP ${r.status})`);
          }
          return r.json();
        }),
        fetch('/api/branches').then(async (r) => {
          if (!r.ok) return { current: '', all: [] };
          return r.json();
        }).catch(() => ({ current: '', all: [] })),
        fetch(`/api/commits${branchQuery}`).then(async (r) => {
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            throw new Error(data.error || `Failed to fetch commits (HTTP ${r.status})`);
          }
          return r.json();
        }),
        fetch('/api/churn').then(async (r) => {
          if (!r.ok) return [];
          return r.json();
        }).catch(() => [])
      ]);

      setOverview(ovRes);
      const branchList = Array.isArray(brRes.all) ? brRes.all : [];
      setBranches(branchList);
      if (!selectedBranch && brRes.current) {
        setSelectedBranch(brRes.current);
      }

      const commitList = Array.isArray(cmRes) ? cmRes : [];
      setCommits(commitList);
      setChurn(Array.isArray(chRes) ? chRes : []);

      if (commitList.length > 0) {
        setSelectedCommit(commitList[0]);
      } else {
        setSelectedCommit(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to GitStory server';
      console.error('Failed to fetch repository metadata', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    fetchData(selectedBranch || undefined);
  }, [fetchData, selectedBranch]);

  const handleBranchChange = (newBranch: string) => {
    setSelectedBranch(newBranch);
    fetchData(newBranch);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1800);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', background: '#090d16', color: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Layers style={{ color: '#38bdf8' }} size={24} />
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>GitStory</h1>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#1e293b', borderRadius: '4px', color: '#94a3b8' }}>v0.1.0</span>
          {overview && (
            <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.5rem' }}>
              📁 {overview.repoName}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem' }}>
          {branches.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GitBranch size={16} style={{ color: '#a855f7' }} />
              <select
                value={selectedBranch || overview?.currentBranch || ''}
                onChange={(e) => handleBranchChange(e.target.value)}
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          ) : overview ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
              <GitBranch size={16} style={{ color: '#a855f7' }} /> {overview.currentBranch}
            </span>
          ) : null}

          {overview && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
              <GitCommit size={16} style={{ color: '#38bdf8' }} /> {overview.totalCommits} commits
            </span>
          )}

          <button 
            onClick={() => fetchData(selectedBranch || undefined)} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1.5rem', background: '#0b1120', borderBottom: '1px solid #1e293b' }}>
        <button 
          onClick={() => setActiveTab('timeline')}
          style={{ background: 'none', border: 'none', color: activeTab === 'timeline' ? '#38bdf8' : '#64748b', fontWeight: 600, cursor: 'pointer', paddingBottom: '0.25rem', borderBottom: activeTab === 'timeline' ? '2px solid #38bdf8' : '2px solid transparent' }}
        >
          Interactive Chronicle
        </button>
        <button 
          onClick={() => setActiveTab('churn')}
          style={{ background: 'none', border: 'none', color: activeTab === 'churn' ? '#38bdf8' : '#64748b', fontWeight: 600, cursor: 'pointer', paddingBottom: '0.25rem', borderBottom: activeTab === 'churn' ? '2px solid #38bdf8' : '2px solid transparent' }}
        >
          File Churn & Hotspots
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div style={{ background: '#451a1a', borderBottom: '1px solid #7f1d1d', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => fetchData(selectedBranch || undefined)}
            style={{ background: '#7f1d1d', border: 'none', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {activeTab === 'timeline' ? (
          <>
            {/* Commit Timeline Stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', borderRight: '1px solid #1e293b' }}>
              {commits.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <GitCommit size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>No commits found</p>
                  <p style={{ fontSize: '0.85rem' }}>This branch or repository currently has no recorded commits.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {commits.map((c) => {
                    const isSelected = selectedCommit?.hash === c.hash;
                    return (
                      <div 
                        key={c.hash} 
                        onClick={() => setSelectedCommit(c)}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          background: isSelected ? '#1e293b' : '#0f172a',
                          border: isSelected ? '1px solid #38bdf8' : '1px solid #1e293b',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#0b1329', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#38bdf8' }}>
                            {c.shortHash}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> {formatDate(c.date)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem', color: '#f1f5f9' }}>{c.message}</p>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                          {c.author_name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Commit Details / Inspector Sidebar */}
            <div style={{ width: '420px', padding: '1.5rem', background: '#0b1120', overflowY: 'auto' }}>
              {selectedCommit ? (
                <div>
                  <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Commit Inspector</h3>
                  <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Full SHA</span>
                        <button
                          onClick={() => copyToClipboard(selectedCommit.hash)}
                          style={{ background: 'none', border: 'none', color: copiedHash ? '#4ade80' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                        >
                          {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                          {copiedHash ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: '#38bdf8' }}>{selectedCommit.hash}</code>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Author</div>
                      <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{selectedCommit.author_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Timestamp</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{new Date(selectedCommit.date).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Message</div>
                      <div style={{ fontSize: '0.95rem', color: '#f8fafc', whiteSpace: 'pre-wrap', marginTop: '0.2rem' }}>
                        {selectedCommit.message}
                      </div>
                    </div>
                    {selectedCommit.parents.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Parent Commits</div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          {selectedCommit.parents.map(p => (
                            <span key={p} style={{ fontSize: '0.75rem', background: '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                              {p.substring(0, 7)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', textAlign: 'center', marginTop: '3rem' }}>Select a commit to view details</div>
              )}
            </div>
          </>
        ) : (
          /* File Churn Hotspots View */
          <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: '#f59e0b' }} /> Frequent Churn Hotspots
            </h2>
            {churn.length === 0 ? (
              <div style={{ padding: '2rem', color: '#64748b' }}>No file churn data available.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '800px' }}>
                {churn.map((item) => (
                  <div key={item.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#cbd5e1' }}>{item.path}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', background: '#334155', borderRadius: '999px', color: '#38bdf8' }}>
                        {item.churnCount} edits
                      </span>
                      <ArrowRight size={14} style={{ color: '#64748b' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;