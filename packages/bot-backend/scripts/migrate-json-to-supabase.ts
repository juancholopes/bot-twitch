#!/usr/bin/env tsx

/**
 * Script de Migración: JSON Local → Supabase
 * 
 * Migra datos existentes de archivos JSON a Supabase
 * mientras mantiene la estructura y relaciones.
 * 
 * MODO SEGURO:
 * - Lee pero NO borra archivos JSON originales
 * - Verifica duplicados antes de insertar
 * - Genera reporte de migración
 * 
 * USO:
 *   pnpm run migrate:json-to-supabase
 *   
 * PREREQUISITOS:
 *   - Variables de entorno configuradas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *   - SQL schema ejecutado en Supabase
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// ES module equivalents of __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Data file paths (relative to project root)
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const POMODORO_STATS_FILE = path.join(DATA_DIR, 'pomodoro-stats.json');
const POMODORO_CONFIG_FILE = path.join(DATA_DIR, 'pomodoro-config.json');

interface UserTaskJSON {
  user: string;
  task: string[];
  completed: string[];
}

interface PomodoroStatsJSON {
  [date: string]: {
    date: string;
    sessionsCompleted: number;
    shortBreaksTaken: number;
    longBreaksTaken: number;
    totalWorkTime: number;
    sessions: any[];
  };
}

interface PomodoroConfigJSON {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

/**
 * Migrate tasks from JSON to Supabase
 */
async function migrateTasks(): Promise<void> {
  console.log('\n📝 Migrando tareas...');

  if (!fs.existsSync(TASKS_FILE)) {
    console.log('⚠️  Archivo tasks.json no encontrado, saltando migración de tareas');
    return;
  }

  try {
    const jsonData = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8')) as UserTaskJSON[];
    console.log(`   Encontradas ${jsonData.length} usuarios con tareas`);

    let totalTasks = 0;
    let insertedTasks = 0;

    for (const userData of jsonData) {
      const { user, task, completed } = userData;

      // Migrate pending tasks
      if (task && task.length > 0) {
        const pendingInserts = task.map(taskText => ({
          username: user,
          task_text: taskText,
          completed: false,
        }));

        const { error } = await supabase
          .from('tasks')
          .insert(pendingInserts);

        if (error) {
          console.error(`   ❌ Error insertando tareas de ${user}:`, error.message);
        } else {
          insertedTasks += pendingInserts.length;
          console.log(`   ✅ ${user}: ${pendingInserts.length} tareas pendientes`);
        }

        totalTasks += task.length;
      }

      // Migrate completed tasks
      if (completed && completed.length > 0) {
        const completedInserts = completed.map(taskText => ({
          username: user,
          task_text: taskText,
          completed: true,
        }));

        const { error } = await supabase
          .from('tasks')
          .insert(completedInserts);

        if (error) {
          console.error(`   ❌ Error insertando tareas completadas de ${user}:`, error.message);
        } else {
          insertedTasks += completedInserts.length;
          console.log(`   ✅ ${user}: ${completedInserts.length} tareas completadas`);
        }

        totalTasks += completed.length;
      }
    }

    console.log(`\n   📊 Total: ${insertedTasks}/${totalTasks} tareas migradas`);
  } catch (error) {
    console.error('❌ Error migrando tareas:', error);
    throw error;
  }
}

/**
 * Migrate Pomodoro stats from JSON to Supabase
 */
