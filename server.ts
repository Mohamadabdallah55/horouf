import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { applyGameAction, createInitialRoomState } from './src/game/gameEngine';
import { ClientRole, GameAction, RoomGameState, RoomPresence, TeamId } from './src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface ClientConnection {
  ws: WebSocket;
  roomCode: string;
  role: ClientRole;
  deviceId: string;
  authorized: boolean;
}

interface RoomDeviceLocks {
  team1DeviceId: string | null;
  team2DeviceId: string | null;
}

const rooms = new Map<string, RoomGameState>();
const roomDeviceLocks = new Map<string, RoomDeviceLocks>();
const clients = new Set<ClientConnection>();

// Ensure default room exists
rooms.set('ELITE1', createInitialRoomState('ELITE1', '2026', false));
roomDeviceLocks.set('ELITE1', { team1DeviceId: null, team2DeviceId: null });

function getOrCreateRoom(roomCode: string, autostart: boolean = false): RoomGameState {
  const code = (roomCode || 'ELITE1').trim().toUpperCase();
  let room = rooms.get(code);
  if (!room) {
    room = createInitialRoomState(code, '2026', autostart);
    rooms.set(code, room);
  }
  if (!roomDeviceLocks.has(code)) {
    roomDeviceLocks.set(code, { team1DeviceId: null, team2DeviceId: null });
  }
  return room;
}

function getDeviceLocks(roomCode: string): RoomDeviceLocks {
  const code = (roomCode || 'ELITE1').trim().toUpperCase();
  let locks = roomDeviceLocks.get(code);
  if (!locks) {
    locks = { team1DeviceId: null, team2DeviceId: null };
    roomDeviceLocks.set(code, locks);
  }
  return locks;
}

/**
 * Sanitizes state per device role:
 * - Team 1 & Team 2 buzzer screens NEVER receive the question text or secret answer!
 * - Display screens NEVER receive unrevealed answers.
 */
function sanitizeStateForRole(state: RoomGameState, role: ClientRole): RoomGameState {
  if (role === 'team1' || role === 'team2') {
    return {
      ...state,
      currentQuestion: null,
    };
  }
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

function getRoomPresence(roomCode: string): RoomPresence {
  let displays = 0;
  let studios = 0;
  let hosts = 0;
  let team1Connected = false;
  let team2Connected = false;
  const locks = getDeviceLocks(roomCode);

  for (const c of clients) {
    if (c.roomCode === roomCode && c.ws.readyState === WebSocket.OPEN) {
      if (c.role === 'display') displays++;
      else if (c.role === 'studio') studios++;
      else if (c.role === 'host') hosts++;
      else if (c.role === 'team1' && c.authorized) team1Connected = true;
      else if (c.role === 'team2' && c.authorized) team2Connected = true;
    }
  }

  const total =
    displays +
    studios +
    hosts +
    (team1Connected ? 1 : 0) +
    (team2Connected ? 1 : 0);

  return {
    displays,
    studios,
    hosts,
    team1Connected,
    team2Connected,
    team1DeviceId: locks.team1DeviceId,
    team2DeviceId: locks.team2DeviceId,
    total,
  };
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
        authorized: client.authorized,
      });
      client.ws.send(payload);
    }
  }
}

// Server-side 1-second timer interval for active question timers and buzzer answer timers
setInterval(() => {
  for (const [roomCode, state] of rooms.entries()) {
    if (state.phase !== 'playing') continue;
    const isMainTimerActive = state.timerRunning && state.timerRemaining > 0;
    const isAnswerTimerActive =
      state.buzzer.status === 'locked_by_winner' &&
      state.buzzer.answerTimerRunning &&
      state.buzzer.answerTimerRemaining > 0;

    if (isMainTimerActive || isAnswerTimerActive) {
      const updated = applyGameAction(state, { type: 'TIMER_TICK' });
      rooms.set(roomCode, updated);
      broadcastRoomState(roomCode);
    }
  }
}, 1000);

function parseRole(rawRole: string | null | undefined): ClientRole {
  if (
    rawRole === 'team1' ||
    rawRole === 'team2' ||
    rawRole === 'display' ||
    rawRole === 'host'
  ) {
    return rawRole;
  }
  return 'studio';
}

