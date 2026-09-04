import { Accessibility, LogOut, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSession } from "../context/SessionContext";
import { DEMO_PIN } from "../data/demoData";
import { formatCurrency } from "../utils/safetyCheck";

export default function Settings() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [inclusiveMode, setInclusiveMode] = useState(() => localStorage.getItem("safesend-inclusive") === "1");

  if (!user) return null;

  const toggleInclusive = () => {
    const next = !inclusiveMode;
    setInclusiveMode(next);
    localStorage.setItem("safesend-inclusive", next ? "1" : "0");
    document.documentElement.classList.toggle("inclusive-mode", next);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-lg mx-auto px-5 md:px-8 py-8 md:py-10 pb-24 md:pb-10">
      <h1 className="font-heading text-2xl font-semibold text-ink mb-6">Settings</h1>

      <div className="card divide-y divide-border mb-6">
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-ink-soft">Name</span>
          <span className="text-[15px] text-ink">{user.name}</span>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-ink-soft">Email</span>
          <span className="text-[15px] text-ink">{user.email}</span>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-ink-soft">Available balance</span>
          <span className="text-[15px] text-ink">{formatCurrency(user.balance)}</span>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-ink-soft">Demo UPI PIN</span>
          <span className="text-[15px] text-ink tracking-widest">{DEMO_PIN}</span>
        </div>
      </div>

      <div className="card p-5 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center"><Accessibility size={19} /></div>
          <div className="flex-1"><p className="text-[15px] font-semibold">Inclusive mode</p><p className="text-xs text-ink-soft mt-1 leading-relaxed">Larger controls and clearer text for easier, more confident payments.</p></div>
          <button type="button" onClick={toggleInclusive} aria-pressed={inclusiveMode} className={`w-11 h-6 rounded-full p-1 transition-colors ${inclusiveMode ? "bg-ink" : "bg-border"}`}><span className={`block w-4 h-4 rounded-full bg-white transition-transform ${inclusiveMode ? "translate-x-5" : ""}`} /></button>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-ink-soft"><Type size={14}/> Designed for users who prefer larger, simpler controls.</div>
      </div>

      <p className="text-sm text-ink-soft mb-6">
        SafeSend is a hackathon prototype. Balances, recipients and PINs are all
        simulated — no real banking data is stored or transmitted.
      </p>

      <button
        onClick={handleLogout}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <LogOut size={16} />
        Switch account
      </button>
    </div>
  );
}
