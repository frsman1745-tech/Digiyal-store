import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function OfferCountdown({ offerEndDate, onExpired }) {
  const { direction } = useLanguage();
  const [remaining, setRemaining] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!offerEndDate) return;

    const end = new Date(offerEndDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        setRemaining(null);
        if (onExpired) onExpired();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 7) {
        setRemaining(null);
        return;
      }

      setRemaining({ days, hours, minutes });
    };

    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [offerEndDate]);

  if (expired) {
    const text = direction === 'rtl' ? 'انتهى العرض' : 'Expired';
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
        <span className="text-white font-bold text-lg px-4 py-2 bg-danger/80 rounded-lg">
          {text}
        </span>
      </div>
    );
  }

  if (!remaining) return null;

  const parts = [];
  if (remaining.days > 0) parts.push(`${remaining.days}${direction === 'rtl' ? ' ي' : 'd'}`);
  if (remaining.hours > 0) parts.push(`${remaining.hours}${direction === 'rtl' ? ' س' : 'h'}`);
  parts.push(`${remaining.minutes}${direction === 'rtl' ? ' د' : 'm'}`);

  const label = direction === 'rtl' ? 'ينتهي العرض خلال' : 'Ends in';

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{label}: {parts.join(' ')}</span>
    </div>
  );
}
