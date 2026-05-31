// src/components/CookieBanner.tsx
'use client';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ai-chronicle-cookie-consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage無効環境では表示しない
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position:     'fixed',
      bottom:       0,
      left:         0,
      right:        0,
      zIndex:       200,
      background:   'rgba(6,15,30,0.97)',
      borderTop:    '1px solid rgba(0,140,237,0.3)',
      padding:      '14px 24px',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'space-between',
      gap:          '1.5rem',
      flexWrap:     'wrap',
    }}>
      <p style={{
        fontFamily: 'Noto Sans JP, sans-serif',
        fontSize:   '0.82rem',
        color:      '#B8C4D0',
        margin:     0,
        lineHeight: 1.7,
        flex:       1,
        minWidth:   '240px',
      }}>
        当サイトでは、サービス向上および広告配信のためにクッキーを使用しています。
        サイトを利用することで、
        <a href="/privacy" style={{ color: '#008CED', textDecoration: 'underline', margin: '0 4px' }}>
          プライバシーポリシー
        </a>
        に同意したものとみなされます。
      </p>
      <button
        onClick={handleAccept}
        style={{
          fontFamily:    'Noto Sans JP, sans-serif',
          fontSize:      '0.82rem',
          fontWeight:    700,
          padding:       '9px 24px',
          background:    '#008CED',
          color:         '#FFFFFF',
          border:        'none',
          borderRadius:  '4px',
          cursor:        'pointer',
          flexShrink:    0,
          whiteSpace:    'nowrap',
        }}
      >
        同意する
      </button>
    </div>
  );
}
