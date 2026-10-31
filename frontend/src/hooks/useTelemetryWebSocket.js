import { useState, useEffect, useRef } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/telemetry";

export function useTelemetryWebSocket({ onTelemetryUpdate, onNewAlert }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          setLastError(null);
          // Send initial ping
          ws.send(JSON.stringify({ action: "ping" }));
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === "telemetry_update" && message.data) {
              if (onTelemetryUpdate) {
                onTelemetryUpdate(message.data);
              }
              if (message.alert && onNewAlert) {
                onNewAlert(message.alert);
              }
            }
          } catch (err) {
            console.error("WS payload parse error:", err);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          // Reconnect with backoff
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          if (isUnmounted) return;
          setLastError("WebSocket connection error");
          ws.close();
        };
      } catch (err) {
        if (!isUnmounted) {
          setLastError(err.message);
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { isConnected, lastError };
}
