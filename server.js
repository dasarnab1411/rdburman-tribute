// RD Burman Tribute Website - Backend Server
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================
/* app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3001', 'http://127.0.0.1:3001','https://rdburman-tribute.vercel.app'],
    credentials: true
})); */

const allowedOrigins = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://rdburman-tribute.vercel.app'  // your Vercel URL
];

	app.use(cors({
	  origin: function (origin, callback) {
		// allow non-browser requests (no origin)
		if (!origin) return callback(null, true);
		if (allowedOrigins.indexOf(origin) === -1) {
		  return callback(new Error('CORS not allowed from this origin'), false);
		}
		return callback(null, true);
	  },
	  credentials: true
	}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    GOOGLE_DRIVE_API_KEY: process.env.GOOGLE_DRIVE_API_KEY,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
};

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        apis: {
            youtube: !!CONFIG.YOUTUBE_API_KEY,
            drive: !!CONFIG.GOOGLE_DRIVE_API_KEY
        }
    });
});

// ============================================
// IMAGE LISTING
// ============================================
app.get('/api/images/list', (req, res) => {
    try {
        const imagesDir = path.join(__dirname, 'public', 'images');
        if (!fs.existsSync(imagesDir)) {
            return res.json({ success: true, images: [] });
        }
        const files = fs.readdirSync(imagesDir);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
        });
        res.json({ success: true, images: imageFiles, count: imageFiles.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GOOGLE DRIVE AUDIO STREAMING
// ============================================
app.get('/api/drive/stream/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        console.log(`\n=== STREAMING REQUEST ===`);
        console.log(`File ID: ${fileId}`);
        console.log(`API Key: ${CONFIG.GOOGLE_DRIVE_API_KEY ? 'Present' : 'Missing'}`);
        
        const drive = google.drive({ 
            version: 'v3', 
            auth: CONFIG.GOOGLE_DRIVE_API_KEY 
        });
        
        // Get metadata
        console.log('Fetching file metadata...');
        const metadata = await drive.files.get({
            fileId: fileId,
            fields: 'name,mimeType,size',
            supportsAllDrives: true
        });
        
        console.log(`File: ${metadata.data.name}`);
        console.log(`Type: ${metadata.data.mimeType}`);
        console.log(`Size: ${metadata.data.size} bytes`);
        
        // Stream file
        console.log('Starting file stream...');
        const fileStream = await drive.files.get({
            fileId: fileId,
            alt: 'media',
            supportsAllDrives: true
        }, {
            responseType: 'stream'
        });
        
        // Set headers
        res.setHeader('Content-Type', metadata.data.mimeType || 'audio/mpeg');
        res.setHeader('Content-Length', metadata.data.size);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        // Pipe stream
        fileStream.data.pipe(res);
        
        fileStream.data.on('end', () => {
            console.log('Stream completed successfully');
        });
        
        fileStream.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Streaming failed' });
            }
        });
        
    } catch (error) {
        console.error('\n=== STREAMING ERROR ===');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Full error:', error);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }
    }
});

// ============================================
// GOOGLE DRIVE FOLDER CONTENTS
// ============================================
app.get('/api/drive/folder-contents/:folderId', async (req, res) => {
    try {
        const { folderId } = req.params;
        console.log(`\n=== FOLDER REQUEST ===`);
        console.log(`Folder ID: ${folderId}`);
        
        const drive = google.drive({ 
            version: 'v3', 
            auth: CONFIG.GOOGLE_DRIVE_API_KEY
        });
        
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, webViewLink, size, fileExtension)',
            orderBy: 'name',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });
        
        const files = response.data.files || [];
        console.log(`Found ${files.length} files`);
        
        const folders = files.filter(f => 
            f.mimeType === 'application/vnd.google-apps.folder'
        );
        
        const audioFiles = files.filter(f => 
            f.mimeType && f.mimeType.includes('audio') || 
            (f.fileExtension && ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma'].includes(f.fileExtension.toLowerCase()))
        );
        
        console.log(`Folders: ${folders.length}, Audio: ${audioFiles.length}`);
        
        res.json({
            success: true,
            folders: folders.map(f => ({
                id: f.id,
                name: f.name,
                link: f.webViewLink
            })),
            audioFiles: audioFiles.map(f => ({
                id: f.id,
                name: f.name.replace(/\.(mp3|wav|flac|m4a|aac|ogg|wma)$/i, ''),
                extension: f.fileExtension,
                size: f.size
            })),
            totalCount: files.length
        });
        
    } catch (error) {
        console.error('\n=== FOLDER ERROR ===');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        
        res.status(500).json({
            success: false,
            error: error.message,
            folderId: req.params.folderId
        });
    }
});

// ============================================
// YOUTUBE API
// ============================================
app.get('/api/youtube/search', async (req, res) => {
    try {
        if (!CONFIG.YOUTUBE_API_KEY) {
            return res.status(500).json({ success: false, error: 'YouTube API key not configured' });
        }

        const searchTerms = [
            'RD Burman documentary',
            'RD Burman Pancham Da',
            'RD Burman interview',
            'RD Burman live performance'
        ];
        
        let allVideos = [];
        
        for (const term of searchTerms) {
            try {
                const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                    params: {
                        part: 'snippet',
                        q: term,
                        type: 'video',
                        maxResults: 3,
                        key: CONFIG.YOUTUBE_API_KEY
                    }
                });
                if (response.data.items) {
                    allVideos.push(...response.data.items);
                }
            } catch (error) {
                console.error(`Error searching "${term}":`, error.message);
            }
        }
        
        const uniqueVideos = Array.from(
            new Map(allVideos.map(v => [v.id.videoId, v])).values()
        );
        
        res.json({
            success: true,
            count: uniqueVideos.length,
            videos: uniqueVideos.slice(0, 24)
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ERROR HANDLERS
// ============================================
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.originalUrl
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   🎵 RD BURMAN TRIBUTE SERVER                        ║
║   Port: ${PORT}                                        ║
║   URL: http://localhost:${PORT}                       ║
╚═══════════════════════════════════════════════════════╝

API Status:
  YouTube: ${CONFIG.YOUTUBE_API_KEY ? '✅' : '❌'}
  Drive:   ${CONFIG.GOOGLE_DRIVE_API_KEY ? '✅' : '❌'}

Ready! 🎶
    `);
});

module.exports = app;