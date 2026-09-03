import { NavLink } from "react-router-dom";
import { Home, Send, Users, History, Settings, ShieldCheck } from "lucide-react";

const links = [
  { to: "/", label: "Overview", icon: Home, end: true },
  { to: "/send", label: "Send Money", icon: Send, end: false },
  { to: "/recipients", label: "Recipients", icon: Users, end: false },
  { to: "/history", label: "History", icon: History, end: false },
];

export default function Navbar() {
  return <>
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface md:py-7 md:px-4">
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2.5"><div className="brand-mark"><ShieldCheck size={18} /></div><h1 className="font-heading text-lg font-bold tracking-tight text-ink">SafeSend</h1></div>
        <p className="text-xs text-ink-soft mt-2 ml-10">Think before you send.</p>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}><Icon size={18} />{label}{to === "/send" && <span className="ml-auto text-[10px] font-bold bg-beige px-1.5 py-0.5 rounded-full">SAFE</span>}</NavLink>)}
      </nav>
      <div className="mt-auto space-y-3">
        <div className="rounded-xl bg-surface-soft border border-border p-4"><div className="flex gap-2"><ShieldCheck size={16} className="text-sage mt-0.5" /><div><p className="text-xs font-semibold text-ink">Safety first</p><p className="text-[11px] leading-relaxed text-ink-soft mt-1">SafeSend checks your own payment patterns before you confirm.</p></div></div></div>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}><Settings size={18} />Settings</NavLink>
      </div>
    </aside>
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur border-t border-border grid grid-cols-4 py-2 px-1 shadow-[0_-4px_20px_rgba(0,0,0,.04)]">
      {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav ${isActive ? "mobile-nav-active" : ""}`}><Icon size={19} /><span>{label === "Send Money" ? "Send" : label}</span></NavLink>)}
    </nav>
  </>;
}
