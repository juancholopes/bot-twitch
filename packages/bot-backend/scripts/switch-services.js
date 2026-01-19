#!/usr/bin/env node

/**
 * Script para cambiar entre servicios JSON y Supabase
 * 
 * USO:
 *   node scripts/switch-services.js supabase  # Cambiar a Supabase
 *   node scripts/switch-services.js json      # Volver a JSON
 */

const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.join(__dirname, '..', 'src', 'features');

const SERVICES_TO_SWITCH = [
  {
    dir: 'task-management',
    file: 'task-management.service.ts',
  },
  {
    dir: 'pomodoro-timer',
    file: 'pomodoro-stats.service.ts',
  },
  {
    dir: 'pomodoro-timer',
    file: 'pomodoro-config.service.ts',
  },
];

function switchToSupabase() {
  console.log('🔄 Cambiando a servicios Supabase...\n');

  for (const service of SERVICES_TO_SWITCH) {
    const dir = path.join(SERVICES_DIR, service.dir);
    const currentFile = path.join(dir, service.file);
    const jsonBackup = path.join(dir, service.file.replace('.ts', '.json.bak'));
    const supabaseFile = path.join(dir, service.file.replace('.ts', '.supabase.ts'));

    // Backup current (JSON version)
    if (fs.existsSync(currentFile) && !fs.existsSync(jsonBackup)) {
      fs.renameSync(currentFile, jsonBackup);
      console.log(`✅ Backup: ${service.file} → ${service.file.replace('.ts', '.json.bak')}`);
    }

    // Activate Supabase version
    if (fs.existsSync(supabaseFile)) {
      fs.copyFileSync(supabaseFile, currentFile);
      console.log(`✅ Activado: ${service.file} (Supabase)`);
    } else {
      console.error(`❌ Error: No se encontró ${service.file.replace('.ts', '.supabase.ts')}`);
    }
  }

  console.log('\n✅ Servicios cambiados a Supabase');
  console.log('⚠️  Recuerda reiniciar el backend: pnpm run dev\n');
}

function switchToJSON() {
  console.log('🔄 Volviendo a servicios JSON...\n');

  for (const service of SERVICES_TO_SWITCH) {
    const dir = path.join(SERVICES_DIR, service.dir);
    const currentFile = path.join(dir, service.file);
    const jsonBackup = path.join(dir, service.file.replace('.ts', '.json.bak'));

    // Restore JSON version
    if (fs.existsSync(jsonBackup)) {
      fs.copyFileSync(jsonBackup, currentFile);
      console.log(`✅ Restaurado: ${service.file} (JSON)`);
    } else {
      console.error(`❌ Error: No se encontró backup ${service.file.replace('.ts', '.json.bak')}`);
    }
  }

  console.log('\n✅ Servicios restaurados a JSON');
  console.log('⚠️  Recuerda reiniciar el backend: pnpm run dev\n');
}

// Main
const mode = process.argv[2];

if (mode === 'supabase') {
  switchToSupabase();
} else if (mode === 'json') {
  switchToJSON();
} else {
  console.error('❌ Modo inválido. Usa: node switch-services.js [supabase|json]');
  process.exit(1);
}
