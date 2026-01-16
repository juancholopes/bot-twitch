import styled from 'styled-components';
import { GlobalStyle } from '@shared/styles/global-styles';
import StreamTaskDisplay from '@features/stream-task-display/stream-task-display';
import NowPlayingDisplay from '@features/now-playing-display/now-playing-display';
import PomodoroDisplay from '@features/pomodoro-display/pomodoro-display';

const Container = styled.div`
  width: 1920px;
  height: 1080px;
  background: transparent !important;
  position: relative;
  overflow: hidden;
  pointer-events: none;

  &::before,
  &::after {
    display: none;
  }
`;

/**
 * OBS Overlay App
 * 
 * Orchestrates all overlay features for OBS streaming.
 * Features are independent and self-contained.
 */
function App() {
  return (
    <>
      <GlobalStyle />
      <Container>
        <StreamTaskDisplay />
        <NowPlayingDisplay />
        <PomodoroDisplay />
      </Container>
    </>
  );
}

export default App;
