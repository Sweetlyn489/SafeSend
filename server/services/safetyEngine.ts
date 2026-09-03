import { query } from "../database";

export type CheckStatus = "good" | "warning" | "neutral";

export interface SafetyCheckItem {
  type: "recipient" | "amount" | "timing" | "similar";
  status: CheckStatus;
  title: string;
  message: string;
}

export interface SafetyCheckResult {
  level: "LOW" | "MODERATE" | "HIGH";
  score: number;
  checks: SafetyCheckItem[];
  summary: string;
}

interface Recipient {
  id: number;
  user_id: number;
  name: string;
  upi_id: string;
  profession: string | null;
}

interface Transaction {
  id: number;
  amount: string;
  created_at: string;
}

// Simple Levenshtein-based similarity, 0 (different) to 1 (identical).
function stringSimilarity(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const rows = s1.length + 1;
  const cols = s2.length + 1;
  const dist: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dist[i][0] = i;
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  return 1 - dist[rows - 1][cols - 1] / maxLen;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

export async function runSafetyCheck(
  userId: number,
  recipientId: number,
  amount: number
): Promise<SafetyCheckResult> {
  const checks: SafetyCheckItem[] = [];
  let score = 0;

  const recipients = await query<Recipient>(
    "SELECT * FROM recipients WHERE user_id = $1",
    [userId]
  );
  const recipient = recipients.find((r) => r.id === recipientId);
  if (!recipient) {
    throw new Error("Recipient not found");
  }

  const priorTxns = await query<Transaction>(
    `SELECT id, amount, created_at FROM transactions
     WHERE user_id = $1 AND recipient_id = $2 AND status = 'completed'
     ORDER BY created_at ASC`,
    [userId, recipientId]
  );

  // ── A. Familiar recipient ──────────────────────────────
  const isFamiliar = priorTxns.length > 0;
  if (isFamiliar) {
    checks.push({
      type: "recipient",
      status: "good",
      title: "Familiar recipient",
      message: `You've paid ${recipient.name} before.`,
    });
  } else {
    score += 25;
    checks.push({
      type: "recipient",
      status: "warning",
      title: "New recipient",
      message: `You haven't paid ${recipient.name} before.`,
    });
  }

  // ── B. Amount pattern ──────────────────────────────────
  if (priorTxns.length >= 2) {
    const amounts = priorTxns.map((t) => Number(t.amount));
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const avg = mean(amounts);
    const sd = stddev(amounts);
    // Flag as unusual if it's well outside the observed range.
    const threshold = Math.max(avg + 2 * sd, max * 1.5);

    if (amount > threshold || amount > max * 3) {
      score += 30;
      checks.push({
        type: "amount",
        status: "warning",
        title: "Amount is unusual",
        message: `Your previous payments to ${recipient.name} were usually between ₹${Math.round(
          min
        ).toLocaleString("en-IN")} and ₹${Math.round(max).toLocaleString("en-IN")}.`,
      });
    } else {
      checks.push({
        type: "amount",
        status: "good",
        title: "Amount looks familiar",
        message: `This is in line with your usual payments to ${recipient.name}.`,
      });
    }
  } else if (priorTxns.length === 1) {
    const prev = Number(priorTxns[0].amount);
    if (amount > prev * 3) {
      score += 20;
      checks.push({
        type: "amount",
        status: "warning",
        title: "Amount is higher than last time",
        message: `Your last payment to ${recipient.name} was ₹${Math.round(prev).toLocaleString(
          "en-IN"
        )}.`,
      });
    } else {
      checks.push({
        type: "amount",
        status: "good",
        title: "Amount looks familiar",
        message: `This is close to your last payment to ${recipient.name}.`,
      });
    }
  } else {
    checks.push({
      type: "amount",
      status: "neutral",
      title: "No amount history yet",
      message: `This is your first payment to ${recipient.name}, so there's no pattern to compare yet.`,
    });
  }

  // ── C. Timing pattern ───────────────────────────────────
  // Based on the recurring interval between past payments (not calendar
  // day-of-month), so it stays meaningful no matter what today's date is.
  if (priorTxns.length >= 2) {
    const dates = priorTxns.map((t) => new Date(t.created_at).getTime());
    const gapsDays: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gapsDays.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const avgGap = mean(gapsDays);
    const gapSpread = stddev(gapsDays);
    // Require at least two observed gaps (three payments) before treating the
    // cadence as established — a single gap isn't enough to call it "regular".
    const isRegular = gapsDays.length >= 2 && avgGap >= 3 && gapSpread <= avgGap * 0.4;

    if (isRegular) {
      const lastDate = dates[dates.length - 1];
      const daysSinceLast = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
      const diff = Math.abs(daysSinceLast - avgGap);

      if (diff > 7) {
        score += 10;
        const early = daysSinceLast < avgGap;
        checks.push({
          type: "timing",
          status: "warning",
          title: "Timing is different",
          message: early
            ? `You usually pay ${recipient.name} about every ${Math.round(
                avgGap
              )} days, but it's only been ${Math.round(daysSinceLast)} since your last payment.`
            : `You usually pay ${recipient.name} about every ${Math.round(
                avgGap
              )} days, and it's been ${Math.round(daysSinceLast)} since your last payment.`,
        });
      } else {
        checks.push({
          type: "timing",
          status: "good",
          title: "Timing looks familiar",
          message: `You usually make this payment around this time.`,
        });
      }
    } else {
      checks.push({
        type: "timing",
        status: "neutral",
        title: "No regular pattern",
        message: `Your past payments to ${recipient.name} don't follow a fixed schedule.`,
      });
    }
  } else {
    checks.push({
      type: "timing",
      status: "neutral",
      title: "Not enough history",
      message: `There isn't enough history with ${recipient.name} to compare timing yet.`,
    });
  }

  // ── D. Similar recipient ────────────────────────────────
  const others = recipients.filter((r) => r.id !== recipientId);
  let mostSimilar: { name: string; score: number } | null = null;
  for (const other of others) {
    const sim = stringSimilarity(recipient.name, other.name);
    if (sim >= 0.6 && (!mostSimilar || sim > mostSimilar.score)) {
      mostSimilar = { name: other.name, score: sim };
    }
  }

  if (mostSimilar) {
    score += 30;
    checks.push({
      type: "similar",
      status: "warning",
      title: "Similar recipient found",
      message: `You also have a saved recipient named ${mostSimilar.name}.`,
    });
  } else {
    checks.push({
      type: "similar",
      status: "good",
      title: "No similar recipient found",
      message: "No closely matching recipient was found.",
    });
  }

  // ── Concern level ────────────────────────────────────────
  let level: SafetyCheckResult["level"] = "LOW";
  if (score >= 51) level = "HIGH";
  else if (score >= 21) level = "MODERATE";

  let summary = "This payment looks consistent with your usual activity.";
  if (level === "MODERATE") {
    summary = isFamiliar
      ? "This recipient is familiar, but something about this payment is different from usual."
      : "A few things about this payment are worth a second look before you continue.";
  } else if (level === "HIGH") {
    summary =
      "Several things about this payment are unusual. Take a moment to double-check the details before continuing.";
  }

  return { level, score, checks, summary };
}
