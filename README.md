# Twitch Bot - Task Management System

A modular bot for Twitch that allows users to manage their daily tasks directly from the chat.

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
├── app.js                  # Main entry point
├── src/
│   ├── bot.js             # Main Twitch bot logic
│   ├── server.js          # Express web server
│   ├── config/
│   │   └── environment.js  # Configuration and environment variables
│   ├── services/
│   │   └── taskService.js  # Task management service
│   ├── commands/
│   │   ├── index.js       # Command exporter
│   │   ├── mytasks.js     # !mytasks command
│   │   ├── task.js        # !task command
│   │   ├── done.js        # !done command
│   │   ├── cleardone.js   # !cleardone command
│   │   ├── delete.js      # !delete command
│   │   └── hello.js       # !hello command
│   └── utils/
│       ├── logger.js      # Logging system
│       └── helpers.js     # Helper functions
├── data/
│   └── tasks.json         # Task storage
├── .env                   # Environment variables
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
   SPOTYFY_CLIENT_ID=your_spotify_client_id
   SPOTYFY_CLIENT_SECRET=your_spotify_client_secret
   ```

4. **Run the application**

   ```bash
   npm start
   # or for development
   npm run dev
   ```

## Available Commands

### For Users

| Command              | Description                     | Example                 |
| -------------------- | ------------------------------- | ----------------------- |
| `!task <tasks>`      | Add new tasks (max. 5 per user) | `!task study, exercise` |
| `!mytasks` / `!list` | View pending tasks              | `!mytasks`              |
| `!done <numbers>`    | Mark tasks as completed         | `!done 1, 2, 3`         |
| `!cleardone`         | Clear completed tasks           | `!cleardone`            |
| `!hello`             | Bot greeting                    | `!hello`                |

### For Streamer

| Command   | Description                    | Example   |
| --------- | ------------------------------ | --------- |
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

`GET /health` - Server health check
