# 🏗️ Arquitectura del Bot de Twitch

## 📐 Principios Arquitectónicos

Esta aplicación sigue dos principios fundamentales:

### 1. **Scope Rule** (Regla de Alcance)
> **"El alcance determina la estructura"**

- ✅ **Código usado por 2+ features** → DEBE ir en `shared/` o `infrastructure/`
- ✅ **Código usado por 1 feature** → DEBE permanecer local en esa feature
- ❌ **NO HAY EXCEPCIONES** - Esta regla es absoluta

### 2. **Screaming Architecture** (Arquitectura que Grita)
> **"La estructura debe gritar QUÉ hace la aplicación, no CÓMO está construida"**

Al abrir `src/`, **inmediatamente ves** que este es un:
- Bot de Twitch con **gestión de tareas** (`task-management`)
- Con **integración de Spotify** (`spotify-integration`)

NO ves carpetas genéricas como "controllers", "services", "utils" que no dicen nada sobre el negocio.

---

## 📁 Estructura del Proyecto

```
src/
├── features/                    # 🎯 FEATURES DE NEGOCIO
│   ├── task-management/         # Feature: Gestión de tareas de usuarios
│   │   ├── task-management.service.ts  # Servicio principal (mismo nombre que feature)
│   │   ├── models.ts            # Tipos específicos de tareas
│   │   ├── utils.ts             # Utilidades SOLO para tareas
│   │   ├── commands/            # Comandos del bot relacionados con tareas
│   │   │   ├── task.command.ts
│   │   │   ├── done.command.ts
│   │   │   ├── cleardone.command.ts
│   │   │   ├── delete.command.ts
│   │   │   ├── mytasks.command.ts
│   │   │   └── index.ts
│   │   └── index.ts             # Export público de la feature
│   │
│   └── spotify-integration/     # Feature: Integración con Spotify
│       ├── spotify-integration.service.ts  # Servicio principal
│       ├── spotify.routes.ts    # Rutas HTTP para Spotify
│       ├── models.ts            # Tipos de Spotify
│       └── index.ts
│
├── shared/                      # 🔄 USADO POR 2+ FEATURES
│   ├── bot-commands/            # Comandos generales del bot
│   │   ├── hello.command.ts
│   │   ├── help.command.ts
│   │   └── index.ts
│   ├── validation/              # Validación compartida
│   │   └── validators.ts
│   └── utils/                   # Utilidades compartidas (si las hubiera)
│
├── infrastructure/              # ⚙️ INFRAESTRUCTURA TRANSVERSAL
│   ├── config/                  # Configuración de la app
│   │   └── environment.ts
│   ├── logging/                 # Sistema de logs
│   │   └── logger.ts
│   └── rate-limiting/           # Control de tasa de peticiones
│       └── rateLimiter.ts
│
├── bot.ts                       # 🤖 Cliente del bot de Twitch
└── server.ts                    # 🌐 Servidor HTTP/WebSocket

obs-overlay/                     # 📺 Aplicación React separada (OBS overlay)
scripts/                         # 🛠️ Scripts de utilidad
data/                            # 💾 Datos persistentes
```

---

## 🎯 Decisiones de Diseño

### ¿Por qué `task-management` y no `tasks`?
- ✅ **Screaming Architecture**: Grita QUÉ hace (gestión de tareas)
- ✅ **Claridad de negocio**: Es una feature, no una simple carpeta de datos
- ✅ **Consistencia**: El servicio se llama `task-management.service.ts`

### ¿Por qué `validators` está en `shared/` y no en `task-management/utils.ts`?
- ✅ **Scope Rule**: Puede ser usado por múltiples features en el futuro
- ✅ **Validación es cross-cutting**: No pertenece a una sola feature

### ¿Por qué `logger` y `config` están en `infrastructure/`?
- ✅ **Cross-cutting concerns**: Son usados por TODAS las features
- ✅ **No son features de negocio**: Son infraestructura técnica

### ¿Por qué `hello` y `help` están en `shared/bot-commands/`?
- ✅ **No pertenecen a ninguna feature específica**: Son comandos generales del bot
- ✅ **Usados transversalmente**: Apoyan a todas las features

---

## 🔧 Path Aliasing

Para evitar imports relativos horribles (`../../utils/logger`), usamos:

