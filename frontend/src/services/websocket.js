/**
 * WebSocket URL utility for real-time connections.
 * Automatically determines the correct WebSocket protocol and host
 * based on the current environment (local dev vs production).
 */

export function getWebSocketURL() {
  // Allow explicit override via env variable
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // Local development
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "ws://127.0.0.1:8000/ws";
  }

  // Production — use wss:// with the Render backend
  return "wss://blood-donation-management-system-web.onrender.com/ws";
}

/**
 * Creates an auto-reconnecting WebSocket connection.
 * Calls `onMessage` for each incoming JSON message.
 * Returns a cleanup function to close the connection.
 *
 * @param {function} onMessage - Callback receiving parsed JSON messages
 * @param {number} reconnectDelay - Milliseconds to wait before reconnecting (default: 3000)
 * @returns {function} cleanup - Call to permanently close the connection
 */
export function createRealtimeConnection(onMessage, reconnectDelay = 3000) {
  let ws = null;
  let shouldReconnect = true;
  let reconnectTimer = null;

  function connect() {
    if (!shouldReconnect) return;

    const url = getWebSocketURL();
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("[LifeFlow WS] Connected to real-time server");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.warn("[LifeFlow WS] Failed to parse message:", err);
      }
    };

    ws.onclose = () => {
      if (shouldReconnect) {
        reconnectTimer = setTimeout(connect, reconnectDelay);
      }
    };

    ws.onerror = (err) => {
      console.warn("[LifeFlow WS] Connection error:", err);
      ws.close();
    };
  }

  connect();

  // Return cleanup function
  return function cleanup() {
    shouldReconnect = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    if (ws) {
      ws.close();
    }
  };
}
