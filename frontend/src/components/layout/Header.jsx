import React from 'react';
import { Menu, Clock, Activity, Radio } from 'lucide-react';
import RefreshButton from '../common/RefreshButton';

export default function Header({
  onToggleSidebar,
  onRefresh,
  refreshing = false,
  lastUpdated,
  activeScenario,
}) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.08] bg-[#030405]/90 backdrop-blur-xl">
      <div className="h-full px-4 md:px-8 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-4">

          {/* Mobile menu */}
          <button
            onClick={onToggleSidebar}
            className="
              lg:hidden
              w-9 h-9
              rounded-xl
              flex items-center justify-center
              text-[#B8C0C8]
              border border-white/[0.08]
              bg-white/[0.025]
              hover:bg-white/[0.06]
              hover:text-[#E8EDF2]
              hover:border-[#00E5FF]/30
              hover:shadow-[0_0_18px_rgba(0,229,255,0.08)]
              transition-all
            "
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* System indicator */}
          <div
            className="
              hidden sm:flex
              items-center gap-2.5
              px-3.5 py-2
              rounded-xl
              bg-[#0D1115]
              border border-white/[0.08]
              shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
            "
          >
            <span className="relative flex items-center justify-center">
              <span className="absolute w-5 h-5 rounded-full bg-[#00FF9C]/10 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-[#00FF9C] shadow-[0_0_8px_rgba(0,255,156,0.9)]" />
            </span>

            <div className="flex flex-col leading-none">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#59636D] font-mono">
                AI ENGINE
              </span>

              <span className="mt-1 text-[11px] font-semibold text-[#E8EDF2]">
                CTU13 LSTM ONLINE
              </span>
            </div>
          </div>

          {/* Scenario */}
          {activeScenario && activeScenario !== 'default' && (
            <div className="hidden md:flex items-center gap-2">
              <div className="w-px h-5 bg-white/[0.08]" />

              <span className="text-[10px] uppercase tracking-[0.16em] text-[#59636D] font-mono">
                SCENARIO
              </span>

              <span className="text-[11px] font-mono font-semibold text-[#B8C0C8]">
                {activeScenario.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2.5 md:gap-4">

          {/* Live connection */}
          <div className="hidden xl:flex items-center gap-2 text-[10px] font-mono">
            <Radio className="w-3.5 h-3.5 text-[#00E5FF]" />

            <span className="text-[#718096]">
              FASTAPI
            </span>

            <span className="text-[#B8C0C8]">
              :8000
            </span>

            <span className="w-1 h-1 rounded-full bg-[#00FF9C] shadow-[0_0_6px_#00FF9C]" />
          </div>

          {/* Timestamp */}
          {lastUpdated && (
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono">
              <Clock className="w-3.5 h-3.5 text-[#59636D]" />

              <span className="text-[#59636D]">
                UPDATED
              </span>

              <span className="text-[#B8C0C8]">
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Refresh */}
          <div className="
            rounded-xl
            border border-white/[0.08]
            bg-white/[0.025]
            hover:border-[#00E5FF]/25
            transition-all
          ">
            <RefreshButton
              onRefresh={onRefresh}
              loading={refreshing}
            />
          </div>

          {/* Profile */}
          <div
            className="
              relative
              w-9 h-9
              rounded-xl
              flex items-center justify-center
              bg-gradient-to-br from-[#E8EDF2] via-[#8F99A3] to-[#3E474F]
              p-[1px]
              shadow-[0_0_16px_rgba(184,192,200,0.08)]
            "
          >
            <div
              className="
                w-full h-full
                rounded-[10px]
                flex items-center justify-center
                bg-[#080A0D]
                text-[#E8EDF2]
              "
            >
              <span className="text-[10px] font-bold tracking-wider font-mono">
                TC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle neon bottom line */}
      <div className="
        absolute bottom-0 left-0 right-0
        h-px
        bg-gradient-to-r
        from-transparent
        via-[#00E5FF]/20
        to-transparent
      " />
    </header>
  );
}