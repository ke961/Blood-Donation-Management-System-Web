"""
Centralized WebSocket Connection Manager.

Maintains a set of active WebSocket connections and provides
broadcast capabilities for real-time updates across the application.
"""

import asyncio
import json
from typing import Set
from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts messages."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection from the active set."""
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        """Send a JSON message to all active WebSocket connections."""
        dead_connections = set()
        for connection in self.active_connections.copy():
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        # Clean up any dead connections
        for conn in dead_connections:
            self.active_connections.discard(conn)

    def broadcast_sync(self, event_type: str, data: dict = None):
        """
        Synchronous helper to schedule a broadcast from sync FastAPI endpoints.
        Safe to call from synchronous route handlers running in thread pools.
        """
        message = {"type": event_type}
        if data:
            message["data"] = data
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.broadcast(message))
            else:
                loop.run_until_complete(self.broadcast(message))
        except RuntimeError:
            # If no event loop exists in this thread, create one
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(self.broadcast(message))


# Global singleton instance
manager = ConnectionManager()
