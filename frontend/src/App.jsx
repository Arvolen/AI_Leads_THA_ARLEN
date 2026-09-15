// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LeadListPage from './pages/LeadListPage';
import LeadDetailPage from './pages/LeadDetailPage';
import DedupePage from './pages/DedupePage';
import DashboardPage from './pages/DashboardPage';
import IngestPage from './pages/IngestPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
        <Navbar />
        <main className="max-w-6xl mx-auto p-6 mt-4">
          <Routes>
            <Route path="/" element={<Navigate to="/leads" replace />} />
            <Route path="/leads" element={<LeadListPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />
            <Route path="/dedupe" element={<DedupePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ingest" element={<IngestPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}