const dotenv = require("dotenv");

dotenv.config();

const config = {
  twitch: {
    username: process.env.TWITCH_USERNAME,
    oauthToken: process.env.OAUTH_TOKEN,
    channelName: process.env.CHANEL_NAME,
    refreshToken: process.env.REFRESH_TOKEN,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
  },
  server: {
    port: process.env.PORT || 3000,
  },
  tasks: {
    maxTasksPerUser: 5,
    maxTasksPerCommand: 5,
    dataFile: "./data/tasks.json",
  },
};

module.exports = config;
