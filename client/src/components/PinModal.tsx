import { useEffect, useRef, useState } from "react";
import { X, Delete } from "lucide-react";

interface Props {
  amount: number;
  onSubmit: (pin: string) => Promise<void> | void;
  onClose: () => void;
  error?: string | null;
}

const PIN_LENGTH = 6;
const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function PinModal({ amount, onSubmit, onClose, error }: Props) {
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      setPin("");
    }
  }, [error]);

  const press = (key: string) => {
    if (submitting) return;
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "") return;
    if (pin.length >= PIN_LENGTH) return;
    setPin((p) => p + key);
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH && !submitting) {
      setSubmitting(true);
      Promise.resolve(onSubmit(pin)).finally(() => setSubmitting(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (/^[0-9]$/.test(e.key)) press(e.key);
      if (e.key === "Backspace") press("back");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, submitting]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40 px-0 md:px-4 animate-[fadeIn_180ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full md:max-w-sm bg-surface rounded-t-2xl md:rounded-lg border border-border p-6 md:p-7 outline-none animate-[slideUp_220ms_ease-out]"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 id="pin-modal-title" className="font-heading text-lg font-semibold text-ink">
              Confirm payment
            </h2>
            <p className="text-sm text-ink-soft mt-1">
              Enter your 6-digit UPI PIN to send ₹{amount.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-soft hover:text-ink p-1 -m-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center gap-3 mb-2" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-colors duration-150 ${
                i < pin.length ? "bg-ink border-ink" : "border-border"
              }`}
            />
          ))}
        </div>

        <div className="min-h-[20px] text-center mb-4" aria-live="polite">
          {error && <p className="text-sm text-terracotta">{error}</p>}
          {submitting && !error && <p className="text-sm text-ink-soft">Checking PIN…</p>}
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
          {KEYPAD.map((key, idx) =>
            key === "" ? (
              <div key={idx} />
            ) : (
              <button
                key={idx}
                type="button"
                onClick={() => press(key)}
                disabled={submitting}
                aria-label={key === "back" ? "Delete digit" : `Digit ${key}`}
                className="h-14 rounded-md text-lg font-medium text-ink hover:bg-surface-soft active:bg-beige transition-colors duration-150 flex items-center justify-center disabled:opacity-40"
              >
                {key === "back" ? <Delete size={20} /> : key}
              </button>
            )
          )}
        </div>

        <p className="text-xs text-ink-soft text-center mt-5">
          This is a simulated PIN for demo purposes only.
        </p>
      </div>
    </div>
  );
}
