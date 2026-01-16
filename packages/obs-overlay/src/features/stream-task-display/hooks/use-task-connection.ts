import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import type { UserTasks } from '@bot-twitch/shared/task';

interface UseTaskConnectionReturn {
  tasks: UserTasks[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

const API_URL = 'http://localhost:3000/api/tasks';

// Datos de prueba para desarrollo
const MOCK_TASKS: UserTasks[] = [
  {
    user: 'juancholopes',
    task: [
      'Implementar autenticación con OAuth',
      'Refactorizar componentes de tareas',
      'Mejorar estilos del overlay'
    ],
    completed: [
      'Configurar WebSocket',
      'Crear estructura base'
    ]
  },
  {
    user: 'viewer123',
    task: [
      'Agregar animaciones suaves',
      'Optimizar rendimiento'
    ],
    completed: [
      'Testear conexión'
    ]
  },
  {
    user: 'developer_pro',
    task: [
      'Documentar API endpoints'
    ],
    completed: []
  }
];

export const useTaskConnection = (): UseTaskConnectionReturn => {
  // Inicializar con datos de prueba si estamos en desarrollo
  const [tasks, setTasks] = useState<UserTasks[]>(
    import.meta.env.DEV ? MOCK_TASKS : []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  const fetchTasks = async (): Promise<void> => {
    try {
      setError(null);
      const response = await axios.get<UserTasks[]>(API_URL, {
        timeout: 5000,
      });
      setTasks(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Check server connection.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const socket: Socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError('Connection failed. Retrying...');
    });

    socket.on('tasksUpdated', () => {
      console.log('Tasks updated, fetching new data...');
      fetchTasks();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-retry connection every 10 seconds if there's an error
  useEffect(() => {
    if (error && !loading) {
      const retryTimer = setTimeout(() => {
        console.log('Retrying connection...');
        fetchTasks();
      }, 10000);

      return () => clearTimeout(retryTimer);
    }
  }, [error, loading]);

  return { tasks, loading, error, connected };
};
