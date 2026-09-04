import { Check } from "lucide-react";

type Step = "form" | "safety" | "review" | "hold" | "success";

const steps = [
  ["form", "Recipient"],
  ["safety", "Safety check"],
  ["review", "Review"],
  ["hold", "SafeHold"],
  ["success", "Complete"],
] as const;

export default function PaymentStepper({ current }: { current: Step }) {
  const currentIndex = steps.findIndex(([key]) => key === current);
  return (
    <div className="mb-7" aria-label="Payment progress">
      <div className="flex items-center justify-between gap-1.5">
        {steps.map(([key, label], index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div key={key} className="flex min-w-0 items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`step-dot ${done ? "step-dot-done" : active ? "step-dot-active" : ""}`}>
                  {done ? <Check size={13} strokeWidth={2.5} /> : index + 1}
                </span>
                <span className={`hidden md:block text-xs whitespace-nowrap ${active ? "text-ink font-semibold" : "text-ink-soft"}`}>
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && <div className={`step-line ${done ? "step-line-done" : ""}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
