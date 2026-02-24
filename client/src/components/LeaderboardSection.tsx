import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { ContributionGrid } from './ContributionGrid';

type Role = 'student' | 'admin';

interface QuizRow {
  rank: number;
  name: string;
  rollNumber: string;
  githubUsername: string;
  score: number;
}

interface PrRow {
  rank: number;
  githubUsername: string;
  rollNumber: string;
  prCount: number;
  status: string;
  qualified: boolean;
}

interface LeaderboardResponse {
  published: boolean;
  quizLeaderboard: QuizRow[];
  prLeaderboard: PrRow[];
}

interface Props {
  role: Role;
  adminData?: LeaderboardResponse;
}

type TabKey = 'quiz' | 'pr';

export const LeaderboardSection: React.FC<Props> = ({ role, adminData }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('quiz');
  const [data, setData] = useState<LeaderboardResponse | null>(adminData || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminData) {
      setData(adminData);
      return;
    }
    if (role === 'student') {
      setLoading(true);
      fetch(`${API_BASE}/api/leaderboard`)
        .then((res) => res.json())
        .then((json: LeaderboardResponse) => setData(json))
        .finally(() => setLoading(false));
    }
  }, [role, adminData]);

  const source = adminData || data;

  return (
    <section className="card card-leaderboard">
      <header className="card-header">
        <div>
          <h2 className="card-title">Leaderboard</h2>
          <p className="card-subtitle">
            Quiz performance and real-time FOSS pull request activity.
          </p>
        </div>
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'quiz' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            Quiz Leaderboard
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'pr' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('pr')}
          >
            Pull Request Leaderboard
          </button>
        </div>
      </header>

      {loading && <div className="card-body">Loading leaderboard…</div>}

      {!loading && source && !source.published && role === 'student' && (
        <div className="card-body">
          <p className="muted">
            The leaderboard is currently hidden. Please check back once the organizers publish it.
          </p>
        </div>
      )}

      {!loading && source && source.published && (
        <div className="card-body">
          {activeTab === 'quiz' && (
            <div className="table-wrapper">
              <table className="gh-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Roll Number</th>
                    <th>GitHub</th>
                    <th>Quiz Score</th>
                  </tr>
                </thead>
                <tbody>
                  {source.quizLeaderboard.map((row) => (
                    <tr key={row.rank}>
                      <td>{row.rank}</td>
                      <td>{row.name}</td>
                      <td>{row.rollNumber}</td>
                      <td>
                        <a
                          href={`https://github.com/${row.githubUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="link-gh"
                        >
                          @{row.githubUsername}
                        </a>
                      </td>
                      <td>{row.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'pr' && (
            <div className="table-wrapper">
              <table className="gh-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>GitHub</th>
                    <th>Roll Number</th>
                    <th>PR Count</th>
                    <th>Status</th>
                    <th>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {source.prLeaderboard.map((row) => (
                    <tr key={row.rank} className={row.qualified ? 'row-qualified' : ''}>
                      <td>{row.rank}</td>
                      <td>
                        <div className="pr-user-cell">
                          <a
                            href={`https://github.com/${row.githubUsername}`}
                            target="_blank"
                            rel="noreferrer"
                            className="link-gh"
                          >
                            @{row.githubUsername}
                          </a>
                          {row.qualified && (
                            <span className="badge-qualified">T-Shirt Qualified</span>
                          )}
                        </div>
                      </td>
                      <td>{row.rollNumber}</td>
                      <td>{row.prCount}</td>
                      <td>{row.status}</td>
                      <td>
                        <ContributionGrid seed={row.githubUsername} intensity={row.prCount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

