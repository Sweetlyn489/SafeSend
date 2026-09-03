import { useEffect, useState } from "react";

interface Props {
  windowMs: number;
  onExpire: () => void;
  onUndo: () => void;
  undoing: boolean;
}

export default function UndoTimer({ windowMs, onExpire, onUndo, undoing }: Props) {
  const totalSeconds = Math.ceil(windowMs / 1000);
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const progress = remaining / totalSeconds;

  return (
    <div className="card p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-[15px] font-medium text-ink">Need to undo this?</p>
        <p className="text-sm text-ink-soft mt-0.5">
          {remaining} second{remaining === 1 ? "" : "s"} remaining
        </p>
        <div className="h-1 w-40 bg-beige rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-ink transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onUndo}
        disabled={undoing}
        className="btn-secondary whitespace-nowrap disabled:opacity-50"
      >
        {undoing ? "Undoing…" : "Undo payment"}
      </button>
    </div>
  );
}
