import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { CrisisState, EnvironmentalEventDefinition, CreatureState, BattleCry } from '../../types';
import { BattleCryInput } from './BattleCryInput';

type Props = {
  crisis: CrisisState;
  eventDef: EnvironmentalEventDefinition;
  creature: CreatureState;
  activeBattleCry: BattleCry | null;
  onVote: (vote: string) => void;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TimePressureCrisis({ crisis, onVote }: { crisis: CrisisState; onVote: (v: string) => void }): JSX.Element {
  const [remaining, setRemaining] = useState(Math.max(0, crisis.endTime - Date.now()));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, crisis.endTime - Date.now()));
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [crisis.endTime]);

  const flee = crisis.timePressureVotes?.flee ?? 0;
  const fight = crisis.timePressureVotes?.fight ?? 0;
  const flashColor = tick % 2 === 0 ? 'var(--crisis)' : 'var(--danger)';

  return (
    <div style={{ padding: '0 16px' }}>
      <div
        style={{
          textAlign: 'center', padding: '20px 0',
          fontSize: 44, fontWeight: 900, letterSpacing: 3,
          color: flashColor, transition: 'color 0.5s ease',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatCountdown(remaining)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button
          onClick={() => onVote('flee')}
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #2a1a3e)',
            border: '2px solid var(--warning)', borderRadius: 12,
            padding: '20px 8px', color: 'var(--warning)',
            fontSize: 16, fontWeight: 900, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>🏃</span>
          KAÇ
          <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>{flee} oy</span>
        </button>
        <button
          onClick={() => onVote('fight')}
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #3e1a1a)',
            border: '2px solid var(--danger)', borderRadius: 12,
            padding: '20px 8px', color: 'var(--danger)',
            fontSize: 16, fontWeight: 900, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>⚔️</span>
          DAYAN
          <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>{fight} oy</span>
        </button>
      </div>
    </div>
  );
}

function ParticipationCrisis({ crisis, onVote }: { crisis: CrisisState; onVote: (v: string) => void }): JSX.Element {
  const current = crisis.participationCount ?? 0;
  const required = crisis.participationRequired ?? 100;
  const pct = Math.min(100, (current / Math.max(1, required)) * 100);
  const [remaining, setRemaining] = useState(Math.max(0, crisis.endTime - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, crisis.endTime - Date.now())), 1000);
    return () => clearInterval(id);
  }, [crisis.endTime]);

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text)', opacity: 0.65 }}>
          <span>Katılım</span>
          <span>{current} / {required} ({Math.round(pct)}%)</span>
        </div>
        <div style={{ height: 12, background: '#252530', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--crisis)', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 12, opacity: 0.8 }}>
        Hangi özelliği feda ediyoruz?
      </div>

      {crisis.sacrificeOptions?.map((opt, i) => (
        <button
          key={opt.id}
          onClick={() => onVote(opt.id)}
          style={{
            width: '100%', background: 'var(--surface)',
            border: '1px solid var(--crisis)', borderRadius: 8,
            padding: '12px', color: 'var(--text)', fontSize: 14,
            cursor: 'pointer', marginBottom: 8, textAlign: 'left', fontWeight: 600,
          }}
        >
          {i === 0 ? 'A' : 'B'}: {opt.mutationId}
        </button>
      ))}

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text)', opacity: 0.45, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
        ⏱ Kalan: {formatCountdown(remaining)}
      </div>
    </div>
  );
}