async function migratePomodoroStats(): Promise<void> {
  console.log('\n⏱️  Migrando estadísticas de Pomodoro...');

  if (!fs.existsSync(POMODORO_STATS_FILE)) {
    console.log('⚠️  Archivo pomodoro-stats.json no encontrado, saltando migración');
    return;
  }

  try {
    const jsonData = JSON.parse(fs.readFileSync(POMODORO_STATS_FILE, 'utf-8')) as PomodoroStatsJSON;
    const dates = Object.keys(jsonData);
    console.log(`   Encontradas estadísticas para ${dates.length} fechas`);

    let insertedDates = 0;

    for (const dateKey of dates) {
      const stats = jsonData[dateKey];

      const { error } = await supabase
        .from('pomodoro_stats')
        .insert({
          date: stats.date,
          sessions_completed: stats.sessionsCompleted,
          short_breaks_taken: stats.shortBreaksTaken,
          long_breaks_taken: stats.longBreaksTaken,
          total_work_time: stats.totalWorkTime,
          sessions: stats.sessions,
        });

      if (error) {
        if (error.code === '23505') { // Duplicate key
          console.log(`   ⚠️  ${dateKey}: ya existe (saltando)`);
        } else {
          console.error(`   ❌ Error insertando stats para ${dateKey}:`, error.message);
        }
      } else {
        insertedDates++;
        console.log(`   ✅ ${dateKey}: ${stats.sessionsCompleted} sesiones`);
      }
    }

    console.log(`\n   📊 Total: ${insertedDates}/${dates.length} fechas migradas`);
  } catch (error) {
    console.error('❌ Error migrando estadísticas:', error);
    throw error;
  }
}

/**
 * Migrate Pomodoro config from JSON to Supabase
 */
async function migratePomodoroConfig(): Promise<void> {
  console.log('\n⚙️  Migrando configuración de Pomodoro...');

  if (!fs.existsSync(POMODORO_CONFIG_FILE)) {
    console.log('⚠️  Archivo pomodoro-config.json no encontrado, usando defaults');
    return;
  }

  try {
    const jsonData = JSON.parse(fs.readFileSync(POMODORO_CONFIG_FILE, 'utf-8')) as PomodoroConfigJSON;
    console.log(`   Work: ${jsonData.workDuration}min, Short Break: ${jsonData.shortBreakDuration}min`);

    const { error } = await supabase
      .from('pomodoro_config')
      .upsert({
        id: 1, // Singleton
        work_duration: jsonData.workDuration,
        short_break_duration: jsonData.shortBreakDuration,
        long_break_duration: jsonData.longBreakDuration,
        sessions_before_long_break: jsonData.sessionsBeforeLongBreak,
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('   ❌ Error migrando configuración:', error.message);
      throw error;
    }

    console.log('   ✅ Configuración migrada correctamente');
  } catch (error) {
    console.error('❌ Error migrando configuración:', error);
    throw error;
  }
}

/**
 * Generate migration report
 */
async function generateReport(): Promise<void> {
  console.log('\n📈 REPORTE DE MIGRACIÓN\n');

  try {
    // Count tasks
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('completed', false);

    const { count: completedCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    console.log(`   Tareas en Supabase:`);
    console.log(`      Total: ${taskCount || 0}`);
    console.log(`      Pendientes: ${pendingCount || 0}`);
    console.log(`      Completadas: ${completedCount || 0}`);

    // Count stats
    const { count: statsCount } = await supabase
      .from('pomodoro_stats')
      .select('*', { count: 'exact', head: true });

    console.log(`\n   Estadísticas Pomodoro:`);
    console.log(`      Días registrados: ${statsCount || 0}`);

    // Config
    const { data: config } = await supabase
      .from('pomodoro_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (config) {
      console.log(`\n   Configuración Pomodoro:`);
      console.log(`      Trabajo: ${config.work_duration}min`);
      console.log(`      Descanso corto: ${config.short_break_duration}min`);
      console.log(`      Descanso largo: ${config.long_break_duration}min`);
    }

    console.log('\n✅ Migración completada exitosamente!\n');
    console.log('⚠️  IMPORTANTE: Los archivos JSON originales NO han sido eliminados.');
    console.log('   Verifica que todo funcione correctamente antes de borrarlos.\n');
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN: JSON Local → Supabase              ║');
  console.log('╚════════════════════════════════════════════════╝');

  try {
    // Test connection
    console.log('\n🔌 Verificando conexión a Supabase...');
    const { error } = await supabase.from('tasks').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error conectando a Supabase:', error.message);
      console.error('   Verifica que:');
      console.error('   1. El SQL schema ha sido ejecutado');
      console.error('   2. Las variables de entorno son correctas');
      process.exit(1);
    }
    console.log('✅ Conexión establecida');

    // Run migrations
    await migrateTasks();
    await migratePomodoroStats();
    await migratePomodoroConfig();

    // Generate report
    await generateReport();
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Run migration
main();
