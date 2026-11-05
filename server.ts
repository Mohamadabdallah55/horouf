import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { applyGameAction, createInitialRoomState } from './src/game/gameEngine';
import { GameAction, RoomGameState } from './src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface ClientConnection {
  ws: WebSocket;
  roomCode: string;
  role: 'studio' | 'display' | 'host';
}

const rooms = new Map<string, RoomGameState>();
const clients = new Set<ClientConnection>();

// Ensure default room exists
rooms.set('ELITE1', createInitialRoomState('ELITE1', '2026', false));

function getOrCreateRoom(roomCode: string, autostart: boolean = false): RoomGameState {
  const code = (roomCode || 'ELITE1').trim().toUpperCase();
  let room = rooms.get(code);
  if (!room) {
    room = createInitialRoomState(code, '2026', autostart);
    rooms.set(code, room);
  }
  return room;
}

/**
 * Sanitizes state for Display Mode so the unrevealed answer is never leaked to the audience display.
 */
function sanitizeStateForRole(
  state: RoomGameState,
  role: 'studio' | 'display' | 'host'
): RoomGameState {
  if (role === 'display' && state.currentQuestion && !state.answerRevealed) {
    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        answer: '••••••••',
      },
    };
  }
  return state;
}

function getRoomPresence(roomCode: string) {
  let displays = 0;
  let hosts = 0;
  let studios = 0;
  for (const c of clients) {
    if (c.roomCode === roomCode && c.ws.readyState === WebSocket.OPEN) {
      if (c.role === 'display') displays++;
      else if (c.role === 'host') hosts++;
      else studios++;
    }
  }
  return { displays, hosts, studios, total: displays + hosts + studios };
}

function broadcastRoomState(roomCode: string) {
  const state = rooms.get(roomCode);
  if (!state) return;
  const presence = getRoomPresence(roomCode);

  for (const client of clients) {
    if (client.roomCode === roomCode && client.ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        type: 'ROOM_STATE',
        state: sanitizeStateForRole(state, client.role),
        presence,
      });
      client.ws.send(payload);
    }
  }
}

// Server-side 1-second timer interval for rooms with active countdowns
setInterval(() => {
  for (const [roomCode, state] of rooms.entries()) {
    if (state.phase === 'playing' && state.timerRunning && state.timerRemaining > 0) {
      const updated = applyGameAction(state, { type: 'TIMER_TICK' });
      rooms.set(roomCode, updated);
      broadcastRoomState(roomCode);
    }
  }
}, 1000);

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`);
    const roomCode = (url.searchParams.get('room') || 'ELITE1').trim().toUpperCase();
    const roleParam = url.searchParams.get('role') || 'studio';
    const autostart = url.searchParams.get('autostart') === '1';
    const role: 'studio' | 'display' | 'host' =
      roleParam === 'display' || roleParam === 'host' ? roleParam : 'studio';

    const room = getOrCreateRoom(roomCode, autostart);
    if (autostart && room.phase === 'title') {
      const started = applyGameAction(room, { type: 'START_MATCH' });
      rooms.set(roomCode, started);
    }

    const conn: ClientConnection = { ws, roomCode, role };
    clients.add(conn);

    // Send initial state and updated presence
    broadcastRoomState(roomCode);

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(String(raw));
        if (data.type === 'ACTION' && data.action) {
          const currentRoom = getOrCreateRoom(conn.roomCode);
          // Protect host permissions if role is display
          if (conn.role === 'display') {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: 'وضع العرض للقراءة فقط ولا يملك صلاحية تعديل حالة المباراة.',
              })
            );
            return;
          }
          // Verify host PIN if provided
          if (data.pin && String(data.pin) !== currentRoom.hostPin) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: 'رمز حماية المقدم (PIN) غير صحيح.',
              })
            );
            return;
          }

          const updated = applyGameAction(currentRoom, data.action as GameAction);
          rooms.set(conn.roomCode, updated);
          broadcastRoomState(conn.roomCode);
        } else if (data.type === 'SWITCH_ROLE' && data.role) {
          conn.role =
            data.role === 'display' || data.role === 'host' ? data.role : 'studio';
          broadcastRoomState(conn.roomCode);
        } else if (data.type === 'JOIN_ROOM' && data.roomCode) {
          const oldRoom = conn.roomCode;
          conn.roomCode = String(data.roomCode).trim().toUpperCase();
          getOrCreateRoom(conn.roomCode);
          broadcastRoomState(oldRoom);
          broadcastRoomState(conn.roomCode);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      clients.delete(conn);
      broadcastRoomState(conn.roomCode);
    });
  });

  // REST API endpoints for room management & fallback sync
  app.post('/api/rooms', (req, res) => {
    const requestedCode = req.body?.roomCode
      ? String(req.body.roomCode).trim().toUpperCase()
      : `EC${Math.floor(1000 + Math.random() * 9000)}`;
    const pin = req.body?.hostPin ? String(req.body.hostPin).trim() : '2026';
    const newRoom = createInitialRoomState(requestedCode, pin, false);
    rooms.set(requestedCode, newRoom);
    res.json({
      roomCode: requestedCode,
      hostPin: pin,
      state: newRoom,
      presence: getRoomPresence(requestedCode),
    });
  });

  app.get('/api/rooms/:roomCode', (req, res) => {
    const code = req.params.roomCode.trim().toUpperCase();
    const roleParam = String(req.query.role || 'studio');
    const role: 'studio' | 'display' | 'host' =
      roleParam === 'display' || roleParam === 'host' ? roleParam : 'studio';
    const room = getOrCreateRoom(code);
    res.json({
      state: sanitizeStateForRole(room, role),
      presence: getRoomPresence(code),
    });
  });

  app.post('/api/rooms/:roomCode/action', (req, res) => {
    const code = req.params.roomCode.trim().toUpperCase();
    const roleParam = String(req.body?.role || 'studio');
    if (roleParam === 'display') {
      res.status(403).json({ error: 'وضع العرض لا يملك صلاحيات المقدم.' });
      return;
    }

    const room = getOrCreateRoom(code);
    if (req.body?.pin && String(req.body.pin) !== room.hostPin) {
      res.status(403).json({ error: 'رمز حماية المقدم (PIN) غير صحيح.' });
      return;
    }

    const action = req.body?.action as GameAction | undefined;
    if (!action || !action.type) {
      res.status(400).json({ error: 'إجراء غير صالح.' });
      return;
    }

    const updated = applyGameAction(room, action);
    rooms.set(code, updated);
    broadcastRoomState(code);

    res.json({
      state: updated,
      presence: getRoomPresence(code),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ELITE CLASH Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
