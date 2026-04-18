import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, Plus, FileText, CheckCircle2, Save, FolderOpen, History, X } from 'lucide-react';
import Papa from 'papaparse';
import StorageService from '../utils/StorageService';

const Contacts = ({ contacts, setContacts }) => {
  const fileInputRef = useRef(null);
  const [manualInput, setManualInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    setProjects(StorageService.getProjects());
  }, []);

  const handleManualAdd = () => {
    if (!manualInput.trim()) return;
    const lines = manualInput.split(/[\n,]+/).map(line => line.trim()).filter(line => line);
    const newContacts = lines.map((val, index) => ({
      id: Date.now() + index,
      name: `Contact ${contacts.length + index + 1}`,
      phone: val,
    }));
    setContacts([...contacts, ...newContacts]);
    setManualInput('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const parsedContacts = results.data
            .filter(row => row.phone || row.Phone || row.Number)
            .map((row, index) => ({
              id: Date.now() + index,
              name: row.name || row.Name || `Contact ${index + 1}`,
              phone: row.phone || row.Phone || row.Number,
            }));
          setContacts([...contacts, ...parsedContacts]);
        },
      });
    }
  };

  const handleSaveProject = () => {
    if (!projectName.trim()) return;
    const newProj = StorageService.saveProject(projectName, contacts);
    setProjects([newProj, ...projects]);
    setProjectName('');
    setShowSaveModal(false);
  };

  const loadProject = (project) => {
    if (window.confirm(`Load project "${project.title}"? Current list will be replaced.`)) {
      setContacts(project.contacts);
    }
  };

  const deleteProject = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this project?")) {
      StorageService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const clearContacts = () => {
    if (window.confirm("Clear all current contacts?")) {
      setContacts([]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
      <div>
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Contact Management</h1>
            <p style={{ color: 'var(--text-dim)' }}>Import, group, and manage your broadcast lists.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowSaveModal(true)} disabled={contacts.length === 0} className="btn-primary" style={{ background: 'var(--secondary)', boxShadow: '0 0 15px var(--secondary-glow)' }}>
              <Save size={18} /> Save as Project
            </button>
            <button onClick={clearContacts} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)', boxShadow: 'none' }}>
              <Trash2 size={18} /> Clear List
            </button>
          </div>
        </header>

        {/* Quick Add Section */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--secondary-glow)', background: 'rgba(0, 188, 212, 0.05)' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Quick Paste Numbers
          </h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <textarea 
              className="input-field"
              style={{ flex: 1, minHeight: '80px', borderColor: 'var(--secondary-glow)' }}
              placeholder="Paste numbers here (one per line or comma separated)..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            ></textarea>
            <button onClick={handleManualAdd} className="btn-primary" style={{ height: 'fit-content', background: 'var(--secondary)', boxShadow: '0 0 15px var(--secondary-glow)' }}>
              Add Now
            </button>
          </div>
        </div>

        {contacts.length === 0 ? (
          <div className="glass-card" style={{ padding: '80px', textAlign: 'center', border: '2px dashed var(--border)' }}>
            <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', margin: '0 auto 24px' }}>
              <Upload size={32} color="var(--text-muted)" />
            </div>
            <h2 style={{ marginBottom: '12px' }}>No Contacts Loaded</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
              Upload a CSV/Excel file or paste numbers above to start your campaign.
            </p>
            <button onClick={() => fileInputRef.current.click()} className="btn-primary" style={{ margin: '0 auto' }}>
              <FileText size={18} /> Choose CSV File
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px' }}>Active List ({contacts.length} Contacts)</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <button onClick={() => fileInputRef.current.click()} style={{ background: 'transparent', color: 'var(--primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={16} /> Import More
                 </button>
                 <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
              </div>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0 }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)' }}>NAME</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)' }}>PHONE</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>{contact.name}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-dim)' }}>{contact.phone}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(37, 211, 102, 0.1)', color: 'var(--primary)' }}>
                          Valid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Projects Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={20} color="var(--primary)" /> Saved Projects
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
            {projects.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No saved lists yet.
              </p>
            ) : (
              projects.map(project => (
                <div 
                  key={project.id} 
                  onClick={() => loadProject(project)}
                  style={{ 
                    padding: '12px', 
                    borderRadius: 'var(--radius-sm)', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{project.title}</span>
                    <button onClick={(e) => deleteProject(project.id, e)} style={{ color: 'var(--error)', background: 'transparent' }}><X size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <span>{project.contacts.length} Contacts</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', background: 'rgba(37, 211, 102, 0.05)' }}>
           <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--primary)' }}>Pro Tip</h4>
           <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
             Saving lists as projects allows you to quickly switch target audiences without re-uploading files.
           </p>
        </div>
      </div>

      {/* Save Project Modal */}
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ padding: '32px', width: '400px' }}>
            <h2 style={{ marginBottom: '24px' }}>Save Contact List</h2>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>Project Title</label>
            <input 
              className="input-field" 
              placeholder="e.g., Summer Lead List" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button 
                onClick={handleSaveProject} 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Save Project
              </button>
              <button 
                onClick={() => setShowSaveModal(false)} 
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: 'var(--radius-sm)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
