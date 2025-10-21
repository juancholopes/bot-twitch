const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new spotifyApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);
