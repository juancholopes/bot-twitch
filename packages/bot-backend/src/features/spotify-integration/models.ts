export interface SpotifyTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
}

export interface SpotifyPlayerState {
	is_playing: boolean;
	item?: {
		name: string;
		artists: Array<{ name: string }>;
		album: {
			name: string;
			images: Array<{ url: string }>;
		};
	};
	progress_ms?: number;
	device?: {
		name: string;
		type: string;
	};
}
