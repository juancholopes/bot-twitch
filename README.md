# Bot de Twitch - Sistema de Tareas

Un bot modular para Twitch que permite a los usuarios gestionar sus tareas diarias directamente desde el chat.

## 🚀 Características

- ✅ Agregar tareas personales (`!task`)
- 📋 Ver tareas pendientes (`!mytasks` o `!list`)
- ✅ Marcar tareas como completadas (`!done`)
- 🧹 Limpiar tareas completadas (`!cleardone`)
- 🗑️ Eliminar todas las tareas (solo streamer) (`!delete`)
- 👋 Comando de saludo (`!hello`)

## 📁 Estructura del Proyecto

```
bot-twich/
├── app.js                  # Punto de entrada principal
├── src/
│   ├── bot.js             # Lógica principal del bot de Twitch
│   ├── server.js          # Servidor web Express
│   ├── config/
│   │   └── environment.js  # Configuración y variables de entorno
│   ├── services/
│   │   └── taskService.js  # Servicio para gestión de tareas
│   ├── commands/
│   │   ├── index.js       # Exportador de comandos
│   │   ├── mytasks.js     # Comando !mytasks
│   │   ├── task.js        # Comando !task
│   │   ├── done.js        # Comando !done
│   │   ├── cleardone.js   # Comando !cleardone
│   │   ├── delete.js      # Comando !delete
│   │   └── hello.js       # Comando !hello
│   └── utils/
│       ├── logger.js      # Sistema de logging
│       └── helpers.js     # Funciones auxiliares
├── data/
│   └── tasks.json         # Almacenamiento de tareas
├── .env                   # Variables de entorno
└── package.json
```

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd bot-twich
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crear archivo `.env` con:
   ```env
   PORT=3000
   OAUTH_TOKEN=oauth:your_oauth_token
   REFRESH_TOKEN=your_refresh_token
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   TWITCH_USERNAME=your_bot_username
   CHANEL_NAME=your_channel_name
   ```

4. **Ejecutar la aplicación**
   ```bash
   npm start
   # o para desarrollo
   npm run dev
   ```

## 📝 Comandos Disponibles

### Para Usuarios

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `!task <tareas>` | Agregar nuevas tareas (máx. 5 por usuario) | `!task estudiar, hacer ejercicio` |
| `!mytasks` / `!list` | Ver tareas pendientes | `!mytasks` |
| `!done <números>` | Marcar tareas como completadas | `!done 1, 2, 3` |
| `!cleardone` | Limpiar tareas completadas | `!cleardone` |
| `!hello` | Saludo del bot | `!hello` |

### Para Streamer

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `!delete` | Eliminar todas las tareas de todos los usuarios | `!delete` |

## 🎯 Reglas del Sistema

- **Máximo 5 tareas por usuario** (incluyendo completadas)
- **Máximo 5 tareas por comando** al agregar
- Las tareas se almacenan en mayúsculas internamente
- Se muestran en minúsculas al usuario
- El comando `!cleardone` libera espacio para nuevas tareas

## 🗂️ Estructura de Datos

```json
[
  {
    "user": "username",
    "task": ["TAREA1", "TAREA2"],
    "completed": ["TAREA_COMPLETADA"]
  }
]
```

## 🔧 Desarrollo

### Principios Aplicados

- **Separación de responsabilidades**: Cada módulo tiene una función específica
- **Código limpio**: Funciones pequeñas y con nombres descriptivos
- **Manejo de errores**: Try-catch en todas las operaciones críticas
- **Logging**: Sistema de logs estructurado
- **Configuración centralizada**: Variables de entorno y configuración en un solo lugar

### Agregar Nuevos Comandos

1. Crear archivo en `src/commands/nuevo-comando.js`
2. Implementar la función handler
3. Exportar en `src/commands/index.js`
4. Agregar lógica de routing en `src/bot.js`

### Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Verificar lint
npm run lint
```

## 🐛 Debugging

Los logs se muestran en consola con timestamps y niveles:
- `INFO`: Operaciones normales
- `ERROR`: Errores capturados
- `WARN`: Advertencias
- `DEBUG`: Información de desarrollo

## 📊 Endpoints Web

- `GET /` - Estado general del bot
- `GET /health` - Health check del servidor

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
