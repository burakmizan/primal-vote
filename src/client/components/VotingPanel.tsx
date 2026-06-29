import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { DailyVote } from '../../types';
import { MUTATION_MAP } from '../../constants/mutations';

type Props = {
  dailyVote: DailyVote | null;
  userHasVoted: boolean;
  userVotedOptionId: string | null;
  onVote: (optionId: string) => void;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const LABELS = ['A', 'B', 'C'];

export function VotingPanel({ dailyVote, userHasVoted, userVotedOptionId, onVote }: Props): JSX.Element {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!dailyVote) return;
    const tick = () => setRemaining(Math.max(0, dailyVote.endTime - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dailyVote]);

  if (!dailyVote) {
    return (
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 10, margin: '0 16px' }}>
        <p style={{ textAlign: 'center', color: 'var(--warning)', margin: 0, fontSize: 14 }}>
          ⚠️ Oylama askıya alındı
        </p>
      </div>
    );
  }

  const totalVotes = Object.values(dailyVote.voteCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 12, border: '1px solid #2a2a3a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 13, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1 }}>
            GÜN {dailyVote.day} OYLAMASI
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text)', opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>
            ⏱ {formatCountdown(remaining)}
          </span>
        </div>

        {dailyVote.options.map((option, i) => {
          const mutation = MUTATION_MAP[option.mutationId];
          if (!mutation) return null;
          const votes = dailyVote.voteCounts[option.id] ?? 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = userVotedOptionId === option.id;
          const label = LABELS[i] ?? String(i + 1);

          return (
            <div
              key={option.id}
              style={{
                background: isSelected ? 'rgba(57,255,20,0.08)' : '#0c0c16',
                border: `1px solid ${isSelected ? 'var(--accent)' : '#252530'}`,
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      width: 24, height: 24, borderRadius: 4,
                      background: isSelected ? 'var(--accent)' : '#2a2a3a',
                      color: isSelected ? '#000' : 'var(--text)',
                      fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {mutation.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.55, marginTop: 1 }}>
                      {mutation.statChanges.map(sc => `${sc.amount > 0 ? '+' : ''}${sc.amount} ${sc.stat}`).join(' · ')}
                    </div>
                  </div>
                </div>

                {!userHasVoted ? (
                  <button
                    onClick={() => onVote(option.id)}
                    style={{
                      background: 'var(--accent)', color: '#000', border: 'none',
                      borderRadius: 6, padding: '5px 11px', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                    }}
                  >
                    OY VER
                  </button>
                ) : isSelected ? (
                  <span style={{ color: 'var(--accent)', fontSize: 18, flexShrink: 0 }}>✓</span>
                ) : null}
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, background: '#252530', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`, height: '100%',
                      background: isSelected ? 'var(--accent)' : '#4a5a8a',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--text)', opacity: 0.4 }}>{votes} oy</span>
                  <span style={{ fontSize: 10, color: 'var(--text)', opacity: 0.4 }}>{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ textAlign: 'center', marginTop: 2, fontSize: 10, color: 'var(--text)', opacity: 0.3 }}>
          Toplam {totalVotes} oy
        </div>
      </div>
    </div>
  );
}
