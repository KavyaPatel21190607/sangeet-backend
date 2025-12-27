import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';

const router = express.Router();

// Initialize Spotify API with credentials
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

/**
 * @route   GET /api/spotify-auth/login
 * @desc    Initiate Spotify OAuth flow
 * @access  Public
 */
router.get('/login', (req, res) => {
    try {
        const scopes = [
            'streaming',
            'user-read-email',
            'user-read-private',
            'user-modify-playback-state',
            'user-read-playback-state',
            'user-read-currently-playing'
        ];

        const state = Math.random().toString(36).substring(7);
        const showDialog = true; // Force authorization dialog to show on every login attempt

        // createAuthorizeURL(scopes, state, showDialog, responseType)
        // For Authorization Code flow, responseType defaults to 'code'
        const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state, showDialog);

        res.json({
            success: true,
            authorizeURL
        });
    } catch (error) {
        console.error('Spotify login error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate Spotify login'
        });
    }
});

/**
 * @route   POST /api/spotify-auth/callback
 * @desc    Handle Spotify OAuth callback
 * @access  Public
 */
router.post('/callback', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // Exchange code for access token
        const data = await spotifyApi.authorizationCodeGrant(code);

        res.json({
            success: true,
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token,
            expiresIn: data.body.expires_in
        });
    } catch (error) {
        console.error('Spotify callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to exchange authorization code'
        });
    }
});

/**
 * @route   POST /api/spotify-auth/refresh
 * @desc    Refresh Spotify access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        spotifyApi.setRefreshToken(refreshToken);
        const data = await spotifyApi.refreshAccessToken();

        res.json({
            success: true,
            accessToken: data.body.access_token,
            expiresIn: data.body.expires_in
        });
    } catch (error) {
        console.error('Spotify refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh access token'
        });
    }
});

/**
 * @route   GET /api/spotify-auth/me
 * @desc    Get current Spotify user profile
 * @access  Public
 */
router.get('/me', async (req, res) => {
    try {
        const { accessToken } = req.query;

        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Access token is required'
            });
        }

        spotifyApi.setAccessToken(accessToken);
        const data = await spotifyApi.getMe();

        res.json({
            success: true,
            user: {
                id: data.body.id,
                displayName: data.body.display_name,
                email: data.body.email,
                country: data.body.country,
                product: data.body.product, // 'premium' or 'free'
                images: data.body.images
            }
        });
    } catch (error) {
        console.error('Spotify get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile'
        });
    }
});

export default router;
