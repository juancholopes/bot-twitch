# 🧹 Limpieza Post-Refactorización

## ⚠️ IMPORTANTE

Después de verificar que la nueva arquitectura funciona correctamente, debes limpiar los archivos antiguos que ya no se usan.

---

## 📋 Archivos/Carpetas a Eliminar

### Carpetas Antiguas (Ya migradas a nueva estructura)

```bash
# ❌ Estas carpetas contienen código antiguo duplicado:
src/commands/           → Migrado a features/ y shared/bot-commands/
src/services/          → Migrado a features/
src/routes/            → Migrado a features/
src/config/            → Migrado a infrastructure/config/
src/utils/helpers.ts   → Migrado a features/task-management/utils.ts
src/utils/logger.ts    → Migrado a infrastructure/logging/
src/utils/rateLimiter.ts → Migrado a infrastructure/rate-limiting/
src/utils/validators.ts → Migrado a shared/validation/
```

---

## ✅ Pasos de Limpieza (Ejecutar en orden)

### Paso 1: Verificación Final

**Antes de eliminar nada, verifica:**

```bash
# 1. Build funciona
npm run build

# 2. Tests pasan
npm test

# 3. Lint está limpio
npm run lint

# 4. Aplicación arranca
npm run dev
```

Si todo pasa ✅, continúa con la limpieza.

---

### Paso 2: Backup (Opcional pero Recomendado)

```bash
# Crear rama de backup
git checkout -b backup-before-cleanup

# O crear carpeta de backup
mkdir -p old-architecture
cp -r src/commands src/services src/routes src/config src/utils old-architecture/
```

---

### Paso 3: Eliminar Carpetas Antiguas

```bash
cd /home/juancho/Projects/bot-twich

# Eliminar carpetas de código antiguo
rm -rf src/commands
rm -rf src/services  
rm -rf src/routes
rm -rf src/config
rm -rf src/utils

# Nota: Esto preserva los tests en sus ubicaciones originales
# Los tests se pueden migrar después a las nuevas features
```

**⚠️ ADVERTENCIA**: Asegúrate de haber hecho backup antes de ejecutar estos comandos.

---

### Paso 4: Migrar Tests a Nueva Estructura

```bash
# Mover tests de taskService
mkdir -p src/features/task-management/__tests__
mv src/services/__tests__/taskService.test.ts \
   src/features/task-management/__tests__/task-management.service.test.ts

# Mover tests de rateLimiter  
mkdir -p src/infrastructure/rate-limiting/__tests__
mv src/utils/__tests__/rateLimiter.test.ts \
   src/infrastructure/rate-limiting/__tests__/rateLimiter.test.ts

# Eliminar carpetas vacías de tests antiguos
rm -rf src/services/__tests__
rm -rf src/utils/__tests__
```

---

### Paso 5: Actualizar Tests con Nuevos Imports

**En `task-management.service.test.ts`:**

```typescript
// ❌ ANTES
import taskService from '../../services/taskService';

// ✅ AHORA
import taskManagementService from '../task-management.service';
```

**En `rateLimiter.test.ts`:**

```typescript
// ❌ ANTES
import { RateLimiter } from '../../utils/rateLimiter';

// ✅ AHORA
import { RateLimiter } from '../rateLimiter';
```

---

### Paso 6: Verificación Post-Limpieza

```bash
# Verificar estructura
tree -L 3 -I 'node_modules|dist|.git' src/

# Debe mostrar SOLO:
# src/
# ├── features/
# │   ├── spotify-integration/
# │   └── task-management/
# ├── infrastructure/
# │   ├── config/
# │   ├── logging/
# │   └── rate-limiting/
# ├── shared/
# │   ├── bot-commands/
# │   ├── utils/
# │   └── validation/
# ├── bot.ts
# └── server.ts

# Re-ejecutar verificaciones
npm run build
npm test
npm run lint
```

---

### Paso 7: Commit de Limpieza

