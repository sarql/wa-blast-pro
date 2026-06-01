const KEYS = {
  PROJECTS: 'wpro_projects',
  CAMPAIGNS: 'wpro_campaigns',
  HISTORY: 'wpro_history',
};

const StorageService = {
  // --- Projects (Contact Lists) ---
  saveProject: (title, contacts) => {
    const projects = StorageService.getProjects();
    const newProject = {
      id: Date.now(),
      title,
      contacts,
      createdAt: new Date().toISOString(),
    };
    const updated = [newProject, ...projects];
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(updated));
    return newProject;
  },

  getProjects: () => {
    const data = localStorage.getItem(KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },

  deleteProject: (id) => {
    const updated = StorageService.getProjects().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(updated));
  },

  // --- Campaigns (Templates) ---
  saveCampaign: (name, campaignData) => {
    const campaigns = StorageService.getCampaigns();
    
    // Strip heavy base64 media data before saving - only keep filename/mimetype
    const cleanMedia = campaignData.media ? {
      filename: campaignData.media.filename,
      mimetype: campaignData.media.mimetype,
      // Note: displayUrl and base64 are NOT saved (too large for localStorage)
    } : null;

    const newCampaign = {
      id: Date.now(),
      name,
      message: campaignData.message,
      delay: campaignData.delay,
      scheduledTime: null, // Don't persist one-time schedule
      media: cleanMedia,
      updatedAt: new Date().toISOString(),
    };
    
    try {
      const updated = [newCampaign, ...campaigns.slice(0, 19)]; // Keep max 20
      localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(updated));
      return newCampaign;
    } catch (e) {
      console.error('Campaign save failed:', e);
      throw new Error('Storage full. Clear old templates and try again.');
    }
  },

  getCampaigns: () => {
    const data = localStorage.getItem(KEYS.CAMPAIGNS);
    return data ? JSON.parse(data) : [];
  },

  deleteCampaign: (id) => {
    const updated = StorageService.getCampaigns().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(updated));
  },

  // --- History (Bulk Send Logs) ---
  saveHistory: (campaignName, logs, total, sent) => {
    const history = StorageService.getHistory();
    const entry = {
      id: Date.now(),
      campaignName,
      date: new Date().toISOString(),
      sent,
      total,
      logs, // Array of {name, phone, status, time}
    };
    const updated = [entry, ...history.slice(0, 49)]; // Keep last 50
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
    return entry;
  },

  getHistory: () => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  clearHistory: () => {
    localStorage.removeItem(KEYS.HISTORY);
  }
};

export default StorageService;
