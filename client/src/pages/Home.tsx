import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, History as HistoryIcon } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { api } from "../api";
import type { Transaction } from "../types";
import BalanceCard from "../components/BalanceCard";
import { formatCurrency, formatDate } from "../utils/safetyCheck";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .getTransactions(user.id)
      .then((rows) => setTransactions(rows.slice(0, 5)))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-8 md:py-10 pb-24 md:pb-10">
      <h1 className="font-heading text-2xl font-semibold text-ink mb-6">
        {greeting()}, {user.name}
      </h1>

      <BalanceCard balance={user.balance} />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Link
          to="/recipients"
          className="card flex items-center gap-2.5 px-4 py-3.5 hover:bg-surface-soft transition-colors duration-150"
        >
          <Users size={18} className="text-ink-soft" />
          <span className="text-[15px] text-ink">Recipients</span>
        </Link>
        <Link
          to="/history"
          className="card flex items-center gap-2.5 px-4 py-3.5 hover:bg-surface-soft transition-colors duration-150"
        >
          <HistoryIcon size={18} className="text-ink-soft" />
          <span className="text-[15px] text-ink">History</span>
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-ink-soft">Recent activity</h2>
          <Link to="/history" className="text-sm text-ink-soft hover:text-ink transition-colors">
            View all
          </Link>
        </div>

        {loading && <p className="text-sm text-ink-soft">Loading…</p>}

        {!loading && transactions.length === 0 && (
          <p className="text-sm text-ink-soft">
            No payments yet. Once you send money, it will show up here.
          </p>
        )}

        {!loading && transactions.length > 0 && (
          <div className="card divide-y divide-border">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[15px] text-ink truncate">
                    {t.recipient_name}
                    {t.status === "reversed" && (
                      <span className="text-ink-soft font-normal"> · Reversed</span>
                    )}
                  </p>
                  <p className="text-sm text-ink-soft">{formatDate(t.created_at)}</p>
                </div>
                <span
                  className={`text-[15px] font-medium whitespace-nowrap ml-3 ${
                    t.status === "reversed" ? "text-ink-soft line-through" : "text-ink"
                  }`}
                >
                  -{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
