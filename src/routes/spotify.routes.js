const express = require("express");
const spotifyService = require("../services/spotifyService");
const config = require("../config/environment");

const router = express.Router();

/**
 * Step 1: Redirect user to Spotify authorization page
 */
router.get("/login", (req, res) => {
  const authUrl = spotifyService.getAuthorizationUrl();
  res.redirect(authUrl);
});

/**
 * Step 2: Handle callback from Spotify with authorization code
 */
router.get("/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `Spotify auth error: ${error}` });
  }

  if (!code) {
    return res.status(400).json({ error: "No authorization code received" });
  }

  try {
    const tokens = await spotifyService.getTokensFromCode(code);

    // In production, save tokens.refresh_token to database
    console.log("✅ Spotify authentication successful!");
    console.log("⚠️  IMPORTANT: Save this refresh token to your .env file:");
    console.log(`SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`);

    res.json({
      success: true,
      message: "Authentication successful! Check console for refresh token.",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
    });
  } catch (error) {
    console.error("Error getting tokens:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to get tokens",
      details: error.response?.data || error.message,
    });
  }
});

/**
 * Get currently playing track
 */
router.get("/now-playing", async (req, res) => {
  const refreshToken = config.spotify.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      error: "No refresh token configured. Please authenticate first by visiting /spotify/login",
    });
  }

  try {
    const track = await spotifyService.getCurrentlyPlaying(refreshToken);

    if (!track || !track.item) {
      return res.json({ isPlaying: false, message: "No track currently playing" });
    }

    res.json({
      isPlaying: track.is_playing,
      track: {
        name: track.item.name,
        artist: track.item.artists.map((a) => a.name).join(", "),
        album: track.item.album.name,
        albumArt: track.item.album.images[0]?.url,
        duration: track.item.duration_ms,
        progress: track.progress_ms,
      },
    });
  } catch (error) {
    console.error("Error getting currently playing:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to get currently playing track",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
