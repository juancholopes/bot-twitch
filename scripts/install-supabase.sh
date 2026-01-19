#!/bin/bash

# =============================================
# Script de Instalación de Dependencias Supabase
# =============================================

set -e

echo "📦 Instalando dependencias de Supabase..."

# Backend
echo "→ Instalando @supabase/supabase-js en bot-backend..."
pnpm add @supabase/supabase-js --filter bot-backend

# Frontend (Overlay)
echo "→ Instalando @supabase/supabase-js en obs-overlay..."
pnpm add @supabase/supabase-js --filter obs-overlay

echo "✅ Dependencias instaladas correctamente"

echo ""
echo "📋 Próximos pasos:"
echo "1. Ejecutar SQL en Supabase Dashboard:"
echo "   - Ir a SQL Editor"
echo "   - Copiar contenido de supabase/migrations/001_initial_schema.sql"
echo "   - Ejecutar"
echo ""
echo "2. Configurar variables de entorno:"
echo "   - Copiar .env.example.supabase a packages/bot-backend/.env"
echo "   - Copiar .env.example.supabase a packages/obs-overlay/.env"
echo "   - Llenar con tus claves de Supabase"
echo ""
echo "3. Migrar datos existentes:"
echo "   - npm run migrate:json-to-supabase"
