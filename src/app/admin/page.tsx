'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [token,    setToken]    = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(data.error ?? 'ログインに失敗しました');
      }
    } catch {
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0D12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ background: '#1A1D24', border: '1px solid rgba(0,140,237,0.2)', borderTop: '3px solid #008CED', borderRadius: '4px', padding: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', fontWeight: 900, color: '#F0EBE1', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            AI<span style={{ color: '#008CED' }}>/</span>CHRONICLE
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#4A5568', marginBottom: '2rem', fontFamily: 'Fira Sans, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Admin Panel
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#7A8A99', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', color: '#F0EBE1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#008CED'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#7A8A99', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', color: '#F0EBE1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#008CED'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#7A8A99', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Token
              </label>
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', color: '#F0EBE1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#008CED'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <p style={{ color: '#F97316', fontSize: '0.8rem', marginBottom: '1rem', padding: '8px 12px', background: 'rgba(249,115,22,0.1)', borderRadius: '2px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: loading ? '#374151' : '#008CED', color: loading ? '#6B7280' : '#000', border: 'none', borderRadius: '2px', fontFamily: 'Fira Sans, sans-serif', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
