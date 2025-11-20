const config = require("../config/environment");
const axios = require("axios");

// In-memory token storage (in production, use a database)
let accessToken = null;
let tokenExpiration = null;

/**
 * Get authorization URL for user to login with Spotify
 */
function getAuthorizationUrl() {
  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: "code",
    redirect_uri: config.spotify.redirectUri,
    scope: scopes,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function getTokensFromCode(code) {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: config.spotify.redirectUri,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${config.spotify.clientId}:${config.spotify.clientSecret}`
        ).toString("base64")}`,
      },
    }
  );

  return response.data;
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken) {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${config.spotify.clientId}:${config.spotify.clientSecret}`
        ).toString("base64")}`,
      },
    }
  );

  return response.data;
}

/**
 * Get a valid access token (refresh if needed)
 */
async function getAccessToken(refreshToken) {
  // Check if we have a valid token in memory
  if (accessToken && tokenExpiration && Date.now() < tokenExpiration) {
    return accessToken;
  }

  // Refresh the token
  const data = await refreshAccessToken(refreshToken);
  accessToken = data.access_token;
  tokenExpiration = Date.now() + data.expires_in * 1000;

  return accessToken;
}

/**
 * Get currently playing track
 */
async function getCurrentlyPlaying(refreshToken) {
  const token = await getAccessToken(refreshToken);

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 204) {
      // No track currently playing
      return null;
    }
    throw error;
  }
}

module.exports = {
  getAuthorizationUrl,
  getTokensFromCode,
  refreshAccessToken,
  getAccessToken,
  getCurrentlyPlaying,
};
