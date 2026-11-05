import { useCallback, useEffect, useRef, useState } from 'react';
import { HexBoard } from './components/HexBoard';
import { HostMobileView } from './components/HostMobileView';
import { RoomSyncModal } from './components/RoomSyncModal';
import { SideControlPanel } from './components/SideControlPanel';
import { StudioMenuDrawer } from './components/StudioMenuDrawer';
import { TitleAndSetupModal } from './components/TitleAndSetupModal';
import { VictoryModal } from './components/VictoryModal';
import { applyGameAction, createInitialRoomState } from './game/gameEngine';
import { CellOwner, GameAction, RoomGameState, TeamId } from './types/game';
import { soundFX } from './utils/soundEffects';

function getInitialUrlParams() {
  if (typeof window === 'undefined') {
    return {
      roomCode: 'ELITE1',
      role: 'studio' as 'studio' | 'display' | 'host',
      pin: '2026',
      autostart: false,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const roomCode = (params.get('room') || 'ELITE1').trim().toUpperCase();
  const modeParam = params.get('mode');
  const role: 'studio' | 'display' | 'host' =
    modeParam === 'display' || modeParam === 'host' ? modeParam : 'studio';
  const pin = params.get('pin') || '2026';
  const autostart = params.get('autostart') === '1';

  return { roomCode, role, pin, autostart };
}

export default function App() {
  const initialParams = getInitialUrlParams();

  const [role, setRole] = useState<'studio' | 'display' | 'host'>(
    initialParams.role
  );
  const [roomCode, setRoomCode] = useState<string>(initialParams.roomCode);
  const [hostPin] = useState<string>(initialParams.pin);

  const [gameState, setGameState] = useState<RoomGameState>(() =>
    createInitialRoomState(
      initialParams.roomCode,
      initialParams.pin,
      initialParams.autostart
    )
  );

  const [presence, setPresence] = useState({
    displays: 0,
    hosts: 0,
    studios: 1,
    total: 1,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => soundFX.isMuted());
  const [correctionMode, setCorrectionMode] = useState<boolean>(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState<boolean>(false);
  const [syncModalOpen, setSyncModalOpen] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const prevPhaseRef = useRef(gameState.phase);
  const prevTimerRef = useRef(gameState.timerRemaining);

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

  // Trigger audio cues on phase or timer changes
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
      )}&role=${encodeURIComponent(role)}${
        initialParams.autostart ? '&autostart=1' : ''
      }`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'ROOM_STATE' && msg.state) {
              setGameState(msg.state);
              if (msg.presence) {
                setPresence(msg.presence);
              }
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connectWs, 2000);
          }
        };
      } catch {
        // Fallback if WebSocket creation fails
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
  }, [roomCode, role, initialParams.autostart]);

  // Local fallback timer interval in case server WS is disconnected
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return; // Server drives timer ticks when connected
      }
      setGameState((prev) => {
        if (prev.phase === 'playing' && prev.timerRunning && prev.timerRemaining > 0) {
          return applyGameAction(prev, { type: 'TIMER_TICK' });
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Dispatches a GameAction optimistically and sends it to the server via WebSocket (or REST fallback)
   */
  const dispatchAction = useCallback(
    (action: GameAction) => {
      if (role === 'display') return;

      // Play immediate feedback sound based on action type
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
          soundFX.playClaimCell();
          break;
        case 'UNDO_MOVE':
        case 'DESELECT_CELL':
          soundFX.playUndo();
          break;
      }

      // Apply optimistically
      setGameState((prev) => applyGameAction(prev, action));

      // Send over WebSocket if open, otherwise POST to REST endpoint
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ACTION',
            action,
            pin: hostPin,
          })
        );
      } else {
        fetch(`/api/rooms/${encodeURIComponent(roomCode)}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            role,
            pin: hostPin,
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
    [role, roomCode, hostPin]
  );

  // Global keyboard shortcuts (Enter/Space on Title, M to mute, Esc to close modals)
  useEffect(() => {
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

  const handleSwitchRole = (newRole: 'studio' | 'display' | 'host') => {
    setRole(newRole);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SWITCH_ROLE', role: newRole }));
    }
  };

  const handleJoinRoom = (newRoomCode: string) => {
    setRoomCode(newRoomCode);
    setSyncModalOpen(false);
  };

  // If user is in dedicated Mobile Host Controller Mode (?mode=host)
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

  return (
    <main
      dir="ltr"
      className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col md:flex-row bg-[#1e1035]"
      style={{
        fontFamily: `'${gameState.settings.fontFamily}', 'Cairo', 'Tajawal', sans-serif`,
      }}
    >
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

      {/* Left 68% Arena: 25-Hexagon Board (Matches Reference Screenshot Layout) */}
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
      </section>

      {/* Right 32% Panel: Question Box, Answer Reveal, and Team Claim Bars */}
      <section className="w-full md:w-[32%] lg:w-[30%] h-[44%] md:h-full relative z-10">
        <SideControlPanel
          state={gameState}
          isDisplayOnly={isDisplayOnly}
          isMuted={isMuted}
          correctionMode={correctionMode}
          connectedDevicesCount={presence.total}
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
          onToggleDisplayMode={() =>
            handleSwitchRole(isDisplayOnly ? 'studio' : 'display')
          }
          onTimerToggle={() =>
            dispatchAction({
              type: gameState.timerRunning ? 'TIMER_PAUSE' : 'TIMER_START',
            })
          }
          onTimerReset={() => dispatchAction({ type: 'TIMER_RESET' })}
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

      {/* Room QR & Multi-Device Sync Modal */}
      {syncModalOpen && (
        <RoomSyncModal
          state={gameState}
          currentRole={role}
          presence={presence}
          onClose={() => setSyncModalOpen(false)}
          onSwitchRole={handleSwitchRole}
          onJoinRoom={handleJoinRoom}
        />
      )}
    </main>
  );
}
