import { useState, useEffect } from 'react';
import axios from 'axios';
import type { SpotifyTrack, SpotifyPlayerState } from '@bot-twitch/shared/spotify';

interface UseSpotifyPlayerReturn {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  loading: boolean;
  error: Error | null;
}

export const useSpotifyPlayer = (): UseSpotifyPlayerReturn => {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
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
