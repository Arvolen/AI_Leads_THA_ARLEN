import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/leads/dashboard/')
      .then(res => setDashboardData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!dashboardData) return <div className="p-8 text-center text-slate-400">Loading analytics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-md font-bold mb-4 text-indigo-400">Leads by Status</h3>
        <div className="space-y-3">
          {dashboardData.by_status.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800">
              <span className="text-sm font-medium">{item.status || 'Unassigned'}</span>
              <span className="font-bold text-slate-200">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-md font-bold mb-4 text-emerald-400">Leads by AI Source Channel</h3>
        <div className="space-y-3">
          {dashboardData.by_source_channel.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800">
              <span className="text-sm font-medium">{item.source_channel || 'Unassigned'}</span>
              <span className="font-bold text-slate-200">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}