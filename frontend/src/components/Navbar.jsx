import { NavLink } from "react-router-dom";
import Mark from "./Mark.jsx";

const linkClass = ({ isActive }) =>
  `border-b-2 px-1 pb-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "border-vision text-ink"
      : "border-transparent text-ink-soft hover:text-ink"
  }`;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <span className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink">
          <Mark className="h-5 w-5" />
          Detecto
        </span>
        <nav className="flex items-center gap-5">
          <NavLink to="/" end className={linkClass}>
            Detect
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
        </nav>
      </div>
    </header>
  );
}