```typescript
// ❌ ANTES (imports relativos)
import logger from '../../utils/logger';
import config from '../../config/environment';

// ✅ AHORA (path aliases)
import logger from '@infrastructure/logging/logger';
import config from '@infrastructure/config/environment';
import { handleAddTask } from '@features/task-management';
import Validators from '@shared/validation/validators';
```

### Aliases configurados:
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`
- `@infrastructure/*` → `src/infrastructure/*`

---

## 📦 Cómo Agregar una Nueva Feature

### Ejemplo: Agregar "Reward Management"

1. **Crea la estructura**:
```bash
src/features/reward-management/
├── reward-management.service.ts  # DEBE tener el mismo nombre que la feature
├── models.ts
├── commands/
│   ├── claim.command.ts
│   └── index.ts
└── index.ts
```

2. **Aplica el Scope Rule**:
- Si creas utilidades que SOLO usa esta feature → `reward-management/utils.ts`
- Si necesitas validación → Usa `@shared/validation/validators`
- Si necesitas logging → Usa `@infrastructure/logging/logger`

3. **Exports públicos** (`index.ts`):
```typescript
export { default as rewardManagementService } from './reward-management.service';
export * from './commands';
export * from './models';
```

4. **Úsala en `bot.ts`**:
```typescript
import * as rewardManagement from '@features/reward-management';

// En handleMessage:
else if (msg.toLowerCase() === '!claim') {
    await rewardManagement.handleClaim(this.client, channel, tags);
}
```

---

## ✅ Beneficios de Esta Arquitectura

### 1. **Escalabilidad**
- Agregar features es trivial - solo crea una nueva carpeta en `features/`
- No hay acoplamiento entre features

### 2. **Mantenibilidad**
- Cada feature es auto-contenida
- Los cambios están aislados
- Fácil de testear unitariamente

### 3. **Onboarding**
- Un nuevo desarrollador entiende QUÉ hace la app mirando `src/features/`
- La estructura guía hacia las decisiones correctas

### 4. **Clean Imports**
- Path aliasing elimina imports relativos complejos
- Código más legible

### 5. **Separation of Concerns**
- Features de negocio separadas de infraestructura
- Código compartido explícitamente identificado

---

## 🚫 Anti-Patrones a Evitar

### ❌ Crear carpetas técnicas genéricas
```
src/
├── controllers/
├── services/
├── models/
└── utils/
```
**Problema**: No grita QUÉ hace la aplicación.

### ❌ Duplicar código en lugar de moverlo a `shared/`
```
features/task-management/formatters.ts
features/reward-management/formatters.ts  # ⚠️ Código duplicado
```
**Solución**: Si 2+ features lo usan → `shared/formatters/`

### ❌ Poner TODO en `shared/`
```
shared/
├── task-utils.ts      # ⚠️ Solo lo usa task-management
├── spotify-utils.ts   # ⚠️ Solo lo usa spotify-integration
```
**Solución**: Scope Rule - Si solo 1 feature lo usa, va EN la feature.

---

## 📚 Referencias

- **Screaming Architecture**: [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- **Feature-Based Organization**: [Feature Sliced Design](https://feature-sliced.design/)

---

## 🎓 Preguntas Frecuentes

**P: ¿Dónde pongo un helper que PODRÍA usarse en múltiples features en el futuro?**  
**R**: Si actualmente solo 1 feature lo usa → En la feature. Cuando una 2da feature lo necesite → Refactoriza a `shared/`. No anticipes, refactoriza cuando sea necesario.

**P: ¿Puedo tener subcarpetas en una feature?**  
**R**: Sí, pero solo para organización interna. Ejemplo: `task-management/commands/`, `task-management/validators/`. La regla: TODO ahí dentro es SOLO para esa feature.

**P: ¿Dónde van los tests?**  
**R**: Junto al código que testean:
- `task-management/__tests__/task-management.service.test.ts`
- `shared/validation/__tests__/validators.test.ts`

**P: ¿Cómo sé si algo va en `infrastructure/` o `shared/`?**  
**R**: 
- `infrastructure/` → Preocupaciones técnicas transversales (logging, config, DB, auth)
- `shared/` → Lógica de negocio compartida entre features (validadores de dominio, formatters, etc.)
