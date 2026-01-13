const dotenv = require("dotenv");

dotenv.config();

// Definir variables requeridas con sus tipos y descripciones
const requiredEnvVars = [
    { name: 'TWITCH_USERNAME', type: 'string', description: 'Twitch bot username' },
    { name: 'OAUTH_TOKEN', type: 'string', description: 'Twitch OAuth Token' },
    { name: 'CHANEL_NAME', type: 'string', description: 'Twitch Channel Name' },
    { name: 'CLIENT_ID', type: 'string', description: 'Twitch Client ID' },
    { name: 'CLIENT_SECRET', type: 'string', description: 'Twitch Client Secret' },
];

const optionalEnvVars = [
    { name: 'REFRESH_TOKEN', type: 'string', description: 'Twitch Refresh Token' },
    { name: 'NODE_ENV', type: 'string', description: 'Environment', default: 'development' },
    { name: 'PORT', type: 'number', description: 'Server Port', default: 3000 },
    { name: 'ALLOWED_ORIGINS', type: 'string', description: 'CORS Alowed Origins' },
    { name: 'MAX_TASKS_PER_USER', type: 'number', description: 'Max tasks per user', default: 5 },
    { name: 'MAX_TASKS_PER_COMMAND', type: 'number', description: 'Max tasks per command', default: 5 },
    { name: 'RATE_LIMIT_DEFAULT_MAX', type: 'number', description: 'Rate limit default max requests', default: 5 },
    { name: 'RATE_LIMIT_DEFAULT_WINDOW', type: 'number', description: 'Rate limit default window ms', default: 10000 },
    { name: 'RATE_LIMIT_HEAVY_MAX', type: 'number', description: 'Rate limit heavy max requests', default: 2 },
    { name: 'RATE_LIMIT_HEAVY_WINDOW', type: 'number', description: 'Rate limit heavy window ms', default: 30000 },
    { name: 'SPOTIFY_CLIENT_ID', type: 'string', description: 'Spotify Client ID' },
    { name: 'SPOTIFY_CLIENT_SECRET', type: 'string', description: 'Spotify Client Secret' },
    { name: 'SPOTIFY_REFRESH_TOKEN', type: 'string', description: 'Spotify Refresh Token' }
];

// Validar variables requeridas
const missingVars = requiredEnvVars.filter(({ name }) => !process.env[name]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(({ name, description }) => {
        console.error(`   - ${name}: ${description}`);
    });
    process.exit(1);
}

// Validar formato de OAuth token
if (!process.env.OAUTH_TOKEN.startsWith('oauth:')) {
    console.error('❌ OAUTH_TOKEN must start with "oauth:"');
    process.exit(1);
}

// Función helper para parsear valores
function parseEnvValue(name, type, defaultValue) {
    const value = process.env[name];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    
    if (type === 'number') {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) return defaultValue;
        return parsed;
    }
    
    if (type === 'boolean') {
        return value === 'true';
    }
    
    return value;
}

const config = {
    env: parseEnvValue('NODE_ENV', 'string', 'development'),
    twitch: {
		username: process.env.TWITCH_USERNAME,
		oauthToken: process.env.OAUTH_TOKEN,
		channelName: process.env.CHANEL_NAME,
		refreshToken: process.env.REFRESH_TOKEN,
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
	},
	server: {
		port: parseEnvValue('PORT', 'number', 3000),
	},
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS 
    },
	tasks: {
		maxTasksPerUser: parseEnvValue('MAX_TASKS_PER_USER', 'number', 5),
		maxTasksPerCommand: parseEnvValue('MAX_TASKS_PER_COMMAND', 'number', 5),
		dataFile: "./data/tasks.json",
	},
    rateLimit: {
        default: {
            max: parseEnvValue('RATE_LIMIT_DEFAULT_MAX', 'number', 5),
            windowMs: parseEnvValue('RATE_LIMIT_DEFAULT_WINDOW', 'number', 10000)
        },
        heavy: {
            max: parseEnvValue('RATE_LIMIT_HEAVY_MAX', 'number', 2),
            windowMs: parseEnvValue('RATE_LIMIT_HEAVY_WINDOW', 'number', 30000)
        }
    },
    spotify: {
        enabled: parseEnvValue('ENABLE_SPOTIFY', 'boolean', false),
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback',
        refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
    }
};

// Validar configuración
if (config.server.port < 1 || config.server.port > 65535) {
    console.error(`❌ Invalid PORT: ${config.server.port}. Must be between 1 and 65535.`);
    process.exit(1);
}

// Logging de configuración (sin secretos)
console.log('✅ Configuration loaded:');
console.log(`   Environment: ${config.env}`);
console.log(`   Twitch Channel: ${config.twitch.channelName}`);
console.log(`   Server Port: ${config.server.port}`);
console.log(`   Max Tasks Per User: ${config.tasks.maxTasksPerUser}`);

module.exports = config;
