import React, { useState } from 'react';

interface Props {
  onSubmit: (identifier: string, password: string) => void;
  loading: boolean;
  error: string | null;
  successMessage?: string | null;
  onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<Props> = ({ onSubmit, loading, error, successMessage, onSwitchToSignup }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(identifier.trim(), password);
  };

  return (
    <section className="card card-auth">
      <h2 className="card-title">Sign in</h2>
      <p className="card-subtitle">
        Use your university email or roll number and password.
      </p>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-field">
          <label htmlFor="identifier">Email or Roll Number</label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="yourroll@mmmut.ac.in or 2021001"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {successMessage && <div className="form-success">{successMessage}</div>}
        {error && <div className="form-error">{error}</div>}
        <button
          type="submit"
          className="gh-button gh-button-primary"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="form-switch">
          Don&apos;t have an account?{' '}
          <button type="button" className="link-button" onClick={onSwitchToSignup}>
            Sign up
          </button>
        </p>
      </form>
    </section>
  );
};

