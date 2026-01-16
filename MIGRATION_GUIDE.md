# Guía de Migración - Actualización de Imports

## ✅ Cambios Completados

1. ✅ Estructura de packages creada
2. ✅ `packages/shared` con tipos compartidos
3. ✅ `packages/bot-backend` con backend
4. ✅ `packages/obs-overlay` reorganizado con Scope Rule
5. ✅ `pnpm-workspace.yaml` actualizado
6. ✅ Scripts de desarrollo en package.json raíz

## 🔄 Pasos Pendientes (Manual)

### 1. Actualizar Imports en Backend

Los archivos en `packages/bot-backend/src/features/` que usen modelos de Task o Spotify deben importar desde `@bot-twitch/shared`:

**Antes:**
```typescript
import type { Task } from '../models';
```

**Después:**
```typescript
import type { Task, UserTasks } from '@bot-twitch/shared/task';
import type { SpotifyTrack, SpotifyPlayerState } from '@bot-twitch/shared/spotify';
```

**Archivos a revisar:**
- `packages/bot-backend/src/features/task-management/*.ts`
- `packages/bot-backend/src/features/spotify-integration/*.ts`
- Cualquier service, controller o route que use estos tipos

### 2. Limpiar Archivos Obsoletos

Una vez que verifiques que todo funciona en `packages/`:

```bash
# Eliminar carpetas antiguas
rm -rf src/
rm -rf obs-overlay/
rm -rf scripts/

# Eliminar archivos movidos
rm -f app.ts
rm -f jest.config.ts
rm -f tsconfig.json  # (ya está en cada package)
```

### 3. Actualizar .gitignore

Agregar a `.gitignore`:
```
# Package builds
packages/*/dist
packages/*/node_modules

# Keep old structure ignored if exists
/src/
/obs-overlay/
```

### 4. Build y Test

```bash
# Build shared primero
pnpm --filter @bot-twitch/shared build

# Build todo
pnpm build

# Test backend
pnpm test

# Desarrollo full
pnpm dev:full
```

## 🎯 Validación Final

### Checklist de Scope Rule

Para cada componente/función, pregúntate:

**¿Cuántas features lo usan?**
- **1 feature** → Debe estar DENTRO de la feature (`features/X/components/`)
- **2+ features** → Debe estar en `shared/` o `infrastructure/`
- **Tipos compartidos entre packages** → `packages/shared/`

### Estructura Esperada de OBS Overlay

```
packages/obs-overlay/src/
├── features/
│   ├── stream-task-display/          ✅ Feature específica
│   │   ├── stream-task-display.tsx   ✅ Container = nombre de feature
│   │   ├── components/               ✅ Componentes SOLO usados aquí
│   │   └── hooks/                    ✅ Hooks SOLO usados aquí
│   └── now-playing-display/          ✅ Feature específica
│       ├── now-playing-display.tsx   ✅ Container = nombre de feature
│       └── components/               ✅ Componentes SOLO usados aquí
├── shared/
│   └── styles/                       ✅ Usado por 2+ features
└── App.tsx                           ✅ Orquestador simple
```

**❌ NO DEBE HABER:**
- Carpeta `src/components/` genérica (violación del Scope Rule)
- Componentes compartidos que solo 1 feature usa
- Containers con nombres diferentes a su feature

## 🚨 Problemas Comunes

### "Cannot find module '@bot-twitch/shared'"

**Solución:**
```bash
# Build shared primero
cd packages/shared
pnpm build

# Reinstalar desde raíz
cd ../..
pnpm install
```

### "Module not found" en obs-overlay

**Solución:** Verificar que `tsconfig.json` de obs-overlay tenga:
```json
{
  "compilerOptions": {
    "paths": {
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"],
      "@infrastructure/*": ["./src/infrastructure/*"]
    }
  }
}
```

Y que `vite.config.ts` tenga:
```typescript
resolve: {
  alias: {
    '@features': path.resolve(__dirname, './src/features'),
    '@shared': path.resolve(__dirname, './src/shared'),
    '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
  }
}
```

## 📚 Recursos

- Ver [MONOREPO_ARCHITECTURE.md](./MONOREPO_ARCHITECTURE.md) para arquitectura completa
- Ejecutar `./migrate-monorepo.sh` para validar build

## ✨ Resultado Final

Un monorepo con:
- ✅ **Tipos compartidos** sin duplicación
- ✅ **Scope Rule** aplicado estrictamente
- ✅ **Screaming Architecture** - estructura autodocumentada
- ✅ **Features independientes** y testables
- ✅ **Single Source of Truth** para modelos de dominio
