/**
 * Spotify domain models - Shared between bot-backend and obs-overlay
 */

export interface SpotifyArtist {
  name: string;
}

export interface SpotifyAlbumImage {
  url: string;
  height?: number;
  width?: number;
}

export interface SpotifyAlbum {
  name?: string;
  images: SpotifyAlbumImage[];
}

export interface SpotifyTrack {
  id?: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms?: number;
  uri?: string;
}

export interface SpotifyPlayerState {
  is_playing: boolean;
  item?: SpotifyTrack | null;
  progress_ms?: number;
  device?: {
    name: string;
    type: string;
  };
}
