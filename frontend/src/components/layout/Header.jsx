import React from 'react';
import { Menu, Zap, Clock } from 'lucide-react';
import RefreshButton from '../common/RefreshButton';

export default function Header({
  onToggleSidebar,
  onOpenSimModal,
  onRefresh,
  refreshing = false,
  lastUpdated,
  activeScenario,
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/90 backdrop-blur-md border-b border-[#ebdcc7] shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-[#7a644c] hover:bg-[#f5efe6] lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 text-xs font-medium">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#65a30d]" />
            CTU13 LSTM Pipeline Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Backend Timestamp */}
        {lastUpdated && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#7a644c] font-mono">
            <Clock className="w-3.5 h-3.5 text-[#b45309]" />
            <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
          </div>
        )}

        <RefreshButton onRefresh={onRefresh} loading={refreshing} />

        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-xl bg-[#f5efe6] border border-[#ded0bc] flex items-center justify-center text-xs font-bold text-[#542e14] shadow-sm font-mono">
          TC
        </div>
      </div>
    </header>
  );
}
