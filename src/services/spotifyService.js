const axios = require('axios');
const querystring = require('querystring');
const logger = require('../utils/logger');
require('dotenv').config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
    logger.error('ERROR: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET are missing in .env file.');
}

let accessToken = null;
let tokenExpiration = 0;

const getAuthorizationUrl = () => {
    const scope = 'user-read-currently-playing user-read-playback-state';
    return 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: scope,
            redirect_uri: REDIRECT_URI,
        });
};

const getTokensFromCode = async (code) => {
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        method: 'post',
        data: querystring.stringify({
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        }),
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    };

    try {
        const response = await axios(authOptions);
        accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;
        tokenExpiration = Date.now() + (response.data.expires_in * 1000);
        return { accessToken, refreshToken };
    } catch (error) {
        logger.error('Error getting tokens from code:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const refreshAccessToken = async () => {
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        method: 'post',
        data: querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }),
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    };

    try {
        const response = await axios(authOptions);
        accessToken = response.data.access_token;
        if (response.data.refresh_token) {
             logger.info('New refresh token received (update your .env if persistent): ' + response.data.refresh_token);
        }
        tokenExpiration = Date.now() + (response.data.expires_in * 1000);
        return accessToken;
    } catch (error) {
         logger.error('Error refreshing access token:', error.response ? error.response.data : error.message);
         throw error;
    }
};

const getAccessToken = async () => {
    if (accessToken && Date.now() < tokenExpiration) {
        return accessToken;
    }
    return await refreshAccessToken();
};

const getPlayerState = async () => {
    try {
        const token = await getAccessToken();
        const response = await axios.get('https://api.spotify.com/v1/me/player', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.status === 204 || !response.data) {
            return null;
        }

        return response.data;
    } catch (error) {
        logger.error('Error getting player state - ' + (error.response ? error.response.status : error.message));
        return null;
    }
};

module.exports = {
    getAuthorizationUrl,
    getTokensFromCode,
    refreshAccessToken,
    getAccessToken,
    getPlayerState
};
