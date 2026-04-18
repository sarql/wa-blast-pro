import React from 'react';
import { LayoutDashboard, Users, Send, Settings, ShieldCheck, MessageSquare } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'campaigns', icon: MessageSquare, label: 'Campaign Builder' },
    { id: 'sender', icon: Send, label: 'Bulk Sender' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="sidebar" style={{
      width: '280px',
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'var(--primary)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px var(--primary-glow)'
        }}>
          <Send size={24} color="#000" />
        </div>
        <h2 style={{ fontSize: '20px', letterSpacing: '-0.5px' }}>WaBlast <span style={{ color: 'var(--primary)', fontSize: '10px', verticalAlign: 'top' }}>PRO</span></h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === item.id ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
              color: activeTab === item.id ? 'var(--primary)' : 'var(--text-dim)',
              textAlign: 'left',
              fontSize: '15px',
              border: activeTab === item.id ? '1px solid rgba(37, 211, 102, 0.2)' : '1px solid transparent'
            }}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

        {/* Removed redundant settings button from sidebar as it's now in main nav */}
        
        <div className="status-badge" style={{
          marginTop: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={16} color="var(--primary)" />
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>Account Safe</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Interval delay active to prevent anti-spam detection.
          </p>
      </div>
      
      <div className="sidebar-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.6 }}>
          Powered by <span style={{ color: 'var(--primary)', fontWeight: '600', letterSpacing: '0.5px' }}>SARQL</span>
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
