import type { JSX } from 'react';
import type { CreatureStats, StatKey } from '../../types';

type Props = {
  stats: CreatureStats;
  dominantStat: StatKey;
  expanded: boolean;
};

const STAT_ICONS: Record<StatKey, string> = {
  heat: '🔥', cold: '❄️', speed: '💨', armor: '🛡️', mind: '🧠', aqua: '💧',
};
const STAT_NAMES: Record<StatKey, string> = {
  heat: 'Isı', cold: 'Soğuk', speed: 'Hız', armor: 'Zırh', mind: 'Akıl', aqua: 'Su',
};
const ALL_STATS: StatKey[] = ['heat', 'cold', 'speed', 'armor', 'mind', 'aqua'];

export function StatBars({ stats, dominantStat, expanded }: Props): JSX.Element {
  const displayed = expanded ? ALL_STATS : ALL_STATS.slice(0, 3);
  const maxVal = Math.max(...ALL_STATS.map(k => stats[k]), 10);

  return (
    <div style={{ padding: '4px 16px' }}>
      {displayed.map(key => {
        const val = stats[key];
        const pct = Math.min(100, (val / maxVal) * 100);
        const isDominant = key === dominantStat;
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 7, gap: 8 }}>
            <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>
              {STAT_ICONS[key]}
            </span>
            <span style={{ width: 38, fontSize: 11, color: 'var(--text)', opacity: 0.65, flexShrink: 0 }}>
              {STAT_NAMES[key]}
            </span>
            <div style={{ flex: 1, height: 6, background: '#252530', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: isDominant ? 'var(--accent)' : '#4a5a8a',
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                  boxShadow: isDominant ? '0 0 6px var(--accent)' : 'none',
                }}
              />
            </div>
            <span
              style={{
                width: 22,
                textAlign: 'right',
                fontSize: 12,
                fontWeight: isDominant ? 700 : 400,
                color: isDominant ? 'var(--accent)' : 'var(--text)',
                flexShrink: 0,
              }}
            >
              {val}
            </span>
          </div>
        );
      })}
    </div>
  );
}
