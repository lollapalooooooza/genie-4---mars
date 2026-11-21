import {RotateCcw} from 'lucide-react';
import {useState} from 'react';
import type {MarsSector} from '../lib/marsWorld';

interface SectorSidebarProps {
  sectors: readonly MarsSector[];
  selectedSectorId: string;
  worldPrompt: string;
  useImageSeed: boolean;
  disabled: boolean;
  onSelectSector: (sector: MarsSector) => void;
  onChangePrompt: (value: string) => void;
  onResetPrompt: () => void;
  onToggleImageSeed: (checked: boolean) => void;
}

function SectorThumbnail({sector}: {sector: MarsSector}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="aspect-video w-full rounded-md bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 flex items-center justify-center border border-slate-800">
        <span className="text-xs font-mono text-amber-400/80">{sector.englishName}</span>
      </div>
    );
  }

  return (
    <img
      src={sector.imagePath}
      alt={sector.name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-md object-cover bg-slate-900"
    />
  );
}

export function SectorSidebar({
  sectors,
  selectedSectorId,
  worldPrompt,
  useImageSeed,
  disabled,
  onSelectSector,
  onChangePrompt,
  onResetPrompt,
  onToggleImageSeed,
}: SectorSidebarProps) {
  return (
    <aside
      id="landing-sectors"
      aria-label="火星着陆区与世界参数"
      className="w-full lg:w-[360px] shrink-0 flex flex-col gap-6"
    >
      <div className="rounded-xl border border-slate-800 bg-[#0D1119] p-4 sm:p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-100">火星着陆区预设</h2>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {sectors.length} 个扇区
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {sectors.map((sector) => {
            const isSelected = sector.id === selectedSectorId;
            return (
              <button
                key={sector.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectSector(sector)}
                aria-pressed={isSelected}
                className={`group w-full text-left rounded-lg border p-3 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-20 shrink-0">
                    <SectorThumbnail sector={sector} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {sector.name}
                      </span>
                      <span className="text-[11px] font-mono text-amber-400/90 tabular-nums shrink-0">
                        {sector.temperature}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 truncate">
                      {sector.vehicleMode}
                    </p>
                    <p className="mt-1 text-[11px] font-mono text-slate-500 tabular-nums truncate">
                      {sector.coordinates}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0D1119] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="world-prompt-input" className="text-sm font-semibold text-slate-100">
            世界模型提示词
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={onResetPrompt}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            恢复预设
          </button>
        </div>

        <textarea
          id="world-prompt-input"
          rows={6}
          value={worldPrompt}
          disabled={disabled}
          onChange={(e) => onChangePrompt(e.target.value)}
          placeholder="描述连续第一人称视角、推进方式与物理环境声效..."
          className="w-full rounded-lg border border-slate-800 bg-[#07090E] px-3 py-2.5 text-xs leading-relaxed text-slate-200 placeholder:text-slate-500 focus:border-amber-500 disabled:opacity-60"
        />

        <div className="pt-1 border-t border-slate-800/80">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useImageSeed}
              disabled={disabled}
              onChange={(e) => onToggleImageSeed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 accent-amber-500"
            />
            <span className="text-xs leading-relaxed text-slate-300">
              启用着陆区首帧视觉引导
              <span className="block text-[11px] text-slate-500">
                启动时自动压缩当前着陆区 16:9 画面作为第 0 帧种子图像（&lt; 45 KB JPEG）
              </span>
            </span>
          </label>
        </div>
      </div>
    </aside>
  );
}
