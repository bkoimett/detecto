import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `px-4 py-2 rounded font-medium transition-colors ${
    isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"
  }`;

export default function Navbar() {
  return (
    <nav className="bg-white shadow px-6 py-3 flex items-center gap-6">
      <span className="text-xl font-bold text-blue-600">🎯 Detecto</span>
      <NavLink to="/" end className={linkClass}>
        Detection View
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        History View
      </NavLink>
    </nav>
  );
}