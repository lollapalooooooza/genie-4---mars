import {GoogleGenAI} from '@google/genai';
import {
  buildWorldSetupPayload,
  createSteerCooldown,
  type GenieInputKey,
  STEER_COOLDOWN_MS,
} from './marsWorld';

export interface GenieWorldSessionHandle {
  interactionId: string;
  sendKey: (action: 'key_down' | 'key_up', input: GenieInputKey) => Promise<void>;
  steerWorld: (text: string) => Promise<boolean>;
  stop: () => Promise<void>;
}

export interface StartGenieWorldParams {
  videoEl: HTMLVideoElement;
  interactionId: string;
  authToken: string;
  worldPrompt: string;
  referenceImageBase64?: string | null;
  connectTimeoutMs?: number;
  onStage?: (stage: string) => void;
  onConnected?: () => void;
  onError: (message: string) => void;
  onEnded: () => void;
}

const DEFAULT_CONNECT_TIMEOUT_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function requestGenieSessionCredentials(): Promise<{
  interactionId: string;
  authToken: string;
  maxDurationSeconds: number;
}> {
  const response = await fetch('/api/genie/session', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  });

  const data = (await response.json().catch(() => ({}))) as {
    interactionId?: string;
    authToken?: string;
    maxDurationSeconds?: number;
    error?: string;
  };

  if (!response.ok || !data.interactionId || !data.authToken) {
    throw new Error(data.error ?? `会话请求失败 (${response.status})`);
  }

  return {
    interactionId: data.interactionId,
    authToken: data.authToken,
    maxDurationSeconds: data.maxDurationSeconds ?? 120,
  };
}

export async function startGenieWorld(
  params: StartGenieWorldParams,
): Promise<GenieWorldSessionHandle> {
  const {
    videoEl,
    interactionId,
    authToken,
    worldPrompt,
    referenceImageBase64,
    connectTimeoutMs = DEFAULT_CONNECT_TIMEOUT_MS,
    onStage,
    onConnected,
    onError,
    onEnded,
  } = params;

  const setupPayload = buildWorldSetupPayload(worldPrompt, referenceImageBase64);

  const signalingBaseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/genie-signaling`
      : undefined;

  const clientAi = new GoogleGenAI({
    apiKey: authToken,
    apiVersion: 'v1beta',
    ...(signalingBaseUrl ? {httpOptions: {baseUrl: signalingBaseUrl}} : {}),
  });

  onStage?.('正在建立 WebRTC 实时媒体通道...');
  const session = await withTimeout(
    clientAi.interactions.connect(interactionId, {
      transport: 'webrtc',
    }),
    connectTimeoutMs,
    'WebRTC 实时流握手超时（25 秒）。请检查当前网络是否允许 WebRTC UDP/ICE 连接后重试。',
  );

  session.transport.setVideoElement(videoEl);

  let stopped = false;

  const ended = (async () => {
    try {
      for await (const event of session.receive()) {
        if (event.event_type === 'error') {
          const msg = event.error?.message ?? 'Genie 4 实时世界流出现异常。';
          onError(msg);
        } else if (event.event_type === 'interaction.completed') {
          onEnded();
        }
      }
    } catch (err) {
      if (!stopped) {
        onError(err instanceof Error ? err.message : String(err));
      }
    }
  })();

  onStage?.('正在注入火星着陆区首帧与物理参数...');
  await withTimeout(
    session.send(setupPayload),
    15_000,
    '发送世界初始参数超时，请重试。',
  );

  // Ensure playback begins promptly if browser paused the stream element
  void videoEl.play().catch(() => {});

  onConnected?.();

  const cooldown = createSteerCooldown(STEER_COOLDOWN_MS);

  const sendKey = async (action: 'key_down' | 'key_up', input: GenieInputKey) => {
    if (stopped) return;
    await session.send({
      event_type: 'user_action',
      action,
      input,
    });
  };

  const steerWorld = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed || stopped) return false;
    if (!cooldown.tryAcquire()) return false;

    for (let i = 0; i < 10; i++) {
      if (stopped) break;
      await session.send(trimmed);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return true;
  };

  const stop = async () => {
    if (stopped) return;
    stopped = true;
    try {
      await session.complete();
      await ended;
    } catch {
      session.detach();
    }
  };

  return {
    interactionId,
    sendKey,
    steerWorld,
    stop,
  };
}
