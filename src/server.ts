import http from 'node:http';
import path from 'node:path';
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

class WebServer {
	private app: Application;
	private port: number;
	private server: http.Server;
	private io: SocketIOServer;

	constructor() {
		this.app = express();
		this.port = config.server.port;
		this.server = http.createServer(this.app);
		this.io = new SocketIOServer(this.server);
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
				origin: (origin, callback) => {
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
			express.static(path.join(__dirname, '../obs-overlay/dist')),
		);
	}

	private setupSocket(): void {
		this.io.on('connection', (socket) => {
			logger.info('Client connected to WebSocket');
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
