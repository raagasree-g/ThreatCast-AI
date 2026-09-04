import React from 'react';
import {
  GitCompare,
  Info,
  Shield,
} from 'lucide-react';


export default function ModelRuleComparisonCard() {

  return (
    <div className="p-6 md:p-7 rounded-2xl bg-white border border-[#ebdcc7] shadow-xs flex flex-col justify-between space-y-5">

      <div className="flex items-center gap-2.5">

        <div className="w-9 h-9 rounded-xl bg-[#fef3c7] border border-[#fde68a] flex items-center justify-center text-[#b45309]">
          <GitCompare className="w-4 h-4" />
        </div>

        <div>

          <h3 className="text-sm font-bold text-[#221207] flex items-center gap-2">
            Model vs Rule Verification
          </h3>

          <p className="text-xs text-[#544230]">
            Comparison will be enabled after the deterministic rule engine is connected to the CTU13 inference pipeline.
          </p>

        </div>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="p-4 rounded-xl bg-[#fffbeb] border border-[#fde68a] space-y-2">

          <div className="flex items-center gap-1.5">

            <span className="text-[11px] font-bold text-[#b45309] uppercase tracking-wider font-mono">
              ML Model
            </span>

          </div>

          <div>

            <span className="text-sm font-bold text-[#221207] block">
              CTU13 LSTM
            </span>

            <span className="text-[11px] text-[#7a644c] font-mono block mt-0.5">
              5 × 30-second states • 12 features
            </span>

          </div>

        </div>


        <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#ebdcc7] space-y-2">

          <div className="flex items-center gap-1.5">

            <Shield className="w-3.5 h-3.5 text-[#7a644c]" />

            <span className="text-[11px] font-bold text-[#544230] uppercase tracking-wider font-mono">
              Rule Engine
            </span>

          </div>

          <div>

            <span className="text-sm font-bold text-[#301a0a] block">
              Not Connected
            </span>

            <span className="text-[11px] text-[#7a644c] font-mono block mt-0.5">
              Deterministic rule integration pending
            </span>

          </div>

        </div>

      </div>


      <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#ebdcc7] flex items-start gap-3">

        <Info className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />

        <div>

          <span className="text-xs font-bold text-[#78350f] font-mono">
            NO MODEL-RULE DISAGREEMENT CLAIM
          </span>

          <p className="text-xs text-[#544230] leading-relaxed mt-1">
            The current CTU13 LSTM integration produces an early-warning probability only. No connected rule-engine comparison is being presented as a live security signal.
          </p>

        </div>

      </div>

    </div>
  );
}