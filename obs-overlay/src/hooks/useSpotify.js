import { useState, useEffect } from 'react';
import axios from 'axios';

const useSpotify = () => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPlayerState = async () => {
        try {
            const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';
            const response = await axios.get(`${API_BASE}/api/spotify/player`); 
            
            if (response.data && response.data.item && response.data.is_playing) {
                setCurrentTrack(response.data.item);
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
                setCurrentTrack(null);
            }
            setError(null);
        } catch (err) {
            setError(err);
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

export default useSpotify;
