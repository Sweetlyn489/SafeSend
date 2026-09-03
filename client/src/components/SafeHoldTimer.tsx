import { ShieldCheck, Timer, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  expiresAt: string;
  onExpire: () => void;
  onCancel: () => void;
  cancelling: boolean;
}

export default function SafeHoldTimer({ expiresAt, onExpire, onCancel, cancelling }: Props) {
  const end = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const total = 10000;
  const [remaining, setRemaining] = useState(Math.max(0, end - Date.now()));
  const expiredRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, end - Date.now());
      setRemaining(next);
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [end, onExpire]);

  const seconds = Math.ceil(remaining / 1000);
  const progress = Math.min(100, Math.max(0, (remaining / total) * 100));

  return (
    <div className="card p-5 md:p-6 border-amber/30 bg-amber/5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
          <ShieldCheck size={21} className="text-amber" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold text-ink">SafeHold is active</p>
            <span className="text-lg font-bold text-amber tabular-nums">{seconds}s</span>
          </div>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            Your money is reserved, but the payment has not been finalized. You can cancel before the timer reaches zero.
          </p>
          <div className="h-2 bg-white rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <button type="button" onClick={onCancel} disabled={cancelling || remaining <= 0}
        className="btn-secondary w-full mt-5 inline-flex justify-center items-center gap-2 border-amber/30">
        <XCircle size={16} />
        {cancelling ? "Cancelling payment…" : "Cancel payment"}
      </button>
      <p className="text-[11px] text-ink-soft text-center mt-3 flex items-center justify-center gap-1">
        <Timer size={12} /> After the hold expires, the payment is automatically finalized.
      </p>
    </div>
  );
}
