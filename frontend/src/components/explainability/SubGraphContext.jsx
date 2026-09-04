import React from 'react';
import { Network, Info } from 'lucide-react';

export default function SubGraphContext({
  subgraphNodes = [],
  subgraphEdges = [],
  fastrpNote,
}) {
  const hasNodes = subgraphNodes.length > 0;
  const hasEdges = subgraphEdges.length > 0;

  return (
    <div className="p-6 md:p-7 rounded-2xl bg-white border border-[#ebdcc7] shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#221207] flex items-center gap-2">
            <Network className="w-4 h-4 text-[#b45309]" />
            Network Context
          </h3>

          <p className="text-xs text-[#7a644c] mt-0.5">
            Supporting network information returned by the current API.
          </p>
        </div>

        <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#f5efe6] text-[#7a644c] border border-[#ded0bc] font-bold">
          Context
        </span>
      </div>

      {hasNodes ? (
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-[#7a644c] block">
            Network Entities
          </span>

          <div className="flex flex-wrap gap-2">
            {subgraphNodes.map((node, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#fcfaf7] border border-[#ebdcc7] text-xs font-mono font-bold text-[#544230]"
              >
                <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                {node}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#ebdcc7]">
          <p className="text-xs text-[#7a644c] font-mono">
            No node-level attribution is available from the CTU13 LSTM
            early-warning model.
          </p>
        </div>
      )}

      {hasEdges && (
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-[#7a644c] block">
            Network Relationships
          </span>

          <div className="space-y-1.5">
            {subgraphEdges.map((edge, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#fcfaf7] text-[#78350f] font-mono text-xs border border-[#ebdcc7] flex items-center gap-2"
              >
                <span className="text-[#998165] font-bold">
                  #{idx + 1}
                </span>
                <span>{edge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-xs text-[#78350f] font-mono leading-relaxed flex gap-2">
        <Info className="w-4 h-4 shrink-0 text-[#b45309] mt-0.5" />

        <div>
          <strong className="text-[#b45309]">
            Explainability scope:
          </strong>{' '}
          The deployed CTU13 LSTM produces an early-warning probability from
          temporal network-state features. It does not produce FastRP
          embeddings, graph-based attribution, or independent MITRE ATT&CK
          stage predictions.
        </div>
      </div>

      {fastrpNote && (
        <div className="text-[11px] text-[#8b7355] font-mono">
          Legacy graph metadata is retained only for API compatibility and is
          not used by the CTU13 LSTM prediction.
        </div>
      )}
    </div>
  );
}