import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express, {
	type Application,
	type Request,
	type Response,
} from 'express';
import { promises as fs } from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import config from '@infrastructure/config/environment';
import logger from '@infrastructure/logging/logger';
import { spotifyRoutes } from '@features/spotify-integration';
import { taskManagementService } from '@features/task-management';
import {
	PomodoroConfigService,
	PomodoroStatsService,
	PomodoroTimerService,
} from '@features/pomodoro-timer';
import { createPomodoroRoutes } from '@features/pomodoro-timer/pomodoro.routes';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebServer {
	private app: Application;
	private port: number;
	private server: http.Server;
	private io: SocketIOServer;
	
	// Pomodoro services
	private pomodoroConfigService: PomodoroConfigService;
	private pomodoroStatsService: PomodoroStatsService;
	private pomodoroTimerService: PomodoroTimerService;

	constructor() {
		this.app = express();
		this.port = config.server.port;
		this.server = http.createServer(this.app);
		this.io = new SocketIOServer(this.server);
		
		// Initialize pomodoro services
		this.pomodoroConfigService = new PomodoroConfigService();
		this.pomodoroStatsService = new PomodoroStatsService();
		this.pomodoroTimerService = new PomodoroTimerService(
			this.pomodoroConfigService,
			this.pomodoroStatsService
		);
		
		// Setup pomodoro WebSocket events
		this.setupPomodoroEvents();
		
		taskManagementService.setEmitter((event: string) =>
			this.io.emit(event),
		);
		this.setupRoutes();
		this.setupSocket();
	}

	private setupRoutes(): void {
		const allowedOrigins = config.cors.allowedOrigins
			? config.cors.allowedOrigins.split(',')
			: [];

		this.app.use(
			cors({
				origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
					if (!origin) return callback(null, true);

					if (config.env === 'development') {
						return callback(null, true);
					}

					if (allowedOrigins.indexOf(origin) !== -1) {
						callback(null, true);
					} else {
						callback(new Error('Not allowed by CORS'));
					}
				},
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
				allowedHeaders: [
					'Origin',
					'X-Requested-With',
					'Content-Type',
					'Accept',
					'Authorization',
				],
				credentials: true,
			}),
		);

		// Spotify Routes
		this.app.use('/', spotifyRoutes);
		
		// Pomodoro Routes
		const pomodoroRoutes = createPomodoroRoutes(
			this.pomodoroTimerService,
			this.pomodoroConfigService,
			this.pomodoroStatsService
		);
		this.app.use('/api/pomodoro', pomodoroRoutes);

		this.app.get('/', (_req: Request, res: Response) => {
			res.json({
				message: 'Bot de Twitch funcionando correctamente',
				timestamp: new Date().toISOString(),
				status: 'online',
			});
		});

		this.app.get('/health', (_req: Request, res: Response) => {
			res.json({
				status: 'healthy',
				uptime: process.uptime(),
				timestamp: new Date().toISOString(),
			});
		});

		this.app.get('/api/tasks', async (_req: Request, res: Response) => {
			const tasksPath = path.join(__dirname, '../data/tasks.json');
			try {
				const data = await fs.readFile(tasksPath, 'utf8');
				res.json(JSON.parse(data));
			} catch (_err) {
				res.status(500).json({ error: 'Failed to read tasks data' });
			}
		});

		// Serve overlay static files
		this.app.use(
			'/overlay',
			express.static(path.join(__dirname, '../../obs-overlay/dist')),
		);
	}
	
	/**
	 * Setup Pomodoro timer WebSocket events
	 */
	private setupPomodoroEvents(): void {
		// Emit tick events every second
		this.pomodoroTimerService.on('tick', (state) => {
			this.io.emit('pomodoro:tick', state);
		});

		// Emit phase change events
		this.pomodoroTimerService.on('phaseChanged', (state) => {
			this.io.emit('pomodoro:phaseChanged', state);
			logger.info(`🍅 Pomodoro phase changed to: ${state.phase}`);
		});

		// Emit session completed events
		this.pomodoroTimerService.on('sessionCompleted', (data) => {
			this.io.emit('pomodoro:sessionCompleted', data);
			logger.info(`🍅 Pomodoro session completed: ${data.phase}`);
		});

		// Emit pause/resume events
		this.pomodoroTimerService.on('paused', (state) => {
			this.io.emit('pomodoro:paused', state);
		});

		this.pomodoroTimerService.on('resumed', (state) => {
			this.io.emit('pomodoro:resumed', state);
		});

		// Emit reset events
		this.pomodoroTimerService.on('reset', (state) => {
			this.io.emit('pomodoro:reset', state);
		});
	}

	private setupSocket(): void {
		this.io.on('connection', (socket: any) => {
			logger.info('Client connected to WebSocket');
			
			// Send current pomodoro state immediately on connection
			socket.emit('pomodoro:stateChanged', this.pomodoroTimerService.getState());
			
			socket.on('disconnect', () => {
				logger.info('Client disconnected from WebSocket');
			});
		});
	}

	start(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.server.listen(this.port, () => {
					logger.info(
						`Servidor web iniciado en http://localhost:${this.port}`,
					);
					resolve();
				});
			} catch (error) {
				logger.error('Error iniciando servidor web:', error);
				reject(error);
			}
		});
	}

	stop(): Promise<void> {
		return new Promise((resolve) => {
			// Cleanup pomodoro timer
			this.pomodoroTimerService.destroy();
			
			if (this.server) {
				this.server.close(() => {
					logger.info('Servidor web detenido');
					resolve();
				});
			} else {
				resolve();
			}
		});
	}
}

export default WebServer;
