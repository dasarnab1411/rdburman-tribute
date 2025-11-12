// RD Burman Tribute Website - Backend Server
// Node.js + Express Server with API integrations

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// ============================================
// CONFIGURATION - Add these to .env file
// ============================================
const CONFIG = {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    GOOGLE_DRIVE_REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI,
    DRIVE_FOLDER_ID: '1FQNqgfrnppArFoYqkL7eL67-r1GS_ar6',
    
    // Optional: Other APIs
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
};

// ============================================
// 1. YOUTUBE API ENDPOINTS
// ============================================

// Search YouTube for RD Burman videos
app.get('/api/youtube/search', async (req, res) => {
    try {
        const searchTerms = [
            'RD Burman documentary',
            'RD Burman Pancham',
            'RD Burman interview',
            'RD Burman live performance',
            'RD Burman tribute',
            'RD Burman making of songs'
        ];
        
        const allVideos = [];
        
        for (const term of searchTerms) {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: term,
                    type: 'video',
                    maxResults: 5,
                    key: CONFIG.YOUTUBE_API_KEY,
                    relevanceLanguage: 'en',
                    safeSearch: 'none',
                    order: 'relevance'
                }
            });
            
            if (response.data.items) {
                allVideos.push(...response.data.items);
            }
        }
        
        // Remove duplicates
        const uniqueVideos = Array.from(
            new Map(allVideos.map(v => [v.id.videoId, v])).values()
        );
        
        res.json({
            success: true,
            count: uniqueVideos.length,
            videos: uniqueVideos
        });
        
    } catch (error) {
        console.error('YouTube API Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch YouTube videos',
            details: error.message
        });
    }
});

// Get specific video details
app.get('/api/youtube/video/:videoId', async (req, res) => {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet,contentDetails,statistics',
                id: req.params.videoId,
                key: CONFIG.YOUTUBE_API_KEY
            }
        });
        
        res.json({
            success: true,
            video: response.data.items[0]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch video details'
        });
    }
});

// ============================================
// 2. GOOGLE DRIVE API ENDPOINTS
// ============================================

let oauth2Client;

// Initialize Google Drive OAuth client
function initDriveClient() {
    oauth2Client = new google.auth.OAuth2(
        CONFIG.GOOGLE_DRIVE_CLIENT_ID,
        CONFIG.GOOGLE_DRIVE_CLIENT_SECRET,
        CONFIG.GOOGLE_DRIVE_REDIRECT_URI
    );
}

// Start OAuth flow
app.get('/api/drive/auth', (req, res) => {
    initDriveClient();
    
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.readonly']
    });
    
    res.json({ authUrl });
});

// OAuth callback
app.get('/api/drive/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        
        // Store tokens securely (in production, use a database)
        res.json({
            success: true,
            message: 'Authentication successful',
            tokens: tokens // In production, don't send tokens to frontend
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
});

// List files in Google Drive folder
app.post('/api/drive/list', async (req, res) => {
    try {
        const { accessToken } = req.body;
        
        if (accessToken) {
            oauth2Client.setCredentials({ access_token: accessToken });
        }
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        // List files in the specific folder
        const response = await drive.files.list({
            q: `'${CONFIG.DRIVE_FOLDER_ID}' in parents`,
            fields: 'files(id, name, mimeType, webViewLink, iconLink, thumbnailLink, size)',
            orderBy: 'name',
            pageSize: 100
        });
        
        // Organize files by folders
        const files = response.data.files;
        const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
        const audioFiles = files.filter(f => 
            f.mimeType.includes('audio') || f.name.endsWith('.mp3')
        );
        
        res.json({
            success: true,
            folders: folders,
            audioFiles: audioFiles,
            totalCount: files.length
        });
        
    } catch (error) {
        console.error('Drive API Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to list Drive files',
            details: error.message
        });
    }
});

