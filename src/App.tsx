import { useCallback, useEffect, useRef, useState } from 'react';
import { HexBoard } from './components/HexBoard';
import { HostMobileView } from './components/HostMobileView';
import { RoomSyncModal } from './components/RoomSyncModal';
import { SideControlPanel } from './components/SideControlPanel';
import { StudioMenuDrawer } from './components/StudioMenuDrawer';
import { TeamBuzzerScreen } from './components/TeamBuzzerScreen';
import { TitleAndSetupModal } from './components/TitleAndSetupModal';
import { VictoryModal } from './components/VictoryModal';
import { applyGameAction, createInitialRoomState } from './game/gameEngine';
import {
  CellOwner,
  ClientRole,
  GameAction,
  RoomGameState,
  RoomPresence,
  TeamId,
} from './types/game';
import { soundFX } from './utils/soundEffects';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_dev';
  try {
    let id = window.sessionStorage.getItem('elite_clash_device_id');
    if (!id) {
      id = `dev_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      window.sessionStorage.setItem('elite_clash_device_id', id);
    }
    return id;
  } catch {
    return `dev_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getInitialUrlParams(): {
  roomCode: string;
  role: ClientRole;
  autostart: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      roomCode: 'ELITE1',
      role: 'studio',
      autostart: false,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const roomCode = (params.get('room') || 'ELITE1').trim().toUpperCase();
  const modeParam = params.get('mode') || params.get('role');
  let role: ClientRole = 'studio';
  if (
    modeParam === 'team1' ||
    modeParam === 'team2' ||
    modeParam === 'display' ||
    modeParam === 'host'
  ) {
    role = modeParam;
  }
  const autostart = params.get('autostart') === '1';

  return { roomCode, role, autostart };
}

export default function App() {
  const initialParams = getInitialUrlParams();
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());

  const [role, setRole] = useState<ClientRole>(initialParams.role);
  const [roomCode, setRoomCode] = useState<string>(initialParams.roomCode);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [authorized, setAuthorized] = useState<boolean>(true);

  const [gameState, setGameState] = useState<RoomGameState>(() =>
    createInitialRoomState(
      initialParams.roomCode,
      '2026',
      initialParams.autostart
    )
  );

  const [presence, setPresence] = useState<RoomPresence>({
    displays: 0,
    studios: 1,
    hosts: 0,
    team1Connected: false,
    team2Connected: false,
    team1DeviceId: null,
    team2DeviceId: null,
    total: 1,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => soundFX.isMuted());
  const [correctionMode, setCorrectionMode] = useState<boolean>(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState<boolean>(false);
  const [syncModalOpen, setSyncModalOpen] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const prevPhaseRef = useRef(gameState.phase);
  const prevTimerRef = useRef(gameState.timerRemaining);
  const prevBuzzerWinnerRef = useRef<TeamId | null>(null);

  // Sync body dataset state for testing & accessibility compliance
  useEffect(() => {
    let bodyState = 'playing';
    if (gameState.phase === 'title') bodyState = 'title';
    else if (gameState.phase === 'paused') bodyState = 'paused';
    else if (
      gameState.phase === 'round_victory' ||
      gameState.phase === 'match_victory'
    ) {
      bodyState = 'gameover';
    } else {
      bodyState = 'playing';
    }
    document.body.dataset.state = bodyState;
  }, [gameState.phase]);

  // Play victory fanfare when round/match is won
  useEffect(() => {
    if (
      (gameState.phase === 'round_victory' ||
        gameState.phase === 'match_victory') &&
      prevPhaseRef.current !== 'round_victory' &&
      prevPhaseRef.current !== 'match_victory'
    ) {
      soundFX.playVictoryFanfare();
    }
    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase]);

  // Play sound cue when a team wins the buzzer race automatically
  useEffect(() => {
    if (
      gameState.buzzer.winner &&
      gameState.buzzer.winner !== prevBuzzerWinnerRef.current
    ) {
      soundFX.playBuzzerWin(gameState.buzzer.winner);
    }
    prevBuzzerWinnerRef.current = gameState.buzzer.winner;
  }, [gameState.buzzer.winner]);

  // Play timer ticks
  useEffect(() => {
    if (
      gameState.timerRunning &&
      gameState.timerRemaining !== prevTimerRef.current
    ) {
      if (gameState.timerRemaining > 0 && gameState.timerRemaining <= 5) {
        soundFX.playTimerTick();
      } else if (gameState.timerRemaining === 0 && prevTimerRef.current > 0) {
        soundFX.playTimeUp();
      }
    }
    prevTimerRef.current = gameState.timerRemaining;
  }, [gameState.timerRemaining, gameState.timerRunning]);

  // Establish real-time WebSocket connection to server
  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWs = () => {
      if (!isMounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?room=${encodeURIComponent(
        roomCode
      )}&role=${encodeURIComponent(role)}&deviceId=${encodeURIComponent(
        deviceId
      )}${initialParams.autostart ? '&autostart=1' : ''}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'ROOM_STATE' && msg.state) {
              setGameState(msg.state);
              if (msg.presence) {
                setPresence(msg.presence);
              }
              if (typeof msg.authorized === 'boolean') {
                setAuthorized(msg.authorized);
              }
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            setWsConnected(false);
            reconnectTimer = setTimeout(connectWs, 1500);
          }
        };
      } catch {
        if (isMounted) setWsConnected(false);
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomCode, role, deviceId, initialParams.autostart]);

  // Local fallback timer interval in case server WS is disconnected
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }
      setGameState((prev) => {
        if (prev.phase !== 'playing') return prev;
        const isMain = prev.timerRunning && prev.timerRemaining > 0;
        const isAns =
          prev.buzzer.status === 'locked_by_winner' &&
          prev.buzzer.answerTimerRunning &&
          prev.buzzer.answerTimerRemaining > 0;
        if (isMain || isAns) {
          return applyGameAction(prev, { type: 'TIMER_TICK' });
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Dispatches a GameAction from the Main Screen (Studio) or Host Mobile Controller
   */
  const dispatchAction = useCallback(
    (action: GameAction) => {
      if (role !== 'studio' && role !== 'host') return;

      switch (action.type) {
        case 'SELECT_CELL':
        case 'NEW_QUESTION':
          soundFX.playSelectLetter();
          break;
        case 'REVEAL_ANSWER':
          soundFX.playRevealAnswer();
          break;
        case 'CLAIM_CELL':
        case 'CORRECT_CELL_OWNER':
        case 'BUZZ_CORRECT_ANSWER':
          soundFX.playClaimCell();
          break;
        case 'BUZZ_OPEN':
        case 'BUZZ_RESET_RACE':
          soundFX.playBuzzerOpen();
          break;
        case 'BUZZ_WRONG_ANSWER':
          soundFX.playWrongAnswer();
          break;
        case 'UNDO_MOVE':
        case 'DESELECT_CELL':
          soundFX.playUndo();
          break;
      }

      // Apply optimistically
      setGameState((prev) => applyGameAction(prev, action));

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ACTION',
            action,
          })
        );
      } else {
        fetch(`/api/rooms/${encodeURIComponent(roomCode)}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            role,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.state) setGameState(data.state);
            if (data?.presence) setPresence(data.presence);
          })
          .catch(() => {});
      }
    },
    [role, roomCode]
  );

  /**
   * Sends a BUZZ_PRESS from Team 1 or Team 2 Device to the server.
   * Server arrival order strictly determines the winner.
   */
  const handleTeamBuzzPress = useCallback(
    (questionNonce: number) => {
      if (role !== 'team1' && role !== 'team2') return;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'BUZZ_PRESS',
            questionNonce,
          })
        );
      } else {
        fetch(`/api/rooms/${encodeURIComponent(roomCode)}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            action: {
              type: 'BUZZ_PRESS',
              payload: { team: role, questionNonce },
            },
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.state) setGameState(data.state);
            if (data?.presence) setPresence(data.presence);
          })
          .catch(() => {});
      }
    },
    [role, roomCode]
  );

  const handleResetTeamDevice = useCallback(
    (team: TeamId | 'both') => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'RESET_TEAM_DEVICE',
            team,
          })
        );
      } else {
        fetch(`/api/rooms/${encodeURIComponent(roomCode)}/reset-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team }),
        }).catch(() => {});
      }
    },
    [roomCode]
  );

  const handleCreateNewRoom = useCallback(() => {
    fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.roomCode) {
          setRoomCode(data.roomCode);
          if (data.state) setGameState(data.state);
          if (data.presence) setPresence(data.presence);
        }
      })
      .catch(() => {});
  }, []);

  // Global keyboard shortcuts on Main Screen
  useEffect(() => {
    if (role !== 'studio') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');
      if (isInput) return;

      if (gameState.phase === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        dispatchAction({ type: 'START_MATCH' });
        return;
      }

      if (e.key === 'm' || e.key === 'M' || e.key === 'ة') {
        const nextMuted = soundFX.toggleMute();
        setIsMuted(nextMuted);
      } else if (e.key === 'Escape') {
        if (menuDrawerOpen) setMenuDrawerOpen(false);
        else if (syncModalOpen) setSyncModalOpen(false);
        else if (correctionMode) setCorrectionMode(false);
        else if (gameState.selectedCellId !== null) {
          dispatchAction({ type: 'DESELECT_CELL' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    role,
    gameState.phase,
    gameState.selectedCellId,
    menuDrawerOpen,
    syncModalOpen,
    correctionMode,
    dispatchAction,
  ]);

  const handleToggleMute = () => {
    const nextMuted = soundFX.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleSwitchRole = (newRole: ClientRole) => {
    setRole(newRole);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SWITCH_ROLE', role: newRole }));
    }
  };

  const handleJoinRoom = (newRoomCode: string) => {
    setRoomCode(newRoomCode);
    setSyncModalOpen(false);
  };

  // Device 2 (Green Team) or Device 3 (Orange Team) Fullscreen Buzzer View
  if (role === 'team1' || role === 'team2') {
    return (
      <TeamBuzzerScreen
        teamId={role}
        state={gameState}
        wsConnected={wsConnected}
        authorized={authorized}
        onBuzzPress={handleTeamBuzzPress}
      />
    );
  }

  // Host Mobile Controller View (with Secret Answer Preview + Full Buzzer & Board Controls)
  if (role === 'host') {
    return (
      <HostMobileView
        state={gameState}
        presence={presence}
        onDispatch={dispatchAction}
        onSwitchToStudio={() => handleSwitchRole('studio')}
      />
    );
  }

  const isDisplayOnly = role === 'display';
  const buzzerWinner = gameState.buzzer.winner;
  const buzzerWinnerTeam =
    buzzerWinner === 'team1'
      ? gameState.team1
      : buzzerWinner === 'team2'
      ? gameState.team2
      : null;

  return (
    <main
      dir="ltr"
      data-buzzer-winner={buzzerWinner || 'none'}
      className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col md:flex-row bg-[#1e1035]"
      style={{
        fontFamily: `'${gameState.settings.fontFamily}', 'Cairo', 'Tajawal', sans-serif`,
      }}
    >
      {/* Illuminated Screen Border Overlay when a Team Wins the Buzzer Race */}
      {gameState.buzzer.status === 'locked_by_winner' && buzzerWinnerTeam && (
        <div
          aria-hidden="true"
          data-testid="main-screen-buzzer-border"
          style={{
            borderColor: buzzerWinnerTeam.color,
            boxShadow: `inset 0 0 45px ${buzzerWinnerTeam.color}, 0 0 35px ${buzzerWinnerTeam.color}`,
          }}
          className="pointer-events-none fixed inset-0 z-30 border-[10px] transition-all duration-200"
        />
      )}

      {/* Title & Match Setup Screen */}
      {gameState.phase === 'title' && !isDisplayOnly && (
        <TitleAndSetupModal
          state={gameState}
          onStartMatch={(cfg) => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            dispatchAction({ type: 'START_MATCH', payload: cfg });
          }}
          onOpenSyncModal={() => setSyncModalOpen(true)}
          onSwitchToDisplayMode={() => handleSwitchRole('display')}
        />
      )}

      {/* Left 68% Arena: 25-Hexagon Board */}
      <section
        className="w-full md:w-[68%] lg:w-[70%] h-[56%] md:h-full relative overflow-hidden"
        aria-label="ساحة اللوحة السداسية"
      >
        <HexBoard
          cells={gameState.cells}
          selectedCellId={gameState.selectedCellId}
          winningPath={gameState.winningPath}
          team1={gameState.team1}
          team2={gameState.team2}
          theme={gameState.settings.theme}
          fontFamily={gameState.settings.fontFamily}
          showLettersOnOwnedCells={gameState.settings.showLettersOnOwnedCells}
          isDisplayOnly={isDisplayOnly}
          correctionMode={correctionMode}
          onSelectCell={(cellId: number) =>
            dispatchAction({ type: 'SELECT_CELL', payload: { cellId } })
          }
          onCorrectCellOwner={(cellId: number, newOwner: CellOwner) =>
            dispatchAction({
              type: 'CORRECT_CELL_OWNER',
              payload: { cellId, owner: newOwner },
            })
          }
        />

        {/* Floating Buzzer Race Winner Toast on Top of Board Arena */}
        {gameState.buzzer.status === 'locked_by_winner' && buzzerWinnerTeam && (
          <div
            dir="rtl"
            data-testid="board-buzzer-announcement"
            style={{
              backgroundColor: buzzerWinnerTeam.color,
            }}
            className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2.5 rounded-2xl text-slate-950 font-black text-lg sm:text-xl shadow-2xl border-4 border-white flex items-center gap-3"
          >
            <span>🔔 {buzzerWinnerTeam.name} ضغط أولًا!</span>
            <span className="px-3 py-0.5 rounded-xl bg-slate-950 text-amber-300 font-mono text-base tabular-nums">
              {gameState.buzzer.answerTimerRemaining}ث
            </span>
          </div>
        )}
      </section>

      {/* Right 32% Panel: Question Box, Buzzer Controls, Answer Reveal, and Team Claim Bars */}
      <section className="w-full md:w-[32%] lg:w-[30%] h-[44%] md:h-full relative z-10">
        <SideControlPanel
          state={gameState}
          presence={presence}
          isDisplayOnly={isDisplayOnly}
          isMuted={isMuted}
          correctionMode={correctionMode}
          onToggleQuestionVisibility={() =>
            dispatchAction({
              type: gameState.questionRevealed ? 'HIDE_QUESTION' : 'SHOW_QUESTION',
            })
          }
          onRevealOrHideAnswer={() =>
            dispatchAction({
              type: gameState.answerRevealed ? 'HIDE_ANSWER' : 'REVEAL_ANSWER',
            })
          }
          onNewQuestion={() => dispatchAction({ type: 'NEW_QUESTION' })}
          onDeselectCell={() => dispatchAction({ type: 'DESELECT_CELL' })}
          onClaimCell={(team: TeamId) =>
            dispatchAction({ type: 'CLAIM_CELL', payload: { team } })
          }
          onUndoMove={() => dispatchAction({ type: 'UNDO_MOVE' })}
          onToggleCorrectionMode={() => setCorrectionMode((prev) => !prev)}
          onToggleMute={handleToggleMute}
          onOpenMenuDrawer={() => setMenuDrawerOpen(true)}
          onOpenSyncModal={() => setSyncModalOpen(true)}
          onTimerToggle={() =>
            dispatchAction({
              type: gameState.timerRunning ? 'TIMER_PAUSE' : 'TIMER_START',
            })
          }
          onTimerReset={() => dispatchAction({ type: 'TIMER_RESET' })}
          onBuzzerOpen={() => dispatchAction({ type: 'BUZZ_OPEN' })}
          onBuzzerLock={() => dispatchAction({ type: 'BUZZ_LOCK' })}
          onBuzzerCorrectAnswer={() =>
            dispatchAction({ type: 'BUZZ_CORRECT_ANSWER' })
          }
          onBuzzerWrongAnswer={() => dispatchAction({ type: 'BUZZ_WRONG_ANSWER' })}
          onBuzzerResetRace={() => dispatchAction({ type: 'BUZZ_RESET_RACE' })}
          onToggleDisplayMode={() =>
            handleSwitchRole(role === 'display' ? 'studio' : 'display')
          }
        />
      </section>

      {/* Victory Celebration Modal */}
      {(gameState.phase === 'round_victory' ||
        gameState.phase === 'match_victory') && (
        <VictoryModal
          state={gameState}
          isDisplayOnly={isDisplayOnly}
          onNextRound={() => dispatchAction({ type: 'NEXT_ROUND' })}
          onReplayRound={() => dispatchAction({ type: 'REPLAY_ROUND' })}
          onResetMatch={() => dispatchAction({ type: 'RESET_MATCH' })}
          onUndoWinningMove={() => dispatchAction({ type: 'UNDO_MOVE' })}
        />
      )}

      {/* Studio Menu, History & Cell Correction Drawer */}
      {menuDrawerOpen && !isDisplayOnly && (
        <StudioMenuDrawer
          state={gameState}
          onClose={() => setMenuDrawerOpen(false)}
          onUndoMove={() => dispatchAction({ type: 'UNDO_MOVE' })}
          onShuffleBoard={() => dispatchAction({ type: 'SHUFFLE_BOARD' })}
          onReplayRound={() => dispatchAction({ type: 'REPLAY_ROUND' })}
          onNextRound={() => dispatchAction({ type: 'NEXT_ROUND' })}
          onReturnToTitle={() =>
            dispatchAction({ type: 'SET_PHASE', payload: { phase: 'title' } })
          }
          onCorrectCellOwner={(cellId, owner) =>
            dispatchAction({
              type: 'CORRECT_CELL_OWNER',
              payload: { cellId, owner },
            })
          }
          onUpdateSettings={(partial) =>
            dispatchAction({ type: 'UPDATE_SETTINGS', payload: partial })
          }
          onUpdateTeamNames={(team1Name, team2Name) =>
            dispatchAction({
              type: 'UPDATE_TEAMS',
              payload: {
                team1: { name: team1Name },
                team2: { name: team2Name },
              },
            })
          }
        />
      )}

      {/* Buzzer Room & QR Pairing Modal */}
      {syncModalOpen && (
        <RoomSyncModal
          state={gameState}
          currentRole={role}
          presence={presence}
          onClose={() => setSyncModalOpen(false)}
          onSwitchRole={handleSwitchRole}
          onJoinRoom={handleJoinRoom}
          onCreateNewRoom={handleCreateNewRoom}
          onResetTeamDevice={handleResetTeamDevice}
          onUpdateSettings={(partial) =>
            dispatchAction({ type: 'UPDATE_SETTINGS', payload: partial })
          }
        />
      )}
    </main>
  );
}
