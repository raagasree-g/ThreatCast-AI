import React from 'react';
import {
  Brain,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

import { formatConfidence } from '../../utils/formatters';


export default function AttackProgressionTimeline({ forecastData }) {
  if (!forecastData) {
    return null;
  }

  const current = forecastData.current_state;

  const probability = Number(
    current?.probability_distribution?.['Early Warning'] ??
    current?.confidence ??
    0
  );

  const warning = probability >= 0.08;

  const probabilityText = formatConfidence(
    probability
  );

  return (
    <div className="rounded-2xl bg-white border border-[#ebdcc7] shadow-xs p-6 md:p-7">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-xl bg-[#fef3c7] border border-[#fde68a] flex items-center justify-center text-[#b45309]">
            <Brain className="w-4 h-4" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#221207]">
              CTU13 LSTM Early-Warning Timeline
            </h3>

            <p className="text-xs text-[#7a644c] mt-0.5">
              Five consecutive 30-second network states
            </p>
          </div>

        </div>


        <div className="flex items-center gap-2">

          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[#f5efe6] border border-[#ded0bc] text-[#78350f]">
            5 × 30 SEC
          </span>

          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${
              warning
                ? 'bg-[#ffedd5] text-[#c2410c] border-[#fdba74]'
                : 'bg-[#f0fdf4] text-[#4d7c0f] border-[#d9f99d]'
            }`}
          >
            {warning ? 'EARLY WARNING' : 'NORMAL'}
          </span>

        </div>

      </div>


      {/* Timeline */}
      <div className="relative">

        <div className="hidden md:block absolute left-[8%] right-[8%] top-7 h-px bg-[#ebdcc7]" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          {Array.from({ length: 5 }).map((_, index) => {

            const stateNumber = index + 1;

            return (
              <div
                key={stateNumber}
                className="relative"
              >

                <div className="flex md:flex-col items-center md:text-center gap-3">

                  <div
                    className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 bg-white ${
                      index === 4
                        ? warning
                          ? 'border-[#f97316] text-[#c2410c]'
                          : 'border-[#84cc16] text-[#4d7c0f]'
                        : 'border-[#d6c6b2] text-[#7a644c]'
                    }`}
                  >
                    {index === 4 ? (
                      warning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )
                    ) : (
                      <span className="text-[10px] font-bold">
                        {stateNumber}
                      </span>
                    )}
                  </div>


                  <div className="md:mt-2">

                    <p className="text-[10px] font-mono font-bold text-[#78350f]">
                      STATE {stateNumber}
                    </p>

                    <p className="text-[10px] text-[#7a644c] font-mono">
                      {stateNumber === 5
                        ? 'Latest'
                        : `T-${5 - stateNumber}`}
                    </p>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </div>


      {/* Current assessment */}
      <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#ebdcc7]">

          <div className="flex items-center gap-2 mb-2">

            <Clock className="w-3.5 h-3.5 text-[#b45309]" />

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a644c] font-mono">
              Temporal Window
            </span>

          </div>

          <p className="text-sm font-bold text-[#221207]">
            5 × 30 seconds
          </p>

          <p className="text-[10px] text-[#7a644c] mt-1">
            Five consecutive network states
          </p>

        </div>


        <div className="p-4 rounded-xl bg-[#fffbeb] border border-[#fde68a]">

          <div className="flex items-center gap-2 mb-2">

            <Brain className="w-3.5 h-3.5 text-[#b45309]" />

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a644c] font-mono">
              Early-Warning Probability
            </span>

          </div>

          <p className="text-lg font-black text-[#78350f]">
            {probabilityText}
          </p>

          <p className="text-[10px] text-[#7a644c] mt-1">
            Deployment threshold: 8%
          </p>

        </div>


        <div
          className={`p-4 rounded-xl border ${
            warning
              ? 'bg-[#fff7ed] border-[#fdba74]'
              : 'bg-[#f0fdf4] border-[#d9f99d]'
          }`}
        >

          <div className="flex items-center gap-2 mb-2">

            {warning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[#c2410c]" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#4d7c0f]" />
            )}

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a644c] font-mono">
              Assessment
            </span>

          </div>

          <p
            className={`text-sm font-black ${
              warning
                ? 'text-[#c2410c]'
                : 'text-[#4d7c0f]'
            }`}
          >
            {warning
              ? 'EARLY WARNING'
              : 'NORMAL NETWORK STATE'}
          </p>

          <p className="text-[10px] text-[#7a644c] mt-1">
            {warning
              ? 'Probability meets deployment threshold'
              : 'Probability is below deployment threshold'}
          </p>

        </div>

      </div>


      {/* Disclaimer */}
      <div className="mt-5 p-3.5 rounded-xl bg-[#fcfaf7] border border-[#ebdcc7]">

        <p className="text-[10px] leading-relaxed text-[#7a644c] font-mono">
          <strong className="text-[#78350f]">
            MODEL SCOPE:
          </strong>{' '}
          The CTU13 LSTM predicts early-warning risk from
          statistical network-state features. It does not
          independently predict specific MITRE ATT&CK stages,
          individual hosts, or future attack paths.
        </p>

      </div>

    </div>
  );
}