// Get files from a specific subfolder
app.post('/api/drive/folder/:folderId', async (req, res) => {
    try {
        const { accessToken } = req.body;
        const { folderId } = req.params;
        
        if (accessToken) {
            oauth2Client.setCredentials({ access_token: accessToken });
        }
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        const response = await drive.files.list({
            q: `'${folderId}' in parents`,
            fields: 'files(id, name, mimeType, webViewLink, iconLink, size)',
            orderBy: 'name',
            pageSize: 100
        });
        
        res.json({
            success: true,
            files: response.data.files
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to list folder contents'
        });
    }
});

// ============================================
// 3. WEB SCRAPING ENDPOINTS
// ============================================

// Scrape RD Burman articles and content
app.get('/api/scrape/articles', async (req, res) => {
    try {
        // This is a simplified example - in production, use proper scraping libraries
        const searches = [
            'RD Burman biography site:wikipedia.org',
            'RD Burman articles site:thehindu.com',
            'RD Burman tribute site:filmcompanion.in'
        ];
        
        const articles = [];
        
        // Use a search API (like SerpAPI or Bing Search API)
        // For now, returning structured data
        
        res.json({
            success: true,
            articles: [
                {
                    title: 'R.D. Burman - Wikipedia',
                    url: 'https://en.wikipedia.org/wiki/R._D._Burman',
                    source: 'Wikipedia',
                    snippet: 'Comprehensive biography and discography'
                },
                {
                    title: 'Remembering RD Burman',
                    url: 'https://www.thehindu.com',
                    source: 'The Hindu',
                    snippet: 'A tribute to the musical genius'
                }
            ]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to scrape articles'
        });
    }
});

// ============================================
// 4. SPOTIFY API (Optional - for music metadata)
// ============================================

let spotifyToken = null;
let spotifyTokenExpiry = null;

async function getSpotifyToken() {
    if (spotifyToken && spotifyTokenExpiry > Date.now()) {
        return spotifyToken;
    }
    
    const auth = Buffer.from(
        `${CONFIG.SPOTIFY_CLIENT_ID}:${CONFIG.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');
    
    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        spotifyToken = response.data.access_token;
        spotifyTokenExpiry = Date.now() + (response.data.expires_in * 1000);
        
        return spotifyToken;
        
    } catch (error) {
        throw new Error('Failed to authenticate with Spotify');
    }
}

app.get('/api/spotify/artist', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        
        const response = await axios.get(
            'https://api.spotify.com/v1/search',
            {
                params: {
                    q: 'R.D. Burman',
                    type: 'artist',
                    limit: 1
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        res.json({
            success: true,
            artist: response.data.artists.items[0]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Spotify data'
        });
    }
});

// ============================================
// 5. GENERAL CONTENT AGGREGATION
// ============================================

app.get('/api/aggregate/all', async (req, res) => {
    try {
        // Aggregate content from multiple sources
        const results = await Promise.allSettled([
            axios.get(`http://localhost:${PORT}/api/youtube/search`),
            // Add more API calls here
        ]);
        
        const aggregated = {
            youtube: results[0].status === 'fulfilled' ? results[0].value.data : null,
            // Add more sources
        };
        
        res.json({
            success: true,
            data: aggregated
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to aggregate content'
        });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        apis: {
            youtube: !!CONFIG.YOUTUBE_API_KEY,
            drive: !!CONFIG.GOOGLE_DRIVE_CLIENT_ID,
            spotify: !!CONFIG.SPOTIFY_CLIENT_ID
        }
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🎵 RD Burman Tribute API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`
    ========================================
    API Endpoints:
    ========================================
    YouTube:
    - GET  /api/youtube/search
    - GET  /api/youtube/video/:videoId
    
    Google Drive:
    - GET  /api/drive/auth
    - POST /api/drive/list
    - POST /api/drive/folder/:folderId
    
    Content:
    - GET  /api/scrape/articles
    - GET  /api/spotify/artist
    - GET  /api/aggregate/all
    ========================================
    `);
});

module.exports = app;