import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home,
  Send,
  Users,
  Clock,
  Settings,
  ChevronLeft,
  Check,
  AlertTriangle,
  X,
  Plus,
  Delete,
  LogOut,
  Search,
  Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#F5F3EE",
  surface: "#FFFFFF",
  soft: "#FAF9F5",
  text: "#252525",
  textSecondary: "#686762",
  textMuted: "#8A8983",
  border: "#DDDAD2",
  beige: "#E9E5DC",
  teal: "#52736F",
  amber: "#B5894A",
  sage: "#71806B",
  terracotta: "#A96961",
};

const fontStack =
  '"DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif';
const uiFontStack =
  '"Manrope", ui-sans-serif, system-ui, -apple-system, sans-serif';

const inr = (n) =>
  "₹" +
  Number(n).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

function seedData() {
  return {
    rahul: {
      id: "rahul",
      name: "Rahul",
      balance: 50000,
      recipients: [
        { id: "r1", name: "Rahul Kumar", upi: "rahulkumar@okhdfc", profession: "Electrician" },
        { id: "r2", name: "Rahul K.", upi: "rahul.k@okicici", profession: "" },
        { id: "r3", name: "Rohit Kumar", upi: "rohitk@okaxis", profession: "" },
        { id: "r4", name: "Priya Sharma", upi: "priya.sharma@oksbi", profession: "" },
        { id: "r5", name: "Electricity Board", upi: "billdesk.eb@okhdfc", profession: "" },
      ],
      transactions: [
        { id: "t1", recipientId: "r1", recipientName: "Rahul Kumar", upi: "rahulkumar@okhdfc", amount: 2500, date: daysAgo(2), status: "Completed", concern: "Low" },
        { id: "t2", recipientId: "r1", recipientName: "Rahul Kumar", upi: "rahulkumar@okhdfc", amount: 3000, date: daysAgo(9), status: "Completed", concern: "Low" },
        { id: "t3", recipientId: "r1", recipientName: "Rahul Kumar", upi: "rahulkumar@okhdfc", amount: 2000, date: daysAgo(16), status: "Completed", concern: "Low" },
        { id: "t4", recipientId: "r1", recipientName: "Rahul Kumar", upi: "rahulkumar@okhdfc", amount: 2800, date: daysAgo(23), status: "Completed", concern: "Low" },
        { id: "t5", recipientId: "r4", recipientName: "Priya Sharma", upi: "priya.sharma@oksbi", amount: 4000, date: daysAgo(1), status: "Completed", concern: "Low" },
        { id: "t6", recipientId: "r5", recipientName: "Electricity Board", upi: "billdesk.eb@okhdfc", amount: 1800, date: daysAgo(1), status: "Completed", concern: "Low" },
      ],
    },
    priya: {
      id: "priya",
      name: "Priya",
      balance: 32400,
      recipients: [
        { id: "p1", name: "Arun Verma", upi: "arun.verma@okicici", profession: "Landlord" },
        { id: "p2", name: "Meena Iyer", upi: "meena.iyer@oksbi", profession: "" },
      ],
      transactions: [
        { id: "pt1", recipientId: "p1", recipientName: "Arun Verma", upi: "arun.verma@okicici", amount: 15000, date: daysAgo(3), status: "Completed", concern: "Low" },
        { id: "pt2", recipientId: "p2", recipientName: "Meena Iyer", upi: "meena.iyer@oksbi", amount: 1200, date: daysAgo(6), status: "Completed", concern: "Low" },
      ],
    },
    arun: {
      id: "arun",
      name: "Arun",
      balance: 78250,
      recipients: [
        { id: "a1", name: "Priya Sharma", upi: "priya.sharma@oksbi", profession: "" },
      ],
      transactions: [
        { id: "at1", recipientId: "a1", recipientName: "Priya Sharma", upi: "priya.sharma@oksbi", amount: 5000, date: daysAgo(4), status: "Completed", concern: "Low" },
      ],
    },
  };
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatWhen(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return (
    date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + `, ${time}`
  );
}

function groupLabel(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
}

/* ------------------------------------------------------------------ */
/*  SafeSend Check logic                                               */
/* ------------------------------------------------------------------ */

function levenshtein(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = [];
  for (let i = 0; i <= a.length; i++) m[i] = [i];
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] =
        a[i - 1] === b[j - 1]
          ? m[i - 1][j - 1]
          : 1 + Math.min(m[i - 1][j - 1], m[i][j - 1], m[i - 1][j]);
    }
  }
  return m[a.length][b.length];
}

