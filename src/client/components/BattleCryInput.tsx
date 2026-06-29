import { useState } from 'react';
import type { JSX } from 'react';
import type { BattleCry } from '../../types';

type Props = {
  day: number;
  activeBattleCry: BattleCry | null;
};

export function BattleCryInput({ day, activeBattleCry }: Props): JSX.Element {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedText, setSubmittedText] = useState('');

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await fetch('/api/game/battle-cry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, day }),
      });
    } catch {
      // non-critical
    }
    setSubmittedText(trimmed);
    setSubmitted(true);
  };

  const displayCry = activeBattleCry?.text ?? (submitted ? submittedText : null);

  return (
    <div
      style={{
        margin: '0 16px 8px',
        background: 'var(--surface)',
        border: '1px solid var(--crisis)',
        borderRadius: 8,
        padding: '10px 12px',
      }}
    >
      {displayCry ? (
        <div>
          <div style={{ fontSize: 10, color: 'var(--crisis)', fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
            ⚔️ EN YÜKSEK SAVAŞ ÇIĞLIĞI
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic' }}>"{displayCry}"</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 10, color: 'var(--crisis)', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
            ⚔️ SAVAŞ ÇIĞLIĞINI YAZ!
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={text}
                onChange={e => setText(e.target.value.slice(0, 50))}
                placeholder="Savaş çığlığını yaz!"
                maxLength={50}
                style={{
                  width: '100%', background: '#0c0c16',
                  border: '1px solid #2a2a3a', borderRadius: 6,
                  padding: '7px 36px 7px 8px', color: 'var(--text)',
                  fontSize: 13, outline: 'none',
                }}
              />
              <span
                style={{
                  position: 'absolute', right: 6, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 10, color: 'var(--text)', opacity: 0.35,
                  pointerEvents: 'none',
                }}
              >
                {text.length}/50
              </span>
            </div>
            <button
              onClick={() => void handleSubmit()}
              disabled={!text.trim()}
              style={{
                background: text.trim() ? 'var(--crisis)' : '#2a2a3a',
                color: text.trim() ? '#fff' : '#666',
                border: 'none', borderRadius: 6,
                padding: '8px 12px', fontSize: 12, fontWeight: 700,
                cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0,
              }}
            >
              Gönder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
