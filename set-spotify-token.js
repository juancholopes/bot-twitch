const fs = require('fs');
const path = require('path');

const refreshToken = process.argv[2];

if (!refreshToken) {
    console.error('Please provide the refresh token provided by the authorization flow.');
    console.error('Usage: node set-spotify-token.js <REFRESH_TOKEN>');
    process.exit(1);
}

const envPath = path.join(__dirname, '.env');

fs.readFile(envPath, 'utf8', (err, data) => {
    let newContent = '';
    if (err && err.code === 'ENOENT') {
        // Create new
        newContent = `SPOTIFY_REFRESH_TOKEN=${refreshToken}\n`;
    } else if (err) {
        console.error('Error reading .env:', err);
        return;
    } else {
        // Update existing or append
        if (data.includes('SPOTIFY_REFRESH_TOKEN=')) {
            newContent = data.replace(/SPOTIFY_REFRESH_TOKEN=.*/g, `SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
        } else {
            newContent = data + `\nSPOTIFY_REFRESH_TOKEN=${refreshToken}\n`;
        }
    }

    fs.writeFile(envPath, newContent, 'utf8', (err) => {
        if (err) {
            console.error('Error writing .env:', err);
        } else {
            console.log('✅ SPOTIFY_REFRESH_TOKEN updated in .env');
            console.log('Please restart your server.');
        }
    });
});
