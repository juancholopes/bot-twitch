# 🧪 Prueba de WebSocket y Overlay

## Verificación del Sistema

### 1. Iniciar el servidor

```bash
npm start
```

### 2. Verificar endpoints

#### Health Check

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-11-12T12:00:00.000Z",
  "memory": {
    "used": 50,
    "total": 100,
    "unit": "MB"
  }
}
```

#### Tareas

```bash
curl http://localhost:3000/api/tasks
```

Respuesta esperada:

```json
{
  "success": true,
  "data": [
    {
      "user": "username",
      "task": ["tarea 1", "tarea 2"],
      "completed": []
    }
  ],
  "count": 1
}
```

### 3. Verificar WebSocket desde el navegador

Abre la consola del navegador en:

```
http://localhost:3000/overlay
```

Deberías ver en la consola:

```
🔌 Initializing WebSocket connection to http://localhost:3000
✅ WebSocket Connected: [socket-id]
📋 Tasks fetched: X users
```

### 4. Prueba de actualización en tiempo real

#### Desde Twitch chat:

```
!task Tarea de prueba
```

En la consola del overlay deberías ver:

```
🔄 Tasks updated event received, fetching new data...
📋 Tasks fetched: X users
```

Y el overlay debería actualizarse automáticamente.

### 5. Logs esperados en el servidor

```
[INFO] 🌐 Servidor web iniciado en http://127.0.0.1:3000
[INFO] 📡 WebSocket disponible en ws://127.0.0.1:3000
[INFO] 📡 WebSocket configurado correctamente
[INFO] ✅ Cliente WebSocket conectado: [socket-id]
[INFO] GET /api/tasks
```

## 🐛 Troubleshooting

### Problema: WebSocket se desconecta inmediatamente

**Síntomas:**

```
[INFO] ✅ Cliente WebSocket conectado: xyz
[INFO] ❌ Cliente WebSocket desconectado: xyz
```

**Soluciones:**

1. **Verificar que el frontend esté haciendo polling correctamente:**

   - Abre DevTools → Network → WS (WebSocket)
   - Deberías ver una conexión activa

2. **Verificar formato de respuesta de la API:**

   ```bash
   curl http://localhost:3000/api/tasks | jq
   ```

   Debe retornar: `{ success: true, data: [...], count: N }`

3. **Verificar que no haya errores en consola del navegador**

4. **Verificar CORS:**
   - El servidor acepta conexiones de cualquier origen (`*`)
   - Si usas un puerto diferente, verifica la configuración

### Problema: El overlay no se actualiza

1. **Verificar que el evento se emite correctamente:**

   - En `taskService.js`, el emitter debe estar configurado
   - Verificar logs cuando se agrega una tarea

2. **Agregar una tarea desde chat:**

   ```
   !task Test
   ```

3. **Verificar en logs del servidor:**
   ```
   [INFO] tasksUpdated event emitted
   ```

### Problema: Tareas no se cargan

1. **Verificar que existe el archivo `data/tasks.json`:**

   ```bash
   cat data/tasks.json
   ```

2. **Verificar permisos de lectura**

3. **Verificar formato del JSON:**
   ```bash
   cat data/tasks.json | jq
   ```

## 🔍 Debug Avanzado

### Habilitar logs detallados de Socket.IO

En el navegador (DevTools → Console):

```javascript
localStorage.debug = "socket.io-client:*";
location.reload();
```

Para desactivar:

```javascript
localStorage.removeItem("debug");
location.reload();
```

### Monitorear eventos de WebSocket

En el componente overlay, agrega temporalmente:

```javascript
socket.onAny((eventName, ...args) => {
  console.log("📨 Event received:", eventName, args);
});
```

## ✅ Checklist de Verificación

- [ ] Servidor iniciado sin errores
- [ ] Endpoint `/api/tasks` retorna formato correcto
- [ ] Endpoint `/api/health` responde
- [ ] WebSocket se conecta y permanece conectado
- [ ] Tareas se cargan en el overlay
- [ ] Agregar tarea desde chat actualiza el overlay
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del servidor

## 🎯 Próximos Pasos

Una vez que todo funcione:

1. ✅ Implementar `spotifyService.js`
2. ✅ Crear rutas de Spotify
3. ✅ Agregar widget de Spotify al overlay
4. ✅ Integrar comandos de Spotify en el bot
