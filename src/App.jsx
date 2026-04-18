import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import CampaignBuilder from './pages/CampaignBuilder';
import BulkSender from './pages/BulkSender';
import Settings from './pages/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState([]);
  const [campaign, setCampaign] = useState({
    name: '',
    message: '',
    delay: 3,
    media: null,
    scheduledTime: null
  });

  // Dynamic Page Title for SEO
  React.useEffect(() => {
    const titles = {
      dashboard: 'Dashboard | WaBlast Pro',
      contacts: 'Contact Management | WaBlast Pro',
      campaigns: 'Campaign Builder | WaBlast Pro',
      sender: 'Bulk Sender Console | WaBlast Pro',
      settings: 'Account Settings | WaBlast Pro'
    };
    document.title = titles[activeTab] || 'WaBlast Pro';
  }, [activeTab]);

  // Lifted state — persists when user switches tabs
  const [sessionLogs, setSessionLogs] = useState([]);
  const [sendStatus, setSendStatus] = useState('idle'); // idle, sending, paused, completed
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={{ total: contacts.length, campaigns: 0 }} />;
      case 'contacts':
        return <Contacts contacts={contacts} setContacts={setContacts} />;
      case 'campaigns':
        return <CampaignBuilder campaign={campaign} setCampaign={setCampaign} />;
      case 'sender':
        return (
          <BulkSender
            contacts={contacts}
            campaign={campaign}
            sessionLogs={sessionLogs}
            setSessionLogs={setSessionLogs}
            sendStatus={sendStatus}
            setSendStatus={setSendStatus}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Layout>
        {renderContent()}
      </Layout>
    </div>
  );
}

export default App;
