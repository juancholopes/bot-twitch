import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PomodoroState } from '@bot-twitch/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * usePomodoro Hook
 * Manages WebSocket connection and pomodoro state
 * Scope Rule: Local to pomodoro-display feature (only this feature uses it)
 */
export function usePomodoro() {
  const [state, setState] = useState<PomodoroState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initial fetch of state via REST API
    const fetchInitialState = async () => {
      try {
        const response = await fetch(`${API_URL}/api/pomodoro/state`);
        if (response.ok) {
          const data = await response.json();
          setState(data);
        }
      } catch (error) {
        console.error('Failed to fetch initial pomodoro state:', error);
      }
    };

    fetchInitialState();

    // Setup WebSocket connection for real-time updates
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to pomodoro timer WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from pomodoro timer WebSocket');
      setIsConnected(false);
    });

    // Listen for state updates
    newSocket.on('pomodoro:stateChanged', (newState: PomodoroState) => {
      setState(newState);
    });

    newSocket.on('pomodoro:tick', (newState: PomodoroState) => {
      setState(newState);
    });

    newSocket.on('pomodoro:phaseChanged', (newState: PomodoroState) => {
      setState(newState);
      console.log(`🍅 Phase changed to: ${newState.phase}`);
    });

    newSocket.on('pomodoro:paused', (newState: PomodoroState) => {
      setState(newState);
    });

    newSocket.on('pomodoro:resumed', (newState: PomodoroState) => {
      setState(newState);
    });

    newSocket.on('pomodoro:reset', (newState: PomodoroState) => {
      setState(newState);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return {
    state,
    isConnected,
    socket,
  };
}
