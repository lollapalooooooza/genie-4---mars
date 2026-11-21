import {useCallback, useEffect, useRef, useState} from 'react';
import {ControlsGuide} from './components/ControlsGuide';
import {SectorSidebar} from './components/SectorSidebar';
import {TopBar} from './components/TopBar';
import {WorldViewport} from './components/WorldViewport';
import {
  type GenieWorldSessionHandle,
  requestGenieSessionCredentials,
  startGenieWorld,
} from './lib/genieClient';
import {compressImageToWebRtcJpeg} from './lib/imageSeed';
import {
  type GenieInputKey,
  mapKeyboardToGenieInput,
  mapKeyboardToSteerPreset,
  MARS_SECTORS,
  type MarsSector,
  MAX_SESSION_SECONDS,
  STEER_COOLDOWN_MS,
  validateWorldPrompt,
} from './lib/marsWorld';

type SessionStatus = 'idle' | 'connecting' | 'active' | 'ended';

export default function App() {
  const [selectedSector, setSelectedSector] = useState<MarsSector>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('sector');
      const match = MARS_SECTORS.find((s) => s.id === param);
      if (match) return match;
    }
    return MARS_SECTORS[0];
  });

  const [worldPrompt, setWorldPrompt] = useState<string>(selectedSector.worldPrompt);
  const [useImageSeed, setUseImageSeed] = useState<boolean>(true);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [connectingStage, setConnectingStage] = useState<string>('正在向服务端申请临时 WebRTC 令牌...');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(MAX_SESSION_SECONDS);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<GenieInputKey>>(() => new Set());
  const [steerCooldownActive, setSteerCooldownActive] = useState<boolean>(false);
  const [lastSteerLabel, setLastSteerLabel] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<GenieWorldSessionHandle | null>(null);
  const pressedKeysRef = useRef<Set<GenieInputKey>>(new Set());
  const cooldownTimerRef = useRef<number | null>(null);
  const cancelConnectingRef = useRef<boolean>(false);
  const statusRef = useRef<SessionStatus>(status);
  statusRef.current = status;

  const clearPressedKeys = useCallback(() => {
    const session = sessionRef.current;
    const currentlyPressed = Array.from(pressedKeysRef.current);
    pressedKeysRef.current.clear();
    setActiveKeys(new Set());
    if (session && currentlyPressed.length > 0) {
      for (const key of currentlyPressed) {
        void session.sendKey('key_up', key).catch(() => {});
      }
    }
  }, []);

  const handleStop = useCallback(async () => {
    const wasConnecting = statusRef.current === 'connecting';
    cancelConnectingRef.current = true;
    clearPressedKeys();
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      await session.stop();
    }
    setStatus(wasConnecting ? 'idle' : 'ended');
    setStatusNotice(
      wasConnecting
        ? '已取消 Genie 4 连接请求。'
        : '探索会话已结束，远端世界生成已停止。',
    );
  }, [clearPressedKeys]);

  const handleStart = useCallback(async () => {
    if (statusRef.current === 'connecting' || statusRef.current === 'active') {
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl) {
      setErrorMessage('视频渲染容器尚未就绪，请刷新后重试。');
      return;
    }

    let validatedPrompt: string;
    try {
      validatedPrompt = validateWorldPrompt(worldPrompt);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      return;
    }

    cancelConnectingRef.current = false;
    setErrorMessage(null);
    setStatusNotice(null);
    setLastSteerLabel(null);
    setSteerCooldownActive(false);
    setRemainingSeconds(MAX_SESSION_SECONDS);
    setConnectingStage('正在向服务端申请临时 WebRTC 令牌...');
    setStatus('connecting');

    try {
      const [credentials, referenceImageBase64] = await Promise.all([
        requestGenieSessionCredentials(),
        useImageSeed ? compressImageToWebRtcJpeg(selectedSector.imagePath) : Promise.resolve(null),
      ]);

      if (cancelConnectingRef.current) {
        return;
      }

      const handle = await startGenieWorld({
        videoEl,
        interactionId: credentials.interactionId,
        authToken: credentials.authToken,
        worldPrompt: validatedPrompt,
        referenceImageBase64,
        onStage: (stage) => setConnectingStage(stage),
        onConnected: () => {
          setStatus('active');
          setRemainingSeconds(credentials.maxDurationSeconds || MAX_SESSION_SECONDS);
        },
        onError: (msg) => {
          setErrorMessage(msg);
          clearPressedKeys();
          sessionRef.current = null;
          setStatus('ended');
        },
        onEnded: () => {
          clearPressedKeys();
          sessionRef.current = null;
          setStatus('ended');
          setStatusNotice('本次 120 秒火星探索会话已自然完成，可随时重新启动新的世界。');
        },
      });

      if (cancelConnectingRef.current) {
        await handle.stop();
        return;
      }

      sessionRef.current = handle;
      setStatus('active');
    } catch (err) {
      sessionRef.current = null;
      if (!cancelConnectingRef.current) {
        setStatus('idle');
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    }
  }, [clearPressedKeys, selectedSector.imagePath, useImageSeed, worldPrompt]);

  const handlePrimaryAction = useCallback(() => {
    if (status === 'active' || status === 'connecting') {
      void handleStop();
    } else if (status === 'idle' || status === 'ended') {
      void handleStart();
    }
  }, [handleStart, handleStop, status]);

  const handleSelectSector = useCallback((sector: MarsSector) => {
    setSelectedSector(sector);
    setWorldPrompt(sector.worldPrompt);
    setErrorMessage(null);
    setStatusNotice(null);
  }, []);

  const handleKeyHoldStart = useCallback((input: GenieInputKey) => {
    const session = sessionRef.current;
    if (!session || statusRef.current !== 'active') return;
    if (pressedKeysRef.current.has(input)) return;

    pressedKeysRef.current.add(input);
    setActiveKeys(new Set(pressedKeysRef.current));
    void session.sendKey('key_down', input).catch((err) => {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    });
  }, []);

  const handleKeyHoldEnd = useCallback((input: GenieInputKey) => {
    if (!pressedKeysRef.current.has(input)) return;
    pressedKeysRef.current.delete(input);
    setActiveKeys(new Set(pressedKeysRef.current));

    const session = sessionRef.current;
    if (!session) return;
    void session.sendKey('key_up', input).catch(() => {});
  }, []);

  const handleSteer = useCallback(async (text: string, label?: string) => {
    const session = sessionRef.current;
    if (!session || statusRef.current !== 'active') return;

    try {
      const accepted = await session.steerWorld(text);
      if (!accepted) return;

      setLastSteerLabel(label ?? text);
      setSteerCooldownActive(true);
      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current);
      }
      cooldownTimerRef.current = window.setTimeout(() => {
        setSteerCooldownActive(false);
        cooldownTimerRef.current = null;
      }, STEER_COOLDOWN_MS);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // 120s countdown while active
  useEffect(() => {
    if (status !== 'active') return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  // Global keyboard steering & movement controls
  useEffect(() => {
    if (status !== 'active') return;

    const isTextEntryFocused = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isTextEntryFocused(e.target)) return;

      const movementKey = mapKeyboardToGenieInput(e.code);
      if (movementKey) {
        e.preventDefault();
        handleKeyHoldStart(movementKey);
        return;
      }

      const steerPreset = mapKeyboardToSteerPreset(e.code);
      if (steerPreset) {
        e.preventDefault();
        void handleSteer(steerPreset.prompt, steerPreset.label);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const movementKey = mapKeyboardToGenieInput(e.code);
      if (movementKey) {
        handleKeyHoldEnd(movementKey);
      }
    };

    const onBlur = () => {
      clearPressedKeys();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [clearPressedKeys, handleKeyHoldEnd, handleKeyHoldStart, handleSteer, status]);

  // Ensure server-side Genie 4 session is explicitly completed on page unload or unmount
  useEffect(() => {
    const onBeforeUnload = () => {
      const session = sessionRef.current;
      if (session) {
        sessionRef.current = null;
        void session.stop();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current);
      }
      const session = sessionRef.current;
      if (session) {
        sessionRef.current = null;
        void session.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100">
      <TopBar status={status} onPrimaryAction={handlePrimaryAction} />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col-reverse lg:flex-row items-start gap-6">
          <SectorSidebar
            sectors={MARS_SECTORS}
            selectedSectorId={selectedSector.id}
            worldPrompt={worldPrompt}
            useImageSeed={useImageSeed}
            disabled={status === 'connecting' || status === 'active'}
            onSelectSector={handleSelectSector}
            onChangePrompt={setWorldPrompt}
            onResetPrompt={() => setWorldPrompt(selectedSector.worldPrompt)}
            onToggleImageSeed={setUseImageSeed}
          />

          <WorldViewport
            videoRef={videoRef}
            sector={selectedSector}
            status={status}
            connectingStage={connectingStage}
            remainingSeconds={remainingSeconds}
            isMuted={isMuted}
            errorMessage={errorMessage}
            statusNotice={statusNotice}
            activeKeys={activeKeys}
            steerCooldownActive={steerCooldownActive}
            lastSteerLabel={lastSteerLabel}
            onStart={() => void handleStart()}
            onStop={() => void handleStop()}
            onToggleMute={() => setIsMuted((prev) => !prev)}
            onKeyHoldStart={handleKeyHoldStart}
            onKeyHoldEnd={handleKeyHoldEnd}
            onSteer={handleSteer}
          />
        </div>

        <ControlsGuide />
      </main>
    </div>
  );
}
