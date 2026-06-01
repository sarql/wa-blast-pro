const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    console.log('Client connected to socket. Current status:', connectionStatus);
    socket.emit('status', connectionStatus);
    if (connectionStatus === 'qr' && lastQrCode) {
        socket.emit('qr', lastQrCode);
    }
});

// Increase JSON limit for base64 images
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 3001;

let client = null;
let connectionStatus = 'initializing'; 
let scheduledJobs = {}; // Map to track scheduled jobs
let isLoggingOut = false;
let lastQrCode = null;

const deleteSessionDirectory = () => {
    const sessionPath = path.join(__dirname, '../sessions/session');
    if (fs.existsSync(sessionPath)) {
        try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('Session directory deleted successfully.');
        } catch (err) {
            console.error('Error deleting session directory:', err);
        }
    }
};

function initializeClient() {
    console.log('Initializing WhatsApp Client...');
    connectionStatus = 'initializing';
    io.emit('status', 'initializing');

    const currentClient = new Client({
        authStrategy: new LocalAuth({ dataPath: './sessions' }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
        }
    });

    client = currentClient;

    currentClient.on('qr', (qr) => {
        if (client !== currentClient) return;
        connectionStatus = 'qr';
        qrcode.toDataURL(qr, (err, url) => {
            lastQrCode = url;
            io.emit('qr', url);
            io.emit('status', 'qr');
        });
    });

    currentClient.on('ready', () => {
        if (client !== currentClient) return;
        connectionStatus = 'ready';
        lastQrCode = null;
        io.emit('status', 'ready');
        console.log('WhatsApp Client is Ready');
    });

    currentClient.on('authenticated', () => {
        if (client !== currentClient) return;
        connectionStatus = 'authenticated';
        lastQrCode = null;
        io.emit('status', 'authenticated');
    });

    currentClient.on('auth_failure', async () => {
        if (client !== currentClient) return;
        connectionStatus = 'auth_failure';
        io.emit('status', 'auth_failure');
        console.log('Authentication failed. Cleaning up session...');
        
        try {
            await currentClient.destroy();
        } catch (e) {
            console.error('Error destroying client on auth failure:', e);
        }
        deleteSessionDirectory();

        setTimeout(() => {
            if (client === currentClient) {
                console.log('Re-initializing client after auth failure...');
                initializeClient();
            }
        }, 5000);
    });

    currentClient.on('disconnected', async (reason) => {
        if (client !== currentClient) return;
        connectionStatus = 'disconnected';
        io.emit('status', 'disconnected');
        console.log('Client disconnected:', reason);

        if (isLoggingOut) {
            console.log('Ignoring disconnect event as manual logout is in progress');
            return;
        }

        try {
            await currentClient.destroy();
        } catch (e) {
            console.error('Error destroying client on disconnect:', e);
        }

        setTimeout(() => {
            if (client === currentClient && !isLoggingOut) {
                console.log('Re-initializing client after disconnect...');
                initializeClient();
            }
        }, 5000);
    });

    currentClient.initialize().catch(err => {
        console.error('Initialization error during run:', err);
    });
}

// API Endpoints
app.get('/status', (req, res) => {
    res.json({ 
        status: connectionStatus,
        qr: connectionStatus === 'qr' ? lastQrCode : null
    });
});

app.get('/api/system-info', (req, res) => {
    const now = new Date();
    res.json({
        serverTime: now,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        formattedIST: now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        offset: now.getTimezoneOffset()
    });
});

app.get('/api/jobs', (req, res) => {
    try {
        const now = new Date();
        const jobs = Object.values(scheduledJobs)
            .filter(j => j && j.time && new Date(j.time) > now)
            .map(j => ({
                id: j.id,
                phone: j.phone,
                time: j.time,
                eta: new Date(j.time) - now
            }));
        res.json(jobs);
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.json([]);
    }
});

app.delete('/api/jobs/:id', (req, res) => {
    const { id } = req.params;
    const job = scheduledJobs[id];
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    if (job.instance) {
        job.instance.cancel();
    }
    delete scheduledJobs[id];
    io.emit('jobs_updated');
    console.log(`[CANCEL] Scheduled job ${id} cancelled.`);
    res.json({ success: true, message: 'Scheduled message cancelled' });
});

app.post('/api/logout', async (req, res) => {
    try {
        isLoggingOut = true;
        if (client) {
            await client.logout();
            await client.destroy();
        }
        connectionStatus = 'disconnected';
        io.emit('status', 'disconnected');
        
        deleteSessionDirectory();

        setTimeout(() => {
            isLoggingOut = false;
            initializeClient();
        }, 2000);

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        try {
            if (client) await client.destroy();
        } catch (destroyErr) {
            console.error('Error destroying client after failed logout:', destroyErr);
        }
        deleteSessionDirectory();
        
        setTimeout(() => {
            isLoggingOut = false;
            initializeClient();
        }, 2000);
        res.status(500).json({ error: 'Failed to logout', details: err.message });
    }
});

const sendWhatsAppMessage = async (phone, message, mediaData) => {
    const formattedPhone = phone.replace(/\D/g, '') + '@c.us';
    
    if (mediaData && mediaData.base64) {
        const media = new MessageMedia(
            mediaData.mimetype,
            mediaData.base64.split(',')[1], // Remove b64 prefix
            mediaData.filename
        );
        return await client.sendMessage(formattedPhone, media, { caption: message });
    } else {
        return await client.sendMessage(formattedPhone, message);
    }
};

app.post('/api/send', async (req, res) => {
    const { phone, message, media, scheduledTime } = req.body;

    if (connectionStatus !== 'ready' && connectionStatus !== 'authenticated') {
        return res.status(400).json({ error: 'WhatsApp not connected' });
    }

    // IF SCHEDULING
    if (scheduledTime) {
        const date = new Date(scheduledTime);
        const now = new Date();

        // VALIDATION: If time is in the past
        if (date <= now) {
            return res.status(400).json({ 
                error: 'Scheduled time is in the past', 
                serverTime: now.toISOString(),
                selectedTime: date.toISOString()
            });
        }

        const jobId = `job_${Date.now()}_${phone}`;
        console.log(`[SCHEDULE] Queued for ${phone} at ${date.toLocaleString()}`);
        
        const jobInstance = schedule.scheduleJob(date, async function() {
            try {
                await sendWhatsAppMessage(phone, message, media);
                console.log(`[SUCCESS] Scheduled message sent to ${phone}`);
                delete scheduledJobs[jobId];
                io.emit('log', { name: 'Auto System', phone, status: 'sent', scheduled: true });
                io.emit('jobs_updated'); // Trigger frontend refresh
            } catch (err) {
                console.error(`[FAILED] Scheduled send failed for ${phone}:`, err);
                io.emit('log', { name: 'Auto System', phone, status: 'failed', scheduled: true });
                delete scheduledJobs[jobId];
                io.emit('jobs_updated');
            }
        });

        // Store metadata
        scheduledJobs[jobId] = {
            id: jobId,
            phone: phone,
            time: date,
            instance: jobInstance
        };
        
        io.emit('jobs_updated');
        return res.json({ success: true, message: 'Message scheduled', jobId });
    }

    // IMMEDIATE SEND
    try {
        await sendWhatsAppMessage(phone, message, media);
        res.json({ success: true });
    } catch (err) {
        console.error('Send error:', err);
        res.status(500).json({ error: 'Failed to send', details: err.message });
    }
});

initializeClient();

server.listen(PORT, () => {
    console.log(`Automation server running on http://localhost:${PORT}`);
});