function FactionCrisis({ crisis, onVote }: { crisis: CrisisState; onVote: (v: string) => void }): JSX.Element {
  const factionVotes = crisis.factionVotes ?? {};
  const fleeVotes = factionVotes['flee'] ?? 0;
  const fightVotes = factionVotes['fight'] ?? 0;
  const fleeThreshold = crisis.factionThresholds?.flee ?? 50;
  const fightThreshold = crisis.factionThresholds?.fight ?? 30;
  const fleePct = Math.min(100, (fleeVotes / Math.max(1, fleeThreshold)) * 100);
  const fightPct = Math.min(100, (fightVotes / Math.max(1, fightThreshold)) * 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <button
        onClick={() => onVote('flee')}
        style={{
          background: 'linear-gradient(180deg, #0d1a2a, #060d14)',
          border: 'none', padding: '24px 12px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <span style={{ fontSize: 32 }}>💨</span>
        <span style={{ color: 'var(--warning)', fontSize: 14, fontWeight: 900 }}>KAÇ TAKIMI</span>
        <span style={{ color: 'var(--text)', fontSize: 11, opacity: 0.6 }}>SPEED</span>
        <div style={{ width: '100%' }}>
          <div style={{ height: 6, background: '#252530', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${fleePct}%`, height: '100%', background: 'var(--warning)' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, marginTop: 4, textAlign: 'center' }}>
            {fleeVotes} / {fleeThreshold}
          </div>
        </div>
      </button>

      <button
        onClick={() => onVote('fight')}
        style={{
          background: 'linear-gradient(180deg, #2a0d0d, #140606)',
          border: 'none', padding: '24px 12px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <span style={{ fontSize: 32 }}>🛡️</span>
        <span style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 900 }}>SAVAŞ TAKIMI</span>
        <span style={{ color: 'var(--text)', fontSize: 11, opacity: 0.6 }}>ARMOR</span>
        <div style={{ width: '100%' }}>
          <div style={{ height: 6, background: '#252530', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${fightPct}%`, height: '100%', background: 'var(--danger)' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, marginTop: 4, textAlign: 'center' }}>
            {fightVotes} / {fightThreshold}
          </div>
        </div>
      </button>
    </div>
  );
}

function ChainCrisis({ crisis, onVote }: { crisis: CrisisState; onVote: (v: string) => void }): JSX.Element {
  const currentDay = crisis.chainCurrentDay ?? 1;
  const requiredDays = crisis.chainRequiredDays ?? 2;
  const targetStat = crisis.chainTargetStat;

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--crisis)' }}>
          {currentDay}. GÜN / {requiredDays}. GÜN
        </span>
      </div>

      {targetStat && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.55, marginBottom: 6 }}>
            {targetStat.toUpperCase()} YÜZDESI — %50 EŞİĞİ
          </div>
          <div style={{ position: 'relative', height: 14, background: '#252530', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2,
              background: 'var(--warning)', zIndex: 2, transform: 'translateX(-50%)',
            }} />
            <div style={{ width: '60%', height: '100%', background: 'var(--crisis)', opacity: 0.7 }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text)', opacity: 0.4, marginTop: 4 }}>
            ⚠ eşik
          </div>
        </div>
      )}

      {crisis.chainDayResults && crisis.chainDayResults.length > 0 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
          {crisis.chainDayResults.map((passed, i) => (
            <div
              key={i}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: passed ? 'var(--success)' : 'var(--danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}
            >
              {passed ? '✓' : '✗'}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 12, opacity: 0.65, textAlign: 'center' }}>
        Her gün yeterli oy oranı tutturulmalı
      </div>

      <button
        onClick={() => onVote('participate')}
        style={{
          width: '100%', background: 'var(--crisis)', color: '#000',
          border: 'none', borderRadius: 8, padding: 14,
          fontSize: 14, fontWeight: 900, cursor: 'pointer',
        }}
      >
        ⚡ KATIL
      </button>
    </div>
  );
}

export function CrisisView({ crisis, eventDef, creature, activeBattleCry, onVote }: Props): JSX.Element {
  const showBattleCry = Date.now() - crisis.startTime < 3 * 3_600_000;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', borderTop: '3px solid var(--crisis)' }}>
      <div style={{ padding: '12px 16px', background: '#12001a', borderBottom: '1px solid var(--crisis)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32, flexShrink: 0 }}>{eventDef.icon}</span>
          <div>
            <div style={{ fontSize: 10, color: 'var(--crisis)', fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>
              ⚠️ KRİZ MODU
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
              {creature.name} — {eventDef.name}
            </div>
          </div>
        </div>
      </div>

      {showBattleCry && (
        <div style={{ paddingTop: 8 }}>
          <BattleCryInput day={creature.day} activeBattleCry={activeBattleCry} />
        </div>
      )}

      <div style={{ paddingTop: 16, paddingBottom: 24 }}>
        {crisis.crisisType === 'time_pressure' && <TimePressureCrisis crisis={crisis} onVote={onVote} />}
        {crisis.crisisType === 'participation' && <ParticipationCrisis crisis={crisis} onVote={onVote} />}
        {crisis.crisisType === 'faction' && <FactionCrisis crisis={crisis} onVote={onVote} />}
        {crisis.crisisType === 'chain' && <ChainCrisis crisis={crisis} onVote={onVote} />}
      </div>
    </div>
  );
}
