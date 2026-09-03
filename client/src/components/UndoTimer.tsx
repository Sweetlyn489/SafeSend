import { RotateCcw, Timer } from "lucide-react";
import { useEffect, useState } from "react";

interface Props { windowMs: number; onExpire: () => void; onUndo: () => void; undoing: boolean; }

export default function UndoTimer({ windowMs, onExpire, onUndo, undoing }: Props) {
  const totalSeconds = Math.ceil(windowMs / 1000);
  const [remaining, setRemaining] = useState(totalSeconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onExpire]);
  const progress = remaining / totalSeconds;
  return (
    <div className="card p-4 md:p-5 border-amber/30 bg-amber/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0"><Timer size={19} className="text-amber" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-ink">Undo is available</p>
            <span className="text-sm font-bold text-amber">{remaining}s</span>
          </div>
          <p className="text-xs text-ink-soft mt-0.5">Changed your mind? Reverse this payment before the window closes.</p>
          <div className="h-1.5 bg-white rounded-full mt-3 overflow-hidden"><div className="h-full bg-amber transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} /></div>
        </div>
      </div>
      <button type="button" onClick={onUndo} disabled={undoing} className="btn-secondary w-full mt-4 inline-flex justify-center items-center gap-2 border-amber/30">
        <RotateCcw size={15} />{undoing ? "Reversing payment…" : "Undo payment"}
      </button>
    </div>
  );
}
