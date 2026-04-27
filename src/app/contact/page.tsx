'use client';
import { useState } from 'react';

const CATEGORIES = [
  '掲載情報の修正依頼',
  'ツール掲載希望',
  '広告・ビジネスのご相談',
  'その他',
];

export default function ContactPage() {
  const [category, setCategory] = useState('');
  const [subject,  setSubject]  = useState('');
  const [email,    setEmail]    = useState('');
  const [body,     setBody]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subject || !body) { setError('カテゴリ・件名・本文は必須です'); return; }
    setSending(true); setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, email, body }),
      });
      const data = await res.json();
      if (data.ok) { setDone(true); }
      else setError(data.error ?? '送信に失敗しました');
    } catch {
      setError('エラーが発生しました。時間をおいて再度お試しください。');
    } finally {
      setSending(false);
    }
  };

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--color-bg-sub)',
    border: '1px solid var(--color-border-mid)',
    borderRadius: '2px', color: 'var(--color-text)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <main className="flex-1">
      <article style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Fira Sans, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          お問い合わせ
        </h1>
        <p style={{ color: 'var(--color-text-sub)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.7 }}>
          ご意見・ご要望・掲載情報の修正依頼などはこちらからお送りください。
        </p>

        {done ? (
          <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34D399', borderRadius: '4px', padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34D399', marginBottom: '0.5rem' }}>送信完了しました</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sub)' }}>お問い合わせありがとうございます。内容を確認のうえ対応いたします。</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* カテゴリ */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                カテゴリ <span style={{ color: '#F97316' }}>*</span>
              </label>
              <select value={category} onChange={e => setCategory(e.target.value)} required
                style={{ ...INPUT, cursor: 'pointer' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-mid)'}>
                <option value="">選択してください</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* 件名 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                件名 <span style={{ color: '#F97316' }}>*</span>
              </label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                placeholder="例：ChatGPTの料金情報の修正依頼"
                style={INPUT}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-mid)'} />
            </div>

            {/* メールアドレス */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                メールアドレス <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>（任意・返信が必要な場合）</span>
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                style={INPUT}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-mid)'} />
            </div>

            {/* 本文 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                お問い合わせ内容 <span style={{ color: '#F97316' }}>*</span>
              </label>
              <textarea value={body} onChange={e => setBody(e.target.value)} required
                rows={7} maxLength={2000}
                placeholder="お問い合わせ内容を詳しくお書きください。"
                style={{ ...INPUT, resize: 'vertical', fontFamily: 'Noto Sans JP, sans-serif', lineHeight: 1.7 }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-mid)'} />
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>
                {body.length} / 2000
              </p>
            </div>

            {error && (
              <p style={{ color: '#F97316', fontSize: '0.85rem', padding: '8px 12px', background: 'rgba(249,115,22,0.1)', borderRadius: '2px' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={sending}
              style={{ padding: '12px 32px', background: sending ? '#374151' : 'var(--color-accent)', color: sending ? '#6B7280' : '#000', border: 'none', borderRadius: '2px', fontFamily: 'Fira Sans, sans-serif', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: sending ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
              {sending ? '送信中...' : '送信する'}
            </button>

            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              ご入力いただいた情報は、お問い合わせへの対応のみに使用します。
            </p>
          </form>
        )}
      </article>
    </main>
  );
}
