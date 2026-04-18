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

// Increase JSON limit for base64 images
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 3001;

// WhatsApp Client Initialization
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
    }
});

let connectionStatus = 'initializing'; 
let scheduledJobs = {}; // Map to track scheduled jobs

client.on('qr', (qr) => {
    connectionStatus = 'qr';
    qrcode.toDataURL(qr, (err, url) => {
        io.emit('qr', url);
        io.emit('status', 'qr');
    });
});

client.on('ready', () => {
    connectionStatus = 'ready';
    io.emit('status', 'ready');
    console.log('WhatsApp Client is Ready');
});

client.on('authenticated', () => {
    connectionStatus = 'authenticated';
    io.emit('status', 'authenticated');
});

client.on('auth_failure', () => {
    connectionStatus = 'auth_failure';
    io.emit('status', 'auth_failure');
});

client.on('disconnected', async (reason) => {
    connectionStatus = 'disconnected';
    io.emit('status', 'disconnected');
    console.log('Client disconnected:', reason);
    // Restart client
    try {
        await client.initialize();
    } catch (e) {
        console.error('Restart failed', e);
    }
});

// API Endpoints
app.get('/status', (req, res) => {
    res.json({ status: connectionStatus });
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
        await client.logout();
        connectionStatus = 'disconnected';
        io.emit('status', 'disconnected');
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
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

client.initialize().catch(err => console.error('Initialization error:', err));

server.listen(PORT, () => {
    console.log(`Automation server running on http://localhost:${PORT}`);
});
