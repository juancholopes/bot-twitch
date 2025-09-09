const express = require("express");
const tmi = require("tmi.js");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const client = new tmi.Client({
	options: { debug: true },
	identity: {
		username: process.env.TWITCH_USERNAME,
		password: process.env.OAUTH_TOKEN,
	},
	channels: [process.env.CHANEL_NAME],
});

client.connect();

// ...existing code...
client.on("message", (channel, tags, message, self) => {

    if (self) return;
    const msg = message.trim();

	if (msg.toLowerCase() === "!list") {
        // Leer las tareas existentes del archivo tasks.json
        let existingUsers = [];
        if (fs.existsSync("tasks.json")) {
            try {
                const data = fs.readFileSync("tasks.json", "utf8");
                existingUsers = JSON.parse(data);
            } catch (err) {
                console.error("Error leyendo tasks.json:", err);
                client.say(channel, `@${tags.username}, error al leer las tareas.`);
                return;
            }
        }

        // Buscar si el usuario existe
        const user = existingUsers.find(user => user.user === tags.username);

        if (user && user.task.length > 0) {
            const taskList = user.task.map((task, index) => `${index + 1}. ${task.toLowerCase()}`).join(", ");
            const completedCount = user.completed ? user.completed.length : 0;
            const totalTasks = user.task.length + completedCount;
            client.say(
                channel,
                `@${tags.username}, tus tareas son: ${taskList} (${totalTasks}/5 total, ${completedCount} completadas)`
            );
        } else {
            client.say(
                channel,
                `@${tags.username}, no tienes tareas registradas. Usa "!task tarea1, tarea2" para agregar tareas.`
            );
        }
        return;
    }

    if (msg.toLowerCase() === "!task") {
        client.say(
            channel,
            `Debes incluir al menos una tarea ${tags.username}, por ejemplo "!task tarea1, tarea2, tarea3, maximo 5 tareas."`
        );
        return;
    }

    if (msg.toLowerCase().startsWith("!task ")) {

        const tasks = msg.slice(6); // Quitar "!task "

        // Añadir maximo de 5 tareas por comando
        const maxTasksPerCommand = 5;
        const maxTasksPerUser = 5; // Máximo total de tareas por usuario
        const taskArray = tasks.split(",").map(task => task.trim()).filter(task => task.length > 0);
        
        if (taskArray.length > maxTasksPerCommand) {
            client.say(
                channel,
                `@${tags.username}, solo puedes agregar un máximo de ${maxTasksPerCommand} tareas a la vez.`
            );
            return;
        }

        const taskList = tasks.toUpperCase() // Variable que contiene las tareas
            .split(",")
            .map((task) => task.trim())
            .filter((task) => task.length > 0);

        // Leer las tareas existentes del archivo tasks.json
        let existingUsers = [];
        if (fs.existsSync("tasks.json")) {
            try {
                const data = fs.readFileSync("tasks.json", "utf8");
                existingUsers = JSON.parse(data);
            } catch (err) {
                console.error("Error leyendo tasks.json:", err);
            }
        }

        // Buscar si el usuario ya existe
        const userIndex = existingUsers.findIndex(user => user.user === tags.username);
        let currentTaskCount = 0;

        if (userIndex !== -1) {
            // El usuario existe, obtener el número de tareas actuales (pendientes + completadas)
            const pendingTasks = existingUsers[userIndex].task.length;
            const completedTasks = existingUsers[userIndex].completed ? existingUsers[userIndex].completed.length : 0;
            currentTaskCount = pendingTasks + completedTasks;
        }

        // Verificar si agregar las nuevas tareas excedería el límite
        const availableSlots = maxTasksPerUser - currentTaskCount;
        
        if (availableSlots <= 0) {
            client.say(
                channel,
                `@${tags.username}, ya tienes el máximo de ${maxTasksPerUser} tareas (incluyendo completadas). Usa "!cleardone" para limpiar las completadas.`
            );
            return;
        }

        // Si hay menos slots disponibles que tareas a agregar, tomar solo las que caben
        const tasksToAdd = taskList.slice(0, availableSlots);
        const tasksRejected = taskList.length - tasksToAdd.length;

        if (userIndex !== -1) {
            // El usuario existe, agregar las nuevas tareas a su array
            existingUsers[userIndex].task.push(...tasksToAdd);
        } else {
            // El usuario no existe, crear una nueva entrada
            existingUsers.push({
                user: tags.username,
                task: tasksToAdd,
                completed: []
            });
        }

        // Escribir de vuelta al archivo
        try {
            fs.writeFileSync("tasks.json", JSON.stringify(existingUsers, null, 2));
        } catch (err) {
            console.error("Error escribiendo tasks.json:", err);
        }

        // Mensaje de confirmación
        let confirmationMessage = `@${tags.username}, agregaste ${tasksToAdd.length} tarea(s): ${tasksToAdd.map((t) => t.toLowerCase()).join(", ")}`;
        
        if (tasksRejected > 0) {
            confirmationMessage += `. Se rechazaron ${tasksRejected} tarea(s) porque excederían el límite de ${maxTasksPerUser} tareas por usuario.`;
        }

        console.log(`Tareas agregadas por ${tags.username}:`, tasksToAdd);
        client.say(channel, confirmationMessage);

        return;
    }

    // Comando para marcar una o varias tareas como completadas
    if (msg.toLowerCase().startsWith("!done ")) {
        const taskNumbersStr = msg.slice(6).trim(); // Quitar "!done "
        
        if (!taskNumbersStr) {
            client.say(channel, `@${tags.username}, debes especificar el número de la tarea. Ejemplo: "!done 1" o "!done 1, 2, 3"`);
            return;
        }

        // Parsear los números separados por comas
        const taskNumbers = taskNumbersStr.split(',')
            .map(num => parseInt(num.trim()))
            .filter(num => !isNaN(num) && num > 0);

        if (taskNumbers.length === 0) {
            client.say(channel, `@${tags.username}, debes especificar números válidos. Ejemplo: "!done 1" o "!done 1, 2, 3"`);
            return;
        }

        // Leer las tareas existentes del archivo tasks.json
        let existingUsers = [];
        if (fs.existsSync("tasks.json")) {
            try {
                const data = fs.readFileSync("tasks.json", "utf8");
                existingUsers = JSON.parse(data);
            } catch (err) {
                console.error("Error leyendo tasks.json:", err);
                client.say(channel, `@${tags.username}, error al leer las tareas.`);
                return;
            }
        }

        // Buscar si el usuario existe
        const userIndex = existingUsers.findIndex(user => user.user === tags.username);

        if (userIndex === -1) {
            client.say(channel, `@${tags.username}, no tienes tareas registradas.`);
            return;
        }

        const user = existingUsers[userIndex];
        
        // Verificar que todos los números sean válidos
        const invalidNumbers = taskNumbers.filter(num => num < 1 || num > user.task.length);
        if (invalidNumbers.length > 0) {
            client.say(channel, `@${tags.username}, números de tarea no válidos: ${invalidNumbers.join(', ')}. Tienes ${user.task.length} tarea(s).`);
            return;
        }

        // Eliminar duplicados y ordenar de mayor a menor para evitar problemas de índices
        const uniqueNumbers = [...new Set(taskNumbers)].sort((a, b) => b - a);
        
        // Mover las tareas de task a completed
        const completedTasks = [];
        if (!user.completed) {
            user.completed = [];
        }

        uniqueNumbers.forEach(taskNumber => {
            const taskIndex = taskNumber - 1; // Convertir de 1-indexado a 0-indexado
            const completedTask = user.task.splice(taskIndex, 1)[0];
            user.completed.push(completedTask);
            completedTasks.push(completedTask);
        });

        // Escribir de vuelta al archivo
        try {
            fs.writeFileSync("tasks.json", JSON.stringify(existingUsers, null, 2));
            const taskList = completedTasks.map(task => task.toLowerCase()).join(', ');
            client.say(channel, `@${tags.username}, marcaste como completada(s): ${taskList}. ¡Felicidades!`);
        } catch (err) {
            console.error("Error escribiendo tasks.json:", err);
            client.say(channel, `@${tags.username}, error al marcar las tareas como completadas.`);
        }

        return;
    }

    // Comando para limpiar tareas completadas
    if (msg.toLowerCase() === "!cleardone") {
        // Leer las tareas existentes del archivo tasks.json
        let existingUsers = [];
        if (fs.existsSync("tasks.json")) {
            try {
                const data = fs.readFileSync("tasks.json", "utf8");
                existingUsers = JSON.parse(data);
            } catch (err) {
                console.error("Error leyendo tasks.json:", err);
                client.say(channel, `@${tags.username}, error al leer las tareas.`);
                return;
            }
        }

        // Buscar si el usuario existe
        const userIndex = existingUsers.findIndex(user => user.user === tags.username);

        if (userIndex === -1) {
            client.say(channel, `@${tags.username}, no tienes tareas registradas.`);
            return;
        }

        const user = existingUsers[userIndex];
        const completedCount = user.completed ? user.completed.length : 0;

        if (completedCount === 0) {
            client.say(channel, `@${tags.username}, no tienes tareas completadas para limpiar.`);
            return;
        }

        // Limpiar las tareas completadas
        user.completed = [];

        // Escribir de vuelta al archivo
        try {
            fs.writeFileSync("tasks.json", JSON.stringify(existingUsers, null, 2));
            client.say(channel, `@${tags.username}, se limpiaron ${completedCount} tarea(s) completada(s). Ahora puedes agregar más tareas.`);
        } catch (err) {
            console.error("Error escribiendo tasks.json:", err);
            client.say(channel, `@${tags.username}, error al limpiar las tareas completadas.`);
        }

        return;
    }

    // Comando para eliminar todas las tareas (solo para el streamer)
    if (msg.toLowerCase() === "!delete") {
        // Verificar si es el streamer
        if (tags.username.toLowerCase() !== process.env.TWITCH_USERNAME.toLowerCase()) {
            client.say(channel, `@${tags.username}, no tienes permisos para ejecutar este comando.`);
            return;
        }

        try {
            // Eliminar el archivo tasks.json o vaciarlo
            fs.writeFileSync("tasks.json", JSON.stringify([], null, 2));
            client.say(channel, `@${tags.username}, se eliminaron todas las tareas de todos los usuarios.`);
            console.log(`${tags.username} eliminó todas las tareas del sistema.`);
        } catch (err) {
            console.error("Error eliminando tasks.json:", err);
            client.say(channel, `@${tags.username}, error al eliminar las tareas.`);
        }

        return;
    }
});


const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
	res.send("Hola mundo desde el servidor de express");
});

app.listen(port, () => {
	console.log(`[ 🟢🟢🟢 ] Escuchando en el puerto http://localhost:${port} 🛰️`);
});
