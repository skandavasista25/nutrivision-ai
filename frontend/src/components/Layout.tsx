
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  BookOpen,
  Leaf,
  Target,
  UserRound,
  LogOut,
  BrainCircuit,
} from "lucide-react";

import { logout } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/scanner", label: "Scanner", icon: ScanLine },
  { to: "/diary", label: "Diary", icon: BookOpen },
  { to: "/nutrition-coach", label: "AI Coach", icon: BrainCircuit },
  { to: "/alternatives", label: "Alternatives", icon: Leaf },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function Layout() {
  const nav = useNavigate();
  const { user } = useAuth();

  const out = async () => {
    await logout();
    nav("/login", { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">NutriVision</div>

        <nav aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? "nav active" : "nav"
              }
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          <div
            className="muted small ellipsis"
            title={user?.email ?? ""}
          >
            {user?.displayName || user?.email}
          </div>

          <button className="btn ghost" onClick={out}>
            <LogOut size={16} aria-hidden />
            Log out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Mobile">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive ? "tab active" : "tab"
            }
            aria-label={label}
          >
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}

        <button className="tab" onClick={out} aria-label="Log out">
          <LogOut size={20} aria-hidden />
          <span>Log out</span>
        </button>
      </nav>
    </div>
  );
}
