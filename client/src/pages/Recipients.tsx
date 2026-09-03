import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { api } from "../api";
import type { Recipient } from "../types";
import RecipientCard from "../components/RecipientCard";

export default function Recipients() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [profession, setProfession] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!user) return;
    setLoading(true);
    api
      .getRecipients(user.id)
      .then(setRecipients)
      .finally(() => setLoading(false));
  };

  useEffect(load, [user]);

  if (!user) return null;

  const resetForm = () => {
    setName("");
    setUpiId("");
    setProfession("");
    setError(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !upiId.trim()) {
      setError("Name and UPI ID are required.");
      return;
    }
    setSaving(true);
    try {
      await api.addRecipient({
        userId: user.id,
        name: name.trim(),
        upiId: upiId.trim(),
        profession: profession.trim() || undefined,
      });
      resetForm();
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message || "Couldn't save this recipient.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-8 md:py-10 pb-24 md:pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-semibold text-ink">Recipients</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="btn-secondary inline-flex items-center gap-1.5 !px-4 !py-2 text-sm"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add recipient"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-5 mb-6 flex flex-col gap-4">
          <div>
            <label htmlFor="r-name" className="text-sm text-ink-soft block mb-1.5">
              Name
            </label>
            <input
              id="r-name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meena Iyer"
            />
          </div>
          <div>
            <label htmlFor="r-upi" className="text-sm text-ink-soft block mb-1.5">
              UPI ID
            </label>
            <input
              id="r-upi"
              className="input-field"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. meena@upi"
            />
          </div>
          <div>
            <label htmlFor="r-profession" className="text-sm text-ink-soft block mb-1.5">
              Profession <span className="text-ink-soft/70">(optional)</span>
            </label>
            <input
              id="r-profession"
              className="input-field"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Plumber"
            />
          </div>

          {error && <p className="text-sm text-terracotta">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary self-start">
            {saving ? "Saving…" : "Save recipient"}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}

      {!loading && recipients.length === 0 && (
        <p className="text-sm text-ink-soft">
          No saved recipients yet. Add one to send your first payment.
        </p>
      )}

      {!loading && recipients.length > 0 && (
        <div className="flex flex-col gap-2">
          {recipients.map((r) => (
            <RecipientCard
              key={r.id}
              recipient={r}
              onClick={() => navigate("/send", { state: { recipientId: r.id } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
