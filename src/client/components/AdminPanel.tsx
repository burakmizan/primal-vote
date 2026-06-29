import { useState } from 'react';
import type { JSX } from 'react';
import { EVENTS } from '../../constants/events';

type Props = {
  onClose: () => void;
};

const crisisEvents = EVENTS.filter(e => e.crisisType !== null);
const defaultEventId = crisisEvents[0]?.id ?? 'ice_age';

function AdminButton({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color: string;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', background: 'var(--surface)',
        border: `1px solid ${color}`, borderRadius: 8,
        color, padding: '12px 16px', fontSize: 13,
        fontWeight: 600, cursor: 'pointer', textAlign: 'left',
      }}
    >
      {label}
    </button>
  );
}

export function AdminPanel({ onClose }: Props): JSX.Element {
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId);
  const [message, setMessage] = useState('');

  const call = async (path: string, body?: object) => {
    try {
      const res = await fetch(`/internal/menu/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json() as { showToast?: string };
      setMessage(data.showToast ?? '✓ Tamam');
    } catch {
      setMessage('⚠ Hata oluştu');
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 24 }}>
      <div
        style={{
          padding: '12px 16px', background: 'var(--surface)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #2a2a3a',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--warning)', letterSpacing: 1 }}>
          ⚙️ ADMIN PANELİ
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

      {message && (
        <div
          style={{
            padding: '8px 16px', background: 'rgba(57,255,20,0.08)',
            borderBottom: '1px solid #2a3a2a',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--accent)' }}>{message}</span>
        </div>
      )}

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AdminButton
          label="⏩ Günü İlerlet"
          onClick={() => void call('advance-day')}
          color="var(--accent)"
        />
        <AdminButton
          label="🔒 Oylamayı Kapat"
          onClick={() => void call('close-vote')}
          color="var(--warning)"
        />
        <AdminButton
          label="📦 Demo State Yükle"
          onClick={() => void call('load-demo-state')}
          color="var(--text)"
        />
        <AdminButton
          label="⏱ Oylama: 1 Saat"
          onClick={() => void call('set-vote-window-1h')}
          color="var(--text)"
        />

        <div style={{ borderTop: '1px solid #2a2a3a', paddingTop: 10, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.45, letterSpacing: 1 }}>
            KRİZ TETİKLE
          </div>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            style={{
              width: '100%', background: '#0c0c16', border: '1px solid #2a2a3a',
              color: 'var(--text)', borderRadius: 6, padding: '9px 8px',
              fontSize: 13, outline: 'none',
            }}
          >
            {crisisEvents.map(e => (
              <option key={e.id} value={e.id}>{e.icon} {e.name}</option>
            ))}
          </select>
          <AdminButton
            label="🔥 Kriz Tetikle"
            onClick={() => void call('trigger-crisis', { eventId: selectedEventId })}
            color="var(--crisis)"
          />
        </div>
      </div>
    </div>
  );
}
