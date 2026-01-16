# OBS Overlay

React application for OBS streaming overlays with real-time task tracking and Spotify integration.

## Arquitectura

Sigue los principios de **Scope Rule** y **Screaming Architecture**:

```
src/
  features/
    stream-task-display/      # Live task list display
    now-playing-display/      # Spotify now playing widget
  shared/
    styles/                   # Global styles
  infrastructure/             # Cross-cutting concerns
```

## Features

### Stream Task Display
Muestra las tareas del chat en tiempo real con WebSocket.

### Now Playing Display  
Widget de Spotify que muestra la canción actual.

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```
