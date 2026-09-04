import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

import StatusBadge from '../common/StatusBadge';

export default function IncidentTable({
  incidents = [],
  onSelectIncident,
}) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#ebdcc7] text-[#7a644c] text-xs">
        No active incidents tracked in this filter range.
      </div>
    );
  }

  const getStatusIcon = (status) => {
    if (status === 'Contained' || status === 'Resolved') {
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    }

    if (status === 'Investigating') {
      return <AlertTriangle className="w-3.5 h-3.5" />;
    }

    return <ShieldAlert className="w-3.5 h-3.5" />;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#ebdcc7] bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#fcfaf7] border-b border-[#ebdcc7] text-[#7a644c] font-mono uppercase text-[10px] tracking-wider">
            <th className="py-3 px-4 font-bold">Incident ID</th>
            <th className="py-3 px-4 font-bold">Detected</th>
            <th className="py-3 px-4 font-bold">Assessment</th>
            <th className="py-3 px-4 font-bold">Affected Assets</th>
            <th className="py-3 px-4 font-bold">Risk Level</th>
            <th className="py-3 px-4 font-bold">ML Signal</th>
            <th className="py-3 px-4 font-bold">Status</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#f5efe6] font-mono">
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              onClick={() =>
                onSelectIncident && onSelectIncident(incident)
              }
              className="cursor-pointer hover:bg-[#fcfaf7] transition-colors group"
            >
              <td className="py-3.5 px-4 font-mono font-bold text-[#b45309] group-hover:text-[#92400e]">
                {incident.id}
              </td>

              <td className="py-3.5 px-4 text-[#7a644c]">
                {incident.detected_at}
              </td>

              <td className="py-3.5 px-4 font-bold text-[#221207] font-sans">
                {incident.current_stage || 'Early-Warning Assessment'}
              </td>

              <td className="py-3.5 px-4 text-[#544230] truncate max-w-[180px]">
                {incident.affected_assets?.length
                  ? incident.affected_assets.join(', ')
                  : 'Not attributed'}
              </td>

              <td className="py-3.5 px-4">
                <StatusBadge status={incident.risk_level} />
              </td>

              <td className="py-3.5 px-4">
                <span className="inline-flex items-center gap-1.5 text-[#b45309] font-bold">
                  {getStatusIcon(incident.status)}
                  {incident.predicted_progression ||
                    'Early-warning signal'}
                </span>
              </td>

              <td className="py-3.5 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    incident.status === 'Forecasted'
                      ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                      : incident.status === 'Investigating'
                      ? 'bg-[#ffedd5] text-[#ea580c] border border-[#fdba74]'
                      : incident.status === 'Contained'
                      ? 'bg-[#f5efe6] text-[#544230] border border-[#ded0bc]'
                      : 'bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]'
                  }`}
                >
                  {incident.status || 'Unknown'}
                </span>
              </td>

              <td className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-[#f5efe6] text-[#7a644c] group-hover:text-[#221207] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}