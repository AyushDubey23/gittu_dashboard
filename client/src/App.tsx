import React, { useEffect, useState } from 'react';
import { API_BASE } from './config';
import { DashboardHeader } from './components/DashboardHeader';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { LeaderboardSection } from './components/LeaderboardSection';
import { AdminDashboard } from './components/AdminDashboard';

type Role = 'student' | 'admin' | null;

interface UserSession {
  role: Role;
  name: string;
  rollNumber: string;
  githubUsername?: string;
  token: string;
}

type AuthView = 'login' | 'signup';

export const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('gdg-foss-session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as UserSession;
        setSession(parsed);
      } catch {
        localStorage.removeItem('gdg-foss-session');
      }
    }
  }, []);

  const handleLogin = async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Unable to login');
      }

      const data = (await res.json()) as UserSession;
      setSession(data);
      localStorage.setItem('gdg-foss-session', JSON.stringify(data));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('gdg-foss-session');
  };

  const handleSignupSuccess = () => {
    setSignupSuccess(true);
    setAuthView('login');
    setError(null);
  };

  return (
    <div className="app-root">
      <DashboardHeader session={session} onLogout={handleLogout} />
      <main className="app-main">
        {!session && authView === 'login' && (
          <LoginForm
            onSubmit={handleLogin}
            loading={loading}
            error={error}
            successMessage={signupSuccess ? 'Account created. Sign in to continue.' : null}
            onSwitchToSignup={() => {
              setAuthView('signup');
              setError(null);
              setSignupSuccess(false);
            }}
          />
        )}
        {!session && authView === 'signup' && (
          <SignupForm
            onSuccess={handleSignupSuccess}
            onSwitchToLogin={() => {
              setAuthView('login');
              setError(null);
            }}
          />
        )}
        {session?.role === 'student' && (
          <LeaderboardSection role="student" />
        )}
        {session?.role === 'admin' && (
          <AdminDashboard session={session as { role: 'admin'; name: string; rollNumber: string; token: string }} />
        )}
      </main>
    </div>
  );
};

