import React from 'react';

interface Props {
  session: {
    role: 'student' | 'admin' | null;
    name: string;
    rollNumber: string;
    githubUsername?: string;
  } | null;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<Props> = ({ session, onLogout }) => {
  return (
    <header className="gh-header">
      <div className="gh-header-left">
        <a
          href="https://www.commudle.com/communities/gdg-new-delhi"
          target="_blank"
          rel="noreferrer"
          className="brand-pill"
        >
          <span className="brand-initial">GDG</span>
          <span className="brand-text">GDG MMMUT</span>
        </a>
      </div>
      <div className="gh-header-center">
        <div className="header-title">
          <span className="header-title-main">FOSS Contribution Month</span>
          <span className="header-title-sub">GDG MMMUT</span>
        </div>
      </div>
      <div className="gh-header-right">
        <a
          href="https://en.wikipedia.org/wiki/Madan_Mohan_Malaviya_University_of_Technology"
          target="_blank"
          rel="noreferrer"
          className="brand-pill"
        >
          <span className="brand-initial">M</span>
          <span className="brand-text">MMMUT</span>
        </a>
        {session && (
          <div className="session-pill">
            <span className="session-role">
              {session.role === 'admin' ? 'Admin' : 'Student'}
            </span>
            <span className="session-name">{session.name}</span>
            <button className="gh-button gh-button-secondary" onClick={onLogout}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

