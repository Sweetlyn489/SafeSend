import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { Recipient, SafetyCheckResult } from "../types";
import { formatCurrency, concernLevelLabel, concernLevelStyles } from "../utils/safetyCheck";

interface Props { recipient: Recipient; amount: number; safetyResult: SafetyCheckResult; }

function initials(name: string) {
  return name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
}

export default function PaymentReview({ recipient, amount, safetyResult }: Props) {
  const levelStyle = concernLevelStyles[safetyResult.level];
  return (
    <div className="space-y-3">
      <div className="card overflow-hidden">
        <div className="p-6 md:p-7 text-center border-b border-border">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-beige flex items-center justify-center text-lg font-semibold text-ink mb-4">
            {initials(recipient.name)}
          </div>
          <p className="text-xs uppercase tracking-[0.12em] font-bold text-ink-soft">You're paying</p>
          <p className="font-heading text-xl font-semibold text-ink mt-1">{recipient.name}</p>
          <p className="text-sm text-ink-soft mt-1">{recipient.upi_id}</p>
          {recipient.profession && <p className="text-xs text-ink-soft mt-2">{recipient.profession}</p>}
        </div>
        <div className="p-6 md:p-7 text-center">
          <p className="text-xs uppercase tracking-[0.12em] font-bold text-ink-soft">Amount</p>
          <p className="font-heading text-4xl font-bold tracking-tight text-ink mt-1">{formatCurrency(amount)}</p>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-sage/10 flex items-center justify-center"><ShieldCheck size={18} className="text-sage" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">SafeSend reviewed this payment</p>
          <p className="text-xs text-ink-soft mt-0.5">{concernLevelLabel[safetyResult.level]} · Please verify the details above.</p>
        </div>
        <CheckCircle2 size={18} className={levelStyle.text} />
      </div>
    </div>
  );
}
