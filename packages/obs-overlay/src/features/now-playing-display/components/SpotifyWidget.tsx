import styled from 'styled-components';
import SpotifyIcon from './SpotifyIcon';
import type { SpotifyTrack } from '@bot-twitch/shared/spotify';

const Widget = styled.div<{ visible: boolean }>`
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  background-color: rgba(30, 215, 96, 0.95);
  padding: 10px 15px;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  max-width: 350px;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform: translateX(${props => props.visible ? '0' : '-150%'});
  opacity: ${props => props.visible ? '1' : '0'};
  z-index: 1000;
  pointer-events: auto;

  .spotify-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
    flex-shrink: 0;
  }
`;

const AlbumArt = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 12px;
  object-fit: cover;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
`;

const TrackName = styled.span`
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const ArtistName = styled.span`
  font-size: 11px;
  opacity: 0.9;
  text-overflow: ellipsis;
  overflow: hidden;
`;

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

  return (
    <Widget visible={isPlaying}>
      <SpotifyIcon />
      {albumArt && <AlbumArt src={albumArt} alt="Album Art" />}
      <Info>
        <TrackName>{currentTrack.name}</TrackName>
        <ArtistName>{artistNames}</ArtistName>
      </Info>
    </Widget>
  );
};

export default SpotifyWidget;
