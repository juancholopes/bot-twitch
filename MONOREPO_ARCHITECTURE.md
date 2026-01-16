# Bot Twitch - Monorepo Architecture

Monorepo del bot de Twitch con arquitectura **Scope Rule** y **Screaming Architecture**.

## 🏗️ Estructura del Monorepo

```
bot-twitch/
├── packages/
│   ├── shared/                    # Tipos compartidos (Single Source of Truth)
│   │   ├── src/
│   │   │   ├── task/              # Modelos de dominio de tareas
│   │   │   └── spotify/           # Modelos de dominio de Spotify
│   │   └── package.json
│   │
│   ├── bot-backend/               # Backend Node.js + Twitch Bot
│   │   ├── src/
│   │   │   ├── features/          # Features del bot (task-management, spotify-integration)
│   │   │   ├── infrastructure/    # Config, logging, rate-limiting
│   │   │   └── shared/            # Bot commands compartidos
│   │   └── package.json
│   │
│   └── obs-overlay/               # Frontend React para OBS
│       ├── src/
│       │   ├── features/
│       │   │   ├── stream-task-display/    # Feature: Lista de tareas en stream
│       │   │   └── now-playing-display/    # Feature: Widget de Spotify
│       │   ├── shared/            # Estilos globales
│       │   └── App.tsx            # Orquestador de features
│       └── package.json
│
├── pnpm-workspace.yaml
└── package.json
```

## 🎯 Principios Arquitectónicos

### 1. Scope Rule (Regla Fundamental)

**"El scope determina la estructura"**

- Código usado por 2+ features → DEBE ir en `shared/` o `infrastructure/`
- Código usado por 1 feature → DEBE quedarse local en esa feature
- **SIN EXCEPCIONES**

### 2. Screaming Architecture

La estructura grita la funcionalidad del negocio:

- `stream-task-display` - Sabes inmediatamente que muestra tareas en el stream
- `now-playing-display` - Obvio que muestra la canción actual
- `task-management` - Gestión de tareas del bot

### 3. Single Source of Truth

`packages/shared` contiene TODOS los tipos compartidos entre backend y frontend:
- ✅ Type safety garantizado
- ✅ No duplicación de modelos
- ✅ Cambios en un solo lugar

## 📦 Packages

### @bot-twitch/shared
Tipos TypeScript compartidos. **Ninguna lógica**, solo definiciones de tipos.

```typescript
import { Task, UserTasks } from '@bot-twitch/shared/task';
import { SpotifyTrack } from '@bot-twitch/shared/spotify';
```

### @bot-twitch/bot-backend
Backend del bot de Twitch:
- Integración con Twitch IRC (tmi.js)
- API REST + WebSocket para el overlay
- Gestión de tareas
- Integración con Spotify

### @bot-twitch/obs-overlay
Frontend React para overlays de OBS:
- Visualización en tiempo real de tareas
- Widget de Spotify "Now Playing"
- Diseñado para transparencia en OBS

## 🚀 Comandos

```bash
# Desarrollo
pnpm dev              # Backend solamente
pnpm dev:overlay      # Overlay solamente
pnpm dev:full         # Backend + Overlay simultáneamente

# Build
pnpm build            # Build todos los packages

# Testing
pnpm test             # Tests del backend
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Linting
pnpm lint             # Lint todos los packages
pnpm lint:fix         # Fix automático

# Limpieza
pnpm clean            # Eliminar dist/ y node_modules
```

## 🔄 Flujo de Trabajo

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

2. **Desarrollo local**:
   ```bash
   pnpm dev:full
   ```

3. **Agregar tipos compartidos**:
   - Editar `packages/shared/src/`
   - Rebuild: `pnpm --filter @bot-twitch/shared build`
   - Los cambios se propagan automáticamente

4. **Nueva feature**:
   - Backend: `packages/bot-backend/src/features/nueva-feature/`
   - Frontend: `packages/obs-overlay/src/features/nueva-feature/`
   - Container DEBE tener el mismo nombre que la feature

## 🎨 Decisiones Arquitectónicas

### ¿Por qué monorepo?
- ✅ Tipos compartidos sin publicar a npm
- ✅ Sincronización de versiones
- ✅ Refactorings atómicos
- ✅ Build y CI/CD unificados

### ¿Por qué Scope Rule?
- ✅ Evita over-engineering (componentes en shared innecesariamente)
- ✅ Fácil de escalar (clear ownership)
- ✅ Menor acoplamiento

### ¿Por qué Screaming Architecture?
- ✅ Onboarding rápido de nuevos devs
- ✅ Estructura autodocumentada
- ✅ Features independientes y testables

## 📝 Contribuir

Sigue **estrictamente** el Scope Rule:

1. ¿Tu componente/función es usado por 2+ features? → `shared/`
2. ¿Solo 1 feature lo usa? → Local en la feature
3. ¿Es cross-cutting (logging, auth, etc.)? → `infrastructure/`

**Container = Feature Name** (ej: `stream-task-display.tsx` para feature `stream-task-display/`)
