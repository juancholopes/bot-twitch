# 🔄 Guía de Migración - Arquitectura Anterior → Nueva

## 📋 Resumen de Cambios

Esta migración transforma una estructura técnica genérica en una arquitectura basada en **features** que sigue los principios de **Scope Rule** y **Screaming Architecture**.

---

## 🗺️ Mapa de Migración

### Archivos Movidos

| Ubicación Anterior | Ubicación Nueva | Razón |
|-------------------|-----------------|-------|
| `src/services/taskService.ts` | `src/features/task-management/task-management.service.ts` | Pertenece a la feature de gestión de tareas |
| `src/commands/task.ts` | `src/features/task-management/commands/task.command.ts` | Comando específico de la feature task-management |
| `src/commands/done.ts` | `src/features/task-management/commands/done.command.ts` | Comando específico de la feature task-management |
| `src/commands/cleardone.ts` | `src/features/task-management/commands/cleardone.command.ts` | Comando específico de la feature task-management |
| `src/commands/delete.ts` | `src/features/task-management/commands/delete.command.ts` | Comando específico de la feature task-management |
| `src/commands/mytasks.ts` | `src/features/task-management/commands/mytasks.command.ts` | Comando específico de la feature task-management |
| `src/services/spotifyService.ts` | `src/features/spotify-integration/spotify-integration.service.ts` | Pertenece a la feature de integración con Spotify |
| `src/routes/spotify.routes.ts` | `src/features/spotify-integration/spotify.routes.ts` | Rutas específicas de la feature Spotify |
| `src/commands/hello.ts` | `src/shared/bot-commands/hello.command.ts` | Comando general, no pertenece a ninguna feature específica |
| `src/commands/help.ts` | `src/shared/bot-commands/help.command.ts` | Comando general, no pertenece a ninguna feature específica |
| `src/utils/logger.ts` | `src/infrastructure/logging/logger.ts` | Infraestructura transversal usada por todas las features |
| `src/config/environment.ts` | `src/infrastructure/config/environment.ts` | Configuración transversal |
| `src/utils/rateLimiter.ts` | `src/infrastructure/rate-limiting/rateLimiter.ts` | Infraestructura transversal |
| `src/utils/validators.ts` | `src/shared/validation/validators.ts` | Puede ser usado por múltiples features (Scope Rule) |
| `src/utils/helpers.ts` | `src/features/task-management/utils.ts` | SOLO usado por task-management (Scope Rule) |
| Scripts en raíz | `scripts/` | Organización de scripts de utilidad |

---

## 🔧 Cambios en Imports

### Antes vs Ahora

#### En `bot.ts`:
```typescript
// ❌ ANTES
import config from './config/environment';
import logger from './utils/logger';
import { limiters } from './utils/rateLimiter';
const commandHandlers = (await import('./commands')).default;

// ✅ AHORA
import config from '@infrastructure/config/environment';
import logger from '@infrastructure/logging/logger';
import { limiters } from '@infrastructure/rate-limiting/rateLimiter';
import * as taskManagement from '@features/task-management';
import * as botCommands from '@shared/bot-commands';
```

#### En `server.ts`:
```typescript
// ❌ ANTES
import config from './config/environment';
import logger from './utils/logger';
import spotifyRoutes from './routes/spotify.routes';
import taskService from './services/taskService';

// ✅ AHORA
import config from '@infrastructure/config/environment';
import logger from '@infrastructure/logging/logger';
import { spotifyRoutes } from '@features/spotify-integration';
import { taskManagementService } from '@features/task-management';
```

#### En features:
```typescript
// ❌ ANTES
import config from '../config/environment';
import logger from '../utils/logger';
import taskService from '../services/taskService';

// ✅ AHORA
import config from '@infrastructure/config/environment';
import logger from '@infrastructure/logging/logger';
import taskManagementService from '../task-management.service';
// O si lo importas desde fuera de la feature:
import { taskManagementService } from '@features/task-management';
```

---

## 📦 Nuevas Convenciones de Nombres

### Servicios
```typescript
// ✅ Convención: El servicio principal tiene el MISMO nombre que la feature
features/task-management/task-management.service.ts
features/spotify-integration/spotify-integration.service.ts
```

### Comandos
```typescript
// ✅ Convención: Sufijo .command.ts
commands/task.command.ts
commands/done.command.ts
```

### Exports de Features
Cada feature expone su API pública en `index.ts`:

```typescript
// features/task-management/index.ts
export * from './commands';
export { default as taskManagementService } from './task-management.service';
export * from './models';
```

---

## 🎯 Análisis de Scope Rule Aplicado

### Utilities → `task-management/utils.ts`
**Funciones**: `parseTaskNumbers`, `validateTaskNumbers`, `formatTaskList`, `formatCompletedTasks`

**Decisión**: Van en `features/task-management/utils.ts`  
**Razón**: SOLO son usadas por la feature task-management (Scope Rule)

