import { useSpotifyPlayer } from './hooks/use-spotify-player';
import SpotifyWidget from './components/SpotifyWidget';

/**
 * Now Playing Display Feature
 * 
 * Shows currently playing Spotify track on stream overlay.
 * Polls Spotify API every 5 seconds for updates.
 */
const NowPlayingDisplay: React.FC = () => {
  const { currentTrack, isPlaying } = useSpotifyPlayer();

  return <SpotifyWidget currentTrack={currentTrack} isPlaying={isPlaying} />;
};

export default NowPlayingDisplay;
