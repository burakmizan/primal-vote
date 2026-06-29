import { useEffect, useState } from 'react';
import type { JSX } from 'react';

export type HintId = 'first_vote' | 'first_event' | 'first_crisis' | 'first_scar' | 'devastated';

type Props = {
  hintId: HintId | null;
  onDismiss: (hintId: HintId) => void;
};

const HINT_TEXT: Record<HintId, string> = {
  first_vote: 'Bu mutasyonu seçmek için oy ver! En çok oy alan kazanır.',
  first_event: 'Çevre olayı yaklaşıyor! Doğru mutasyonu seçersen hazırlıklı olursun.',
  first_crisis: 'Kriz Modu! Normal oylama durdu. Talimatları takip et.',
  first_scar: 'Savaş İzi! Bu krizin kalıcı kanıtı yaratığında yaşayacak.',
  devastated: 'Ağır kayıp. Ama generation sıfırlanmaz — geri dönebilirsiniz.',
};

export function ContextualHint({ hintId, onDismiss }: Props): JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<HintId | null>(null);

  useEffect(() => {
    if (!hintId) {
      setVisible(false);
      return;
    }
    setActiveId(hintId);
    setVisible(true);
    const id = setTimeout(() => {
      setVisible(false);
      onDismiss(hintId);
    }, 3000);
    return () => clearTimeout(id);
  }, [hintId, onDismiss]);

  if (!visible || !activeId) return null;

  const text = HINT_TEXT[activeId];

  return (
    <div
      onClick={() => {
        setVisible(false);
        onDismiss(activeId);
      }}
      style={{
        position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 60,
        background: '#0d1a0d', border: '1px solid var(--accent)',
        borderRadius: 8, padding: '12px 16px',
        fontSize: 13, color: 'var(--text)', cursor: 'pointer',
        animation: 'fadeIn 0.3s ease',
        boxShadow: '0 4px 16px rgba(57,255,20,0.15)',
      }}
    >
      💡 {text}
    </div>
  );
}
