import type { Recipient, SafetyCheckResult } from "../types";
import { formatCurrency, concernLevelLabel, concernLevelStyles } from "../utils/safetyCheck";

interface Props {
  recipient: Recipient;
  amount: number;
  safetyResult: SafetyCheckResult;
}

export default function PaymentReview({ recipient, amount, safetyResult }: Props) {
  const levelStyle = concernLevelStyles[safetyResult.level];

  return (
    <div className="card divide-y divide-border">
      <div className="p-5 md:p-6">
        <p className="text-sm text-ink-soft mb-1">Paying</p>
        <p className="text-[17px] font-medium text-ink">
          {recipient.name}
          {recipient.profession && (
            <span className="text-ink-soft font-normal"> · {recipient.profession}</span>
          )}
        </p>
        <p className="text-sm text-ink-soft mt-0.5">{recipient.upi_id}</p>
      </div>

      <div className="p-5 md:p-6">
        <p className="text-sm text-ink-soft mb-1">Amount</p>
        <p className="font-heading text-2xl font-semibold text-ink">{formatCurrency(amount)}</p>
      </div>

      <div className="p-5 md:p-6 flex items-center justify-between">
        <p className="text-sm text-ink-soft">SafeSend Check</p>
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${levelStyle.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${levelStyle.dot}`} />
          {concernLevelLabel[safetyResult.level]}
        </span>
      </div>
    </div>
  );
}
