# ⚡ Comandos Rápidos - Bot Twitch Monorepo

## 🚀 Inicio Rápido

```bash
# 1. Instalar todo
pnpm install

# 2. Build shared (requerido primero)
pnpm --filter @bot-twitch/shared build

# 3. Desarrollo completo (backend + overlay)
pnpm dev:full
```

## 📦 Por Package

### Backend
```bash
# Solo desarrollo backend
pnpm dev

# Build backend
pnpm --filter @bot-twitch/bot-backend build

# Tests
pnpm test
pnpm test:watch
pnpm test:coverage

# Lint
pnpm --filter @bot-twitch/bot-backend lint
pnpm --filter @bot-twitch/bot-backend lint:fix
```

### Overlay
```bash
# Solo desarrollo overlay
pnpm dev:overlay

# Build overlay
pnpm --filter @bot-twitch/obs-overlay build

# Lint
pnpm --filter @bot-twitch/obs-overlay lint
```

### Shared (Tipos)
```bash
# Build tipos compartidos
pnpm --filter @bot-twitch/shared build

# Watch mode (útil durante desarrollo)
pnpm --filter @bot-twitch/shared dev
```

## 🔧 Comandos Globales

```bash
# Build todo el monorepo
pnpm build

# Lint todo
pnpm lint

# Lint fix todo
pnpm lint:fix

# Limpiar todo (dist + node_modules)
pnpm clean

# Reinstalar desde cero
pnpm clean && pnpm install
```

## 🔍 Comandos de Validación

```bash
# Verificar estructura de packages
ls -la packages/

# Ver dependencias del workspace
pnpm list --depth 0

# Ver qué packages usan @bot-twitch/shared
pnpm why @bot-twitch/shared

# Verificar builds
pnpm -r build
```

## 🐛 Troubleshooting

### "Cannot find module '@bot-twitch/shared'"
```bash
cd packages/shared
pnpm build
cd ../..
pnpm install
```

### "Module not found" en imports con alias
```bash
# Verificar que vite.config.ts tenga los alias correctos
cat packages/obs-overlay/vite.config.ts

# Reiniciar servidor de desarrollo
pnpm dev:overlay
```

### Limpiar cache y reinstalar
```bash
rm -rf node_modules packages/*/node_modules packages/*/dist
pnpm install
pnpm build
```

## 📂 Navegación Rápida

```bash
# Backend
cd packages/bot-backend

# Overlay  
cd packages/obs-overlay

# Shared types
cd packages/shared

# Volver a raíz
cd ../..
```

## 🎯 Workflow Típico

### Agregar nueva feature al overlay
```bash
# 1. Crear estructura
mkdir -p packages/obs-overlay/src/features/nueva-feature/{components,hooks}

# 2. Crear container (mismo nombre que la feature)
touch packages/obs-overlay/src/features/nueva-feature/nueva-feature.tsx

# 3. Si necesita tipos nuevos, agregarlos a shared
touch packages/shared/src/nueva-feature/models.ts

# 4. Build shared
pnpm --filter @bot-twitch/shared build

# 5. Desarrollo
pnpm dev:full
```

### Actualizar tipos compartidos
```bash
# 1. Editar tipos
vim packages/shared/src/task/models.ts

# 2. Rebuild shared
pnpm --filter @bot-twitch/shared build

# 3. Los cambios se propagan automáticamente a backend y overlay
```

## 🧪 Testing

```bash
# Tests del backend
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Test específico
cd packages/bot-backend
pnpm test -- taskService.test.ts
```

## 🏗️ Build & Deploy

```bash
# Build everything
pnpm build

# Build solo backend
pnpm --filter @bot-twitch/bot-backend build

# Build solo overlay
pnpm --filter @bot-twitch/obs-overlay build

# Preview overlay build
cd packages/obs-overlay
pnpm preview
```

## 📊 Info del Proyecto

```bash
# Ver versión de pnpm
pnpm --version

# Ver workspaces
pnpm ls --depth -1

# Ver scripts disponibles
pnpm run

# Ver estructura de directorios
tree -L 3 -I 'node_modules|dist'
```

## 🎨 Desarrollo con OBS

```bash
# 1. Iniciar backend (puerto 3000)
pnpm dev

# 2. En otra terminal, iniciar overlay (puerto 5173)
pnpm dev:overlay

# 3. En OBS, agregar Browser Source:
# URL: http://localhost:5173
# Width: 1920
# Height: 1080
# CSS: body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
```

## 🔄 Migración de Archivos Antiguos

```bash
# Ver qué hay en las carpetas antiguas
ls -la src/
ls -la obs-overlay/

# Cuando estés listo, eliminar
rm -rf src/ obs-overlay/ scripts/
rm -f app.ts jest.config.ts

# Opcional: git commit
git add .
git commit -m "chore: complete monorepo migration"
```

---

💡 **Tip**: Guarda este archivo en favoritos para referencia rápida
