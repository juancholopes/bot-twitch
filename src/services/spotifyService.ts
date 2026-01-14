import querystring from 'node:querystring';
import axios from 'axios';
import config from '../config/environment';
import logger from '../utils/logger';

interface SpotifyTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
}

class SpotifyService {
	private clientId?: string;
	private clientSecret?: string;
	private redirectUri: string;
	private refreshToken?: string;
	private enabled: boolean;
	private accessToken: string | null = null;
	private tokenExpiration: number = 0;

	constructor() {
		// Safe check for config properties
		const spotifyConfig = config.spotify || {};

		this.clientId = spotifyConfig.clientId;
		this.clientSecret = spotifyConfig.clientSecret;
		this.redirectUri = spotifyConfig.redirectUri;
		this.refreshToken = spotifyConfig.refreshToken;
		this.enabled = spotifyConfig.enabled;

		if (!this.isEnabled()) {
			logger.warn('Spotify service disabled or configuration missing.');
		}
	}

	isEnabled(): boolean {
		return this.enabled && !!this.clientId && !!this.clientSecret;
	}

	getAuthorizationUrl(): string {
		const scope = 'user-read-currently-playing user-read-playback-state';
		return (
			'https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: this.clientId,
				scope: scope,
				redirect_uri: this.redirectUri,
			})
		);
	}

	async getTokensFromCode(code: string): Promise<SpotifyTokenResponse> {
		const authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			method: 'post' as const,
			data: querystring.stringify({
				code: code,
				redirect_uri: this.redirectUri,
				grant_type: 'authorization_code',
			}),
			headers: {
				Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		};

		try {
			const response = await axios(authOptions);
			this.accessToken = response.data.access_token;
			this.tokenExpiration = Date.now() + response.data.expires_in * 1000;

			// Log refresh token for user to save
			if (response.data.refresh_token) {
				this.refreshToken = response.data.refresh_token; // Update in memory
			}

			return response.data;
		} catch (error: any) {
			logger.error(
				'Error getting tokens from code:',
				error.response ? error.response.data : error.message,
			);
			throw error;
		}
	}

	async refreshAccessToken(): Promise<string> {
		if (!this.refreshToken) {
			throw new Error('No refresh token available');
		}

		const authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			method: 'post' as const,
			data: querystring.stringify({
				grant_type: 'refresh_token',
				refresh_token: this.refreshToken,
			}),
			headers: {
				Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		};

		try {
			const response = await axios(authOptions);
			this.accessToken = response.data.access_token;
			this.tokenExpiration = Date.now() + response.data.expires_in * 1000;

			if (response.data.refresh_token) {
				this.refreshToken = response.data.refresh_token;
				logger.info('New Spotify refresh token received.');
			}

			return this.accessToken!;
		} catch (error: any) {
			const errorMsg = error.response
				? JSON.stringify(error.response.data)
				: error.message;
			logger.error(`Error refreshing Spotify access token: ${errorMsg}`);
			throw error;
		}
	}

	async getAccessToken(): Promise<string> {
		// Refresh 60 seconds before expiration
		if (this.accessToken && Date.now() < this.tokenExpiration - 60000) {
			return this.accessToken;
		}
		return await this.refreshAccessToken();
	}

	async getPlayerState(): Promise<any> {
		if (!this.isEnabled()) return null;

		try {
			return await this._requestWithRetry(async () => {
				const token = await this.getAccessToken();
				const response = await axios.get(
					'https://api.spotify.com/v1/me/player',
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				if (response.status === 204) {
					return null;
				}
				return response.data;
			});
		} catch (_error) {
			return null; // Return null on failure to keep bot valid
		}
	}

	private async _requestWithRetry<T>(
		requestFn: () => Promise<T>,
		retries: number = 3,
	): Promise<T> {
		let lastError: any;

		for (let i = 0; i < retries; i++) {
			try {
				return await requestFn();
			} catch (error: any) {
				lastError = error;

				// If unauthorized, token might be stale despite our checks
				if (error.response && error.response.status === 401) {
					logger.warn('Spotify 401. Invalidating token...');
					this.accessToken = null;
					this.tokenExpiration = 0;
					// Next iteration will call getAccessToken() which will refresh
					continue;
				}

				if (error.response && error.response.status === 429) {
					const retryAfter =
						(parseInt(error.response.headers['retry-after'], 10) ||
							5) * 1000;
					logger.warn(
						`Spotify Rate Limit. Waiting ${retryAfter / 1000}s`,
					);
					await new Promise((r) => setTimeout(r, retryAfter));
					continue;
				}

				if (error.response && error.response.status >= 500) {
					const delay = 1000 * 2 ** i;
					await new Promise((r) => setTimeout(r, delay));
					continue;
				}

				// If it's another error, don't retry
				throw error;
			}
		}
		throw lastError;
	}
}

export default new SpotifyService();
