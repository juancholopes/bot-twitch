# Twitch Bot - Task Management System

A modular bot for Twitch that allows users to manage their daily tasks directly from the chat. Built with TypeScript for type safety and better developer experience.

## Features

- Add personal tasks (`!task`)
- View pending tasks (`!mytasks` or `!list`)
- Mark tasks as completed (`!done`)
- Clear completed tasks (`!cleardone`)
- Delete all tasks (streamer only) (`!delete`)
- Greeting command (`!hello`)

## Project Structure

```
bot-twich/
├── app.ts                  # Main entry point
├── src/
│   ├── bot.ts             # Main Twitch bot logic
│   ├── server.ts          # Express web server
│   ├── config/
│   │   └── environment.ts  # Configuration and environment variables
│   ├── services/
│   │   ├── taskService.ts  # Task management service
│   │   └── spotifyService.ts  # Spotify integration service
│   ├── commands/
│   │   ├── index.ts       # Command exporter
│   │   ├── mytasks.ts     # !mytasks command
│   │   ├── task.ts        # !task command
│   │   ├── done.ts        # !done command
│   │   ├── cleardone.ts   # !cleardone command
│   │   ├── delete.ts      # !delete command
│   │   ├── hello.ts       # !hello command
│   │   └── help.ts        # !help command
│   ├── routes/
│   │   └── spotify.routes.ts  # Spotify API routes
│   └── utils/
│       ├── logger.ts      # Logging system
│       ├── helpers.ts     # Helper functions
│       ├── validators.ts  # Input validation
│       └── rateLimiter.ts # Rate limiting
├── dist/                  # Compiled JavaScript (generated)
├── data/
│   └── tasks.json         # Task storage
├── .env                   # Environment variables
├── tsconfig.json          # TypeScript configuration
└── package.json
```

## Installation and Configuration

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bot-twich
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file with:
   ```env
   PORT=3000
   OAUTH_TOKEN=oauth:your_oauth_token
   REFRESH_TOKEN=your_refresh_token
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   TWITCH_USERNAME=your_bot_username
   CHANEL_NAME=your_channel_name
   ```

4. **Build and run the application**
   ```bash
   # Build TypeScript
   npm run build
   
   # Run in production
   npm start
   
   # or for development (with auto-reload)
   npm run dev
   ```

## Available Commands

### For Users

| Command | Description | Example |
|---------|-------------|---------|
| `!task <tasks>` | Add new tasks (max. 5 per user) | `!task study, exercise` |
| `!mytasks` / `!list` | View pending tasks | `!mytasks` |
| `!done <numbers>` | Mark tasks as completed | `!done 1, 2, 3` |
| `!cleardone` | Clear completed tasks | `!cleardone` |
| `!hello` | Bot greeting | `!hello` |

### For Streamer

| Command | Description | Example |
|---------|-------------|---------|
| `!delete` | Delete all tasks for all users | `!delete` |

## System Rules

- **Maximum 5 tasks per user** (including completed)
- **Maximum 5 tasks per command** when adding
- Tasks are stored in uppercase internally
- Displayed in lowercase to the user
- The `!cleardone` command frees up space for new tasks

## Data Structure

```json
[
  {
    "user": "username",
    "task": ["TASK1", "TASK2"],
    "completed": ["COMPLETED_TASK"]
  }
]
```

## Development

### Applied Principles

- **Separation of concerns**: Each module has a specific function
- **Clean code**: Small functions with descriptive names
- **Error handling**: Try-catch in all critical operations
- **Logging**: Structured logging system
- **Centralized configuration**: Environment variables and configuration in one place

### Adding New Commands

1. Create file in `src/commands/new-command.js`
2. Implement the handler function
3. Export in `src/commands/index.js`
4. Add routing logic in `src/bot.js`

### Testing

```bash
# Run tests (when implemented)
npm test

# Check lint
npm run lint
```

## Debugging

Logs are displayed in console with timestamps and levels:
- `INFO`: Normal operations
- `ERROR`: Captured errors
- `WARN`: Warnings
- `DEBUG`: Development information

## Web Endpoints

- `GET /` - General bot status
- `GET /health` - Server health check
