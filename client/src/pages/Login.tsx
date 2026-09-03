import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import { api } from "../api";
import { useSession } from "../context/SessionContext";
import { DEMO_USER_TAGLINES } from "../data/demoData";
import { formatCurrency } from "../utils/safetyCheck";

export default function Login() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const { login } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getUsers()
      .then(setUsers)
      .catch(() => setLoadError("Couldn't load demo users. Is the server running?"));
  }, []);

  const handleSelect = async (user: User) => {
    setLoadingId(user.id);
    try {
      await login(user.id);
      navigate("/");
    } catch {
      setLoadError("Couldn't sign in. Please try again.");
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-2xl font-semibold text-ink">SafeSend</h1>
          <p className="text-sm text-ink-soft mt-1.5">Think before you send.</p>
        </div>

        <p className="text-sm text-ink-soft mb-4 text-center">Choose a demo account to continue</p>

        {loadError && (
          <p className="text-sm text-terracotta text-center mb-4">{loadError}</p>
        )}

        <div className="flex flex-col gap-2.5">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              disabled={loadingId !== null}
              className="card flex items-center justify-between px-5 py-4 text-left hover:bg-surface-soft transition-colors duration-150 disabled:opacity-60"
            >
              <div>
                <p className="text-[15px] font-medium text-ink">{user.name}</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  {DEMO_USER_TAGLINES[user.name] || user.email}
                </p>
              </div>
              <span className="text-sm text-ink-soft whitespace-nowrap ml-4">
                {formatCurrency(user.balance)}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-ink-soft text-center mt-8">
          This is a hackathon prototype. No real accounts, passwords, or banking
          credentials are used.
        </p>
      </div>
    </div>
  );
}
