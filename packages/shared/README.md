# @bot-twitch/shared

Tipos y modelos compartidos entre todos los packages del monorepo.

## Estructura

```
src/
  task/         # Modelos de dominio de tareas
  spotify/      # Modelos de dominio de Spotify
```

## Uso

```typescript
import { Task, UserTasks } from '@bot-twitch/shared/task';
import { SpotifyTrack, SpotifyPlayerState } from '@bot-twitch/shared/spotify';
```

## Single Source of Truth

Este package asegura que los tipos estén sincronizados entre backend y frontend.
