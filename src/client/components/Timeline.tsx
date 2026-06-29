import type { JSX } from 'react';
import type { MutationRecord, BattleScar, EnvironmentalEventDefinition, LoreEntry } from '../../types';
import { MUTATION_MAP } from '../../constants/mutations';

type Props = {
  history: MutationRecord[];
  battleScars: BattleScar[];
  events: EnvironmentalEventDefinition[];
  loreEntries: LoreEntry[];
  onClose: () => void;
};

export function Timeline({ history, battleScars, events, loreEntries, onClose }: Props): JSX.Element {
  const eventMap = new Map(events.map(e => [e.id, e]));

  type ScarEntry = { scar: BattleScar; eventDef: EnvironmentalEventDefinition | undefined };
  const scarByDay = new Map<number, ScarEntry>(
    battleScars.map(s => [s.day, { scar: s, eventDef: eventMap.get(s.eventId) }])
  );

  const loreByDay = new Map<number, LoreEntry>(
    (loreEntries ?? []).map(l => [l.day, l])
  );

  const sorted = [...history].sort((a, b) => b.day - a.day);

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
          📜 EVRİM TARİHİ
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
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text)', opacity: 0.35 }}>
            Henüz evrim tarihi yok
          </div>
        )}

        {sorted.map(record => {
          const mutation = MUTATION_MAP[record.mutationId];
          const entry = scarByDay.get(record.day);
          const lore = loreByDay.get(record.day);
          const hasScar = !!entry;
          const scarColor = hasScar ? 'var(--scar)' : undefined;

          return (
            <div
              key={record.day}
              style={{
                marginBottom: 8, padding: '10px 12px',
                background: hasScar ? 'rgba(139,105,20,0.12)' : 'var(--surface)',
                border: `1px solid ${hasScar ? 'var(--scar)' : '#2a2a3a'}`,
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.35, marginBottom: 2, letterSpacing: 1 }}>
                    GÜN {record.day}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {mutation?.name ?? record.mutationId}
                  </div>
                  {mutation && (
                    <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, marginTop: 2 }}>
                      {mutation.statChanges.map(sc => `${sc.amount > 0 ? '+' : ''}${sc.amount} ${sc.stat}`).join(' · ')}
                    </div>
                  )}
                  {lore && (
                    <div
                      style={{
                        marginTop: 8, padding: '6px 8px',
                        background: 'rgba(180,130,40,0.10)',
                        border: '1px solid rgba(180,130,40,0.35)',
                        borderRadius: 5,
                      }}
                    >
                      <div style={{ fontSize: 9, color: '#b88228', fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>
                        📜 VAKAYİNAME
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.75, fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{lore.text}"
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text)', opacity: 0.35, marginTop: 3 }}>
                        — {lore.authorId} · {lore.votes} oy
                      </div>
                    </div>
                  )}
                </div>

                {hasScar && entry && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {entry.eventDef && (
                      <div style={{ fontSize: 20 }}>{entry.eventDef.icon}</div>
                    )}
                    <div style={{ fontSize: 11, color: scarColor, fontWeight: 700, marginTop: 2 }}>
                      ⚔️ {entry.scar.eventName}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
