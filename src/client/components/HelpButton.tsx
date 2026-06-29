import { useState } from 'react';
import type { JSX } from 'react';

export function HelpButton(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 50,
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid #3a3a4a',
          color: 'var(--text)', fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700,
        }}
      >
        ?
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface)', border: '1px solid #3a3a4a',
              borderRadius: 12, padding: 24, maxWidth: 300, width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', color: 'var(--accent)', fontSize: 15, letterSpacing: 2, fontWeight: 800 }}>
              NASIL OYNANIR?
            </h3>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 2.2 }}>
              <div>🧬 Her gün 3 mutasyon oylanır</div>
              <div>🗳️ En çok oy alan eklenir</div>
              <div>⚠️ Felaketler gelir, hazırlan</div>
              <div>⚔️ Krizi atlatırsan iz kalır</div>
              <div>🏆 30 gün sonra efsane olur</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: '100%', marginTop: 20,
                background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: 8, padding: '10px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
