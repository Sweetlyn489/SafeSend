import { Check, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import type { SafetyCheckResult } from "../types";
import { concernLevelLabel, concernLevelStyles, checkStatusStyles } from "../utils/safetyCheck";

const iconFor = { check: Check, alert: AlertTriangle, info: Info };

export default function SafetyCheck({ result }: { result: SafetyCheckResult }) {
  const levelStyle = concernLevelStyles[result.level];
  const warnings = result.checks.filter((check) => check.status === "warning").length;

  return (
    <div className="card overflow-hidden animate-[fadeIn_200ms_ease-out]">
      <div className={`p-5 md:p-6 ${levelStyle.bg}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-black/5 flex items-center justify-center shrink-0">
            <ShieldCheck size={21} className={levelStyle.text} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.12em] text-ink-soft uppercase">SafeSend Check</p>
            <h2 className="font-heading text-xl font-semibold mt-1 text-ink">
              {warnings ? "Take a second look" : "This payment looks familiar"}
            </h2>
            <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{result.summary}</p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-ink">What we noticed</p>
          <span className={`pill ${levelStyle.bg} ${levelStyle.text}`}>{concernLevelLabel[result.level]}</span>
        </div>
        <ul className="space-y-3">
          {result.checks.map((check, idx) => {
            const style = checkStatusStyles[check.status];
            const Icon = iconFor[style.icon];
            return (
              <li key={idx} className="rounded-xl border border-border bg-surface-soft p-3.5 flex gap-3">
                <div className={`mt-0.5 w-7 h-7 rounded-full ${style.icon === "alert" ? "bg-amber/10" : "bg-beige"} flex items-center justify-center shrink-0`}>
                  <Icon size={15} className={style.text} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{check.title}</p>
                  <p className="text-sm text-ink-soft mt-0.5 leading-relaxed">{check.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-ink-soft mt-4 leading-relaxed">
          SafeSend is a safety checkpoint. It highlights differences in your payment — you decide whether to continue.
        </p>
      </div>
    </div>
  );
}
