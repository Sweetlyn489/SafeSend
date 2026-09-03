import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { api } from "../api";
import type { Recipient, SafetyCheckResult } from "../types";
import RecipientCard from "../components/RecipientCard";
import SafetyCheck from "../components/SafetyCheck";
import PaymentReview from "../components/PaymentReview";
import PinModal from "../components/PinModal";
import UndoTimer from "../components/UndoTimer";
import { formatCurrency } from "../utils/safetyCheck";

type Step = "form" | "safety" | "review" | "success";

export default function SendMoney() {
  const { user, setBalance } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedId = (location.state as { recipientId?: number } | null)?.recipientId;

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientId, setRecipientId] = useState<number | null>(preselectedId ?? null);
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("form");
  const [checking, setChecking] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);

  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [undoWindowMs, setUndoWindowMs] = useState(10000);
  const [undoing, setUndoing] = useState(false);
  const [undone, setUndone] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getRecipients(user.id).then(setRecipients);
  }, [user]);

  if (!user) return null;

  const selectedRecipient = recipients.find((r) => r.id === recipientId) || null;
  const numericAmount = Number(amount);

  const handleContinueFromForm = async () => {
    setFormError(null);
    if (!recipientId) {
      setFormError("Please select a recipient.");
      return;
    }
    if (!amount || numericAmount <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }
    if (numericAmount > user.balance) {
      setFormError("This amount is more than your available balance.");
      return;
    }

    setChecking(true);
    try {
      const result = await api.checkPayment({
        userId: user.id,
        recipientId,
        amount: numericAmount,
      });
      setSafetyResult(result);
      setStep("safety");
    } catch (err: any) {
      setFormError(err.message || "Couldn't run the SafeSend Check right now.");
    } finally {
      setChecking(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    if (!recipientId || !safetyResult) return;
    setPinError(null);
    try {
      const result = await api.confirmPayment({
        userId: user.id,
        recipientId,
        amount: numericAmount,
        pin,
        concernLevel: safetyResult.level,
        concernReasons: safetyResult.checks,
      });
      setBalance(result.balance);
      setTransactionId(result.transaction.id);
      setUndoWindowMs(result.undoWindowMs);
      setShowPin(false);
      setStep("success");
      setTimerActive(true);
    } catch (err: any) {
      setPinError(err.message || "Incorrect PIN. Please try again.");
    }
  };

  const handleUndo = async () => {
    if (!transactionId) return;
    setUndoing(true);
    try {
      const result = await api.undoPayment(transactionId);
      setBalance(result.balance);
      setUndone(true);
      setTimerActive(false);
    } catch {
      // If undo fails (e.g. window passed), just let the timer expire naturally.
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 md:px-8 py-8 md:py-10 pb-24 md:pb-10">
      <h1 className="font-heading text-2xl font-semibold text-ink mb-6">Send money</h1>

      {step === "form" && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-ink-soft mb-2.5">Recipient</p>
            {recipients.length === 0 ? (
              <p className="text-sm text-ink-soft">
                You don't have any saved recipients yet. Add one from the Recipients page.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {recipients.map((r) => (
                  <RecipientCard
                    key={r.id}
                    recipient={r}
                    selected={r.id === recipientId}
                    onClick={() => setRecipientId(r.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="text-sm text-ink-soft block mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">₹</span>
              <input
                id="amount"
                type="number"
                min="1"
                inputMode="decimal"
                className="input-field pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <p className="text-sm text-ink-soft mt-1.5">
              Available balance: {formatCurrency(user.balance)}
            </p>
          </div>

          {formError && <p className="text-sm text-terracotta">{formError}</p>}

          <button
            onClick={handleContinueFromForm}
            disabled={checking}
            className="btn-primary self-start"
          >
            {checking ? "Checking…" : "Continue"}
          </button>
        </div>
      )}

      {step === "safety" && safetyResult && selectedRecipient && (
        <div className="flex flex-col gap-6">
          <SafetyCheck result={safetyResult} />
          <div className="flex gap-3">
            <button onClick={() => setStep("form")} className="btn-secondary">
              Go Back
            </button>
            <button onClick={() => setStep("review")} className="btn-primary">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "review" && safetyResult && selectedRecipient && (
        <div className="flex flex-col gap-6">
          <PaymentReview
            recipient={selectedRecipient}
            amount={numericAmount}
            safetyResult={safetyResult}
          />
          <div className="flex gap-3">
            <button onClick={() => setStep("safety")} className="btn-secondary">
              Go Back
            </button>
            <button onClick={() => setShowPin(true)} className="btn-primary">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "success" && selectedRecipient && (
        <div className="flex flex-col gap-6">
          <div className="card p-6 md:p-7">
            <p className="text-sm text-ink-soft mb-1">
              {undone ? "Payment reversed" : "Payment completed"}
            </p>
            <p className="font-heading text-3xl font-semibold text-ink mb-4">
              {formatCurrency(numericAmount)}
            </p>
            <p className="text-[15px] text-ink">{selectedRecipient.name}</p>
            <p className="text-sm text-ink-soft">{selectedRecipient.upi_id}</p>
            <p className="text-sm text-ink-soft mt-4">
              {undone ? "Reversed just now" : "Completed just now"}
            </p>
          </div>

          {timerActive && !undone && (
            <UndoTimer
              windowMs={undoWindowMs}
              onExpire={() => setTimerActive(false)}
              onUndo={handleUndo}
              undoing={undoing}
            />
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate("/history")} className="btn-secondary">
              View history
            </button>
            <button onClick={() => navigate("/")} className="btn-primary">
              Back to home
            </button>
          </div>
        </div>
      )}

      {showPin && (
        <PinModal
          amount={numericAmount}
          onSubmit={handlePinSubmit}
          onClose={() => {
            setShowPin(false);
            setPinError(null);
          }}
          error={pinError}
        />
      )}
    </div>
  );
}
