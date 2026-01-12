const spotifyService = require('./src/services/spotifyService');
const logger = require('./src/utils/logger');

console.log('--- Spotify Token Utility ---');
console.log('1. Open this URL in your browser:');
console.log(spotifyService.getAuthorizationUrl());
console.log('\n2. After login, you will be redirected to .../callback?code=YOUR_CODE');
console.log('3. The server will display the Refresh Token automatically.');
console.log('   Or run this script with the code: node get-spotify-token.js <YOUR_CODE>');

const code = process.argv[2];

if (code) {
    console.log('\nExchanging code for tokens...');
    spotifyService.getTokensFromCode(code)
        .then(({ accessToken, refreshToken }) => {
            console.log('\n--- SUCCESS ---');
            console.log('Access Token:', accessToken.substring(0, 20) + '...');
            console.log('Refresh Token:', refreshToken);
            console.log('\nRun: node set-spotify-token.js', refreshToken);
        })
        .catch(err => {
            console.error('Error:', err.message);
        });
}
