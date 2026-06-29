import { useState } from 'react';
import type { JSX } from 'react';

type Props = {
  onComplete: () => void;
};

const SCREENS = [
  {
    icon: '🧬',
    title: 'PRIMAL VOTE',
    subtitle: 'Evrimsel seçimler, kolektif karar',
    body: 'Bu topluluğun yaratığı senin oylarınla evrimleşir. Her gün 3 mutasyon önerilir. En çok oy alan kalıcı olur ve yaratık değişir.',
  },
  {
    icon: '🗳️',
    title: 'NASIL OYNANIR',
    subtitle: 'Günlük 3 mutasyon, 1 kazanan',
    body: 'Her gün farklı evrim seçenekleri sunulur. Topluluğun oyları yaratığın istatistiklerini şekillendirir. Dominant stat arka planı etkiler.',
  },
  {
    icon: '⚔️',
    title: 'KRİZLER & İZLER',
    subtitle: 'Tehlike ve kalıcı miras',
    body: 'Çevre felaketleri geldiğinde normal oylama durur — kriz başlar. Krizi atlatırsan yaratığında kalıcı bir savaş izi kalır. 30 günde efsane olursun.',
  },
];

export function OnboardingOverlay({ onComplete }: Props): JSX.Element {
  const [screen, setScreen] = useState(0);
  const current = SCREENS[screen];
  const isLast = screen === SCREENS.length - 1;

  if (!current) return <div />;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 24,
      }}
    >
      <button
        onClick={onComplete}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'transparent', border: '1px solid #444',
          color: 'var(--text)', borderRadius: 6, padding: '4px 12px',
          fontSize: 12, cursor: 'pointer', opacity: 0.7,
        }}
      >
        Atla
      </button>

      <div style={{ textAlign: 'center', maxWidth: 320, width: '100%' }}>
        <div style={{ fontSize: 72, marginBottom: 20, lineHeight: 1 }}>{current.icon}</div>

        <h2
          style={{
            margin: '0 0 6px', fontSize: 22, fontWeight: 900,
            color: 'var(--accent)', letterSpacing: 2,
          }}
        >
          {current.title}
        </h2>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text)', opacity: 0.55 }}>
          {current.subtitle}
        </p>
        <p style={{ margin: '0 0 36px', fontSize: 15, color: 'var(--text)', lineHeight: 1.65, opacity: 0.9 }}>
          {current.body}
        </p>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {SCREENS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i === screen ? 'var(--accent)' : '#3a3a4a',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {screen > 0 && (
            <button
              onClick={() => setScreen(s => s - 1)}
              style={{
                background: 'transparent', border: '1px solid #3a3a4a',
                color: 'var(--text)', borderRadius: 8, padding: '11px 18px',
                fontSize: 14, cursor: 'pointer',
              }}
            >
              ← Geri
            </button>
          )}
          <button
            onClick={() => (isLast ? onComplete() : setScreen(s => s + 1))}
            style={{
              background: 'var(--accent)', border: 'none', color: '#000',
              borderRadius: 8, padding: '11px 24px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {isLast ? 'Başla! 🚀' : 'İleri →'}
          </button>
        </div>
      </div>
    </div>
  );
}
