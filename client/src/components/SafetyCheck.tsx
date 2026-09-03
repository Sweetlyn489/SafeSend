import { Check, AlertTriangle, Info } from "lucide-react";
import type { SafetyCheckResult } from "../types";
import { concernLevelLabel, concernLevelStyles, checkStatusStyles } from "../utils/safetyCheck";

const iconFor = {
  check: Check,
  alert: AlertTriangle,
  info: Info,
};

export default function SafetyCheck({ result }: { result: SafetyCheckResult }) {
  const levelStyle = concernLevelStyles[result.level];

  return (
    <div className="card p-5 md:p-6 animate-[fadeIn_200ms_ease-out]">
      <p className="text-xs font-medium tracking-wide text-ink-soft mb-4">PAYMENT CONTEXT</p>

      <ul className="space-y-4">
        {result.checks.map((check, idx) => {
          const style = checkStatusStyles[check.status];
          const Icon = iconFor[style.icon];
          return (
            <li key={idx} className="flex gap-3">
              <Icon size={18} className={`${style.text} mt-0.5 flex-shrink-0`} strokeWidth={2.25} />
              <div>
                <p className="text-[15px] font-medium text-ink">{check.title}</p>
                <p className="text-sm text-ink-soft mt-0.5">{check.message}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border my-5" />

      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${levelStyle.dot}`} />
        <p className={`text-sm font-semibold uppercase tracking-wide ${levelStyle.text}`}>
          {concernLevelLabel[result.level]}
        </p>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{result.summary}</p>
    </div>
  );
}
