import { useState } from 'react';
import type { JSX } from 'react';
import type { GameStatePayload } from '../../types';
import { EVENTS } from '../../constants/events';
import { EVENT_MAP } from '../../constants/events';
import { PhaserGame } from '../phaser/PhaserGame';
import { StatBars } from './StatBars';
import { VotingPanel } from './VotingPanel';
import { EventBanner } from './EventBanner';
import { CrisisView } from './CrisisView';
import { OnboardingOverlay } from './OnboardingOverlay';
import { HelpButton } from './HelpButton';
import { ContextualHint } from './ContextualHint';
import type { HintId } from './ContextualHint';
import { WelcomeBack } from './WelcomeBack';
import { Timeline } from './Timeline';
import { HallOfFame } from './HallOfFame';
import { AdminPanel } from './AdminPanel';

type Tab = 'main' | 'timeline' | 'scars' | 'halloffame' | 'admin';

type Props = {
  gameState: GameStatePayload;
  userVotedOptionId: string | null;
  showWelcomeBack: boolean;
  onVote: (optionId: string) => void;
  onCrisisVote: (vote: string) => void;
  onOnboardingComplete: () => void;
  onHintDismiss: (hintId: HintId) => void;
  onWelcomeBackClose: () => void;
};

function NavButton({
  label, icon, active, onClick,
}: {
  label: string; icon: string; active: boolean; onClick: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: 'none', padding: '4px 10px',
        color: active ? 'var(--accent)' : 'var(--text)',
        opacity: active ? 1 : 0.45,
        fontSize: 9, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        transition: 'opacity 0.2s',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  );
}

// Separate component so `tab: Tab` is the full union type — avoids TS control-flow narrowing
function BottomNav({ tab, onSelect, isMod }: { tab: Tab; onSelect: (t: Tab) => void; isMod: boolean }): JSX.Element {
  return (
    <div
      style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: 375, background: 'var(--surface)',
        borderTop: '1px solid #2a2a3a',
        display: 'flex', justifyContent: 'space-around',
        padding: '6px 0 8px', zIndex: 40,
      }}
    >
      <NavButton label="Tarihçe" icon="📜" active={tab === 'timeline'} onClick={() => onSelect('timeline')} />
      <NavButton label="İzler" icon="⚔️" active={tab === 'scars'} onClick={() => onSelect('scars')} />
      <NavButton label="Hall" icon="🏆" active={tab === 'halloffame'} onClick={() => onSelect('halloffame')} />
      {isMod && (
        <NavButton label="Mod" icon="⚙️" active={tab === 'admin'} onClick={() => onSelect('admin')} />
      )}
    </div>
  );
}

const PHASER_SCALE = 256 / 375;

