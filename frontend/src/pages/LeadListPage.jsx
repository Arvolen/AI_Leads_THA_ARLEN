// pages/LeadListPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api/leads/';
const ITEMS_PER_PAGE = 10;

export default function LeadListPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [searchQuery, statusFilter, ownerFilter, countryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, ownerFilter, countryFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE, {
        params: { q: searchQuery, status: statusFilter, owner: ownerFilter, country: countryFilter }
      });
      setLeads(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      q: searchQuery, status: statusFilter, owner: ownerFilter, country: countryFilter
    }).toString();
    window.open(`${API_BASE}export/?${params}`, '_blank');
  };

  const uniqueOwners = [...new Set(leads.map(l => l.owner).filter(Boolean))];
  const uniqueCountries = [...new Set(leads.map(l => l.country).filter(Boolean))];

  const totalPages = Math.max(1, Math.ceil(leads.length / ITEMS_PER_PAGE));
  const paginatedLeads = leads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      {/* Controls & Multi-Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg w-full lg:w-72">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-100"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-100 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
          </select>

          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-100 outline-none"
          >
            <option value="">All Owners</option>
            {uniqueOwners.map((owner, idx) => (
              <option key={idx} value={owner}>{owner}</option>
            ))}
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-100 outline-none"
          >
            <option value="">All Countries</option>
            {uniqueCountries.map((country, idx) => (
              <option key={idx} value={country}>{country}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition ml-auto"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-4">Name</th>
              <th className="p-4">Company</th>
              <th className="p-4">Country</th>
              <th className="p-4">Owner</th>
              <th className="p-4">Status</th>
              <th className="p-4">Source Channel</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {paginatedLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-900/50 transition">
                <td className="p-4 font-medium text-slate-100">
                  <Link to={`/leads/${lead.id}`} className="hover:text-indigo-400 transition">
                    {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`}
                  </Link>
                </td>
                <td className="p-4 text-slate-300">{lead.company || '-'}</td>
                <td className="p-4 text-slate-400">{lead.country || '-'}</td>
                <td className="p-4 text-slate-400">{lead.owner || 'Unassigned'}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded text-xs font-semibold">
                    {lead.status || 'New'}
                  </span>
                </td>
                <td className="p-4 text-emerald-400 font-medium">{lead.source_channel || 'Unassigned'}</td>
                <td className="p-4 text-right">
                  <Link
                    to={`/leads/${lead.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition"
                  >
                    <Eye size={14} /> View Details
                  </Link>
                </td>
              </tr>
            ))}
            {paginatedLeads.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">No leads found matching criteria.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {leads.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900">
            <span className="text-sm text-slate-400">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, leads.length)} of {leads.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}