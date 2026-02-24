import React, { useState } from 'react';
import { API_BASE } from '../config';

interface Props {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const YEARS = ['1st', '2nd', '3rd', '4th'] as const;

export const SignupForm: React.FC<Props> = ({ onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [year, setYear] = useState<string>('1st');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim.endsWith('@mmmut.ac.in')) {
      setError('Please use your university email (@mmmut.ac.in).');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: emailTrim,
          githubUsername: githubUsername.trim().replace(/^@/, ''),
          year,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card card-auth">
      <h2 className="card-title">Create an account</h2>
      <p className="card-subtitle">
        Use your <strong>university email</strong> (@mmmut.ac.in). The part before &quot;@&quot; will be your roll number.
      </p>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-field">
          <label htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="signup-email">University Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="yourroll@mmmut.ac.in"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="signup-github">GitHub Username</label>
          <input
            id="signup-github"
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="username"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="signup-year">Year</label>
          <select
            id="signup-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y} year
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            minLength={6}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button
          type="submit"
          className="gh-button gh-button-primary"
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="form-switch">
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </form>
    </section>
  );
}
