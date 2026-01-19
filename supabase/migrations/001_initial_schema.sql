-- =============================================
-- Bot Twitch - Schema de Base de Datos
-- Migración: JSON Local → Supabase
-- =============================================

-- =============================================
-- 1. TABLA: tasks
-- =============================================
-- Almacena tareas de usuarios de Twitch
-- Mantiene compatibilidad con estructura JSON anterior

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,           -- Usuario de Twitch (sin @ prefix)
  task_text TEXT NOT NULL,          -- Texto de la tarea
  completed BOOLEAN DEFAULT FALSE,  -- Estado de completitud
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para búsquedas rápidas
  CONSTRAINT tasks_username_check CHECK (char_length(username) > 0),
  CONSTRAINT tasks_text_check CHECK (char_length(task_text) > 0)
);

-- Índices para optimizar queries frecuentes
CREATE INDEX idx_tasks_username ON tasks(username);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_username_completed ON tasks(username, completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS Policies para tasks
-- =============================================
-- Permitir lectura pública (para overlay)
-- Permitir escritura solo desde backend (con service_role)

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Lectura pública (overlay puede leer todas las tareas)
CREATE POLICY "Allow public read access" ON tasks
    FOR SELECT
    USING (true);

-- Policy: Inserción/Actualización/Eliminación solo para service_role
-- (automáticamente bypassed por service_role key)
CREATE POLICY "Allow service role all operations" ON tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =============================================
-- 2. TABLA: pomodoro_stats
-- =============================================
-- Estadísticas diarias del timer Pomodoro

CREATE TABLE IF NOT EXISTS pomodoro_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,        -- YYYY-MM-DD (única por día)
  sessions_completed INTEGER DEFAULT 0,
  short_breaks_taken INTEGER DEFAULT 0,
  long_breaks_taken INTEGER DEFAULT 0,
  total_work_time INTEGER DEFAULT 0,  -- en minutos
  sessions JSONB DEFAULT '[]'::jsonb,  -- Array de SessionRecord
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT pomodoro_stats_date_unique UNIQUE (date),
  CONSTRAINT pomodoro_stats_positive_values CHECK (
    sessions_completed >= 0 AND
    short_breaks_taken >= 0 AND
    long_breaks_taken >= 0 AND
    total_work_time >= 0
  )
);

-- Índice para búsquedas por rango de fechas
CREATE INDEX idx_pomodoro_stats_date ON pomodoro_stats(date DESC);

-- Trigger para updated_at
CREATE TRIGGER pomodoro_stats_updated_at
    BEFORE UPDATE ON pomodoro_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS Policies para pomodoro_stats
-- =============================================

ALTER TABLE pomodoro_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Lectura pública
CREATE POLICY "Allow public read access" ON pomodoro_stats
    FOR SELECT
    USING (true);

-- Policy: Escritura solo para service_role
CREATE POLICY "Allow service role all operations" ON pomodoro_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =============================================
-- 3. TABLA: pomodoro_config
-- =============================================
-- Configuración global del timer Pomodoro
-- Solo debe existir una fila (singleton pattern)

CREATE TABLE IF NOT EXISTS pomodoro_config (
  id INTEGER PRIMARY KEY DEFAULT 1,  -- Singleton: solo ID = 1
  work_duration INTEGER NOT NULL DEFAULT 80,
  short_break_duration INTEGER NOT NULL DEFAULT 10,
  long_break_duration INTEGER NOT NULL DEFAULT 20,
  sessions_before_long_break INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT pomodoro_config_singleton CHECK (id = 1),
  CONSTRAINT pomodoro_config_positive_values CHECK (
    work_duration > 0 AND
    short_break_duration > 0 AND
    long_break_duration > 0 AND
    sessions_before_long_break > 0
  )
);

-- Insertar configuración por defecto
INSERT INTO pomodoro_config (id, work_duration, short_break_duration, long_break_duration, sessions_before_long_break)
VALUES (1, 80, 10, 20, 5)
ON CONFLICT (id) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER pomodoro_config_updated_at
    BEFORE UPDATE ON pomodoro_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS Policies para pomodoro_config
-- =============================================

ALTER TABLE pomodoro_config ENABLE ROW LEVEL SECURITY;

-- Policy: Lectura pública
CREATE POLICY "Allow public read access" ON pomodoro_config
    FOR SELECT
    USING (true);

-- Policy: Actualización solo para service_role
CREATE POLICY "Allow service role all operations" ON pomodoro_config
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =============================================
-- 4. FUNCIONES ÚTILES
-- =============================================

-- Función: Obtener tareas activas de un usuario
CREATE OR REPLACE FUNCTION get_user_active_tasks(p_username TEXT)
RETURNS TABLE (
  id UUID,
  task_text TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.task_text, t.created_at
  FROM tasks t
  WHERE t.username = p_username AND t.completed = FALSE
  ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función: Obtener conteo de tareas por usuario
CREATE OR REPLACE FUNCTION get_user_task_count(p_username TEXT)
RETURNS TABLE (
  pending_count BIGINT,
  completed_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE completed = FALSE) as pending_count,
    COUNT(*) FILTER (WHERE completed = TRUE) as completed_count,
    COUNT(*) as total_count
  FROM tasks
  WHERE username = p_username;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función: Limpiar tareas completadas de un usuario
CREATE OR REPLACE FUNCTION clear_completed_tasks(p_username TEXT)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM tasks
  WHERE username = p_username AND completed = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. REALTIME CONFIGURATION
-- =============================================
-- Habilitar Realtime para todas las tablas
-- Permite que el overlay reciba actualizaciones en tiempo real

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE pomodoro_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE pomodoro_config;

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE tasks IS 'Tareas de usuarios de Twitch - migrado desde data/tasks.json';
COMMENT ON TABLE pomodoro_stats IS 'Estadísticas diarias del timer Pomodoro - migrado desde data/pomodoro-stats.json';
COMMENT ON TABLE pomodoro_config IS 'Configuración global del timer - migrado desde data/pomodoro-config.json';

COMMENT ON COLUMN tasks.username IS 'Usuario de Twitch (sin @ prefix, case-insensitive)';
COMMENT ON COLUMN tasks.task_text IS 'Descripción de la tarea';
COMMENT ON COLUMN tasks.completed IS 'true = completada, false = pendiente';

COMMENT ON COLUMN pomodoro_stats.sessions IS 'Array JSONB de SessionRecord (startTime, endTime, type, durationMinutes, completed)';
