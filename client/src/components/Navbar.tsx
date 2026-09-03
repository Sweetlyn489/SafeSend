import { NavLink } from "react-router-dom";
import { Home, Send, Users, History, Settings } from "lucide-react";

const links = [
  { to: "/", label: "Overview", icon: Home, end: true },
  { to: "/send", label: "Send Money", icon: Send, end: false },
  { to: "/recipients", label: "Recipients", icon: Users, end: false },
  { to: "/history", label: "History", icon: History, end: false },
];

export default function Navbar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-surface-soft md:py-8 md:px-5">
        <div className="mb-10 px-1">
          <h1 className="font-heading text-lg font-semibold tracking-tight text-ink">SafeSend</h1>
          <p className="text-sm text-ink-soft mt-0.5">Think before you send.</p>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors duration-150 ${
                  isActive
                    ? "bg-beige text-ink font-medium"
                    : "text-ink-soft hover:bg-beige/60 hover:text-ink"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors duration-150 ${
                isActive
                  ? "bg-beige text-ink font-medium"
                  : "text-ink-soft hover:bg-beige/60 hover:text-ink"
              }`
            }
          >
            <Settings size={18} strokeWidth={2} />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex justify-around py-2">
        {[...links].map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors duration-150 ${
                isActive ? "text-ink font-medium" : "text-ink-soft"
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            {label === "Send Money" ? "Send" : label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
