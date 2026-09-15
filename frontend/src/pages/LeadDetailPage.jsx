// pages/LeadDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Edit3, Sparkles, UserCheck, Phone, Mail, Building, Globe } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api/leads/';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patchForm, setPatchForm] = useState({ status: '', owner: '', notes: '' });

  useEffect(() => {
    fetchLeadDetail();
  }, [id]);

  const fetchLeadDetail = async () => {
    try {
      const res = await axios.get(`${API_BASE}${id}/`);
      setLead(res.data);
      setPatchForm({
        status: res.data.status || 'New',
        owner: res.data.owner || '',
        notes: res.data.notes || ''
      });
    } catch (err) {
      console.error("Failed to fetch lead details", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.patch(`${API_BASE}${id}/`, patchForm);
      setLead(res.data);
      alert("Lead updated successfully!");
    } catch (err) {
      alert("Failed to update lead.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading lead details...</div>;
  if (!lead) return <div className="p-8 text-center text-slate-400">Lead not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-sm font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Leads
        </button>
        <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded-full">
          Lead ID: #{lead.id}
        </span>
      </div>

      {/* Main Lead Header Card */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`}
          </h1>
          <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
            <Building size={14} /> {lead.company || 'No Company'} • <Globe size={14} /> {lead.country || 'No Location'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded-lg text-sm font-semibold">
            {lead.status || 'New'}
          </span>
        </div>
      </div>

      {/* Complete Data Attributes Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Personal & Contact Attributes */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Mail size={14} /> Contact Information
          </h2>
          <div className="space-y-2 text-slate-300">
            <div><span className="text-slate-500">First Name:</span> <strong className="text-slate-100">{lead.first_name || '-'}</strong></div>
            <div><span className="text-slate-500">Last Name:</span> <strong className="text-slate-100">{lead.last_name || '-'}</strong></div>
            <div><span className="text-slate-500">Email:</span> <strong className="text-slate-100">{lead.email || '-'}</strong></div>
            <div><span className="text-slate-500">Email Domain:</span> <strong className="text-slate-100">{lead.email_domain || '-'}</strong></div>
            <div><span className="text-slate-500">Phone:</span> <strong className="text-slate-100">{lead.phone || '-'}</strong></div>
            <div><span className="text-slate-500">Normalized Phone:</span> <strong className="text-slate-100">{lead.normalized_phone || '-'}</strong></div>
          </div>
        </div>

        {/* Assignment & System Metadata */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <UserCheck size={14} /> Assignment & Metadata
          </h2>
          <div className="space-y-2 text-slate-300">
            <div><span className="text-slate-500">Contact Owner:</span> <strong className="text-slate-100">{lead.owner || 'Unassigned'}</strong></div>
            <div><span className="text-slate-500">Country:</span> <strong className="text-slate-100">{lead.country || '-'}</strong></div>
            <div><span className="text-slate-500">Original Source:</span> <strong className="text-slate-100">{lead.original_source || '-'}</strong></div>
            <div><span className="text-slate-500">Created At:</span> <strong className="text-slate-100">{new Date(lead.created_at).toLocaleString()}</strong></div>
            <div><span className="text-slate-500">Updated At:</span> <strong className="text-slate-100">{new Date(lead.updated_at).toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      {/* AI Extraction Section (Part 3) */}
      <div className="bg-slate-950 border border-emerald-900/50 p-5 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
          <Sparkles size={16} /> AI Source Channel Extraction
        </div>
        <div className="text-sm text-slate-300">
          Extracted Channel: <strong className="text-emerald-300 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">{lead.source_channel || 'Unassigned'}</strong>
        </div>
        {lead.source_detail && (
          <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block mb-1">Extracted Source Detail:</span>
            "{lead.source_detail}"
          </div>
        )}
      </div>

      {/* Interactive PATCH Form */}
      <form onSubmit={handlePatchSubmit} className="bg-slate-950 border border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2">
          <Edit3 size={18} /> Update Lead Attributes (PATCH)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select
              value={patchForm.status}
              onChange={(e) => setPatchForm({ ...patchForm, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 outline-none"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Contact Owner</label>
            <input
              type="text"
              value={patchForm.owner}
              onChange={(e) => setPatchForm({ ...patchForm, owner: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
          <textarea
            rows="4"
            value={patchForm.notes}
            onChange={(e) => setPatchForm({ ...patchForm, notes: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 outline-none"
            placeholder="Add internal notes..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition"
          >
            Save Changes (PATCH)
          </button>
        </div>
      </form>
    </div>
  );
}