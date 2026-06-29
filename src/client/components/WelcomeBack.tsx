import type { JSX } from 'react';
import type { CreatureState, DailyVote, UpcomingEventPreview, StatKey } from '../../types';
import { MUTATION_MAP } from '../../constants/mutations';

type Props = {
  creature: CreatureState;
  lastVote: DailyVote | null;
  upcomingEvent: UpcomingEventPreview | null;
  onClose: () => void;
};

const STAT_ICONS: Record<StatKey, string> = {
  heat: '🔥', cold: '❄️', speed: '💨', armor: '🛡️', mind: '🧠', aqua: '💧',
};

export function WelcomeBack({ creature, lastVote, upcomingEvent, onClose }: Props): JSX.Element {
  const winnerId = lastVote?.winnerId;
  const winnerOption = winnerId ? lastVote?.options.find(o => o.id === winnerId) : undefined;
  const winnerMutation = winnerOption ? MUTATION_MAP[winnerOption.mutationId] : null;
  const totalVotes = lastVote
    ? Object.values(lastVote.voteCounts).reduce((a, b) => a + b, 0)
    : 0;
  const domIcon = STAT_ICONS[creature.dominantStat];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 80, padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid #3a3a4a',
          borderRadius: 12, padding: 20, width: '100%', maxWidth: 340,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--accent)', letterSpacing: 1 }}>
            HOŞ GELDİN GERİ
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text)',
              fontSize: 22, cursor: 'pointer', lineHeight: 1, opacity: 0.6,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        {winnerMutation && (
          <div style={{ marginBottom: 10, padding: '10px 12px', background: '#0c0c16', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.45, marginBottom: 4, letterSpacing: 1 }}>
              DÜNKÜ KAZANAN MUTASYON
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{winnerMutation.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.55, marginTop: 2 }}>
              {totalVotes} oy ile kazandı
            </div>
          </div>
        )}

        <div style={{ marginBottom: upcomingEvent ? 10 : 0, padding: '10px 12px', background: '#0c0c16', borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.45, marginBottom: 8, letterSpacing: 1 }}>
            YARATIK DURUMU
          </div>
          <div style={{ display: 'flex', gap: 0, justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24 }}>{domIcon}</div>
              <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, marginTop: 2 }}>Dom. Stat</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Evr. {creature.stage}</div>
              <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, marginTop: 2 }}>Aşama</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--scar)' }}>
                ⚔️ ×{creature.battleScars.length}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, marginTop: 2 }}>Savaş İzi</div>
            </div>
          </div>
        </div>

        {upcomingEvent && (
          <div
            style={{
              padding: '10px 12px', background: '#0c0c16', borderRadius: 8,
              border: '1px solid var(--warning)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 700 }}>
              ⚠️ Yaklaşan: {upcomingEvent.icon} {upcomingEvent.eventName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.55, marginTop: 2 }}>
              {upcomingEvent.daysUntil} gün kaldı
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 16,
            background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 8, padding: 12,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
