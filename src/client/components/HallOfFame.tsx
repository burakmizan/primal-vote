import type { JSX } from 'react';
import type { GenerationRecord } from '../../types';

type Props = {
  generations: GenerationRecord[];
  onClose: () => void;
};

const STAT_ICONS: Record<string, string> = {
  heat: '🔥', cold: '❄️', speed: '💨', armor: '🛡️', mind: '🧠', aqua: '💧',
};

export function HallOfFame({ generations, onClose }: Props): JSX.Element {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 24 }}>
      <div
        style={{
          padding: '12px 16px', background: 'var(--surface)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #2a2a3a',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--accent)', letterSpacing: 1 }}>
          🏆 ŞEREF SALONU
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: '1px solid #3a3a4a',
            color: 'var(--text)', borderRadius: 6, padding: '4px 12px',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          ✕ Kapat
        </button>
      </div>

      <div style={{ padding: '8px 16px' }}>
        {generations.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text)', opacity: 0.35 }}>
            Henüz tamamlanan nesil yok
          </div>
        )}

        {generations.map(gen => {
          const statEntries = Object.entries(gen.finalStats) as [string, number][];
          const top3 = [...statEntries].sort((a, b) => b[1] - a[1]).slice(0, 3);
          const totalCrises = gen.survivalCount + gen.devastatedCount;
          const crisisRate = totalCrises > 0 ? Math.round((gen.survivalCount / totalCrises) * 100) : 100;

          return (
            <div
              key={gen.generationId}
              style={{
                marginBottom: 12, padding: 14, background: 'var(--surface)',
                border: '1px solid #3a3a28', borderRadius: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>
                    {gen.creatureName}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.45, marginTop: 2 }}>
                    Gün {gen.startDay}–{gen.endDay}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text)', opacity: 0.55 }}>
                  <div>{gen.totalVotes} oy</div>
                  <div>{crisisRate}% kriz atlatma</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: gen.battleScars.length > 0 ? 10 : 0 }}>
                {top3.map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      flex: 1, background: '#0c0c16', borderRadius: 6,
                      padding: '8px 4px', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{STAT_ICONS[key] ?? '?'}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{val}</div>
                    <div style={{ fontSize: 9, color: 'var(--text)', opacity: 0.4, marginTop: 1 }}>{key}</div>
                  </div>
                ))}
              </div>

              {gen.battleScars.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--scar)', lineHeight: 1.6 }}>
                  ⚔️ {gen.battleScars.map(s => s.eventName).join(' · ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
