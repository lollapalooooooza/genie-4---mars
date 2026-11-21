export function ControlsGuide() {
  return (
    <section
      id="controls-guide"
      aria-label="操控与会话说明"
      className="mt-10 border-t border-slate-800/80 pt-8 pb-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">01. 载具位移与视角转向</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            实时流启动后，按住 <span className="font-mono text-slate-200">W A S D</span>{' '}
            控制火星漫游车或滑翔器前后左右推进，按住方向键{' '}
            <span className="font-mono text-slate-200">↑ ↓ ← →</span>{' '}
            平滑调整第一人称视野俯仰与偏航。
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-100">02. 实时世界动态引导</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            在探索过程中可随时通过快捷键{' '}
            <span className="font-mono text-slate-200">Space · Q · E · R</span>{' '}
            或底部输入框注入天气剧变、照明开启、暮光日落等环境变化指令（2 秒冷却防冲突）。
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-100">03. 实时流时长与音频</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            每次 Genie 4 探索会话以 720p · 24fps 视频与 48kHz 立体声环境音实时生成，单次最长
            120 秒；点击“结束会话”或关闭页面时将立即停止远端世界推流。
          </p>
        </div>
      </div>
    </section>
  );
}
