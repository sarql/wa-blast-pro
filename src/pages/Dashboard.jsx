import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Clock, ShieldCheck, QrCode, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';

const Dashboard = ({ stats }) => {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('initializing'); // initializing, qr, ready, authenticated, disconnected
  const [socket, setSocket] = useState(null);
  const [serverTime, setServerTime] = useState(new Date());

  useEffect(() => {
    const newSocket = io('https://wa-blast-pro.onrender.com');
    setSocket(newSocket);

    newSocket.on('qr', (url) => {
      setQrCode(url);
      setStatus('qr');
    });

    newSocket.on('status', (newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'ready' || newStatus === 'authenticated') {
        setQrCode(null);
      }
    });

    // Check initial status and time
    fetch('https://wa-blast-pro.onrender.com/status')
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(() => setStatus('disconnected'));

    const timer = setInterval(() => {
      setServerTime(new Date());
    }, 1000);

    return () => {
      newSocket.close();
      clearInterval(timer);
    };
  }, []);

  const cards = [
    { label: 'Total Contacts', value: stats?.total || 0, icon: Users, color: 'var(--primary)' },
    { label: 'Sent via Automation', value: 0, icon: Send, color: 'var(--secondary)' },
    { label: 'Active Campaigns', value: stats?.campaigns || 0, icon: MessageSquare, color: 'var(--warning)' },
    { label: 'Indian Standard Time (IST)', value: serverTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true }), icon: Clock, color: 'var(--primary)' },
  ];

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Automation Dashboard</h1>
          <p style={{ color: 'var(--text-dim)' }}>Manage your automated messaging session.</p>
        </div>
        <div style={{
          padding: '8px 16px',
          borderRadius: '20px',
          background: status === 'ready' || status === 'authenticated' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(248, 81, 73, 0.1)',
          color: status === 'ready' || status === 'authenticated' ? 'var(--primary)' : 'var(--error)',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid currentColor'
        }}>
          {status === 'ready' || status === 'authenticated' ? <Wifi size={16} /> : <WifiOff size={16} />}
          {status.toUpperCase()}
        </div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {cards.map((card, i) => (
          <div key={i} className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `rgba(255, 255, 255, 0.05)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <card.icon size={24} color={card.color} />
              </div>
            </div>
            <h3 style={{ fontSize: '28px', marginBottom: '4px' }}>{card.value}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* WhatsApp Connection Card */}
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {(status === 'ready' || status === 'authenticated') ? (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', marginBottom: '24px', justifyContent: 'center' }}>
                <ShieldCheck size={48} color="var(--primary)" />
              </div>
              <h2 style={{ marginBottom: '12px' }}>WhatsApp Connected</h2>
              <p style={{ color: 'var(--text-dim)', maxWidth: '300px', marginBottom: '24px' }}>Your automation engine is ready. You can now send bulk messages in the background.</p>
              <button 
                onClick={async () => {
                  if (window.confirm("Are you sure you want to disconnect? You will need to scan the QR code again.")) {
                    try {
                      const res = await fetch('https://wa-blast-pro.onrender.com/api/logout', { method: 'POST' });
                      const data = await res.json();
                      if (data.success) {
                        setStatus('disconnected');
                        setQrCode(null);
                      }
                    } catch (e) {
                      console.error("Logout failed", e);
                    }
                  }
                }}
                style={{
                  padding: '8px 24px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                Disconnect Session
              </button>
            </>
          ) : qrCode ? (
            <>
              <h2 style={{ marginBottom: '24px' }}>Scan QR Code</h2>
              <div style={{ 
                background: 'white', 
                padding: '16px', 
                borderRadius: '12px', 
                marginBottom: '24px',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.1)' 
              }}>
                <img src={qrCode} alt="WhatsApp QR Code" style={{ display: 'block' }} />
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt; Scan</p>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <QrCode size={32} color="var(--text-muted)" />
                </div>
              </div>
              <h2>Linking Session...</h2>
              <p style={{ color: 'var(--text-dim)', marginTop: '8px' }}>Please wait while we initialize the WhatsApp client.</p>
            </>
          )}
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px' }}>Session Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Environment</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Node.js / Puppeteer</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Auth Method</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Local Stored Session</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Socket Server</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: status === 'disconnected' ? 'var(--error)' : 'var(--success)' }}>
                {status === 'disconnected' ? 'OFFLINE' : 'ONLINE'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: '32px', padding: '16px', borderRadius: '12px', background: 'rgba(0, 188, 212, 0.05)', border: '1px dashed var(--secondary-glow)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center' }}>
              Automation is currently restricted to text messaging. Media support coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
