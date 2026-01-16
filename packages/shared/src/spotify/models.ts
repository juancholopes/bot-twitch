/**
 * Spotify domain models - Shared between bot-backend and obs-overlay
 */

export interface SpotifyArtist {
  name: string;
}

export interface SpotifyAlbumImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyAlbum {
  images: SpotifyAlbumImage[];
}

export interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface SpotifyPlayerState {
  item: SpotifyTrack | null;
  is_playing: boolean;
}
