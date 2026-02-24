import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { LeaderboardSection } from './LeaderboardSection';

interface Session {
  role: 'admin';
  name: string;
  rollNumber: string;
  token: string;
}

interface StudentRow {
  id: number;
  name: string;
  rollNumber: string;
  year: string;
  githubUsername: string;
  quizScore: number;
  prCount: number;
}

interface OverviewResponse {
  totalRegistrations: number;
  publishLeaderboard: boolean;
  students: StudentRow[];
  quizLeaderboard: any[];
  prLeaderboard: any[];
}

interface Props {
  session: Session;
}

const YEAR_FILTERS = ['All', '1st', '2nd', '3rd', '4th'] as const;

export const AdminDashboard: React.FC<Props> = ({ session }) => {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingRoll, setSavingRoll] = useState<string | null>(null);
  const [deletingRoll, setDeletingRoll] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { quizScore: string; prCount: string }>>({});

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/overview`, {
        headers: {
          'x-auth-token': session.token,
        },
      });
      const json = (await res.json()) as OverviewResponse;
      setOverview(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [session.token]);

  useEffect(() => {
    if (!overview) return;
    setDrafts((prev) => {
      const next: Record<string, { quizScore: string; prCount: string }> = {};
      for (const s of overview.students) {
        next[s.rollNumber] = {
          quizScore: prev[s.rollNumber]?.quizScore ?? String(s.quizScore ?? 0),
          prCount: prev[s.rollNumber]?.prCount ?? String(s.prCount ?? 0),
        };
      }
      return next;
    });
  }, [overview]);

  const handleTogglePublish = async () => {
    if (!overview) return;
    setToggling(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/publish-leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': session.token,
        },
        body: JSON.stringify({ publish: !overview.publishLeaderboard }),
      });
      const json = await res.json();
      setOverview({ ...overview, publishLeaderboard: json.publishLeaderboard });
      await loadOverview();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Unable to update publish setting.');
    } finally {
      setToggling(false);
    }
  };

  const handleSaveScores = async (rollNumber: string) => {
    const draft = drafts[rollNumber];
    if (!draft) return;
    setSavingRoll(rollNumber);
    setActionError(null);
    try {
      const quizScore = Number(draft.quizScore);
      const prCount = Number(draft.prCount);
      const res = await fetch(`${API_BASE}/api/admin/participant/${encodeURIComponent(rollNumber)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': session.token,
        },
        body: JSON.stringify({
          quizScore: Number.isFinite(quizScore) ? quizScore : 0,
          prCount: Number.isFinite(prCount) ? prCount : 0,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Unable to update participant.');
      }
      await loadOverview();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Unable to update participant.');
    } finally {
      setSavingRoll(null);
    }
  };

  const handleDeleteParticipant = async (rollNumber: string) => {
    const ok = window.confirm(`Delete participant ${rollNumber}? This cannot be undone.`);
    if (!ok) return;
    setDeletingRoll(rollNumber);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/participant/${encodeURIComponent(rollNumber)}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': session.token,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Unable to delete participant.');
      }
      await loadOverview();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Unable to delete participant.');
    } finally {
      setDeletingRoll(null);
    }
  };

  const filteredStudents =
    overview?.students.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.githubUsername && s.githubUsername.toLowerCase().includes(q)) ||
        s.year.toLowerCase().includes(q);
      const matchesYear = yearFilter === 'All' || s.year === yearFilter;
      return matchesSearch && matchesYear;
    }) ?? [];

  return (
    <div className="admin-layout">
      <section className="card card-admin-summary">
        <header className="card-header">
          <div>
            <h2 className="card-title">Admin Overview</h2>
            <p className="card-subtitle">
              High-level stats for GDG MMMUT FOSS Contribution Month.
            </p>
          </div>
        </header>
        {loading && <div className="card-body">Loading admin data…</div>}
        {!loading && overview && (
          <div className="card-body admin-summary-grid">
            <div className="summary-tile">
              <div className="summary-label">Total Registrations</div>
              <div className="summary-value">{overview.totalRegistrations}</div>
            </div>
            <div className="summary-tile">
              <div className="summary-label">Leaderboard Visibility</div>
              <div className="summary-toggle-row">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={overview.publishLeaderboard}
                    onChange={handleTogglePublish}
                    disabled={toggling}
                  />
                  <span className="slider" />
                </label>
                <span className="summary-toggle-text">
                  {overview.publishLeaderboard ? 'Published for students' : 'Hidden from students'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card card-student-list">
        <header className="card-header">
          <div>
            <h2 className="card-title">Participants</h2>
            <p className="card-subtitle">
              Searchable list with filters by year.
            </p>
          </div>
          <div className="card-actions card-actions-row">
            <select
              className="filter-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              {YEAR_FILTERS.map((y) => (
                <option key={y} value={y}>
                  {y === 'All' ? 'All years' : `${y} year`}
                </option>
              ))}
            </select>
            <input
              type="search"
              className="search-input"
              placeholder="Search by name, roll, year, or GitHub…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>
        {loading && <div className="card-body">Loading students…</div>}
        {!loading && overview && (
          <div className="card-body table-wrapper">
            {actionError && <div className="form-error admin-action-error">{actionError}</div>}
            <table className="gh-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Year</th>
                  <th>GitHub Username</th>
                  <th>Quiz Score</th>
                  <th>PR Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.rollNumber}</td>
                    <td>{s.year}</td>
                    <td>
                      <a
                        href={`https://github.com/${s.githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link-gh"
                      >
                        @{s.githubUsername}
                      </a>
                    </td>
                    <td>
                      <input
                        className="table-number-input"
                        type="number"
                        min={0}
                        value={drafts[s.rollNumber]?.quizScore ?? String(s.quizScore ?? 0)}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [s.rollNumber]: {
                              quizScore: e.target.value,
                              prCount: prev[s.rollNumber]?.prCount ?? String(s.prCount ?? 0),
                            },
                          }))
                        }
                        disabled={savingRoll === s.rollNumber || deletingRoll === s.rollNumber}
                      />
                    </td>
                    <td>
                      <input
                        className="table-number-input"
                        type="number"
                        min={0}
                        value={drafts[s.rollNumber]?.prCount ?? String(s.prCount ?? 0)}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [s.rollNumber]: {
                              quizScore: prev[s.rollNumber]?.quizScore ?? String(s.quizScore ?? 0),
                              prCount: e.target.value,
                            },
                          }))
                        }
                        disabled={savingRoll === s.rollNumber || deletingRoll === s.rollNumber}
                      />
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="gh-button gh-button-secondary"
                          onClick={() => handleSaveScores(s.rollNumber)}
                          disabled={savingRoll === s.rollNumber || deletingRoll === s.rollNumber}
                        >
                          {savingRoll === s.rollNumber ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="gh-button gh-button-danger"
                          onClick={() => handleDeleteParticipant(s.rollNumber)}
                          disabled={savingRoll === s.rollNumber || deletingRoll === s.rollNumber}
                        >
                          {deletingRoll === s.rollNumber ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No students match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {overview && (
        <LeaderboardSection
          role="admin"
          adminData={{
            published: overview.publishLeaderboard,
            quizLeaderboard: overview.quizLeaderboard as any,
            prLeaderboard: overview.prLeaderboard as any,
          }}
        />
      )}
    </div>
  );
};

