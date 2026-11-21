import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Maximize2,
  Play,
  Send,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {type FormEvent, type RefObject, useState} from 'react';
import {
  formatSessionTimer,
  type GenieInputKey,
  type MarsSector,
  STEER_PRESETS,
  type SteerPreset,
} from '../lib/marsWorld';

interface WorldViewportProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  sector: MarsSector;
  status: 'idle' | 'connecting' | 'active' | 'ended';
  connectingStage: string;
  remainingSeconds: number;
  isMuted: boolean;
  errorMessage: string | null;
  statusNotice: string | null;
  activeKeys: ReadonlySet<GenieInputKey>;
  steerCooldownActive: boolean;
  lastSteerLabel: string | null;
  onStart: () => void;
  onStop: () => void;
  onToggleMute: () => void;
  onKeyHoldStart: (input: GenieInputKey) => void;
  onKeyHoldEnd: (input: GenieInputKey) => void;
  onSteer: (text: string, label?: string) => Promise<void>;
}

export function WorldViewport({
  videoRef,
  sector,
  status,
  connectingStage,
  remainingSeconds,
  isMuted,
  errorMessage,
  statusNotice,
  activeKeys,
  steerCooldownActive,
  lastSteerLabel,
  onStart,
  onStop,
  onToggleMute,
  onKeyHoldStart,
  onKeyHoldEnd,
  onSteer,
}: WorldViewportProps) {
  const [customSteer, setCustomSteer] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);

  const handleSteerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = customSteer.trim();
    if (!trimmed || status !== 'active' || steerCooldownActive) return;
    await onSteer(trimmed, trimmed);
    setCustomSteer('');
  };

  const handleFullscreen = () => {
    const el = videoRef.current;
    if (el && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  const renderHoldButton = (
    input: GenieInputKey,
    label: string,
    display: React.ReactNode,
  ) => {
    const pressed = activeKeys.has(input);
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        disabled={status !== 'active'}
        onPointerDown={(e) => {
          e.preventDefault();
          onKeyHoldStart(input);
        }}
        onPointerUp={() => onKeyHoldEnd(input)}
        onPointerLeave={() => onKeyHoldEnd(input)}
        onPointerCancel={() => onKeyHoldEnd(input)}
        className={`flex h-11 w-11 items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-colors select-none touch-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          pressed
            ? 'border-amber-400 bg-amber-500 text-slate-950'
            : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
        }`}
      >
        {display}
      </button>
    );
  };

  return (
    <section
      id="viewport-stage"
      aria-label="火星世界实时视界"
      className="flex-1 min-w-0 w-full flex flex-col gap-5"
    >
      <div
        data-testid="mars-viewport"
        data-status={status}
        className="overflow-hidden rounded-xl border border-slate-800 bg-[#0B0F17]"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-[#05070B]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              status === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {status !== 'active' && (
            <>
              {!previewFailed ? (
                <img
                  key={sector.imagePath}
                  src={sector.imagePath}
                  alt={`${sector.name} 着陆区预览`}
                  referrerPolicy="no-referrer"
                  onError={() => setPreviewFailed(true)}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/50 via-[#0C1018] to-[#07090E]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/50 to-black/20" />
            </>
          )}

          {status === 'active' && (
            <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto inline-flex items-center gap-3 rounded-lg border border-slate-700/70 bg-[#07090E]/80 px-3 py-1.5 backdrop-blur-sm">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  实时世界流
                </span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-mono text-slate-200 tabular-nums">
                  {formatSessionTimer(remainingSeconds)}
                </span>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-label={isMuted ? '开启立体声环境音' : '静音环境音'}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-[#07090E]/80 text-slate-200 hover:border-slate-500 hover:text-white backdrop-blur-sm cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleFullscreen}
                  aria-label="全屏显示"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-[#07090E]/80 text-slate-200 hover:border-slate-500 hover:text-white backdrop-blur-sm cursor-pointer"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onStop}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 transition-colors cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  结束会话
                </button>
              </div>
            </div>
          )}

          {status === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#07090E]/75 px-6 text-center backdrop-blur-xs">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" />
              <p className="text-base font-medium text-slate-100">
                正在建立 Genie 4 实时世界流...
              </p>
              <p className="text-xs text-slate-300">{connectingStage}</p>
              <button
                type="button"
                onClick={onStop}
                className="mt-1 rounded-lg border border-slate-600 bg-slate-900/90 px-4 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                取消连接
              </button>
            </div>
          )}

          {(status === 'idle' || status === 'ended') && (
            <div className="hidden sm:flex absolute inset-x-0 bottom-0 p-6 lg:p-7 flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                <div className="max-w-2xl">
                  <p className="text-xs font-mono text-amber-400 tracking-wide">
                    {sector.englishName} · {sector.coordinates}
                  </p>
                  <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
                    {sector.name}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {sector.summary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  启动 Genie 4 火星世界
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 border-t border-slate-700/60 pt-4 text-xs">
                <div>
                  <span className="block text-slate-400">表面重力</span>
                  <span className="mt-0.5 block font-mono text-sm font-medium text-slate-100 tabular-nums">
                    {sector.gravity}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">大气压强</span>
                  <span className="mt-0.5 block font-mono text-sm font-medium text-slate-100 tabular-nums">
                    {sector.pressure}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">地表温度</span>
                  <span className="mt-0.5 block font-mono text-sm font-medium text-slate-100 tabular-nums">
                    {sector.temperature}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">相对高程</span>
                  <span className="mt-0.5 block font-mono text-sm font-medium text-slate-100 tabular-nums">
                    {sector.elevation}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {(status === 'idle' || status === 'ended') && (
          <div className="sm:hidden p-4 flex flex-col gap-4 border-t border-slate-800/80">
            <div>
              <p className="text-[11px] font-mono text-amber-400 tracking-wide">
                {sector.englishName} · {sector.coordinates}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-white">
                {sector.name}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                {sector.summary}
              </p>
            </div>

            <button
              type="button"
              onClick={onStart}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              启动 Genie 4 火星世界
            </button>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3 text-xs">
              <div>
                <span className="block text-slate-400">表面重力</span>
                <span className="mt-0.5 block font-mono text-sm font-medium text-slate-100 tabular-nums">
                  {sector.gravity}
                </span>
              </div>
              <div>
                <span className="block text-slate-400">大气压强</span>
                <span className="mt-0.5 block font-mono text-sm font-medium text-slate-100 tabular-nums">
                  {sector.pressure}
                </span>
              </div>
              <div>
                <span className="block text-slate-400">地表温度</span>
                <span className="mt-0.5 block font-mono text-sm font-medium text-slate-100 tabular-nums">
                  {sector.temperature}
                </span>
              </div>
              <div>
                <span className="block text-slate-400">相对高程</span>
                <span className="mt-0.5 block font-mono text-sm font-medium text-slate-100 tabular-nums">
                  {sector.elevation}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-rose-100">连接或会话状态异常</p>
            <p className="mt-0.5 text-xs text-rose-200/90 break-words">{errorMessage}</p>
          </div>
        </div>
      )}

      {!errorMessage && statusNotice && (
        <div
          role="status"
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-xs text-slate-300"
        >
          {statusNotice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 rounded-xl border border-slate-800 bg-[#0D1119] p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-100">实时环境引导</h2>
            <span className="text-xs font-mono text-slate-400">
              {status !== 'active'
                ? '启动世界后可用'
                : steerCooldownActive
                  ? '指令冷却中 (2s)'
                  : lastSteerLabel
                    ? `已注入: ${lastSteerLabel}`
                    : '就绪'}
            </span>
          </div>

          <form onSubmit={handleSteerSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <label htmlFor="steer-input" className="sr-only">
              输入实时环境引导指令
            </label>
            <input
              id="steer-input"
              type="text"
              value={customSteer}
              disabled={status !== 'active'}
              onChange={(e) => setCustomSteer(e.target.value)}
              placeholder="输入实时改变世界的描述（例：前方出现冰层反光陨石坑）"
              className="flex-1 rounded-lg border border-slate-800 bg-[#07090E] px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status !== 'active' || steerCooldownActive || !customSteer.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              发送引导
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STEER_PRESETS.map((preset: SteerPreset) => (
              <button
                key={preset.id}
                type="button"
                disabled={status !== 'active' || steerCooldownActive}
                onClick={() => void onSteer(preset.prompt, preset.label)}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-200 hover:border-amber-500/60 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="truncate">{preset.label}</span>
                <kbd className="font-mono text-[10px] text-amber-400 shrink-0">
                  {preset.keyHint}
                </kbd>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 rounded-xl border border-slate-800 bg-[#0D1119] p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-100">驾驶与视角操控</h2>
            <span className="text-xs text-slate-400">支持键盘长按或触控长按</span>
          </div>

          <div className="flex items-center justify-around gap-4 py-1">
            <div className="flex flex-col items-center gap-1.5">
              {renderHoldButton('key_w', '向前移动 (W)', 'W')}
              <div className="flex items-center gap-1.5">
                {renderHoldButton('key_a', '向左移动 (A)', 'A')}
                {renderHoldButton('key_s', '向后移动 (S)', 'S')}
                {renderHoldButton('key_d', '向右移动 (D)', 'D')}
              </div>
              <span className="mt-1 text-[11px] text-slate-400">载具位移</span>
            </div>

            <div className="h-16 w-px bg-slate-800" aria-hidden="true" />

            <div className="flex flex-col items-center gap-1.5">
              {renderHoldButton(
                'arrow_up',
                '视角上仰 (上方向键)',
                <ArrowUp className="h-4 w-4" aria-hidden="true" />,
              )}
              <div className="flex items-center gap-1.5">
                {renderHoldButton(
                  'arrow_left',
                  '视角左转 (左方向键)',
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />,
                )}
                {renderHoldButton(
                  'arrow_down',
                  '视角下俯 (下方向键)',
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />,
                )}
                {renderHoldButton(
                  'arrow_right',
                  '视角右转 (右方向键)',
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />,
                )}
              </div>
              <span className="mt-1 text-[11px] text-slate-400">云台视角</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