export function MainView({
  gameState,
  userVotedOptionId,
  showWelcomeBack,
  onVote,
  onCrisisVote,
  onOnboardingComplete,
  onHintDismiss,
  onWelcomeBackClose,
}: Props): JSX.Element {
  const [tab, setTab] = useState<Tab>('main');
  const [statsExpanded, setStatsExpanded] = useState(false);

  const { creature, dailyVote, crisis, userState, upcomingEvent, activeBattleCry } = gameState;
  const userHasVoted = userVotedOptionId !== null;
  const hallOfFame = gameState.hallOfFame ?? [];
  const isMod = gameState.isMod === true;

  const getActiveHint = (): HintId | null => {
    const seen = userState.seenHints;
    if (!seen.includes('first_vote') && dailyVote) return 'first_vote';
    if (!seen.includes('first_event') && upcomingEvent) return 'first_event';
    if (!seen.includes('first_crisis') && creature.isInCrisis) return 'first_crisis';
    if (!seen.includes('first_scar') && creature.battleScars.length > 0) return 'first_scar';
    return null;
  };

  // Priority 1: Onboarding
  if (!userState.hasSeenOnboarding) {
    return <OnboardingOverlay onComplete={onOnboardingComplete} />;
  }

  // Priority 2: Welcome Back
  if (showWelcomeBack) {
    return (
      <WelcomeBack
        creature={creature}
        lastVote={dailyVote}
        upcomingEvent={upcomingEvent}
        onClose={onWelcomeBackClose}
      />
    );
  }

  // Priority 3: Crisis mode
  if (creature.isInCrisis && crisis) {
    const eventDef = EVENT_MAP[crisis.eventId];
    return (
      <div style={{ background: 'var(--bg)', maxWidth: 375, margin: '0 auto' }}>
        <HelpButton />
        <ContextualHint hintId={getActiveHint()} onDismiss={onHintDismiss} />
        {eventDef ? (
          <CrisisView
            crisis={crisis}
            eventDef={eventDef}
            creature={creature}
            activeBattleCry={activeBattleCry}
            onVote={onCrisisVote}
          />
        ) : (
          <div style={{ padding: 24, color: 'var(--danger)', textAlign: 'center' }}>
            Bilinmeyen kriz eventi
          </div>
        )}
      </div>
    );
  }

  // Sub-views (tab !== 'main') — kept in one block to avoid TS narrowing tab→'main' in normal view
  if (tab !== 'main') {
    return (
      <div style={{ background: 'var(--bg)', maxWidth: 375, margin: '0 auto' }}>
        {tab === 'timeline' && (
          <Timeline
            history={creature.mutationHistory}
            battleScars={creature.battleScars}
            events={EVENTS}
            loreEntries={gameState.loreEntries ?? []}
            onClose={() => setTab('main')}
          />
        )}

        {tab === 'scars' && (
          <div style={{ minHeight: '100vh', paddingBottom: 24 }}>
            <div
              style={{
                padding: '12px 16px', background: 'var(--surface)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid #2a2a3a',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--scar)', letterSpacing: 1 }}>
                ⚔️ SAVAŞ İZLERİ
              </h2>
              <button
                onClick={() => setTab('main')}
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
              {creature.battleScars.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text)', opacity: 0.35 }}>
                  Henüz savaş izi yok
                </div>
              ) : (
                creature.battleScars.map(scar => (
                  <div
                    key={scar.id}
                    style={{
                      marginBottom: 8, padding: '12px',
                      background: scar.isFaded ? '#0c0c16' : 'rgba(139,105,20,0.12)',
                      border: `1px solid ${scar.isFaded ? '#2a2a3a' : 'var(--scar)'}`,
                      borderRadius: 8, opacity: scar.isFaded ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--scar)' }}>
                      ⚔️ {scar.eventName}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.45, marginTop: 3 }}>
                      Gün {scar.day} · {scar.crisisType}
                      {scar.isFaded ? ' · Solmuş' : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'halloffame' && (
          <HallOfFame generations={hallOfFame} onClose={() => setTab('main')} />
        )}

        {tab === 'admin' && (
          <AdminPanel onClose={() => setTab('main')} />
        )}
      </div>
    );
  }

  // Priority 4: Normal main screen (tab === 'main')
  return (
    <div style={{ background: 'var(--bg)', maxWidth: 375, margin: '0 auto', paddingBottom: 68, minHeight: '100vh' }}>
      <HelpButton />
      <ContextualHint hintId={getActiveHint()} onDismiss={onHintDismiss} />

      {/* Header */}
      <div
        style={{
          padding: '10px 16px 6px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: 2 }}>
            PRIMAL VOTE
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
            {creature.name}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--text)', opacity: 0.55 }}>Gün {creature.day}</div>
          <div style={{ fontSize: 12, color: 'var(--scar)', fontWeight: 600 }}>
            ⚔️ ×{creature.battleScars.length}
          </div>
        </div>
      </div>

      {/* Phaser Canvas — scaled to 256×256, centered */}
      <div
        style={{
          width: 256, height: 256, overflow: 'hidden',
          margin: '6px auto 0', borderRadius: 10,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 375, height: 400,
            transform: `scale(${PHASER_SCALE})`,
            transformOrigin: 'top left',
            position: 'absolute', top: 0, left: 0,
          }}
        >
          <PhaserGame />
        </div>
      </div>

      {/* Stat Bars */}
      <div style={{ marginTop: 10, marginBottom: 6 }}>
        <StatBars stats={creature.stats} dominantStat={creature.dominantStat} expanded={statsExpanded} />
        <button
          onClick={() => setStatsExpanded(e => !e)}
          style={{
            display: 'block', width: '100%', background: 'transparent',
            border: 'none', color: 'var(--text)', opacity: 0.4,
            fontSize: 11, cursor: 'pointer', padding: '3px 16px', textAlign: 'center',
          }}
        >
          {statsExpanded ? '▲ Daha Az' : '▼ Tümünü Gör'}
        </button>
      </div>

      {/* Event Banner */}
      {upcomingEvent && (
        <div style={{ marginBottom: 8 }}>
          <EventBanner event={upcomingEvent} />
        </div>
      )}

      {/* Voting Panel */}
      <div style={{ marginBottom: 12 }}>
        <VotingPanel
          dailyVote={dailyVote}
          userHasVoted={userHasVoted}
          userVotedOptionId={userVotedOptionId}
          onVote={onVote}
        />
      </div>

      <BottomNav tab={tab} onSelect={setTab} isMod={isMod} />
    </div>
  );
}
