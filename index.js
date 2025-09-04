const express = require("express");
const tmi = require("tmi.js");
const dotenv = require("dotenv");

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

client.on("message", (channel, tags, message, self) => {
  // Ignore echoed messages.
  if (self) return;

  if (message.toLocaleLowerCase() === "!task") {
    client.say(channel, "Mensaje enviado");
  }

  if (message.toLowerCase().startsWith("!task ")) {
    const tasks = message.slice(6); // Quitar "!task "
    const taskList = tasks.split(",").map((task) => task.trim());

    console.log(...taskList);

    client
      .say(
        channel,
        `@${tags.username}, agregaste ${taskList.length} tarea(s): ${taskList.join(", ")}`,
      )
      .catch(console.error);
  }

  if (message.toLowerCase() === "!hello") {
    // "@alca, heya!"
    client.say(channel, `Hola @${tags.username},`);
  }
});

const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hola mundo desde el servidor de express");
});

app.listen(port, () => {
  console.log(`Escuchando en el puerto http://localhost:${port}`);
});
