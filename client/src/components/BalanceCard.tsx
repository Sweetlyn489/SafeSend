import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/safetyCheck";

export default function BalanceCard({ balance }: { balance: number }) {
  const navigate = useNavigate();

  return (
    <div className="card p-6 md:p-7">
      <p className="text-sm text-ink-soft mb-2">Available balance</p>
      <p className="font-heading text-4xl font-semibold text-ink mb-6">
        {formatCurrency(balance)}
      </p>
      <button
        onClick={() => navigate("/send")}
        className="btn-primary inline-flex items-center gap-2"
      >
        <Send size={16} />
        Send Money
      </button>
    </div>
  );
}
