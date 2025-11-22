// frontend/src/hooks/useWebSocket.ts

import { useEffect, useState, useRef, useCallback } from 'react';
import { getAccessToken } from '@/utils/storage';

export const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const token = getAccessToken();
    
    if (!token) {
        console.warn("Cannot connect to WebSocket: No access token found.");
        return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
        return;
    }

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    console.log(`Attempting WebSocket connection to: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connection established successfully');
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log('❌ WebSocket connection closed');
      setSocket(null);
      socketRef.current = null;
      // Attempt to reconnect after 3 seconds
      setTimeout(() => connect(), 3000);
    };

    ws.onerror = (error) => {
      console.error('⚠️ WebSocket error:', error);
    };

    socketRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { socket };
};