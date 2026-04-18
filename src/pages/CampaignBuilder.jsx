import React, { useRef, useState, useEffect } from 'react';
import { MessageSquare, Info, Star, Clock, FileUp, X, Calendar, Save, History, LayoutTemplate } from 'lucide-react';
import StorageService from '../utils/StorageService';

const CampaignBuilder = ({ campaign, setCampaign }) => {
  const fileInputRef = useRef(null);
  const [serverTime, setServerTime] = useState(new Date());
  const [savedCampaigns, setSavedCampaigns] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    setSavedCampaigns(StorageService.getCampaigns());
    const timer = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const insertVariable = (variable) => {
    setCampaign({ ...campaign, message: campaign.message + `{${variable}}` });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large (Max 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCampaign({
        ...campaign,
        media: {
          displayUrl: URL.createObjectURL(file),
          base64: event.target.result,
          mimetype: file.type,
          filename: file.name
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCampaign = () => {
    if (!tempName.trim()) return;
    try {
      const saved = StorageService.saveCampaign(tempName, campaign);
      setSavedCampaigns([saved, ...savedCampaigns]);
      setTempName('');
      setShowSaveModal(false);
    } catch (e) {
      alert(e.message || 'Could not save template. Please clear old templates first.');
    }
  };

  const loadCampaign = (saved) => {
    if (window.confirm(`Load template "${saved.name}"?`)) {
      const { id, name, updatedAt, ...cleanData } = saved;
      setCampaign(cleanData);
    }
  };

  const deleteCampaign = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this template?")) {
      StorageService.deleteCampaign(id);
      setSavedCampaigns(savedCampaigns.filter(c => c.id !== id));
    }
  };

  const getTimeDiff = () => {
    if (!campaign.scheduledTime) return null;
    const diff = new Date(campaign.scheduledTime) - serverTime;
    if (diff <= 0) return <span style={{ color: 'var(--error)' }}>Time is in the past!</span>;
    const mins = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `Sends in ${hours}h ${mins % 60}m`;
    return `Sends in ${mins}m`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
      <div>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Campaign Builder</h1>
            <p style={{ color: 'var(--text-dim)' }}>Craft the perfect message with media and scheduling.</p>
          </div>
          <button onClick={() => setShowSaveModal(true)} className="btn-primary" style={{ background: 'var(--warning)', color: '#000', boxShadow: '0 0 15px rgba(210, 153, 34, 0.3)' }}>
            <Save size={18} /> Save as Template
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>Campaign Header</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Internal campaign name..."
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Message Content</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['name', 'phone'].map(v => (
                      <button key={v} onClick={() => insertVariable(v)} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--secondary)', border: '1px solid var(--secondary-glow)' }}>
                        +{v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea 
                  className="input-field" 
                  rows="6" 
                  placeholder="Hello {name}, check out our new update!"
                  style={{ resize: 'vertical', minHeight: '120px' }}
                  value={campaign.message}
                  onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
                ></textarea>
              </div>

              <div className="glass-card" style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '24px', alignItems: 'start' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '20px', marginBottom: '12px', fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>
                      <Clock size={14} style={{ flexShrink: 0 }} /> Send Delay
                    </label>
                    <select 
                      className="input-field"
                      style={{ background: 'var(--bg-dark)', width: '100%', cursor: 'pointer' }}
                      value={campaign.delay}
                      onChange={(e) => setCampaign({ ...campaign, delay: parseInt(e.target.value) })}
                    >
                      <option value="1">1s</option>
                      <option value="3">3s</option>
                      <option value="5">5s</option>
                      <option value="10">10s</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '20px', marginBottom: '12px', fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>
                      <Calendar size={14} style={{ flexShrink: 0 }} /> Schedule (IST)
                    </label>
                    <div style={{ width: '100%' }}>
                      <input 
                        type="datetime-local" 
                        className="input-field"
                        style={{ 
                          background: 'var(--bg-dark)',
                          colorScheme: 'dark',
                          padding: '10px',
                          width: '100%'
                        }}
                        value={campaign.scheduledTime || ''}
                        onChange={(e) => setCampaign({ ...campaign, scheduledTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 5px var(--primary)' }}></div>
                    Server: {serverTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getTimeDiff()}</span>
                </div>
              </div>

              {/* Media Section */}
              <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileUp size={16} /> Attachment
                </h4>
                {!campaign.media ? (
                  <button onClick={() => fileInputRef.current.click()} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-dim)', fontSize: '13px' }}>
                    Click to add Image or Document
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden' }}>
                      {campaign.media.mimetype.startsWith('image/') ? (
                        <img src={campaign.media.displayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : <div className="flex-center"><Info size={20} /></div>}
                    </div>
                    <span style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{campaign.media.filename}</span>
                    <button onClick={() => setCampaign({ ...campaign, media: null })} style={{ color: 'var(--error)', background: 'transparent' }}><X size={16} /></button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>
            </div>
          </div>

          <div>
             <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--primary)" /> Live Preview
            </h3>
            <div style={{ 
              background: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
              backgroundSize: 'cover', borderRadius: 'var(--radius-lg)', padding: '24px', minHeight: '400px', border: '1px solid var(--border)'
            }}>
              <div style={{ background: '#0b141a', padding: '8px', borderRadius: '0 12px 12px 12px', maxWidth: '85%', color: '#e9edef', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
                {campaign.media && campaign.media.mimetype.startsWith('image/') && <img src={campaign.media.displayUrl} style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }} />}
                <div style={{ padding: '4px 8px', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{campaign.message || "Template message..."}</div>
                <div style={{ fontSize: '10px', color: '#8696a0', textAlign: 'right', marginTop: '4px' }}>{serverTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Templates */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutTemplate size={20} color="var(--warning)" /> Saved Templates
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
          {savedCampaigns.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>No templates saved.</p>
          ) : (
            savedCampaigns.map(saved => (
              <div 
                key={saved.id} 
                onClick={() => loadCampaign(saved)}
                style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{saved.name}</span>
                  <button onClick={(e) => deleteCampaign(saved.id, e)} style={{ color: 'var(--error)', background: 'transparent' }}><X size={14} /></button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', height: '2.4em', overflow: 'hidden' }}>{saved.message}</p>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span>{saved.media ? '📎 File' : '📝 Text'}</span>
                  <span>{new Date(saved.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ padding: '32px', width: '400px' }}>
            <h2 style={{ marginBottom: '24px' }}>Save as Template</h2>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>Template Name</label>
            <input className="input-field" placeholder="e.g., Welcome Message v2" value={tempName} onChange={(e) => setTempName(e.target.value)} autoFocus />
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={handleSaveCampaign} className="btn-primary" style={{ flex: 1, background: 'var(--warning)', color: '#000', justifyContent: 'center' }}>Save Template</button>
              <button onClick={() => setShowSaveModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: 'var(--radius-sm)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignBuilder;
