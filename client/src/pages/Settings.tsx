import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { DEMO_PIN } from "../data/demoData";
import { formatCurrency } from "../utils/safetyCheck";

export default function Settings() {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  if (!user) return null;

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
