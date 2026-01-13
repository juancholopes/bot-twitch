const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotifyService');
const logger = require('../utils/logger');

// Login route
router.get('/api/spotify/login', (req, res) => {
	const authUrl = spotifyService.getAuthorizationUrl();
	res.redirect(authUrl);
});

// Callback route - NOTE: This must match REDIRECT_URI exactly
router.get('/callback', async (req, res) => {
	const code = req.query.code || null;
	if (!code) {
		return res.redirect('/?error=invalid_code');
	}

	try {
		const { accessToken, refreshToken } =
			await spotifyService.getTokensFromCode(code);
		res.send(`
            <html>
                <body style="font-family: sans-serif; background: #121212; color: white; text-align: center; padding: 50px;">
                    <h1 style="color: #1DB954;">Spotify Connected!</h1>
                    <div style="background: #282828; padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h3>Refresh Token (Save this to your .env file):</h3>
                        <div style="background: #000; padding: 10px; word-break: break-all; font-family: monospace;">${refreshToken}</div>
                        <br>
                        <p>To configure automatically, run: <br><code>node set-spotify-token.js ${refreshToken}</code></p>
                        <button onclick="navigator.clipboard.writeText('${refreshToken}')" style="padding: 10px 20px; background: #1DB954; border: none; border-radius: 20px; color: white; cursor: pointer;">Copy to Clipboard</button>
                    </div>
                </body>
            </html>
        `);
	} catch (error) {
		logger.error('Callback error:', error);
		res.redirect('/?error=token_error');
	}
});

// Player state route
router.get('/api/spotify/player', async (req, res) => {
	try {
		const playerState = await spotifyService.getPlayerState();
		res.json(playerState || { is_playing: false });
	} catch (error) {
		logger.error('Route error /player:', error);
		res.status(500).json({ error: 'Failed to fetch player state' });
	}
});

module.exports = router;
