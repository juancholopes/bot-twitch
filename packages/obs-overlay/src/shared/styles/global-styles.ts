import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    pointer-events: none;
  }

  body {
    margin: 0;
    padding: 0;
    background: transparent !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    pointer-events: none;
  }

  #root {
    width: 100vw;
    height: 100vh;
    background: transparent !important;
    pointer-events: none;
  }

  html, body, #root, div {
    background: transparent !important;
  }

  .interactive {
    pointer-events: auto !important;
  }

  * {
    will-change: auto;
  }
`;
