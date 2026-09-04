import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Search, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { api } from "../api";
import type { Recipient, SafetyCheckResult } from "../types";
import RecipientCard from "../components/RecipientCard";
import SafetyCheck from "../components/SafetyCheck";
import PaymentReview from "../components/PaymentReview";
import PinModal from "../components/PinModal";
import SafeHoldTimer from "../components/SafeHoldTimer";
import PaymentStepper from "../components/PaymentStepper";
import { formatCurrency } from "../utils/safetyCheck";

type Step = "form" | "safety" | "review" | "hold" | "success";

export default function SendMoney() {
  const { user, setBalance } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedId = (location.state as { recipientId?: number } | null)?.recipientId;
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientId, setRecipientId] = useState<number | null>(preselectedId ?? null);
  const [newRecipient, setNewRecipient] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUpi, setNewUpi] = useState("");
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [checking, setChecking] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [holdComplete, setHoldComplete] = useState(false);

  useEffect(() => { if (user) api.getRecipients(user.id).then(setRecipients); }, [user]);
  if (!user) return null;

  const selectedRecipient = recipients.find((r) => r.id === recipientId) || null;
  const numericAmount = Number(amount);

  const chooseNew = () => {
    setRecipientId(null); setNewRecipient(true); setFormError(null);
  };

  const handleContinueFromForm = async () => {
    setFormError(null);
    let id = recipientId;
    if (newRecipient) {
      if (!newName.trim() || !newUpi.trim()) return setFormError("Enter the recipient's name and UPI ID.");
      setResolving(true);
      try {
        const r = await api.resolveRecipient({ userId: user.id, name: newName.trim(), upiId: newUpi.trim() });
        setRecipients((current) => [...current, r]);
        id = r.id;
        setRecipientId(r.id);
        setNewRecipient(false);
      } catch (err: any) { setFormError(err.message || "Couldn't verify this recipient."); return; }
      finally { setResolving(false); }
    }
    if (!id) return;
    if (!amount || numericAmount <= 0) return setFormError("Enter an amount greater than zero.");
    if (numericAmount > user.balance) return setFormError("This amount is more than your available balance.");
    setChecking(true);
    try {
      const result = await api.checkPayment({ userId: user.id, recipientId: id, amount: numericAmount });
      setSafetyResult(result); setStep("safety");
    } catch (err: any) { setFormError(err.message || "Couldn't run the SafeSend Check right now."); }
    finally { setChecking(false); }
  };

  const handlePinSubmit = async (pin: string) => {
    if (!recipientId || !safetyResult) return;
    setPinError(null);
    try {
      const result = await api.confirmPayment({
        userId: user.id, recipientId, amount: numericAmount, pin,
        concernLevel: safetyResult.level, concernReasons: safetyResult.checks
      });
      setBalance(result.balance);
      setTransactionId(result.transaction.id);
      setHoldExpiresAt(result.holdExpiresAt);
      setShowPin(false);
      setStep("hold");
    } catch (err: any) { setPinError(err.message || "Incorrect PIN. Please try again."); }
  };

  const handleFinalize = useCallback(async () => {
    if (!transactionId || holdComplete) return;
    try {
      await api.finalizePayment(transactionId);
      setHoldComplete(true);
      setStep("success");
    } catch (err: any) {
      if (err?.message === "SafeHold is still active.") return;
      setFormError(err?.message || "Couldn't finalize the payment.");
    }
  }, [transactionId, holdComplete]);

  const handleCancel = async () => {
    if (!transactionId) return;
    setCancelling(true);
    try {
      const result = await api.cancelPayment(transactionId);
      setBalance(result.balance);
      setStep("success");
      setHoldComplete(false);
    } catch (err: any) {
      setFormError(err.message || "The SafeHold window has expired.");
    } finally { setCancelling(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-7 md:py-10 pb-28 md:pb-10">
      <div className="flex items-center justify-between mb-2">
        <div><p className="eyebrow">Secure payment</p><h1 className="font-heading text-2xl md:text-3xl font-bold mt-1">Send money</h1></div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-soft"><LockKeyhole size={14}/> Protected by SafeSend</div>
      </div>
      <p className="text-sm text-ink-soft mb-6">Check the payment first, then SafeHold gives you a final cancellation window.</p>
      <PaymentStepper current={step} />

      {step === "form" && <div className="space-y-5 animate-[fadeIn_200ms_ease-out]">
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-sm font-semibold text-ink">1. Who are you paying?</p><p className="text-xs text-ink-soft mt-1">{newRecipient ? "Enter the person directly — you don't have to save them." : "Choose a saved recipient or send to someone new."}</p></div>
            <span className="pill bg-beige text-ink-soft">{recipients.length} saved</span>
          </div>

          {!newRecipient ? (
            <>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input className="input-field pl-10" placeholder="Search saved recipients" aria-label="Search saved recipients"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="grid gap-2">
                {recipients.map((r) => <div key={r.id} data-recipient-name={r.name.toLowerCase()}><RecipientCard recipient={r} selected={r.id === recipientId} onClick={() => setRecipientId(r.id)} /></div>)}
              </div>
              <button type="button" onClick={chooseNew} className="btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2">
                <UserPlus size={16}/> Send to someone new
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div><label htmlFor="new-name" className="text-sm text-ink-soft block mb-1.5">Recipient name</label><input id="new-name" className="input-field" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Ananya Joseph" /></div>
              <div><label htmlFor="new-upi" className="text-sm text-ink-soft block mb-1.5">UPI ID</label><input id="new-upi" className="input-field" value={newUpi} onChange={e=>setNewUpi(e.target.value)} placeholder="e.g. ananya@upi" /></div>
              <div className="rounded-xl bg-amber/10 border border-amber/20 p-3 text-xs text-ink-soft"><strong className="text-ink">Not saving them?</strong> That's fine. SafeSend will use these details for this payment without adding them to your saved recipient list.</div>
              <button type="button" onClick={()=>{setNewRecipient(false);setFormError(null)}} className="text-sm text-ink-soft hover:text-ink">← Choose a saved recipient instead</button>
            </div>
          )}
        </div>

        <div className="card p-5 md:p-6">
          <p className="text-sm font-semibold text-ink">2. How much?</p>
          <div className="relative mt-4"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-ink-soft">₹</span><input id="amount" type="number" min="1" inputMode="decimal" className="input-field pl-9 text-lg font-semibold" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" aria-label="Payment amount" /></div>
          <div className="flex justify-between mt-2 text-xs text-ink-soft"><span>Available balance</span><span className="font-semibold text-ink">{formatCurrency(user.balance)}</span></div>
          {formError && <div className="mt-3 rounded-xl bg-terracotta/10 px-3.5 py-3 text-sm text-terracotta">{formError}</div>}
        </div>
        <button onClick={handleContinueFromForm} disabled={checking || resolving || (!newRecipient && recipients.length === 0)} className="btn-primary w-full inline-flex items-center justify-center gap-2">
          {resolving ? "Verifying recipient…" : checking ? "Checking your payment…" : <>Run SafeSend Check <ArrowRight size={16}/></>}
        </button>
      </div>}

      {step === "safety" && safetyResult && selectedRecipient && <div className="space-y-5 animate-[fadeIn_200ms_ease-out]">
        <div className="rounded-2xl bg-surface-soft border border-border p-4 flex items-center gap-3"><Sparkles size={18} className="text-sage"/><p className="text-sm text-ink"><strong>Before you send:</strong> SafeSend compared this payment with your usual patterns.</p></div>
        <SafetyCheck result={safetyResult}/>
        <div className="flex gap-3"><button onClick={() => setStep("form")} className="btn-secondary inline-flex items-center gap-2"><ArrowLeft size={16}/> Back</button><button onClick={() => setStep("review")} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">I've checked — Continue <ArrowRight size={16}/></button></div>
      </div>}

      {step === "review" && safetyResult && selectedRecipient && <div className="space-y-5 animate-[fadeIn_200ms_ease-out]">
        <PaymentReview recipient={selectedRecipient} amount={numericAmount} safetyResult={safetyResult}/>
        <div className="rounded-xl bg-beige/60 p-4 text-sm text-ink-soft flex gap-3"><CheckCircle2 size={18} className="text-sage shrink-0"/><span><strong className="text-ink">Last check:</strong> confirm the recipient name, UPI ID and amount before entering your PIN.</span></div>
        <div className="flex gap-3"><button onClick={() => setStep("safety")} className="btn-secondary inline-flex items-center gap-2"><ArrowLeft size={16}/> Back</button><button onClick={() => setShowPin(true)} className="btn-primary flex-1 inline-flex items-center justify-center gap-2"><LockKeyhole size={16}/> Continue to PIN</button></div>
      </div>}

      {step === "hold" && selectedRecipient && holdExpiresAt && <div className="space-y-5 animate-[fadeIn_200ms_ease-out]">
        <div className="card p-6 md:p-7 bg-ink text-white border-ink">
          <div className="flex items-center gap-2 text-white/65 text-xs font-semibold uppercase tracking-[.14em]"><ShieldCheck size={16}/> Payment protected</div>
          <p className="font-heading text-3xl font-bold mt-3">{formatCurrency(numericAmount)}</p>
          <p className="text-sm text-white/65 mt-1">to {selectedRecipient.name}</p>
          <div className="mt-5 rounded-xl bg-white/10 p-4 text-sm text-white/80 leading-relaxed">
            <strong className="text-white">Your money is reserved.</strong> The transfer command is waiting in SafeHold. Cancel it now, or let the safety window expire to finalize the demo transfer.
          </div>
        </div>
        <SafeHoldTimer expiresAt={holdExpiresAt} onExpire={handleFinalize} onCancel={handleCancel} cancelling={cancelling}/>
        {formError && <p className="text-sm text-terracotta">{formError}</p>}
      </div>}

      {step === "success" && selectedRecipient && <div className="space-y-5 animate-[fadeIn_200ms_ease-out]">
        <div className="card overflow-hidden">
          <div className={`p-7 md:p-9 text-center ${holdComplete ? "bg-sage/5" : "bg-beige/50"}`}>
            <div className={`mx-auto w-16 h-16 rounded-full ${holdComplete ? "bg-sage" : "bg-ink-soft"} text-white flex items-center justify-center mb-4`}>
              {holdComplete ? <CheckCircle2 size={31}/> : <ArrowLeft size={31}/>}
            </div>
            <p className="eyebrow">{holdComplete ? "Payment finalized" : "Payment cancelled"}</p>
            <p className="font-heading text-4xl font-bold tracking-tight mt-2">{formatCurrency(numericAmount)}</p>
            <p className="text-sm text-ink-soft mt-2">{holdComplete ? `sent to ${selectedRecipient.name}` : "was not transferred"}</p>
          </div>
          <div className="p-5 md:p-6 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-ink-soft">UPI ID</span><span className="text-ink font-medium">{selectedRecipient.upi_id}</span></div>
            <div className="flex justify-between text-sm"><span className="text-ink-soft">Status</span><span className={holdComplete ? "text-sage font-semibold" : "text-ink-soft font-semibold"}>{holdComplete ? "Completed" : "Cancelled"}</span></div>
          </div>
        </div>
        <div className="flex gap-3"><button onClick={() => navigate("/history")} className="btn-secondary flex-1">View history</button><button onClick={() => navigate("/")} className="btn-primary flex-1">Back to home</button></div>
      </div>}

      {showPin && <PinModal amount={numericAmount} onSubmit={handlePinSubmit} onClose={() => { setShowPin(false); setPinError(null); }} error={pinError}/>}
    </div>
  );
}