function authorizeTeamDevice(
  roomCode: string,
  role: ClientRole,
  deviceId: string
): boolean {
  if (role !== 'team1' && role !== 'team2') return true;
  const locks = getDeviceLocks(roomCode);
  const lockKey = role === 'team1' ? 'team1DeviceId' : 'team2DeviceId';
  const currentLockedDeviceId = locks[lockKey];

  // Check if there is currently an active open connection for this team with the locked deviceId
  const activeSocketWithLock = Array.from(clients).some(
    (c) =>
      c.roomCode === roomCode &&
      c.role === role &&
      c.authorized &&
      c.ws.readyState === WebSocket.OPEN &&
      c.deviceId === currentLockedDeviceId
  );

  if (
    !currentLockedDeviceId ||
    currentLockedDeviceId === deviceId ||
    !activeSocketWithLock
  ) {
    locks[lockKey] = deviceId;
    return true;
  }

  return false;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`);
    const roomCode = (url.searchParams.get('room') || 'ELITE1').trim().toUpperCase();
    const role = parseRole(url.searchParams.get('role'));
    const deviceId = (
      url.searchParams.get('deviceId') || `dev_${Math.random().toString(36).slice(2, 10)}`
    ).trim();
    const autostart = url.searchParams.get('autostart') === '1';

    const room = getOrCreateRoom(roomCode, autostart);
    if (autostart && room.phase === 'title') {
      const started = applyGameAction(room, { type: 'START_MATCH' });
      rooms.set(roomCode, started);
    }

    const authorized = authorizeTeamDevice(roomCode, role, deviceId);
    const conn: ClientConnection = { ws, roomCode, role, deviceId, authorized };
    clients.add(conn);

    broadcastRoomState(roomCode);

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(String(raw));

        // 1. Atomic Buzzer Press from Team 1 or Team 2 Device
        if (data.type === 'BUZZ_PRESS') {
          if (conn.role !== 'team1' && conn.role !== 'team2') {
            return;
          }
          if (!conn.authorized) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: 'يوجد جهاز آخر متصل ومعتمد لهذا الفريق حاليًا.',
              })
            );
            return;
          }
          const currentRoom = getOrCreateRoom(conn.roomCode);
          // Strict server-side identity: use conn.role, never client-supplied team!
          const updated = applyGameAction(currentRoom, {
            type: 'BUZZ_PRESS',
            payload: {
              team: conn.role,
              questionNonce:
                typeof data.questionNonce === 'number'
                  ? data.questionNonce
                  : undefined,
            },
          });
          if (updated !== currentRoom) {
            rooms.set(conn.roomCode, updated);
            broadcastRoomState(conn.roomCode);
          }
          return;
        }

        // 2. Host / Studio Reset Team Device Lock
        if (
          data.type === 'RESET_TEAM_DEVICE' &&
          (conn.role === 'studio' || conn.role === 'host')
        ) {
          const targetTeam: TeamId | 'both' = data.team || 'both';
          const locks = getDeviceLocks(conn.roomCode);
          if (targetTeam === 'team1' || targetTeam === 'both') {
            locks.team1DeviceId = null;
          }
          if (targetTeam === 'team2' || targetTeam === 'both') {
            locks.team2DeviceId = null;
          }
          for (const c of clients) {
            if (c.roomCode === conn.roomCode && (c.role === 'team1' || c.role === 'team2')) {
              c.authorized = authorizeTeamDevice(c.roomCode, c.role, c.deviceId);
            }
          }
          broadcastRoomState(conn.roomCode);
          return;
        }

        // 3. Host Mobile Controller & Main Studio Game Actions
        if (data.type === 'ACTION' && data.action) {
          if (conn.role !== 'studio' && conn.role !== 'host') {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: 'التحكم بالمباراة متاح من الشاشة الرئيسية أو جهاز المقدم فقط.',
              })
            );
            return;
          }

          const currentRoom = getOrCreateRoom(conn.roomCode);
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
          conn.role = parseRole(data.role);
          conn.authorized = authorizeTeamDevice(conn.roomCode, conn.role, conn.deviceId);
          broadcastRoomState(conn.roomCode);
        } else if (data.type === 'JOIN_ROOM' && data.roomCode) {
          const oldRoom = conn.roomCode;
          conn.roomCode = String(data.roomCode).trim().toUpperCase();
          getOrCreateRoom(conn.roomCode);
          conn.authorized = authorizeTeamDevice(conn.roomCode, conn.role, conn.deviceId);
          broadcastRoomState(oldRoom);
          broadcastRoomState(conn.roomCode);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      clients.delete(conn);
      const locks = getDeviceLocks(conn.roomCode);
      if (conn.role === 'team1' && locks.team1DeviceId === conn.deviceId) {
        // Check if any other socket with same deviceId is still open
        const stillOpen = Array.from(clients).some(
          (c) =>
            c.roomCode === conn.roomCode &&
            c.role === 'team1' &&
            c.deviceId === conn.deviceId &&
            c.ws.readyState === WebSocket.OPEN
        );
        if (!stillOpen) {
          // Promote any waiting team1 socket if present
          const waiting = Array.from(clients).find(
            (c) =>
              c.roomCode === conn.roomCode &&
              c.role === 'team1' &&
              c.ws.readyState === WebSocket.OPEN
          );
          if (waiting) {
            locks.team1DeviceId = waiting.deviceId;
            waiting.authorized = true;
          }
        }
      }
      if (conn.role === 'team2' && locks.team2DeviceId === conn.deviceId) {
        const stillOpen = Array.from(clients).some(
          (c) =>
            c.roomCode === conn.roomCode &&
            c.role === 'team2' &&
            c.deviceId === conn.deviceId &&
            c.ws.readyState === WebSocket.OPEN
        );
        if (!stillOpen) {
          const waiting = Array.from(clients).find(
            (c) =>
              c.roomCode === conn.roomCode &&
              c.role === 'team2' &&
              c.ws.readyState === WebSocket.OPEN
          );
          if (waiting) {
            locks.team2DeviceId = waiting.deviceId;
            waiting.authorized = true;
          }
        }
      }
      broadcastRoomState(conn.roomCode);
    });
  });

  // REST API endpoints for room creation, state fetch, and atomic actions
  app.post('/api/rooms', (req, res) => {
    const requestedCode = req.body?.roomCode
      ? String(req.body.roomCode).trim().toUpperCase()
      : `EC${Math.floor(1000 + Math.random() * 9000)}`;
    const pin = req.body?.hostPin ? String(req.body.hostPin).trim() : '2026';
    const newRoom = createInitialRoomState(requestedCode, pin, false);
    rooms.set(requestedCode, newRoom);
    roomDeviceLocks.set(requestedCode, { team1DeviceId: null, team2DeviceId: null });
    res.json({
      roomCode: requestedCode,
      hostPin: pin,
      state: newRoom,
      presence: getRoomPresence(requestedCode),
    });
  });

  app.get('/api/rooms/:roomCode', (req, res) => {
    const code = req.params.roomCode.trim().toUpperCase();
    const role = parseRole(String(req.query.role || 'studio'));
    const room = getOrCreateRoom(code);
    res.json({
      state: sanitizeStateForRole(room, role),
      presence: getRoomPresence(code),
    });
  });

  app.post('/api/rooms/:roomCode/action', (req, res) => {
    const code = req.params.roomCode.trim().toUpperCase();
    const role = parseRole(String(req.body?.role || 'studio'));
    const room = getOrCreateRoom(code);

    const action = req.body?.action as GameAction | undefined;
    if (!action || !action.type) {
      res.status(400).json({ error: 'إجراء غير صالح.' });
      return;
    }

    // Team devices may only trigger BUZZ_PRESS for their own authenticated team
    if (role === 'team1' || role === 'team2') {
      if (action.type !== 'BUZZ_PRESS') {
        res.status(403).json({ error: 'غير مصرح لجهاز الفريق بهذا الإجراء.' });
        return;
      }
      const enforcedAction: GameAction = {
        type: 'BUZZ_PRESS',
        payload: {
          team: role,
          questionNonce: action.payload?.questionNonce,
        },
      };
      const updated = applyGameAction(room, enforcedAction);
      rooms.set(code, updated);
      broadcastRoomState(code);
      res.json({
        state: sanitizeStateForRole(updated, role),
        presence: getRoomPresence(code),
      });
      return;
    }

    if (role === 'display') {
      res.status(403).json({ error: 'وضع العرض لا يملك صلاحيات الإدارة.' });
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

  app.post('/api/rooms/:roomCode/reset-device', (req, res) => {
    const code = req.params.roomCode.trim().toUpperCase();
    const targetTeam: TeamId | 'both' = req.body?.team || 'both';
    const locks = getDeviceLocks(code);
    if (targetTeam === 'team1' || targetTeam === 'both') {
      locks.team1DeviceId = null;
    }
    if (targetTeam === 'team2' || targetTeam === 'both') {
      locks.team2DeviceId = null;
    }
    for (const c of clients) {
      if (c.roomCode === code && (c.role === 'team1' || c.role === 'team2')) {
        c.authorized = authorizeTeamDevice(c.roomCode, c.role, c.deviceId);
      }
    }
    broadcastRoomState(code);
    res.json({ ok: true, presence: getRoomPresence(code) });
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
