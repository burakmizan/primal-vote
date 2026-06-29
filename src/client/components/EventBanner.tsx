import type { JSX } from 'react';
import type { UpcomingEventPreview } from '../../types';

type Props = {
  event: UpcomingEventPreview | null;
};

const RISK_COLORS: Record<string, string> = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--danger)',
  certain: 'var(--crisis)',
};

export function EventBanner({ event }: Props): JSX.Element | null {
  if (!event) return null;

  const color = RISK_COLORS[event.crisisRisk] ?? 'var(--warning)';
  const isCertain = event.crisisRisk === 'certain';
  const statEntries = Object.entries(event.requiredStats.stats) as [string, number][];

  return (
    <div
      style={{
        margin: '0 16px',
        background: 'var(--surface)',
        border: `1px solid ${color}`,
        borderRadius: 8,
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{event.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{event.eventName}</div>
            <div style={{ fontSize: 11, color, fontWeight: 700 }}>
              {event.daysUntil} GÜN KALDI{isCertain ? ' — KRİZ KESİN' : ''}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text)', opacity: 0.55, flexShrink: 0 }}>
          {statEntries.map(([stat, needed]) => (
            <div key={stat}>{stat} ≥ {needed}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
