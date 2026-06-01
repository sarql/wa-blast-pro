import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, User, Database, Terminal } from 'lucide-react';

const Settings = () => {
  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Account & Settings</h1>
        <p style={{ color: 'var(--text-dim)' }}>Manage your application preferences and security.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Profile Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={32} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px' }}>Admin User</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Local Administrator</p>
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Edit Profile
          </button>
        </div>

        {/* Messaging Defaults */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--secondary)" /> Messaging Defaults
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-dim)' }}>Default Batch Delay (s)</label>
              <input type="number" className="input-field" defaultValue="3" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>Anti-detection Mode</span>
              <div style={{ width: '40px', height: '20px', background: 'var(--primary)', borderRadius: '10px', position: 'relative' }}>
                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage / Database */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--warning)" /> Data Management
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '20px' }}>
            All contact data and message history are stored locally in your browser and current session folder.
          </p>
          <button style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--error)', 
            color: 'var(--error)', 
            background: 'transparent' 
          }}>
            Wipe All Local Data
          </button>
        </div>

        {/* System Info */}
        <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '16px' }}>System Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ENGINE VERSION</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>v2.4.1-stable</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SERVER UPTIME</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>2h 45m</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SESSION TYPE</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>Puppeteer Headless</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
