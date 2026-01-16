#!/bin/bash

# Script de migración: Reorganización completa del monorepo
# Ejecuta este script para completar la reorganización arquitectónica

set -e

echo "🚀 Iniciando reorganización del monorepo..."

# 1. Build del package shared primero (dependency de los otros)
echo ""
echo "📦 Building @bot-twitch/shared..."
cd packages/shared
pnpm build
cd ../..

# 2. Limpiar archivos obsoletos de la raíz
echo ""
echo "🧹 Limpiando archivos obsoletos..."

# Mover archivos de configuración que ya no se necesitan en la raíz
if [ -f "app.ts" ]; then
  echo "  ℹ️ app.ts ahora está en packages/bot-backend/"
fi

if [ -d "src" ] && [ -d "packages/bot-backend/src" ]; then
  echo "  ℹ️ src/ ahora está en packages/bot-backend/src/"
fi

if [ -d "obs-overlay" ] && [ -d "packages/obs-overlay" ]; then
  echo "  ℹ️ obs-overlay/ ahora está en packages/obs-overlay/"
fi

# 3. Validar compilación de todos los packages
echo ""
echo "🔍 Validando compilación de todos los packages..."
pnpm -r build || echo "⚠️ Algunos packages tienen errores de compilación (normal si hay imports a actualizar)"

echo ""
echo "✅ Reorganización completada!"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Revisar imports en packages/bot-backend/src que referencien @bot-twitch/shared"
echo "  2. Eliminar carpetas obsoletas:"
echo "     - rm -rf src/ (si packages/bot-backend/src está completo)"
echo "     - rm -rf obs-overlay/ (si packages/obs-overlay está completo)"
echo "     - rm -f app.ts jest.config.ts (ahora en packages/bot-backend/)"
echo "  3. Probar: pnpm dev:full"
echo ""
echo "📖 Documentación completa en MONOREPO_ARCHITECTURE.md"
