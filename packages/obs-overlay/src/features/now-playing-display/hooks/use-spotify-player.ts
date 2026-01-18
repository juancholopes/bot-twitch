import { useState, useEffect } from 'react';
import axios from 'axios';
import type { SpotifyTrack, SpotifyPlayerState } from '@bot-twitch/shared/spotify';

interface UseSpotifyPlayerReturn {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  loading: boolean;
  error: Error | null;
}

// Datos de prueba para desarrollo
const MOCK_TRACK: SpotifyTrack = {
  id: 'mock-track-1',
  name: 'LUNA',
  artists: [
    { name: 'Feid' },
    { name: 'ATL Jacob' }
  ],
  album: {
    name: 'FERXXOCALIPSIS',
    images: [
      { 
        url: 'https://i.scdn.co/image/ab67616d0000b273f1aad814a40ec7419c234242',
        height: 640,
        width: 640
      }
    ]
  },
  duration_ms: 180000,
  uri: 'spotify:track:mock'
};

export const useSpotifyPlayer = (): UseSpotifyPlayerReturn => {
  // Inicializar con datos de prueba en modo desarrollo
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(
    import.meta.env.DEV ? MOCK_TRACK : null
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(import.meta.env.DEV ? true : false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlayerState = async (): Promise<void> => {
    try {
      const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';
      const response = await axios.get<SpotifyPlayerState>(`${API_BASE}/api/spotify/player`);

      if (response.data && response.data.item && response.data.is_playing) {
        setCurrentTrack(response.data.item);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        setCurrentTrack(null);
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err 
        : new Error('Failed to fetch player state');
      setError(errorMessage);
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerState();
    const interval = setInterval(fetchPlayerState, 5000);
    return () => clearInterval(interval);
  }, []);

  return { currentTrack, isPlaying, loading, error };
};
