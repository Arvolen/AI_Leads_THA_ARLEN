import { useState, useEffect } from 'react';
import axios from 'axios';
import { CopyCheck, Check, Loader2, GitCompare, AlertCircle } from 'lucide-react';

export default function DedupePage() {
  const [dedupeData, setDedupeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mergingKey, setMergingKey] = useState(null);

  useEffect(() => {
    axios.post('http://127.0.0.1:8000/api/leads/dedupe-candidates/')
      .then(res => setDedupeData(res.data.candidate_pairs || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleMerge = async (primaryId, secondaryId, pairIndex) => {
    const activeKey = `${primaryId}-${secondaryId}`;
    setMergingKey(activeKey);

    try {
      await axios.post('http://127.0.0.1:8000/api/leads/merge/', {
        primary_id: primaryId,
        secondary_id: secondaryId,
      });
      setDedupeData(prev => prev.filter((_, idx) => idx !== pairIndex));
    } catch (err) {
      console.error('Merge error:', err);
      alert(err.response?.data?.error || 'Failed to merge leads.');
    } finally {
      setMergingKey(null);
    }
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '24px', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCompare size={24} color="#818cf8" /> AI Duplicate Candidates
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Select which record to keep as primary when merging candidate duplicates.
          </p>
        </div>
        <span style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', color: '#cbd5e1' }}>
          {dedupeData.length} {dedupeData.length === 1 ? 'Pair Found' : 'Pairs Found'}
        </span>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <p>Scanning database for candidate duplicates...</p>
        </div>
      )}

      {/* Candidates List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {dedupeData.map((pair, idx) => {
          const isMergingThisPair = mergingKey?.includes(`${pair.lead_a.id}`) && mergingKey?.includes(`${pair.lead_b.id}`);
          const scorePct = Math.round(pair.confidence_score * 100);

          return (
            <div 
              key={`${pair.lead_a.id}-${pair.lead_b.id}`} 
              style={{ backgroundColor: '#020617', border: '2px solid #1e293b', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
            >
              {/* Pair Banner */}
              <div style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ backgroundColor: '#312e81', color: '#c7d2fe', border: '1px solid #4338ca', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px' }}>
                    Pair #{idx + 1}
                  </span>
                  <span style={{ backgroundColor: scorePct >= 85 ? '#4c0519' : '#451a03', color: scorePct >= 85 ? '#fecdd3' : '#fef3c7', border: `1px solid ${scorePct >= 85 ? '#881337' : '#78350f'}`, fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px' }}>
                    {scorePct}% Match Confidence
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', backgroundColor: '#020617', padding: '6px 12px', borderRadius: '6px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} color="#818cf8" />
                  <span><strong style={{ color: '#94a3b8' }}>Triggers:</strong> {pair.reasoning}</span>
                </div>
              </div>

              {/* Grid Body */}
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                
                {/* RECORD A */}
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                        Record A &bull; ID #{pair.lead_a.id}
                      </span>
                      {pair.lead_a.company && (
                        <span style={{ fontSize: '11px', backgroundColor: '#1e293b', color: '#cbd5e1', padding: '2px 8px', borderRadius: '4px' }}>
                          {pair.lead_a.company}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#ffffff' }}>{pair.lead_a.name}</h3>
                    <p style={{ fontSize: '13px', color: '#818cf8', fontFamily: 'monospace', margin: '0 0 12px 0' }}>{pair.lead_a.email || '—'}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Phone:</span>
                        <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{pair.lead_a.phone || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Owner:</span>
                        <span style={{ color: '#e2e8f0' }}>{pair.lead_a.owner || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMerge(pair.lead_a.id, pair.lead_b.id, idx)}
                    disabled={isMergingThisPair}
                    style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {isMergingThisPair && mergingKey === `${pair.lead_a.id}-${pair.lead_b.id}` ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={14} /> Keep Lead A (Merge B into A)
                      </>
                    )}
                  </button>
                </div>

                {/* RECORD B */}
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                        Record B &bull; ID #{pair.lead_b.id}
                      </span>
                      {pair.lead_b.company && (
                        <span style={{ fontSize: '11px', backgroundColor: '#1e293b', color: '#cbd5e1', padding: '2px 8px', borderRadius: '4px' }}>
                          {pair.lead_b.company}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#ffffff' }}>{pair.lead_b.name}</h3>
                    <p style={{ fontSize: '13px', color: '#818cf8', fontFamily: 'monospace', margin: '0 0 12px 0' }}>{pair.lead_b.email || '—'}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Phone:</span>
                        <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{pair.lead_b.phone || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Owner:</span>
                        <span style={{ color: '#e2e8f0' }}>{pair.lead_b.owner || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMerge(pair.lead_b.id, pair.lead_a.id, idx)}
                    disabled={isMergingThisPair}
                    style={{ backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {isMergingThisPair && mergingKey === `${pair.lead_b.id}-${pair.lead_a.id}` ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={14} /> Keep Lead B (Merge A into B)
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          );
        })}

        {dedupeData.length === 0 && !loading && (
          <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', color: '#64748b' }}>
            <CopyCheck size={48} color="#10b981" style={{ margin: '0 auto 16px auto', opacity: 0.8 }} />
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', margin: 0 }}>Database Clean!</p>
            <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>No candidate duplicate pairs detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}