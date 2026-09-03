import { query } from "./database";

export type ConcernLevel = "LOW" | "MODERATE" | "HIGH";

export interface SafetyResult {
  concernLevel: ConcernLevel;
  score: number;
  checks: {
    familiarRecipient: boolean;
    unusualAmount: boolean;
    unusualTiming: boolean;
    similarRecipient: boolean;
  };
  reasons: string[];
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function similarity(a: string, b: string): number {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return Math.min(x.length, y.length) / Math.max(x.length, y.length);

  const dp = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0));
  for (let i = 0; i <= x.length; i++) dp[i][0] = i;
  for (let j = 0; j <= y.length; j++) dp[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      dp[i][j] = x[i - 1] === y[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[x.length][y.length] / Math.max(x.length, y.length);
}

export async function runSafetyCheck(
  userId: number,
  recipientId: number,
  amount: number
): Promise<SafetyResult> {
  const recipientResult = await query<{ id: number; name: string }>(
    "SELECT id, name FROM recipients WHERE id = $1 AND user_id = $2",
    [recipientId, userId]
  );
  if (recipientResult.rowCount === 0) throw new Error("Recipient not found");

  const history = await query<{ amount: string; created_at: Date }>(
    `SELECT amount, created_at
     FROM transactions
     WHERE user_id = $1 AND recipient_id = $2 AND status <> 'REVERSED'
     ORDER BY created_at DESC`,
    [userId, recipientId]
  );

  const otherRecipients = await query<{ name: string }>(
    `SELECT name FROM recipients WHERE user_id = $1 AND id <> $2`,
    [userId, recipientId]
  );

  const familiarRecipient = history.rowCount > 0;
  let unusualAmount = false;
  if (history.rowCount > 0) {
    const amounts = history.rows.map(r => Number(r.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    unusualAmount = amount > Math.max(max * 2, avg * 3) || amount < Math.min(min / 2, avg / 3);
  }

  let unusualTiming = false;
  if (history.rowCount >= 2) {
    const dates = history.rows.map(r => new Date(r.created_at).getTime()).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) gaps.push(dates[i] - dates[i - 1]);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avgGap > 0) {
      const lastGap = Date.now() - dates[dates.length - 1];
      unusualTiming = lastGap > avgGap * 2.5 || lastGap < avgGap * 0.4;
    }
  }

  const selectedName = recipientResult.rows[0].name;
  const similarRecipient = otherRecipients.rows.some(r => similarity(selectedName, r.name) >= 0.65);

  let score = 0;
  const reasons: string[] = [];
  if (!familiarRecipient) {
    score += 25;
    reasons.push("Recipient is new to your payment history");
  } else {
    reasons.push("Recipient is familiar");
  }
  if (similarRecipient) {
    score += 30;
    reasons.push("A similar saved recipient exists");
  }
  if (unusualAmount) {
    score += 30;
    reasons.push("Amount is much higher or lower than previous payments");
  }
  if (unusualTiming) {
    score += 10;
    reasons.push("Payment timing differs from the usual pattern");
  }

  const concernLevel: ConcernLevel = score <= 20 ? "LOW" : score <= 50 ? "MODERATE" : "HIGH";
  return {
    concernLevel,
    score,
    checks: { familiarRecipient, unusualAmount, unusualTiming, similarRecipient },
    reasons
  };
}