### Validators → `shared/validation/validators.ts`
**Funciones**: `sanitizeTask`, `isValidInput`

**Decisión**: Van en `shared/validation/`  
**Razón**: Validación puede ser usada por múltiples features (Scope Rule preventivo)

### Logger → `infrastructure/logging/logger.ts`
**Decisión**: Infraestructura  
**Razón**: Usado por TODAS las features - cross-cutting concern

### Config → `infrastructure/config/environment.ts`
**Decisión**: Infraestructura  
**Razón**: Configuración global de la aplicación

### Rate Limiter → `infrastructure/rate-limiting/rateLimiter.ts`
**Decisión**: Infraestructura  
**Razón**: Mecanismo de protección transversal

---

## ✅ Checklist de Migración

Si quieres aplicar esta arquitectura a otra parte del código:

- [ ] **Identificar features de negocio** - ¿Qué hace la aplicación?
- [ ] **Crear estructura de features** - Una carpeta por feature en `features/`
- [ ] **Aplicar Scope Rule** - Contar cuántas features usan cada archivo
  - 1 feature → Local en la feature
  - 2+ features → `shared/`
  - Infraestructura técnica → `infrastructure/`
- [ ] **Renombrar servicios** - `[feature-name].service.ts`
- [ ] **Actualizar imports** - Usar path aliases (`@features`, `@shared`, `@infrastructure`)
- [ ] **Crear exports públicos** - `index.ts` en cada feature
- [ ] **Actualizar archivos principales** - `bot.ts`, `server.ts`, `app.ts`
- [ ] **Mover scripts** - Llevar scripts sueltos a `scripts/`
- [ ] **Documentar** - Crear/actualizar `ARCHITECTURE.md`

---

## 🚨 Cambios que Requieren Atención

### 1. Tests
Si tienes tests, necesitarás actualizar los imports:

```typescript
// ❌ ANTES
import taskService from '../services/taskService';

// ✅ AHORA
import { taskManagementService } from '@features/task-management';
```

### 2. Scripts
Scripts que importan código del src necesitan actualizar paths:

```typescript
// En scripts/get-spotify-token.ts
// ❌ ANTES
import spotifyService from '../src/services/spotifyService';

// ✅ AHORA
import { spotifyIntegrationService } from '../src/features/spotify-integration';
```

### 3. OBS Overlay
Si el overlay importa código del backend, actualizar:

```typescript
// ❌ ANTES
import { UserTask } from '../src/services/taskService';

// ✅ AHORA
import type { UserTask } from '../src/features/task-management';
```

---

## 🎓 Para el Futuro: Cómo Mantener Esta Arquitectura

### ✅ Hacer (DO)
1. **Crear features por funcionalidad de negocio**, no por capa técnica
2. **Aplicar Scope Rule religiosamente** - Si 2+ features lo usan → `shared/`
3. **Usar path aliases** - Nunca `../../..`
4. **Nombrar servicios igual que features** - `task-management.service.ts`
5. **Exportar API pública** en `index.ts` de cada feature

### ❌ No Hacer (DON'T)
1. **No crear carpetas técnicas genéricas** (`controllers/`, `services/`, `models/`)
2. **No duplicar código** - Si se repite, evalúa moverlo a `shared/`
3. **No poner todo en `shared/`** - Solo lo que 2+ features usan
4. **No anticipar** - No muevas a `shared/` "por si acaso". Hazlo cuando realmente se comparta
5. **No acoplar features** - Una feature NO debe importar de otra feature. Usa `shared/` si necesitas compartir

---

## 🔗 Recursos Adicionales

- Lee `ARCHITECTURE.md` para entender los principios
- Revisa `src/features/task-management/` como ejemplo de referencia
- Usa el comando `git diff` para ver los cambios exactos realizados

---

## 💡 Ejemplo Práctico: Agregar una Nueva Feature

Supongamos que quieres agregar "User Points" (sistema de puntos):

```bash
# 1. Crear estructura
mkdir -p src/features/user-points/commands
touch src/features/user-points/user-points.service.ts
touch src/features/user-points/models.ts
touch src/features/user-points/commands/points.command.ts
touch src/features/user-points/commands/index.ts
touch src/features/user-points/index.ts

# 2. Implementar servicio
# user-points.service.ts usa:
# - @infrastructure/logging/logger
# - @infrastructure/config/environment
# - @shared/validation/validators (si necesita)

# 3. Crear comandos
# commands/points.command.ts

# 4. Exportar API pública
# index.ts:
# export * from './commands';
# export { default as userPointsService } from './user-points.service';

# 5. Usar en bot.ts
# import * as userPoints from '@features/user-points';
# await userPoints.handlePoints(...);
```

---

**¡La arquitectura ahora grita "Bot de Twitch con Task Management y Spotify Integration"!** 🎉
