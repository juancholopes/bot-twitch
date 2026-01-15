// Task-related types
export interface Task {
  id: string;
  text: string;
  username: string;
  completed: boolean;
  timestamp: number;
}

export interface UserTasks {
  user: string;
  task?: string[];
  completed?: string[];
}

// Spotify-related types
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
