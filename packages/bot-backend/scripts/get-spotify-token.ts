import { spotifyIntegrationService } from '../src/features/spotify-integration';
import logger from '../src/infrastructure/logging/logger';

console.log('--- Spotify Token Utility ---');
console.log('1. Open this URL in your browser:');
console.log(spotifyIntegrationService.getAuthorizationUrl());
console.log('\n2. After login, you will be redirected to .../callback?code=YOUR_CODE');
console.log('3. The server will display the Refresh Token automatically.');
console.log('   Or run this script with the code: node get-spotify-token.js <YOUR_CODE>');

const code = process.argv[2];

if (code) {
    console.log('\nExchanging code for tokens...');
    spotifyIntegrationService.getTokensFromCode(code)
        .then(({ access_token: accessToken, refresh_token: refreshToken }: any) => {
            console.log('\n--- SUCCESS ---');
            console.log('Access Token:', accessToken.substring(0, 20) + '...');
            console.log('Refresh Token:', refreshToken);
            console.log('\nRun: node set-spotify-token.js', refreshToken);
        })
        .catch((err: any) => {
            console.error('Error:', err.message);
        });
}
