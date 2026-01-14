# Bot de Twitch - Sistema de Gestión de Tareas

## Tabla de Contenidos

- [Problema que Resuelve](#problema-que-resuelve)
- [Descripción General](#descripción-general)
- [Decisiones Técnicas](#decisiones-técnicas)
- [Instalación y Configuración](#instalación-y-configuración)
- [Comandos Disponibles](#comandos-disponibles)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Estimaciones y Complejidad](#estimaciones-y-complejidad)
- [Qué Haría Diferente](#qué-haría-diferente)
- [Desarrollo y Contribución](#desarrollo-y-contribución)

---

## Problema que Resuelve

Durante las transmisiones en vivo en Twitch, tanto streamers como espectadores suelen mencionar tareas o recordatorios que quieren cumplir, pero frecuentemente se olvidan de ellas porque no hay un sistema centralizado y accesible para gestionarlas en tiempo real dentro del chat.

**Solución implementada:**

Este bot permite a los usuarios del chat crear, visualizar y completar tareas personales sin salir de la plataforma de Twitch. Esto mejora el engagement de la comunidad y ayuda a los espectadores a mantener productividad mientras disfrutan del contenido del streamer.

**Impacto medible:**

- Reduce la fricción de gestionar tareas externas (como abrir otra aplicación)
- Fomenta la participación de la comunidad con una herramienta útil
- Proporciona al streamer un overlay visual en OBS para mostrar las tareas en pantalla

---

## Descripción General

Bot modular para Twitch que permite gestionar tareas directamente desde el chat. Incluye integración con Spotify para mostrar la canción actual en transmisión y un sistema de overlay para OBS.

**Stack tecnológico:**

- **Backend:** Node.js con TypeScript, Express, tmi.js (cliente de Twitch IRC)
- **Frontend (Overlay):** React con Vite
- **Almacenamiento:** Sistema de archivos JSON (persistencia simple)
- **Testing:** Jest para pruebas unitarias
- **Calidad de código:** Biome para linting y formateo

---

## Decisiones Técnicas

### 1. TypeScript en lugar de JavaScript

**Decisión:** Migrar de JavaScript a TypeScript para el backend.

**Razón:** El proyecto inicialmente estaba en JavaScript, pero conforme crecía la base de código, los errores de tipo en runtime se volvieron más frecuentes. TypeScript proporciona:

- Detección temprana de errores en tiempo de desarrollo
- Mejor autocompletado y documentación en el IDE
- Refactorización más segura al modificar interfaces de servicios

**Trade-off:** Añade complejidad en la configuración inicial y requiere un paso de compilación, pero el beneficio en mantenibilidad supera el costo.

### 2. Arquitectura de servicios separados

**Decisión:** Separar la lógica de negocio en servicios independientes (`taskService`, `spotifyService`) en lugar de acoplarla directamente en los comandos.

**Razón:** 

- **Testabilidad:** Los servicios pueden probarse de manera aislada sin depender del cliente de Twitch
- **Reutilización:** La lógica de tareas puede usarse tanto en comandos del bot como en endpoints HTTP
- **Escalabilidad:** Si en el futuro se añade otra interfaz (Discord, CLI), los servicios ya están desacoplados

**Implementación:** Por ejemplo, `taskService.ts` maneja la persistencia y reglas de negocio, mientras que `task.ts` (comando) solo coordina la entrada del usuario y la respuesta.

### 3. Almacenamiento en JSON vs Base de datos

**Decisión:** Usar un archivo JSON para persistir datos en lugar de una base de datos (MySQL, PostgreSQL, MongoDB).

**Razón:**

- **Simplicidad:** Para un MVP con decenas de usuarios concurrentes, un archivo JSON es suficiente
- **Cero configuración:** No requiere instalación de servidor de base de datos ni gestión de conexiones
- **Portabilidad:** El archivo `tasks.json` es autodocumentado y fácil de inspeccionar

**Limitaciones conocidas:**

- No es adecuado para alta concurrencia (múltiples escrituras simultáneas pueden causar corrupción)
- No tiene capacidades de consulta avanzadas
- Escala verticalmente (todo en memoria)

### 4. Rate Limiting personalizado

**Decisión:** Implementar un sistema de rate limiting propio en `rateLimiter.ts` en lugar de usar middleware de Express como `express-rate-limit`.

**Razón:**

- Control granular por usuario de Twitch (no por IP)
- Lógica específica: limitar comandos por usuario en ventanas de tiempo
- Aprendizaje: implementar el algoritmo de "token bucket" desde cero demuestra comprensión de sistemas distribuidos

**Implementación:** Cada usuario tiene un bucket de tokens que se regenera cada X segundos. Esto previene spam sin afectar usuarios legítimos.

### 5. Integración con Spotify

**Decisión:** Añadir un servidor Express para manejar OAuth 2.0 con Spotify y exponer endpoints HTTP.

**Razón:**

- El protocolo OAuth requiere un callback HTTP (no se puede hacer solo con IRC de Twitch)
- Permite que el overlay de OBS consuma datos mediante HTTP/WebSockets
- Separa preocupaciones: el bot IRC maneja comandos, el servidor Express maneja APIs externas

**Flujo implementado:**

1. Usuario autentifica con Spotify vía `/auth`
2. Callback recibe el token y lo almacena
3. Overlay consulta `/api/current-track` para mostrar la canción actual

---

## Instalación y Configuración

### Requisitos previos

- Node.js >= 18.0.0
- npm o pnpm instalado
- Cuenta de Twitch con token OAuth ([Generar aquí](https://twitchapps.com/tmi/))
- (Opcional) Cuenta de Spotify Developer para integración musical

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/juancholopes/bot-twitch.git
cd bot-twitch

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (ver sección siguiente)

# 4. Compilar TypeScript
pnpm run build

# 5. Ejecutar en producción
pnpm start

# O para desarrollo con auto-reload
pnpm run dev
```

### Configuración de variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración del servidor
PORT=3000

# Credenciales de Twitch
OAUTH_TOKEN=oauth:tu_token_aqui
TWITCH_USERNAME=nombre_del_bot
CHANEL_NAME=canal_donde_opera

# Credenciales de Spotify (opcional)
CLIENT_ID=tu_client_id
CLIENT_SECRET=tu_client_secret
REFRESH_TOKEN=tu_refresh_token
```

**Cómo obtener credenciales:**

| Servicio | Guía |
|----------|------|
| Twitch OAuth | Visitar [https://twitchapps.com/tmi/](https://twitchapps.com/tmi/) y seguir instrucciones |
| Spotify API | Crear app en [Spotify Dashboard](https://developer.spotify.com/dashboard) y configurar redirect URI |

### Verificación de instalación

```bash
# Verificar que el servidor inicia correctamente
pnpm start

# En otra terminal, verificar el endpoint de salud
curl http://localhost:3000/health
# Debe responder: {"status":"ok","service":"twitch-bot"}
```

---

## Comandos Disponibles

### Para usuarios del chat

| Comando | Parámetros | Descripción | Ejemplo | Restricciones |
|---------|------------|-------------|---------|---------------|
| `!task` | `<lista_tareas>` | Agrega tareas personales separadas por coma | `!task estudiar TS, hacer ejercicio` | Máximo 5 tareas por comando, máximo 5 tareas totales por usuario |
| `!mytasks` / `!list` | - | Muestra tus tareas pendientes y completadas | `!mytasks` | Cooldown de 10 segundos |
| `!done` | `<números>` | Marca tareas como completadas por su número | `!done 1, 3` | Solo tareas propias |
| `!cleardone` | - | Elimina todas tus tareas completadas | `!cleardone` | Libera espacio para nuevas tareas |
| `!hello` | - | Saludo del bot | `!hello` | - |
| `!help` | - | Muestra ayuda de comandos | `!help` | - |

### Para el streamer (rol moderador/broadcaster)

| Comando | Descripción | Ejemplo | Precaución |
|---------|-------------|---------|------------|
| `!delete` | Elimina todas las tareas de todos los usuarios | `!delete` | Acción irreversible, usar con cuidado |

### Reglas del sistema

```
┌─────────────────────────────────────────────────────────────┐
│ LÍMITES POR USUARIO                                         │
├─────────────────────────────────────────────────────────────┤
│ • Máximo 5 tareas totales (pendientes + completadas)        │
│ • Máximo 5 tareas por comando !task                         │
│ • Cooldown de 10 segundos entre comandos                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FORMATO DE DATOS                                            │
├─────────────────────────────────────────────────────────────┤
│ • Las tareas se almacenan en MAYÚSCULAS internamente        │
│ • Se muestran en minúsculas al usuario para legibilidad     │
│ • Persistencia en archivo JSON en ./data/tasks.json         │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitectura del Proyecto

### Estructura de directorios

```
bot-twitch/
│
├── src/                          # Código fuente del backend
│   ├── bot.ts                    # Cliente IRC de Twitch (punto de entrada)
│   ├── server.ts                 # Servidor Express para APIs
│   │
│   ├── commands/                 # Comandos del bot (capa de presentación)
│   │   ├── index.ts              # Exportador de comandos
│   │   ├── task.ts               # !task - Agregar tareas
│   │   ├── mytasks.ts            # !mytasks - Listar tareas
│   │   ├── done.ts               # !done - Completar tareas
│   │   ├── cleardone.ts          # !cleardone - Limpiar completadas
│   │   ├── delete.ts             # !delete - Borrar todo (mod)
│   │   └── help.ts               # !help - Ayuda
│   │
│   ├── services/                 # Lógica de negocio (capa de dominio)
│   │   ├── taskService.ts        # Gestión de tareas (CRUD)
│   │   └── spotifyService.ts     # Integración con Spotify API
│   │
│   ├── routes/                   # Rutas HTTP (capa de API)
│   │   └── spotify.routes.ts     # Endpoints de Spotify
│   │
│   ├── utils/                    # Utilidades compartidas
│   │   ├── logger.ts             # Sistema de logs con niveles
│   │   ├── rateLimiter.ts        # Control de rate limiting
│   │   ├── validators.ts         # Validación de entrada
│   │   └── helpers.ts            # Funciones auxiliares
│   │
│   └── config/                   # Configuración
│       └── environment.ts        # Variables de entorno tipadas
│
├── obs-overlay/                  # Frontend para OBS (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── CompactTaskList.jsx    # Lista de tareas en overlay
│   │   │   ├── SpotifyWidget.jsx      # Widget de Spotify
│   │   │   └── UserSection.jsx        # Sección de usuario
│   │   ├── hooks/
│   │   │   └── useSpotify.js          # Hook para consumir API
│   │   └── App.jsx
│   └── index.html                     # Página de overlay
│
├── data/                         # Persistencia
│   └── tasks.json                # Almacenamiento de tareas
│
├── dist/                         # Código compilado (generado)
├── app.ts                        # Punto de entrada principal
├── tsconfig.json                 # Configuración TypeScript
├── jest.config.ts                # Configuración de tests
└── package.json
```

### Flujo de datos

```
Usuario en Twitch Chat
         |
         | (!task estudiar)
         v
    bot.ts (Cliente IRC)
         |
         | Parsea comando
         v
  commands/task.ts (Validación)
         |
         | Llama a servicio
         v
  services/taskService.ts
         |
         | CRUD en tasks.json
         v
    data/tasks.json
         |
         | Respuesta
         v
    Mensaje en chat
```

### Patrones de diseño aplicados

| Patrón | Ubicación | Justificación |
|--------|-----------|---------------|
| **Command Pattern** | `src/commands/*` | Cada comando es un módulo independiente que implementa la misma interfaz (handler) |
| **Service Layer** | `src/services/*` | Abstrae la lógica de negocio de la capa de presentación (comandos) |
| **Singleton** | `src/utils/logger.ts` | Una única instancia del logger compartida en toda la aplicación |
| **Repository Pattern** | `taskService.ts` (implícito) | Abstrae el acceso a datos (tasks.json) del resto de la aplicación |
| **Factory Pattern** | `rateLimiter.ts` | Crea instancias de limitadores con diferentes configuraciones |

---

## Estimaciones y Complejidad

### Tiempo de desarrollo invertido

| Fase | Tiempo estimado | Detalles |
|------|-----------------|----------|
| Setup inicial + MVP (comandos básicos) | 8-10 horas | Configuración de Twitch IRC, comandos !task y !mytasks, persistencia JSON |
| Migración a TypeScript | 6-8 horas | Refactorización completa, configuración de tsconfig, tipado de interfaces |
| Integración de Spotify | 10-12 horas | Implementación OAuth 2.0, manejo de refresh tokens, endpoints HTTP |
| Overlay OBS con React | 12-15 horas | Setup de Vite, componentes React, WebSockets para actualización en tiempo real |
| Testing y documentación | 5-6 horas | Pruebas unitarias con Jest, escritura de README |
| **Total estimado** | **41-51 horas** | Proyecto desarrollado en ~2 semanas (part-time) |

### Complejidad de funcionalidades clave

| Funcionalidad | Complejidad | Tiempo para nueva feature similar | Desafíos técnicos |
|---------------|-------------|-------------------------------------|-------------------|
| Añadir nuevo comando simple | Baja | 1-2 horas | Principalmente boilerplate, seguir patrón existente |
| Modificar lógica de persistencia | Media | 4-6 horas | Requiere cambios en `taskService.ts` y manejo de migraciones de datos |
| Integrar nueva API externa | Alta | 8-12 horas | OAuth, manejo de errores de red, rate limits de la API externa |
| Añadir base de datos real (PostgreSQL) | Alta | 16-20 horas | Diseño de esquema, ORM (Prisma), migraciones, testing con DB de prueba |

### Posibles retrasos y mitigaciones

```
┌──────────────────────────────────────────────────────────────────┐
│ RIESGOS IDENTIFICADOS                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. Rate limits de Spotify API                                   │
│    • Impacto: Overlay deja de actualizar                        │
│    • Mitigación: Caché de 30 segundos, manejo de errores 429    │
│                                                                  │
│ 2. Corrupción de tasks.json en escrituras concurrentes          │
│    • Impacto: Pérdida de datos de usuarios                      │
│    • Mitigación: File locking (implementar en 3-4 horas)        │
│                                                                  │
│ 3. Cambio en API de Twitch IRC                                  │
│    • Impacto: Bot deja de recibir mensajes                      │
│    • Mitigación: Monitoreo de deprecation notices de tmi.js     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Qué Haría Diferente

### Si volviera a empezar este proyecto desde cero

#### 1. Base de datos relacional desde el inicio

**Por qué:**

El archivo JSON funciona para un MVP, pero en producción con 100+ usuarios concurrentes podría causar:

- Race conditions en escrituras simultáneas
- Lentitud al cargar todo el archivo en memoria
- Dificultad para hacer queries complejas (ej: "top 10 usuarios con más tareas completadas")

**Solución:**

Usaría **PostgreSQL con Prisma ORM** porque:

- Prisma genera tipos TypeScript automáticamente desde el esquema
- Transacciones ACID previenen corrupción de datos
- Facilita migraciones de esquema con `prisma migrate`

**Tiempo de implementación:** 12-16 horas adicionales inicialmente, pero ahorra debugging futuro.

#### 2. Arquitectura event-driven para el overlay

**Problema actual:**

El overlay hace polling cada 5 segundos para obtener actualizaciones de tareas. Esto causa:

- Latencia de hasta 5 segundos para ver cambios
- Desperdicio de recursos en requests HTTP innecesarios

**Solución:**

Implementar **WebSockets bidireccionales con Socket.io**:

```typescript
// Cuando un usuario completa una tarea en el chat
taskService.completeTask(userId, taskId)
  .then(() => {
    io.emit('task:updated', { userId, taskId }); // Notifica al overlay en tiempo real
  });
```

**Beneficio:** Actualización instantánea en OBS sin polling.

**Tiempo de implementación:** 6-8 horas (Socket.io está parcialmente implementado pero no integrado).

#### 3. Sistema de permisos más granular

**Limitación actual:**

Solo hay dos roles: streamer (puede `!delete`) y usuario normal. No hay moderadores ni VIPs con permisos especiales.

**Mejora:**

Implementar un sistema de roles basado en Twitch badges:

```typescript
enum UserRole {
  VIEWER = 0,
  SUBSCRIBER = 1,
  VIP = 2,
  MODERATOR = 3,
  BROADCASTER = 4
}

// Configuración por comando
const permissions = {
  '!delete': UserRole.MODERATOR, // Mods también pueden limpiar tareas
  '!task': UserRole.VIEWER
};
```

**Beneficio:** Mayor flexibilidad para delegar administración del bot.

**Tiempo de implementación:** 3-4 horas.

#### 4. Tests de integración con base de datos en memoria

**Carencia actual:**

Solo hay tests unitarios de servicios individuales. No se prueba el flujo completo de un comando (recibir mensaje → procesar → responder).

**Solución:**

Usar **supertest** para tests de integración de endpoints HTTP y **mock de tmi.js** para simular mensajes de chat:

```typescript
describe('!task command integration', () => {
  it('should add task and persist to database', async () => {
    const mockMessage = createMockTwitchMessage('!task estudiar TS');
    await handleCommand(mockMessage);
    
    const tasks = await taskService.getTasks('testuser');
    expect(tasks).toContainEqual({ text: 'ESTUDIAR TS', completed: false });
  });
});
```

**Tiempo de implementación:** 10-12 horas para suite completa.

#### 5. Configuración sin recompilar (config.json)

**Problema actual:**

Para cambiar límites como "máximo 5 tareas por usuario", hay que modificar `taskService.ts` y recompilar.

**Solución:**

Archivo `config.json` con valores por defecto:

```json
{
  "tasks": {
    "maxPerUser": 5,
    "maxPerCommand": 5,
    "cooldownSeconds": 10
  },
  "rateLimiting": {
    "enabled": true,
    "tokensPerMinute": 5
  }
}
```

**Beneficio:** El streamer puede ajustar configuración sin conocimientos técnicos.

**Tiempo de implementación:** 2-3 horas.

---

## Desarrollo y Contribución

### Principios de código aplicados

```
┌─────────────────────────────────────────────────────────────┐
│ CLEAN CODE                                                  │
├─────────────────────────────────────────────────────────────┤
│ • Funciones pequeñas (máximo 20 líneas)                     │
│ • Nombres descriptivos (getUserTasks vs getData)            │
│ • Evitar comentarios innecesarios (el código se explica)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SOLID PRINCIPLES                                            │
├─────────────────────────────────────────────────────────────┤
│ • Single Responsibility: Cada servicio hace una cosa        │
│ • Open/Closed: Comandos extendibles sin modificar core      │
│ • Dependency Inversion: Services inyectados, no importados  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ERROR HANDLING                                              │
├─────────────────────────────────────────────────────────────┤
│ • Try-catch en todas las operaciones I/O                    │
│ • Errores específicos con mensajes claros                   │
│ • Logging de errores con stack trace                        │
│ • Graceful degradation (si Spotify falla, bot sigue activo) │
└─────────────────────────────────────────────────────────────┘
```

### Cómo añadir un nuevo comando

**Escenario:** Quieres añadir un comando `!stats` que muestre estadísticas del usuario.

**Tiempo estimado:** 1.5 - 2 horas

```bash
# 1. Crear archivo del comando (10 min)
touch src/commands/stats.ts

# 2. Implementar la lógica (45 min)
# Ver ejemplo en src/commands/mytasks.ts

# 3. Exportar en index (5 min)
# Añadir en src/commands/index.ts

# 4. Registrar en el bot (10 min)
# Añadir case en src/bot.ts

# 5. Tests unitarios (20 min)
# Crear src/commands/__tests__/stats.test.ts

# 6. Documentación (10 min)
# Actualizar README.md
```

**Plantilla de comando:**

```typescript
// src/commands/stats.ts
import { Client } from 'tmi.js';
import { taskService } from '../services/taskService';
import { logger } from '../utils/logger';

export async function handleStatsCommand(
  channel: string,
  user: string,
  client: Client
): Promise<void> {
  try {
    const stats = await taskService.getUserStats(user);
    
    client.say(
      channel,
      `@${user} - Tareas totales: ${stats.total}, Completadas: ${stats.completed}, Pendientes: ${stats.pending}`
    );
    
    logger.info(`Stats shown for ${user}`);
  } catch (error) {
    logger.error(`Error in stats command: ${error}`);
    client.say(channel, `@${user}, hubo un error al obtener tus estadísticas.`);
  }
}
```

### Scripts de desarrollo

```bash
# Desarrollo con auto-reload (backend + overlay)
pnpm run dev:full

# Solo backend
pnpm run dev

# Solo overlay OBS
pnpm run dev:overlay

# Tests
pnpm test                  # Ejecutar una vez
pnpm run test:watch        # Modo watch
pnpm run test:coverage     # Con cobertura

# Linting
pnpm run lint              # Revisar
pnpm run lint:fix          # Auto-arreglar
```

### Sistema de logging

El proyecto usa un logger centralizado con niveles de severidad:

| Nivel | Uso | Ejemplo |
|-------|-----|---------|
| `DEBUG` | Información de desarrollo | `logger.debug('User data:', userData)` |
| `INFO` | Operaciones normales | `logger.info('Task added for user123')` |
| `WARN` | Situaciones anómalas no críticas | `logger.warn('Rate limit approaching for user')` |
| `ERROR` | Errores capturados | `logger.error('Failed to save tasks:', error)` |

**Configuración:** En producción, solo se muestran niveles `INFO` y superiores (configurar `LOG_LEVEL` en `.env`).

### Endpoints HTTP disponibles

| Método | Ruta | Descripción | Respuesta |
|--------|------|-------------|-----------|
| `GET` | `/` | Estado general del bot | `{"status":"running","version":"1.0.0"}` |
| `GET` | `/health` | Health check | `{"status":"ok","service":"twitch-bot"}` |
| `GET` | `/api/spotify/current-track` | Canción actual de Spotify | `{"name":"Song","artist":"Artist","isPlaying":true}` |
| `GET` | `/api/tasks` | Todas las tareas (requiere auth) | `[{user, tasks, completed}]` |

**Nota:** Los endpoints `/api/*` están protegidos con CORS configurado para permitir solo el origen del overlay.

---

## Contacto y Recursos Adicionales

### Documentación de dependencias clave

- [tmi.js Documentation](https://github.com/tmijs/tmi.js) - Cliente IRC de Twitch
- [Spotify Web API](https://developer.spotify.com/documentation/web-api) - Integración musical
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Guía de TypeScript

### Autor

**Juan Carlos López**  
Desarrollador enfocado en soluciones que mejoran la experiencia de comunidades en línea.

### Licencia

ISC
