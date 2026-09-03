import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, History as HistoryIcon, ShieldCheck, Users, WalletCards } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { api } from "../api";
import type { Transaction } from "../types";
import { formatCurrency, formatDate } from "../utils/safetyCheck";

function greeting() { const hour = new Date().getHours(); return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"; }
function initials(name: string) { return name.split(" ").map((x) => x[0]).slice(0,2).join("").toUpperCase(); }

export default function Home() {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (user) api.getTransactions(user.id).then(setTransactions).finally(() => setLoading(false)); }, [user]);
  const stats = useMemo(() => ({ checked: transactions.length, reviewed: transactions.filter(t => t.concern_level && t.concern_level !== "LOW").length }), [transactions]);
  if (!user) return null;

  return <div className="max-w-5xl mx-auto px-5 md:px-8 py-7 md:py-10 pb-28 md:pb-10">
    <div className="flex items-end justify-between gap-4 mb-7"><div><p className="eyebrow">Your payment safety dashboard</p><h1 className="font-heading text-2xl md:text-3xl font-bold mt-1">{greeting()}, {user.name.split(" ")[0]}</h1><p className="text-sm text-ink-soft mt-1">Ready when you are. SafeSend is here for the last-second check.</p></div><Link to="/settings" className="hidden sm:block text-sm text-ink-soft hover:text-ink">Settings →</Link></div>

    <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-4">
      <div className="card p-6 md:p-8 bg-ink text-white border-ink relative overflow-hidden">
        <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full border border-white/10"/><div className="absolute -right-4 -top-8 w-36 h-36 rounded-full border border-white/10"/>
        <div className="relative"><div className="flex items-center gap-2 text-white/65 text-xs font-semibold"><WalletCards size={15}/> AVAILABLE BALANCE</div><p className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-3">{formatCurrency(user.balance)}</p><p className="text-xs text-white/55 mt-2">Simulated demo balance</p><Link to="/send" className="mt-7 btn-primary !bg-white !text-ink hover:!bg-white/90 inline-flex items-center gap-2">Send money <ArrowUpRight size={16}/></Link></div>
      </div>
      <div className="card p-5 md:p-6 flex flex-col justify-between"><div><div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center"><ShieldCheck size={20} className="text-sage"/></div><p className="font-heading text-lg font-bold mt-4">SafeSend protection</p><p className="text-sm text-ink-soft mt-1 leading-relaxed">Every payment gets a quick context check before you authenticate.</p></div><div className="grid grid-cols-2 gap-2 mt-5"><div className="rounded-xl bg-surface-soft p-3"><p className="text-xl font-bold">{stats.checked}</p><p className="text-[11px] text-ink-soft mt-0.5">payments checked</p></div><div className="rounded-xl bg-surface-soft p-3"><p className="text-xl font-bold">{stats.reviewed}</p><p className="text-[11px] text-ink-soft mt-0.5">reviewed closely</p></div></div></div>
    </div>

    <div className="grid grid-cols-2 gap-3 mt-4"><Link to="/recipients" className="card p-4 flex items-center gap-3 hover:bg-surface-soft"><div className="w-9 h-9 rounded-xl bg-beige flex items-center justify-center"><Users size={17}/></div><div><p className="text-sm font-semibold">Recipients</p><p className="text-xs text-ink-soft">Manage payees</p></div></Link><Link to="/history" className="card p-4 flex items-center gap-3 hover:bg-surface-soft"><div className="w-9 h-9 rounded-xl bg-beige flex items-center justify-center"><HistoryIcon size={17}/></div><div><p className="text-sm font-semibold">History</p><p className="text-xs text-ink-soft">View payments</p></div></Link></div>

    <div className="mt-8"><div className="flex items-center justify-between mb-3"><div><p className="eyebrow">Activity</p><h2 className="font-heading text-lg font-bold mt-1">Recent payments</h2></div><Link to="/history" className="text-xs font-semibold text-ink-soft hover:text-ink">View all →</Link></div>
      {loading && <div className="card p-6 text-sm text-ink-soft">Loading activity…</div>}
      {!loading && transactions.length === 0 && <div className="card p-6 text-sm text-ink-soft">No payments yet. Your first SafeSend-protected payment will appear here.</div>}
      {!loading && transactions.length > 0 && <div className="card divide-y divide-border">{transactions.slice(0,6).map(t => <div key={t.id} className="px-4 py-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-beige flex items-center justify-center text-xs font-bold shrink-0">{initials(t.recipient_name)}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate">{t.recipient_name}</p><p className="text-xs text-ink-soft mt-0.5">{formatDate(t.created_at)} · {t.status === "reversed" ? "Reversed" : "Completed"}</p></div><span className={`text-sm font-semibold ${t.status === "reversed" ? "text-ink-soft line-through" : "text-ink"}`}>-{formatCurrency(t.amount)}</span></div>)}</div>}
    </div>
  </div>;
}
