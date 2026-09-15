// components/Navbar.jsx
import { NavLink } from 'react-router-dom';
import { Users, CopyCheck, BarChart3, Send } from 'lucide-react';

export default function Navbar() {
  const linkStyle = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
      isActive ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <header className="border-b border-slate-800 bg-slate-950 p-4 sticky top-0 z-10 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          AI Lead Management
        </h1>
        <nav className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto w-full md:w-auto">
          <NavLink to="/leads" className={linkStyle}>
            <Users size={16} /> Leads
          </NavLink>
          <NavLink to="/dedupe" className={linkStyle}>
            <CopyCheck size={16} /> AI Dedup
          </NavLink>
          <NavLink to="/dashboard" className={linkStyle}>
            <BarChart3 size={16} /> Dashboard
          </NavLink>
          <NavLink to="/ingest" className={linkStyle}>
            <Send size={16} /> Web Ingest
          </NavLink>
        </nav>
      </div>
    </header>
  );
}