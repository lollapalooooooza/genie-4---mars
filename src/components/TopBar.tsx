interface TopBarProps {
  status: 'idle' | 'connecting' | 'active' | 'ended';
  onPrimaryAction: () => void;
}

export function TopBar({status, onPrimaryAction}: TopBarProps) {
  const isRunning = status === 'active' || status === 'connecting';

  const buttonLabel =
    status === 'connecting'
      ? '取消连接'
      : status === 'active'
        ? '结束会话'
        : '开始探索';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#07090E]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <a
          href="#viewport-stage"
          className="text-lg font-semibold tracking-tight text-slate-50 whitespace-nowrap shrink-0"
        >
          Ares Horizon
        </a>

        <nav
          aria-label="主导航"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          <a
            href="#viewport-stage"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            实时视界
          </a>
          <a
            href="#landing-sectors"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            着陆区
          </a>
          <a
            href="#controls-guide"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            操控说明
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isRunning
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-slate-100 text-slate-950 hover:bg-white'
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