```bash
# Si todo funciona correctamente
git add .
git commit -m "refactor: remove old architecture files after successful migration

- Removed src/commands/ (migrated to features/ and shared/)
- Removed src/services/ (migrated to features/)
- Removed src/routes/ (migrated to features/)
- Removed src/config/ (migrated to infrastructure/)
- Removed src/utils/ (migrated to shared/ and infrastructure/)
- Migrated tests to new locations
- All tests passing, build successful"
```

---

## 📊 Estructura Final Esperada

```
src/
├── features/
│   ├── task-management/
│   │   ├── __tests__/
│   │   │   └── task-management.service.test.ts
│   │   ├── commands/
│   │   │   ├── task.command.ts
│   │   │   ├── done.command.ts
│   │   │   ├── cleardone.command.ts
│   │   │   ├── delete.command.ts
│   │   │   ├── mytasks.command.ts
│   │   │   └── index.ts
│   │   ├── task-management.service.ts
│   │   ├── models.ts
│   │   ├── utils.ts
│   │   └── index.ts
│   │
│   └── spotify-integration/
│       ├── spotify-integration.service.ts
│       ├── spotify.routes.ts
│       ├── models.ts
│       └── index.ts
│
├── infrastructure/
│   ├── config/
│   │   └── environment.ts
│   ├── logging/
│   │   └── logger.ts
│   └── rate-limiting/
│       ├── __tests__/
│       │   └── rateLimiter.test.ts
│       └── rateLimiter.ts
│
├── shared/
│   ├── bot-commands/
│   │   ├── hello.command.ts
│   │   ├── help.command.ts
│   │   └── index.ts
│   ├── utils/           # (vacío por ahora, puede eliminarse)
│   └── validation/
│       └── validators.ts
│
├── bot.ts
└── server.ts
```

---

## 🎯 Checklist de Limpieza

- [ ] **Backup creado** (rama git o carpeta)
- [ ] **Verificaciones pre-limpieza** ejecutadas (build, test, lint)
- [ ] **Carpetas antiguas eliminadas** (commands, services, routes, config, utils)
- [ ] **Tests migrados** a nueva estructura
- [ ] **Imports de tests actualizados**
- [ ] **Verificaciones post-limpieza** ejecutadas
- [ ] **Estructura final coincide** con diagrama arriba
- [ ] **Commit realizado** con mensaje descriptivo
- [ ] **Documentación actualizada** si es necesario

---

## 🚨 Si Algo Sale Mal

### Restaurar desde Backup

```bash
# Si usaste rama git:
git checkout backup-before-cleanup

# Si usaste carpeta de backup:
cp -r old-architecture/commands src/
cp -r old-architecture/services src/
cp -r old-architecture/routes src/
cp -r old-architecture/config src/
cp -r old-architecture/utils src/
```

### Verificar qué Archivos Importan los Antiguos

```bash
# Buscar imports de archivos antiguos
grep -r "from '../services/" src/
grep -r "from './services/" src/
grep -r "from '../commands/" src/
grep -r "from '../utils/logger" src/
grep -r "from '../config/" src/

# Si encuentra algo, significa que hay archivos no migrados
# NO elimines las carpetas antiguas hasta migrar esos archivos
```

---

## 💡 Notas Adicionales

### Carpeta `shared/utils/`

Esta carpeta está vacía actualmente. Puedes:
1. Eliminarla: `rm -rf src/shared/utils/`
2. Mantenerla para futuro código compartido

### Tests

Los tests antiguos funcionan porque Jest está configurado con `moduleNameMapper`. Migrarlos es **opcional pero recomendado** para mantener consistencia.

### OBS Overlay

La carpeta `obs-overlay/` es una aplicación separada y NO debe tocarse.

---

## ✅ Estado Final

Después de la limpieza, deberías tener:

- ✅ **0 carpetas antiguas** en `src/`
- ✅ **Estructura limpia** basada en features
- ✅ **Tests pasando** 100%
- ✅ **Build exitoso**
- ✅ **Código duplicado eliminado**

---

**Última actualización**: 2026-01-15  
**Próximo paso**: Ejecutar limpieza siguiendo esta guía