function runSafetyCheck({ recipient, amount, allRecipients, history }) {
  const past = history.filter((t) => t.recipientId === recipient.id);
  const isFamiliar = past.length > 0;

  let score = 0;
  const reasons = [];

  // 1. Familiar recipient
  if (isFamiliar) {
    reasons.push({
      key: "familiar",
      ok: true,
      title: "Familiar recipient",
      detail: `You've paid ${recipient.name} before.`,
    });
  } else {
    score += 25;
    reasons.push({
      key: "familiar",
      ok: false,
      title: "New recipient",
      detail: `This is your first payment to ${recipient.name}.`,
    });
  }

  // 2. Amount pattern
  if (past.length >= 2) {
    const amounts = past.map((t) => t.amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const upperBound = max * 1.5;
    if (amount > upperBound) {
      score += 30;
      reasons.push({
        key: "amount",
        ok: false,
        title: "Amount is unusual",
        detail: `Your previous payments to ${recipient.name} were usually between ${inr(min)} and ${inr(max)}.`,
      });
    } else {
      reasons.push({
        key: "amount",
        ok: true,
        title: "Amount looks typical",
        detail: `Within your usual range of ${inr(min)}–${inr(max)} for ${recipient.name}.`,
      });
    }
  } else if (past.length === 1) {
    reasons.push({
      key: "amount",
      ok: true,
      title: "Not enough history to compare",
      detail: `You've only paid ${recipient.name} once before, so there isn't a clear pattern yet.`,
    });
  } else {
    reasons.push({
      key: "amount",
      ok: true,
      title: "No amount history yet",
      detail: `There's no previous amount to compare this payment against.`,
    });
  }

  // 3. Timing pattern
  const hour = new Date().getHours();
  const familiarHourPayments = past.filter((t) => Math.abs(t.date.getHours() - hour) <= 3);
  if (past.length >= 2 && familiarHourPayments.length === 0) {
    score += 10;
    reasons.push({
      key: "timing",
      ok: false,
      title: "Timing is unusual",
      detail: `You don't usually pay ${recipient.name} around this time of day.`,
    });
  } else {
    reasons.push({
      key: "timing",
      ok: true,
      title: "Timing looks familiar",
      detail: past.length
        ? `You've paid around this time before.`
        : `There's no timing history yet, so nothing stands out.`,
    });
  }

  // 4. Similar recipient
  const similar = allRecipients.filter((r) => {
    if (r.id === recipient.id) return false;
    const dist = levenshtein(r.name, recipient.name);
    return dist > 0 && dist <= 3;
  });
  if (similar.length > 0 && !isFamiliar) {
    score += 30;
    reasons.push({
      key: "similar",
      ok: false,
      title: "Similar saved recipient found",
      detail: `${similar[0].name} is a saved recipient with a name close to this one. Make sure you've picked the right person.`,
    });
  } else {
    reasons.push({
      key: "similar",
      ok: true,
      title: "No similar recipient found",
      detail: `No closely matching saved recipient was found.`,
    });
  }

  let level = "Low";
  if (score >= 51) level = "High";
  else if (score >= 21) level = "Moderate";

  const summaries = {
    Low: "This payment matches your usual activity.",
    Moderate: `${recipient.name} is a familiar recipient, but something about this payment is a little different from usual. Review the details before continuing.`,
    High: "Several things about this payment are unusual. Take a moment to review the details before continuing.",
  };

  return { reasons, score, level, summary: summaries[level] };
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function Avatar({ name, size = 40 }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: C.beige,
        color: C.text,
        fontFamily: uiFontStack,
        fontWeight: 600,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}

function ConcernBadge({ level, size = "md" }) {
  const map = {
    Low: { color: C.sage, label: "Low concern" },
    Moderate: { color: C.amber, label: "Moderate concern" },
    High: { color: C.terracotta, label: "High concern" },
  };
  const { color, label } = map[level];
  const pad = size === "sm" ? "2px 8px" : "4px 10px";
  const fs = size === "sm" ? 11 : 12.5;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        padding: pad,
        fontSize: fs,
        fontFamily: uiFontStack,
        fontWeight: 600,
        color,
        background: `${color}17`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {label}
    </span>
  );
}

function PrimaryButton({ children, onClick, disabled, full = true, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} transition-opacity duration-150`}
      style={{
        background: disabled ? C.textMuted : C.text,
        color: "#FFFFFF",
        fontFamily: uiFontStack,
        fontWeight: 600,
        fontSize: 15,
        padding: "14px 20px",
        borderRadius: 10,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.opacity = "0.85")}
      onMouseUp={(e) => !disabled && (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      className="w-full transition-colors duration-150"
      style={{
        background: "transparent",
        color: C.text,
        fontFamily: uiFontStack,
        fontWeight: 600,
        fontSize: 15,
        padding: "14px 20px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function ScreenHeader({ title, subtitle, onBack }) {
  return (
    <div className="mb-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 mb-4 -ml-1"
          style={{ color: C.textSecondary, fontFamily: uiFontStack, fontSize: 14 }}
        >
          <ChevronLeft size={18} />
          Back
        </button>
      )}
      <h1 style={{ fontFamily: fontStack, fontWeight: 600, fontSize: 26, color: C.text, letterSpacing: "-0.01em" }}>
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5" style={{ fontFamily: uiFontStack, fontSize: 14.5, color: C.textSecondary }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SafetyCheck component (signature feature)                          */
/* ------------------------------------------------------------------ */

function SafetyCheck({ result }) {
  const levelColor = { Low: C.sage, Moderate: C.amber, High: C.terracotta }[result.level];
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 20px 6px" }}>
        <p
          style={{
            fontFamily: uiFontStack,
            fontWeight: 700,
            fontSize: 11.5,
            letterSpacing: "0.06em",
            color: C.textMuted,
          }}
        >
          PAYMENT CONTEXT
        </p>
      </div>
      <div>
        {result.reasons.map((r, i) => (
          <div
            key={r.key}
            className="flex items-start gap-3"
            style={{
              padding: "14px 20px",
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <div className="mt-0.5 shrink-0">
              {r.ok ? (
                <Check size={17} style={{ color: C.sage }} strokeWidth={2.5} />
              ) : (
                <AlertTriangle size={17} style={{ color: C.amber }} strokeWidth={2.2} />
              )}
            </div>
            <div>
              <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14.5, color: C.text }}>
                {r.title}
              </p>
              <p style={{ fontFamily: uiFontStack, fontSize: 13.5, color: C.textSecondary, marginTop: 2, lineHeight: 1.45 }}>
                {r.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "18px 20px 20px" }}>
        <p
          style={{
            fontFamily: fontStack,
            fontWeight: 700,
            fontSize: 15,
            color: levelColor,
            marginBottom: 6,
          }}
        >
          {result.level.toUpperCase()} CONCERN
        </p>
        <p style={{ fontFamily: uiFontStack, fontSize: 13.5, color: C.textSecondary, lineHeight: 1.5 }}>
          {result.summary}
        </p>
        {result.level !== "Low" && (
          <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted, marginTop: 10, lineHeight: 1.5 }}>
            Unusual doesn't automatically mean unsafe. You're always in control of whether to continue.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PIN modal                                                          */
/* ------------------------------------------------------------------ */

const DEMO_PIN = "204060";

function PinModal({ onClose, onConfirm }) {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const press = (d) => {
    if (entered.length >= 6) return;
    setError(false);
    const next = entered + d;
    setEntered(next);
    if (next.length === 6) {
      setTimeout(() => {
        if (next === DEMO_PIN) {
          onConfirm();
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => {
            setEntered("");
            setShake(false);
          }, 400);
        }
      }, 150);
    }
  };

  const backspace = () => {
    setError(false);
    setEntered(entered.slice(0, -1));
  };

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50"
      style={{ background: "rgba(37,37,37,0.4)" }}
    >
      <div
        className="w-full sm:max-w-sm"
        style={{
          background: C.surface,
          borderRadius: "20px 20px 0 0",
          padding: "28px 24px 32px",
          animation: "riseUp 200ms ease-out",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 style={{ fontFamily: fontStack, fontWeight: 600, fontSize: 19, color: C.text }}>
            Confirm payment
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X size={20} style={{ color: C.textMuted }} />
          </button>
        </div>
        <p style={{ fontFamily: uiFontStack, fontSize: 13.5, color: C.textSecondary, marginBottom: 24 }}>
          Enter your 6-digit UPI PIN. This is a simulated prototype PIN — no real credentials are used.
        </p>

        <div className="flex justify-center gap-3 mb-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: i < entered.length ? (error ? C.terracotta : C.text) : "transparent",
                border: `1.5px solid ${i < entered.length ? (error ? C.terracotta : C.text) : C.border}`,
                transform: shake ? `translateX(${(i % 2 === 0 ? -3 : 3)}px)` : "none",
                transition: "transform 60ms ease",
              }}
            />
          ))}
        </div>
        <p
          style={{
            textAlign: "center",
            fontFamily: uiFontStack,
            fontSize: 12.5,
            color: C.terracotta,
            height: 18,
            marginBottom: 8,
          }}
        >
          {error ? "Incorrect PIN. Try again." : ""}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              style={{
                fontFamily: uiFontStack,
                fontWeight: 600,
                fontSize: 19,
                color: C.text,
                background: C.soft,
                borderRadius: 12,
                padding: "16px 0",
              }}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => {
              setEntered("");
              setError(false);
            }}
            style={{
              fontFamily: uiFontStack,
              fontWeight: 600,
              fontSize: 12.5,
              color: C.textSecondary,
              background: "transparent",
              borderRadius: 12,
              padding: "16px 0",
            }}
          >
            Clear
          </button>
          <button
            onClick={() => press("0")}
            style={{
              fontFamily: uiFontStack,
              fontWeight: 600,
              fontSize: 19,
              color: C.text,
              background: C.soft,
              borderRadius: 12,
              padding: "16px 0",
            }}
          >
            0
          </button>
          <button
            onClick={backspace}
            className="flex items-center justify-center"
            style={{
              background: "transparent",
              borderRadius: 12,
              padding: "16px 0",
              color: C.textSecondary,
            }}
            aria-label="Backspace"
          >
            <Delete size={19} />
          </button>
        </div>
        <p style={{ textAlign: "center", fontFamily: uiFontStack, fontSize: 11.5, color: C.textMuted, marginTop: 18 }}>
          Demo PIN: 2 0 4 0 6 0
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login                                                               */
/* ------------------------------------------------------------------ */

function Login({ onLogin }) {
  const [selected, setSelected] = useState(null);
  const demoUsers = [
    { id: "rahul", name: "Rahul" },
    { id: "priya", name: "Priya" },
    { id: "arun", name: "Arun" },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <h1 style={{ fontFamily: fontStack, fontWeight: 700, fontSize: 30, color: C.text, letterSpacing: "-0.01em" }}>
            SafeSend
          </h1>
          <p style={{ fontFamily: uiFontStack, fontSize: 14.5, color: C.textSecondary, marginTop: 6 }}>
            Think before you send.
          </p>
        </div>

        <p
          style={{
            fontFamily: uiFontStack,
            fontWeight: 700,
            fontSize: 11.5,
            letterSpacing: "0.06em",
            color: C.textMuted,
            marginBottom: 12,
          }}
        >
          CHOOSE A DEMO ACCOUNT
        </p>
        <div className="space-y-2.5 mb-8">
          {demoUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u.id)}
              className="w-full flex items-center gap-3"
              style={{
                background: selected === u.id ? C.soft : C.surface,
                border: `1px solid ${selected === u.id ? C.text : C.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                textAlign: "left",
              }}
            >
              <Avatar name={u.name} size={36} />
              <span style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 15, color: C.text }}>
                {u.name}
              </span>
              {selected === u.id && (
                <span className="ml-auto">
                  <Check size={18} style={{ color: C.text }} />
                </span>
              )}
            </button>
          ))}
        </div>

        <PrimaryButton disabled={!selected} onClick={() => onLogin(selected)}>
          Continue
        </PrimaryButton>

        <p style={{ fontFamily: uiFontStack, fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          This is a demo environment. No real accounts, passwords or banking credentials are used.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell (sidebar / bottom nav)                                       */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { id: "home", label: "Overview", icon: Home },
  { id: "send", label: "Send Money", icon: Send },
  { id: "recipients", label: "Recipients", icon: Users },
  { id: "history", label: "History", icon: Clock },
];

function Sidebar({ route, setRoute, user, onLogout }) {
  return (
    <div
      className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0"
      style={{ borderRight: `1px solid ${C.border}`, padding: "28px 20px" }}
    >
      <div className="mb-10 px-2">
        <h1 style={{ fontFamily: fontStack, fontWeight: 700, fontSize: 19, color: C.text }}>
          SafeSend
        </h1>
        <p style={{ fontFamily: uiFontStack, fontSize: 12, color: C.textMuted, marginTop: 2 }}>
          Think before you send.
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setRoute(item.id)}
              className="flex items-center gap-3"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: active ? C.soft : "transparent",
                color: active ? C.text : C.textSecondary,
                fontFamily: uiFontStack,
                fontWeight: active ? 600 : 500,
                fontSize: 14.5,
                textAlign: "left",
              }}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <button
          onClick={() => setRoute("settings")}
          className="flex items-center gap-3"
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: route === "settings" ? C.soft : "transparent",
            color: route === "settings" ? C.text : C.textSecondary,
            fontFamily: uiFontStack,
            fontWeight: route === "settings" ? 600 : 500,
            fontSize: 14.5,
            textAlign: "left",
          }}
        >
          <Settings size={17} />
          Settings
        </button>
        <div className="flex items-center gap-3 mt-4 px-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
          <Avatar name={user.name} size={32} />
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 13.5, color: C.text }}>
              {user.name}
            </p>
            <p style={{ fontFamily: uiFontStack, fontSize: 11.5, color: C.textMuted }}>Demo account</p>
          </div>
          <button onClick={onLogout} aria-label="Log out">
            <LogOut size={16} style={{ color: C.textMuted }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ route, setRoute }) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 flex z-40"
      style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = route === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setRoute(item.id)}
            className="flex-1 flex flex-col items-center gap-1"
            style={{ padding: "10px 0 calc(10px + env(safe-area-inset-bottom))" }}
          >
            <Icon size={20} strokeWidth={active ? 2.3 : 2} color={active ? C.text : C.textMuted} />
            <span
              style={{
                fontFamily: uiFontStack,
                fontSize: 10.5,
                fontWeight: active ? 700 : 500,
                color: active ? C.text : C.textMuted,
              }}
            >
              {item.label === "Send Money" ? "Send" : item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home                                                                */
/* ------------------------------------------------------------------ */

function Home_({ user, setRoute }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const recent = [...user.transactions]
    .sort((a, b) => b.date - a.date)
    .slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: fontStack, fontWeight: 600, fontSize: 26, color: C.text, letterSpacing: "-0.01em" }}>
          {greeting}, {user.name}
        </h1>
        <p style={{ fontFamily: uiFontStack, fontSize: 14.5, color: C.textSecondary, marginTop: 4 }}>
          Here's your payment activity.
        </p>
      </div>

      <div
        className="mb-6"
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "22px 22px",
        }}
      >
        <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted, fontWeight: 600 }}>
          Available balance
        </p>
        <p style={{ fontFamily: fontStack, fontWeight: 700, fontSize: 34, color: C.text, marginTop: 6, letterSpacing: "-0.01em" }}>
          {inr(user.balance)}
        </p>
        <div className="mt-5">
          <PrimaryButton full={false} onClick={() => setRoute("send")} style={{ padding: "12px 22px" }}>
            <span className="flex items-center gap-2">
              <Send size={15} /> Send Money
            </span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setRoute("recipients")}
          className="flex items-center gap-2.5"
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}
        >
          <Users size={17} style={{ color: C.textSecondary }} />
          <span style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 13.5, color: C.text }}>Recipients</span>
        </button>
        <button
          onClick={() => setRoute("history")}
          className="flex items-center gap-2.5"
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}
        >
          <Clock size={17} style={{ color: C.textSecondary }} />
          <span style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 13.5, color: C.text }}>History</span>
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontFamily: uiFontStack, fontWeight: 700, fontSize: 11.5, letterSpacing: "0.06em", color: C.textMuted }}>
            RECENT ACTIVITY
          </p>
          <button onClick={() => setRoute("history")} style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textSecondary }}>
            View all
          </button>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {recent.length === 0 && (
            <p style={{ padding: 20, fontFamily: uiFontStack, fontSize: 13.5, color: C.textMuted }}>
              No payments yet. Once you send money, it'll show up here.
            </p>
          )}
          {recent.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-3"
              style={{ padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}
            >
              <Avatar name={t.recipientName} size={36} />
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14, color: C.text }}>
                  {t.recipientName}
                </p>
                <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted }}>{formatWhen(t.date)}</p>
              </div>
              <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14.5, color: C.text }}>{inr(t.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recipients                                                         */
/* ------------------------------------------------------------------ */

function Recipients({ user, addRecipient, onSend }) {
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", upi: "", profession: "" });
  const [errors, setErrors] = useState({});

  const filtered = user.recipients.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Enter a name.";
    if (!form.upi.trim()) errs.upi = "Enter a UPI ID.";
    else if (!/^[\w.\-]+@[\w.\-]+$/.test(form.upi.trim())) errs.upi = "Enter a valid UPI ID, like name@bank.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    addRecipient({ id: "new-" + Date.now(), name: form.name.trim(), upi: form.upi.trim(), profession: form.profession.trim() });
    setForm({ name: "", upi: "", profession: "" });
    setShowAdd(false);
  };

  return (
    <div>
      <ScreenHeader title="Recipients" subtitle="People and businesses you send money to." />

      <div className="flex gap-3 mb-5">
        <div
          className="flex-1 flex items-center gap-2"
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}
        >
          <Search size={16} style={{ color: C.textMuted }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipients"
            style={{ fontFamily: uiFontStack, fontSize: 14, color: C.text, background: "transparent", outline: "none", width: "100%" }}
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 shrink-0"
          style={{ background: C.text, color: "#fff", borderRadius: 10, padding: "10px 16px", fontFamily: uiFontStack, fontWeight: 600, fontSize: 13.5 }}
        >
          <Plus size={15} /> Add
        </button>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {filtered.length === 0 && (
          <p style={{ padding: 20, fontFamily: uiFontStack, fontSize: 13.5, color: C.textMuted }}>
            No recipients match your search.
          </p>
        )}
        {filtered.map((r, i) => (
          <button
            key={r.id}
            onClick={() => onSend(r)}
            className="w-full flex items-center gap-3"
            style={{ padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${C.border}`, textAlign: "left" }}
          >
            <Avatar name={r.name} size={38} />
            <div className="min-w-0">
              <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14.5, color: C.text }}>{r.name}</p>
              <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted }}>
                {r.upi}
                {r.profession ? ` · ${r.profession}` : ""}
              </p>
            </div>
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: "rgba(37,37,37,0.4)" }}>
          <div className="w-full sm:max-w-sm" style={{ background: C.surface, borderRadius: "20px 20px 0 0", padding: "26px 24px 32px" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: fontStack, fontWeight: 600, fontSize: 19, color: C.text }}>Add recipient</h2>
              <button onClick={() => setShowAdd(false)}>
                <X size={20} style={{ color: C.textMuted }} />
              </button>
            </div>

            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} placeholder="Rahul Kumar" />
            <Field label="UPI ID" value={form.upi} onChange={(v) => setForm({ ...form, upi: v })} error={errors.upi} placeholder="rahul@upi" />
            <Field label="Profession (optional)" value={form.profession} onChange={(v) => setForm({ ...form, profession: v })} placeholder="Electrician" />

            <div className="mt-2">
              <PrimaryButton onClick={submit}>Save recipient</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, error, placeholder }) {
  return (
    <div className="mb-4">
      <label style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 12.5, color: C.textSecondary, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          fontFamily: uiFontStack,
          fontSize: 14.5,
          color: C.text,
          background: C.soft,
          border: `1px solid ${error ? C.terracotta : C.border}`,
          borderRadius: 10,
          padding: "12px 14px",
          outline: "none",
        }}
      />
      {error && (
        <p style={{ fontFamily: uiFontStack, fontSize: 12, color: C.terracotta, marginTop: 5 }}>{error}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Send Money flow                                                     */
/* ------------------------------------------------------------------ */

function SendMoney({ user, allRecipients, presetRecipient, onComplete, exitToHome }) {
  const [step, setStep] = useState(presetRecipient ? 2 : 1);
  const [recipient, setRecipient] = useState(presetRecipient || null);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [paid, setPaid] = useState(false);

  const safetyResult = useMemo(() => {
    if (!recipient || !amount) return null;
    return runSafetyCheck({
      recipient,
      amount: Number(amount),
      allRecipients,
      history: user.transactions,
    });
  }, [recipient, amount]);

  const goAmount = (r) => {
    setRecipient(r);
    setStep(2);
  };

  const validateAmount = () => {
    const n = Number(amount);
    if (!amount || isNaN(n) || n <= 0) {
      setAmountError("Enter an amount greater than ₹0.");
      return false;
    }
    if (n > user.balance) {
      setAmountError("This amount is more than your available balance.");
      return false;
    }
    setAmountError("");
    return true;
  };

  if (paid) {
    return (
      <PaymentSuccess
        recipient={recipient}
        amount={Number(amount)}
        concern={safetyResult?.level || "Low"}
        onFinish={(reversed) => onComplete({ recipient, amount: Number(amount), concern: safetyResult?.level || "Low", reversed })}
      />
    );
  }

  return (
    <div>
      {step === 1 && (
        <div>
          <ScreenHeader title="Send Money" subtitle="Who are you sending to?" onBack={exitToHome} />
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            {allRecipients.map((r, i) => (
              <button
                key={r.id}
                onClick={() => goAmount(r)}
                className="w-full flex items-center gap-3"
                style={{ padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${C.border}`, textAlign: "left" }}
              >
                <Avatar name={r.name} size={38} />
                <div className="min-w-0">
                  <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14.5, color: C.text }}>{r.name}</p>
                  <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted }}>
                    {r.upi}
                    {r.profession ? ` · ${r.profession}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && recipient && (
        <div>
          <ScreenHeader title="Send Money" subtitle="Amount" onBack={() => setStep(1)} />
          <div className="flex items-center gap-3 mb-6" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <Avatar name={recipient.name} size={36} />
            <div>
              <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14.5, color: C.text }}>{recipient.name}</p>
              <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted }}>{recipient.upi}</p>
            </div>
          </div>

          <div
            className="flex items-center justify-center mb-2"
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "36px 20px" }}
          >
            <span style={{ fontFamily: fontStack, fontWeight: 600, fontSize: 30, color: C.textMuted, marginRight: 4 }}>₹</span>
            <input
              autoFocus
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                setAmount(v);
                setAmountError("");
              }}
              placeholder="0"
              style={{
                fontFamily: fontStack,
                fontWeight: 600,
                fontSize: 40,
                color: C.text,
                background: "transparent",
                outline: "none",
                width: 220,
                textAlign: "left",
              }}
            />
          </div>
          {amountError && (
            <p style={{ fontFamily: uiFontStack, fontSize: 13, color: C.terracotta, marginBottom: 12 }}>{amountError}</p>
          )}
          <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted, marginBottom: 24 }}>
            Available balance: {inr(user.balance)}
          </p>

          <PrimaryButton
            onClick={() => {
              if (validateAmount()) setStep(3);
            }}
          >
            Continue
          </PrimaryButton>
        </div>
      )}

      {step === 3 && recipient && safetyResult && (
        <div>
          <ScreenHeader title="SafeSend Check" subtitle="Here's some context before you send." onBack={() => setStep(2)} />
          <div className="mb-6">
            <SafetyCheck result={safetyResult} />
          </div>
          <PrimaryButton onClick={() => setStep(4)}>Continue to review</PrimaryButton>
        </div>
      )}

      {step === 4 && recipient && safetyResult && (
        <div>
          <ScreenHeader title="Review Payment" onBack={() => setStep(3)} />

          <div className="mb-4" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={recipient.name} size={40} />
              <div>
                <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 15, color: C.text }}>{recipient.name}</p>
                <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted }}>
                  {recipient.profession ? `${recipient.profession} · ` : ""}
                  {recipient.upi}
                </p>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
              <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted, marginBottom: 4 }}>Amount</p>
              <p style={{ fontFamily: fontStack, fontWeight: 700, fontSize: 26, color: C.text }}>{inr(amount)}</p>
            </div>
          </div>

          <div className="mb-6">
            <SafetyCheck result={safetyResult} />
          </div>

          <div className="flex gap-3">
            <SecondaryButton onClick={() => setStep(3)}>Go back</SecondaryButton>
            <PrimaryButton onClick={() => setShowPin(true)}>Continue</PrimaryButton>
          </div>
        </div>
      )}

      {showPin && (
        <PinModal
          onClose={() => setShowPin(false)}
          onConfirm={() => {
            setShowPin(false);
            setPaid(true);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payment success + undo                                             */
/* ------------------------------------------------------------------ */

function PaymentSuccess({ recipient, amount, concern, onFinish }) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [state, setState] = useState("pending"); // pending | reversed | completed
  const finishedRef = useRef(false);

  useEffect(() => {
    if (state !== "pending") return;
    if (secondsLeft <= 0) {
      setState("completed");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, state]);

  useEffect(() => {
    if (state !== "pending" && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(state === "reversed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="flex flex-col items-center text-center pt-8">
      <div
        className="flex items-center justify-center mb-6"
        style={{ width: 56, height: 56, borderRadius: 999, background: `${C.sage}1c` }}
      >
        <Check size={26} style={{ color: C.sage }} strokeWidth={2.5} />
      </div>

      <h1 style={{ fontFamily: fontStack, fontWeight: 600, fontSize: 22, color: C.text }}>
        {state === "reversed" ? "Payment reversed" : "Payment completed"}
      </h1>

      <p style={{ fontFamily: fontStack, fontWeight: 700, fontSize: 32, color: C.text, marginTop: 14 }}>
        {inr(amount)}
      </p>

      <div className="mt-3 mb-1">
        <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 15, color: C.text }}>{recipient.name}</p>
        <p style={{ fontFamily: uiFontStack, fontSize: 13, color: C.textMuted }}>{recipient.upi}</p>
      </div>

      <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted, marginTop: 10 }}>Just now</p>

      {state === "pending" && (
        <div className="w-full max-w-xs mt-10" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 22 }}>
          <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14.5, color: C.text }}>Need to undo this?</p>
          <p style={{ fontFamily: uiFontStack, fontSize: 13, color: C.textSecondary, marginTop: 3, marginBottom: 16 }}>
            {secondsLeft} second{secondsLeft !== 1 ? "s" : ""} remaining
          </p>
          <div style={{ height: 3, background: C.border, borderRadius: 999, marginBottom: 18, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(secondsLeft / 10) * 100}%`,
                background: C.amber,
                transition: "width 1s linear",
              }}
            />
          </div>
          <SecondaryButton onClick={() => setState("reversed")}>Undo payment</SecondaryButton>
        </div>
      )}

      {state !== "pending" && (
        <p style={{ fontFamily: uiFontStack, fontSize: 12, color: C.textMuted, marginTop: 24, maxWidth: 300, lineHeight: 1.5 }}>
          This is a simulated prototype flow. Real-world UPI payments aren't universally reversible within a fixed window.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  History                                                             */
/* ------------------------------------------------------------------ */

function History({ user }) {
  const [selected, setSelected] = useState(null);
  const sorted = [...user.transactions].sort((a, b) => b.date - a.date);
  const groups = [];
  sorted.forEach((t) => {
    const label = groupLabel(t.date);
    let g = groups.find((g) => g.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(t);
  });

  return (
    <div>
      <ScreenHeader title="History" />
      {groups.length === 0 && (
        <p style={{ fontFamily: uiFontStack, fontSize: 13.5, color: C.textMuted }}>No payments yet.</p>
      )}
      {groups.map((g) => (
        <div key={g.label} className="mb-6">
          <p style={{ fontFamily: uiFontStack, fontWeight: 700, fontSize: 11.5, letterSpacing: "0.06em", color: C.textMuted, marginBottom: 8 }}>
            {g.label.toUpperCase()}
          </p>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            {g.items.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full flex items-center gap-3"
                style={{ padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${C.border}`, textAlign: "left" }}
              >
                <Avatar name={t.recipientName} size={36} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14, color: C.text }}>{t.recipientName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ConcernBadge level={t.concern} size="sm" />
                    <span style={{ fontFamily: uiFontStack, fontSize: 11.5, color: C.textMuted }}>{t.status}</span>
                  </div>
                </div>
                <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 14.5, color: C.text }}>{inr(t.amount)}</p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: "rgba(37,37,37,0.4)" }} onClick={() => setSelected(null)}>
          <div
            className="w-full sm:max-w-sm"
            style={{ background: C.surface, borderRadius: "20px 20px 0 0", padding: "26px 24px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: fontStack, fontWeight: 600, fontSize: 19, color: C.text }}>Payment details</h2>
              <button onClick={() => setSelected(null)}>
                <X size={20} style={{ color: C.textMuted }} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <Avatar name={selected.recipientName} size={40} />
              <div>
                <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 15, color: C.text }}>{selected.recipientName}</p>
                <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted }}>{selected.upi}</p>
              </div>
            </div>

            <DetailRow label="Amount" value={inr(selected.amount)} />
            <DetailRow label="Date & time" value={formatWhen(selected.date)} />
            <DetailRow label="Status" value={selected.status} />
            <div className="flex items-center justify-between" style={{ padding: "10px 0" }}>
              <span style={{ fontFamily: uiFontStack, fontSize: 13, color: C.textMuted }}>Concern level</span>
              <ConcernBadge level={selected.concern} size="sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontFamily: uiFontStack, fontSize: 13, color: C.textMuted }}>{label}</span>
      <span style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 13.5, color: C.text }}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings                                                            */
/* ------------------------------------------------------------------ */

function SettingsPage({ user, onLogout }) {
  return (
    <div>
      <ScreenHeader title="Settings" />

      <div className="mb-6" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={44} />
          <div>
            <p style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 15.5, color: C.text }}>{user.name}</p>
            <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.textMuted }}>Demo profile</p>
          </div>
        </div>
      </div>

      <div className="mb-6" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <DetailRowFull label="Application" value="SafeSend" />
        <DetailRowFull label="Mode" value="Prototype / Demo" last />
      </div>

      <div
        className="flex items-start gap-3 mb-8"
        style={{ background: `${C.teal}12`, border: `1px solid ${C.teal}30`, borderRadius: 12, padding: "14px 16px" }}
      >
        <Info size={16} style={{ color: C.teal, marginTop: 2 }} />
        <p style={{ fontFamily: uiFontStack, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
          Payments, PIN entry and payment reversal in this app are simulated for demonstration purposes only. No real money, banking credentials, or UPI systems are involved.
        </p>
      </div>

      <SecondaryButton onClick={onLogout} style={{ color: C.terracotta, borderColor: `${C.terracotta}40` }}>
        Log out
      </SecondaryButton>
    </div>
  );
}

function DetailRowFull({ label, value, last }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "14px 20px", borderBottom: last ? "none" : `1px solid ${C.border}` }}>
      <span style={{ fontFamily: uiFontStack, fontSize: 13.5, color: C.textSecondary }}>{label}</span>
      <span style={{ fontFamily: uiFontStack, fontWeight: 600, fontSize: 13.5, color: C.text }}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [data, setData] = useState(seedData);
  const [userId, setUserId] = useState(null);
  const [route, setRoute] = useState("home");
  const [presetRecipient, setPresetRecipient] = useState(null);

  const user = userId ? data[userId] : null;

  const handleLogin = (id) => {
    setUserId(id);
    setRoute("home");
  };

  const handleLogout = () => {
    setUserId(null);
    setData(seedData());
    setRoute("home");
  };

  const addRecipient = (r) => {
    setData((d) => ({
      ...d,
      [userId]: { ...d[userId], recipients: [...d[userId].recipients, r] },
    }));
  };

  const goToSend = (recipient) => {
    setPresetRecipient(recipient || null);
    setRoute("send");
  };

  const completePayment = ({ recipient, amount, concern, reversed }) => {
    setData((d) => {
      const u = d[userId];
      const newTx = {
        id: "tx-" + Date.now(),
        recipientId: recipient.id,
        recipientName: recipient.name,
        upi: recipient.upi,
        amount,
        date: new Date(),
        status: reversed ? "Reversed" : "Completed",
        concern,
      };
      return {
        ...d,
        [userId]: {
          ...u,
          balance: reversed ? u.balance : u.balance - amount,
          transactions: [newTx, ...u.transactions],
        },
      };
    });
    setPresetRecipient(null);
    setRoute("history");
  };

  useEffect(() => {
    if (route !== "send") setPresetRecipient(null);
  }, [route]);

  return (
    <div style={{ fontFamily: uiFontStack, background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, button:focus-visible { outline: 2px solid ${C.teal}; outline-offset: 2px; }
        @keyframes riseUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="md:flex">
          <Sidebar route={route === "send" ? "send" : route} setRoute={(r) => { setPresetRecipient(null); setRoute(r); }} user={user} onLogout={handleLogout} />

          <div className="flex-1 min-w-0">
            <div className="max-w-2xl mx-auto px-5 py-8 md:px-10 md:py-10" style={{ paddingBottom: 96 }}>
              {route === "home" && <Home_ user={user} setRoute={(r) => (r === "send" ? goToSend(null) : setRoute(r))} />}
              {route === "recipients" && <Recipients user={user} addRecipient={addRecipient} onSend={(r) => goToSend(r)} />}
              {route === "send" && (
                <SendMoney
                  user={user}
                  allRecipients={user.recipients}
                  presetRecipient={presetRecipient}
                  onComplete={completePayment}
                  exitToHome={() => setRoute("home")}
                />
              )}
              {route === "history" && <History user={user} />}
              {route === "settings" && <SettingsPage user={user} onLogout={handleLogout} />}
            </div>
          </div>

          <BottomNav route={route} setRoute={(r) => { setPresetRecipient(null); setRoute(r); }} />
        </div>
      )}
    </div>
  );
}
