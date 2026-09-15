import { useState } from "react";
import { Upload, FileText, Code, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function IngestPage() {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    form_name: "Website Demo Request",
    page_url: "/contact",
    message: "",
  });

  // Raw JSON State
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(
      [
        {
          form_id: "form_demo_request",
          form_name: "Newsletter Signup",
          page_url: "/blog",
          submitted_at: new Date().toISOString(),
          name: "Karim Toure",
          email: "k.toure@liutrading.biz",
          phone: "+61 462 210 338",
          company: "Liu Trading Studio",
          country: "Australia",
          message: "Following up after our earlier conversation, please send more info.",
        },
      ],
      null,
      2
    )
  );

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendIngestRequest = async (payload) => {
    setLoading(true);
    setResponseMessage(null);
    setErrorMessage(null);

    try {
      const isArray = Array.isArray(payload);
      const itemsToIngest = isArray ? payload : [payload];
      const results = [];

      for (const item of itemsToIngest) {
        const res = await fetch("http://localhost:8000/api/leads/ingest/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        if (!res.ok) {
          throw new Error(`Failed to ingest record for ${item.email || item.name || "lead"}`);
        }

        const data = await res.json();
        results.push(data);
      }

      setResponseMessage(results);
    } catch (err) {
      setErrorMessage(err.message || "An error occurred during ingestion.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendIngestRequest(formData);
  };

  const handleJsonSubmit = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonInput);
      sendIngestRequest(parsed);
    } catch {
      setErrorMessage("Invalid JSON format. Please check your syntax.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Upload className="text-indigo-400" size={24} /> Lead Ingestion Portal
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Manually ingest single lead entries or submit bulk JSON payloads into the system.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 space-x-4">
        <button
          onClick={() => setActiveTab("form")}
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "form"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText size={16} /> Single Lead Form
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "json"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code size={16} /> Raw JSON Payload
        </button>
      </div>

      {/* Tab 1: Single Form */}
      {activeTab === "form" && (
        <form onSubmit={handleFormSubmit} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Company</label>
              <input
                type="text"
                name="company"
                placeholder="Company Name"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Country</label>
              <input
                type="text"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Form Name</label>
              <input
                type="text"
                name="form_name"
                placeholder="e.g. Website Demo Request"
                value={formData.form_name}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Page URL</label>
              <input
                type="text"
                name="page_url"
                placeholder="e.g. /contact"
                value={formData.page_url}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Message</label>
            <textarea
              name="message"
              placeholder="Message or submission notes..."
              rows={4}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Ingest Lead"}
          </button>
        </form>
      )}

      {/* Tab 2: Raw JSON */}
      {activeTab === "json" && (
        <form onSubmit={handleJsonSubmit} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 space-y-4">
          <label className="block text-sm text-slate-300">
            Paste contents from <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400 text-xs font-mono">website_form_submissions.json</code>:
          </label>
          <textarea
            rows={12}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Submit JSON Payload"}
          </button>
        </form>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Success / Result Display */}
      {responseMessage && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" /> Ingestion Results
          </h3>
          <div className="space-y-2">
            {responseMessage.map((res, index) => (
              <div key={index} className="bg-slate-900/80 border border-slate-700/50 p-3 rounded-lg flex items-center gap-3 text-sm">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${
                    res.status === "created"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  }`}
                >
                  {res.status}
                </span>
                <span className="text-slate-200">
                  {res.lead?.full_name || `${res.lead?.first_name || ""} ${res.lead?.last_name || ""}`.trim() || "Lead"}
                  <span className="text-slate-400 text-xs ml-2">({res.lead?.email || res.lead?.phone || "No contact info"})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}