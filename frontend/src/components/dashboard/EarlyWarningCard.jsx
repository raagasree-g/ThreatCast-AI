import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function EarlyWarningCard({ summary }) {
  if (!summary) {
    return null;
  }

  const probability = Number(summary.forecast_confidence ?? 0);
  const warning = probability >= 0.08;
  const probabilityPercent = (probability * 100).toFixed(2);

  return (
    <div className="rounded-2xl bg-white border border-[#ebdcc7] shadow-xs p-6 md:p-7">

      <div className="flex items-start gap-3 mb-5">

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
            warning
              ? 'bg-[#fff7ed] border-[#fdba74] text-[#c2410c]'
              : 'bg-[#f0fdf4] border-[#d9f99d] text-[#4d7c0f]'
          }`}
        >
          {warning ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
        </div>

        <div>
          <p className="text-[10px] font-mono font-bold tracking-wider text-[#b45309] uppercase">
            Early Warning System
          </p>

          <h3 className="text-lg font-black text-[#221207] mt-1">
            CTU13 LSTM Early-Warning Assessment
          </h3>

          <p className="text-xs text-[#7a644c] mt-1">
            Current assessment from the latest five 30-second network states.
          </p>
        </div>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="rounded-xl border border-[#ebdcc7] bg-[#fcfaf7] p-4">

          <p className="text-[10px] font-mono font-bold uppercase text-[#7a644c]">
            Current State
          </p>

          <p className="text-base font-black text-[#221207] mt-2">
            {summary.current_stage || 'Normal Network State'}
          </p>

        </div>


        <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4">

          <p className="text-[10px] font-mono font-bold uppercase text-[#7a644c]">
            Early-Warning Probability
          </p>

          <p className="text-xl font-black text-[#78350f] mt-2">
            {probabilityPercent}%
          </p>

          <p className="text-[10px] text-[#7a644c] mt-1">
            Deployment threshold: 8%
          </p>

        </div>


        <div
          className={`rounded-xl border p-4 ${
            warning
              ? 'bg-[#fff7ed] border-[#fdba74]'
              : 'bg-[#f0fdf4] border-[#d9f99d]'
          }`}
        >

          <p className="text-[10px] font-mono font-bold uppercase text-[#7a644c]">
            Assessment
          </p>

          <p
            className={`text-base font-black mt-2 ${
              warning ? 'text-[#c2410c]' : 'text-[#4d7c0f]'
            }`}
          >
            {warning ? 'EARLY WARNING' : 'NORMAL'}
          </p>

          <p className="text-[10px] text-[#7a644c] mt-1">
            {warning
              ? 'Probability exceeds the deployment threshold.'
              : 'Probability is below the deployment threshold.'}
          </p>

        </div>

      </div>


      <div className="mt-5 rounded-xl border border-[#ebdcc7] bg-[#fcfaf7] p-4">

        <p className="text-xs leading-relaxed text-[#7a644c]">

          <span className="font-bold text-[#78350f]">
            Model scope:
          </span>{' '}

          The CTU13 LSTM predicts early-warning risk from
          statistical network-state features. It does not independently
          predict specific MITRE ATT&CK stages, individual hosts,
          or future attack paths.

        </p>

      </div>

    </div>
  );
}