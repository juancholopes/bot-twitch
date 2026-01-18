import SpotifyIcon from './SpotifyIcon';
import type { SpotifyTrack } from '@bot-twitch/shared/spotify';

interface SpotifyWidgetProps {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
}

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ currentTrack, isPlaying }) => {
  if (!currentTrack || !isPlaying) return null;

  const artistNames = currentTrack.artists.map(artist => artist.name).join(', ');
  const albumArt = currentTrack.album.images && currentTrack.album.images.length > 0 
    ? currentTrack.album.images[0].url 
    : null;

  const visibility = isPlaying
    ? 'translate-x-0 opacity-100'
    : '-translate-x-[150%] opacity-0';

  return (
    <div
      className={`pointer-events-auto fixed bottom-5 left-5 z-[1000] flex max-w-[350px] items-center rounded-full bg-[rgba(30,215,96,0.95)] px-4 py-2.5 text-white shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${visibility}`}
    >
      <SpotifyIcon className="mr-3 h-6 w-6 shrink-0" />
      {albumArt && (
        <img
          src={albumArt}
          alt="Album Art"
          className="mr-3 h-10 w-10 rounded-[4px] object-cover shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
        />
      )}
      <div className="flex min-w-0 flex-col justify-center whitespace-nowrap">
        <span className="truncate text-[14px] font-bold leading-tight">{currentTrack.name}</span>
        <span className="truncate text-[11px] opacity-90">{artistNames}</span>
      </div>
    </div>
  );
};

export default SpotifyWidget;
