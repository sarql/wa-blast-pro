import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, CheckCircle, AlertCircle, Loader2, Clock, History, ListRestart, Trash2, XCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { interpolate, formatPhone } from '../utils/SenderService';
import StorageService from '../utils/StorageService';

const BulkSender = ({
  contacts, campaign,
  sessionLogs, setSessionLogs,
  sendStatus, setSendStatus,
  currentIndex, setCurrentIndex
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [scheduledQueue, setScheduledQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  const total = contacts.length;
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;

  const fetchQueue = () => {
    fetch('http://localhost:3001/api/jobs')
      .then(res => res.json())
      .then(data => setScheduledQueue(data))
      .catch(() => setScheduledQueue([]));
  };

  // Setup socket and fetch initial data
  useEffect(() => {
    setHistory(StorageService.getHistory());

    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    fetch('http://localhost:3001/status')
      .then(res => res.json())
      .then(data => setConnectionStatus(data.status))
      .catch(() => setConnectionStatus('disconnected'));

    fetchQueue();

    socket.on('status', (s) => setConnectionStatus(s));
    socket.on('jobs_updated', fetchQueue);
    socket.on('log', (newLog) => {
      setSessionLogs(prev => [{
        ...newLog,
        id: Date.now(),
        time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      }, ...prev]);
    });

    // Refresh queue every 10s for countdown updates
    const queueRefresh = setInterval(fetchQueue, 10000);

    return () => {
      socket.close();
      clearInterval(queueRefresh);
    };
  }, []);

  const startSending = () => {
    if (connectionStatus !== 'ready' && connectionStatus !== 'authenticated') {
      alert("Please connect WhatsApp on the Dashboard first!");
      return;
    }
    if (contacts.length === 0) {
      alert("Please import contacts first!");
      return;
    }
    if (!campaign.message) {
      alert("Please compose a message first!");
      return;
    }
    setSendStatus('sending');
  };

  const pauseSending = () => {
    clearInterval(timerRef.current);
    setSendStatus('paused');
  };

  const resetPanel = () => {
    clearInterval(timerRef.current);
    if (sessionLogs.length > 0 && window.confirm("Save current session to history before resetting?")) {
      const entry = StorageService.saveHistory(campaign.name || 'Untitled', sessionLogs, total, currentIndex);
      setHistory(prev => [entry, ...prev]);
    }
    setSendStatus('idle');
    setCurrentIndex(0);
    setSessionLogs([]);
    setTimeRemaining(0);
  };

  const cancelScheduledJob = async (jobId) => {
    if (!window.confirm("Cancel this scheduled message?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/jobs/${jobId}`);
      fetchQueue();
    } catch (err) {
      alert("Could not cancel — the message may have already been sent.");
    }
  };

  const clearHistory = () => {
    if (window.confirm("Clear all campaign history?")) {
      StorageService.clearHistory();
      setHistory([]);
    }
  };

  // Core sending loop
  useEffect(() => {
    if (sendStatus !== 'sending') return;

    const processNextMessage = async () => {
      if (currentIndex < total) {
        const contact = contacts[currentIndex];
        const message = interpolate(campaign.message, contact);
        const phone = formatPhone(contact.phone);

        const logId = Date.now();
        const newLog = {
          id: logId,
          name: contact.name,
          phone: phone,
          status: 'sending',
          time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
        };
        setSessionLogs(prev => [newLog, ...prev]);

        try {
          await axios.post('http://localhost:3001/api/send', {
            phone, message,
            media: campaign.media,
            scheduledTime: campaign.scheduledTime
          });
          setSessionLogs(prev => prev.map(l => l.id === logId
            ? { ...l, status: campaign.scheduledTime ? 'scheduled' : 'sent' }
            : l));
        } catch (err) {
          const errMsg = err?.response?.data?.error || 'Failed';
          setSessionLogs(prev => prev.map(l => l.id === logId
            ? { ...l, status: 'failed', note: errMsg }
            : l));
        }

        if (!campaign.scheduledTime) {
          setTimeRemaining(campaign.delay);
          timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(timerRef.current);
                setCurrentIndex(i => i + 1);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setCurrentIndex(i => i + 1);
        }
      } else if (currentIndex >= total && total > 0) {
        setSendStatus('completed');
        const entry = StorageService.saveHistory(campaign.name || 'Untitled', sessionLogs, total, total);
        setHistory(prev => [entry, ...prev]);
      }
    };

    processNextMessage();
    return () => clearInterval(timerRef.current);
  }, [sendStatus, currentIndex]);

  const isConnected = connectionStatus === 'ready' || connectionStatus === 'authenticated';

  const statusColor = (s) => {
    if (s === 'sent') return 'var(--success)';
    if (s === 'scheduled') return 'var(--secondary)';
    if (s === 'failed') return 'var(--error)';
    return 'var(--warning)';
  };

  const formatEta = (ms) => {
    if (!ms || ms <= 0) return 'Soon';
    const mins = Math.floor(ms / 1000 / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '32px' }}>
      <div>
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Bulk Sender</h1>
            <p style={{ color: 'var(--text-dim)' }}>Monitor automated background delivery.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={resetPanel} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <ListRestart size={16} /> Reset
            </button>
            <div style={{ padding: '8px 16px', borderRadius: '20px', background: isConnected ? 'rgba(37,211,102,0.1)' : 'rgba(248,81,73,0.1)', color: isConnected ? 'var(--primary)' : 'var(--error)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid currentColor' }}>
              {isConnected ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </header>

        {/* Progress & Controls */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: '700' }}>{currentIndex}<span style={{ fontSize: '16px', color: 'var(--text-dim)' }}> / {total}</span></div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>PROCESSED</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: '700', color: 'var(--primary)' }}>{Math.round(progress)}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>COMPLETE</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: '700', color: 'var(--secondary)' }}>{sessionLogs.filter(l => l.status === 'sent').length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>SENT OK</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: '700', color: 'var(--error)' }}>{sessionLogs.filter(l => l.status === 'failed').length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>FAILED</div>
            </div>
          </div>

          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden', marginBottom: '28px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', boxShadow: '0 0 15px var(--primary-glow)', transition: 'width 0.5s ease' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
            {sendStatus === 'sending' ? (
              <button onClick={pauseSending} className="flex-center" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer' }}>
                <Pause size={26} />
              </button>
            ) : (
              <button
                onClick={startSending}
                disabled={sendStatus === 'completed'}
                className="btn-primary flex-center"
                style={{ width: '60px', height: '60px', borderRadius: '50%', background: sendStatus === 'completed' ? 'var(--text-muted)' : 'var(--primary)', opacity: isConnected ? 1 : 0.5 }}
              >
                <Play size={26} fill="currentColor" />
              </button>
            )}
            {sendStatus === 'sending' && !campaign.scheduledTime && (
              <div style={{ padding: '10px 24px', borderRadius: '32px', background: 'rgba(37,211,102,0.08)', border: '1px solid var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={16} color="var(--primary)" />
                <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)' }}>Next: {timeRemaining}s</span>
              </div>
            )}
            {sendStatus === 'completed' && (
              <div style={{ padding: '10px 24px', borderRadius: '32px', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <CheckCircle size={18} /> Campaign Complete!
              </div>
            )}
          </div>
        </div>

        {/* Persistent Session Logs */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px' }}>Current Session Logs</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {sendStatus === 'idle' && sessionLogs.length > 0 && (
                <button
                  onClick={() => {
                    const entry = StorageService.saveHistory(campaign.name || 'Untitled', sessionLogs, total, currentIndex);
                    setHistory(prev => [entry, ...prev]);
                    setSessionLogs([]);
                    setCurrentIndex(0);
                  }}
                  style={{ fontSize: '12px', color: 'var(--primary)', background: 'transparent' }}
                >Save & Clear</button>
              )}
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                {sessionLogs.length} entries
              </span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessionLogs.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Logs will appear here when you start a campaign.<br />They stay visible even when you switch tabs.</p>
              </div>
            ) : sessionLogs.map(log => (
              <div key={log.id} style={{
                padding: '12px 16px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)',
                borderLeft: `3px solid ${statusColor(log.status)}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{log.name || log.phone}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{log.phone} · {log.time}</div>
                  {log.note && <div style={{ fontSize: '11px', color: 'var(--error)', marginTop: '2px' }}>{log.note}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {log.status === 'sending' && <Loader2 size={14} className="animate-spin" color="var(--warning)" />}
                  <span style={{ fontSize: '11px', fontWeight: '700', color: statusColor(log.status) }}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Scheduled Queue with Cancel */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--secondary)" /> Scheduled Queue
            </h3>
            <button onClick={fetchQueue} style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'transparent' }}>Refresh</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
            {scheduledQueue.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>No pending scheduled messages.</p>
            ) : scheduledQueue.map(job => (
              <div key={job.id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,188,212,0.05)', border: '1px solid var(--secondary-glow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{job.phone}</div>
                  <div style={{ fontSize: '11px', color: 'var(--secondary)', marginTop: '2px' }}>
                    ⏱ {formatEta(job.eta)} · {new Date(job.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                  </div>
                </div>
                <button
                  onClick={() => cancelScheduledJob(job.id)}
                  title="Cancel this message"
                  style={{ color: 'var(--error)', background: 'transparent', padding: '4px' }}
                >
                  <XCircle size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign History */}
        <div className="glass-card" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--primary)" /> Campaign History
            </h3>
            <button onClick={clearHistory} style={{ background: 'transparent', color: 'var(--error)' }}><Trash2 size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
            {history.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '32px' }}>No history yet.</p>
            ) : history.map(item => (
              <div key={item.id} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>{item.campaignName}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>{new Date(item.date).toLocaleDateString('en-IN')}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{item.sent}/{item.total} Sent</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSender;
