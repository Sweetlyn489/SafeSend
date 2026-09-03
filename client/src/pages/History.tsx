import { useEffect, useMemo, useState } from "react";
import { useSession } from "../context/SessionContext";
import { api } from "../api";
import type { Transaction } from "../types";
import {
  formatCurrency,
  formatDate,
  formatTime,
  concernLevelLabel,
  concernLevelStyles,
} from "../utils/safetyCheck";

export default function History() {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .getTransactions(user.id)
      .then(setTransactions)
      .catch(() => setError("Couldn't load your transaction history right now."))
      .finally(() => setLoading(false));
  }, [user]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const label = formatDate(t.created_at);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(t);
    }
    return Array.from(map.entries());
  }, [transactions]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-8 md:py-10 pb-24 md:pb-10">
      <h1 className="font-heading text-2xl font-semibold text-ink mb-6">Transaction history</h1>

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {error && <p className="text-sm text-terracotta">{error}</p>}

      {!loading && !error && transactions.length === 0 && (
        <p className="text-sm text-ink-soft">
          No transactions yet. Payments you send will appear here.
        </p>
      )}

      {!loading &&
        groups.map(([label, txns]) => (
          <div key={label} className="mb-7">
            <p className="text-sm font-medium text-ink-soft mb-3">{label}</p>
            <div className="card divide-y divide-border">
              {txns.map((t) => {
                const level = t.concern_level ? concernLevelStyles[t.concern_level] : null;
                return (
                  <div key={t.id} className="flex items-center justify-between px-4 py-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-ink truncate">
                        {t.recipient_name}
                        {t.profession && (
                          <span className="text-ink-soft font-normal"> · {t.profession}</span>
                        )}
                      </p>
                      <p className="text-sm text-ink-soft mt-0.5">
                        {formatTime(t.created_at)}
                        {" · "}
                        {t.status === "reversed" ? "Cancelled" : t.status === "pending_hold" ? "SafeHold" : "Completed"}
                        {t.concern_level && level && (
                          <>
                            {" · "}
                            <span className={level.text}>{concernLevelLabel[t.concern_level]}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className={`text-[15px] font-medium whitespace-nowrap ml-3 ${
                        t.status === "reversed" ? "text-ink-soft line-through" : t.status === "pending_hold" ? "text-amber" : "text-ink"
                      }`}
                    >
                      -{formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
