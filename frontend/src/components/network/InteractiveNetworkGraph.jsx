import React, { useId, useMemo, useState } from 'react';
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';

const FLOW = { safe: '#22c55e', suspicious: '#f59e0b', attack: '#ef4444' };
export const STATUS_COLORS = { compromised: '#ef4444', attacker: '#ef4444', suspicious: '#f59e0b', benign: '#22c55e', safe: '#22c55e', normal: '#38bdf8', endpoint: '#38bdf8', server: '#a855f7', critical_asset: '#a855f7', external_host: '#94a3b8', other: '#94a3b8', background: '#94a3b8' };
const NODE_ICON = { compromised: '!', suspicious: '?', safe: '✓', endpoint: '▣', server: '▤', external_host: '◎', other: '◇' };

function visualKey(node) {
  if (node.status === 'compromised' || node.type === 'attacker') return 'compromised';
  if (node.status === 'suspicious') return 'suspicious';
  if (node.type === 'server' || node.type === 'critical_asset') return 'server';
  if (node.type === 'external_host') return 'external_host';
  if (node.status === 'safe' || node.status === 'benign') return 'safe';
  return node.type === 'endpoint' ? 'endpoint' : 'other';
}

export default function InteractiveNetworkGraph({ graphData, selectedNodeId, onSelectNode, onSelectEdge, timelineTime, filters = { safe: true, suspicious: true, attack: true, background: true, normal: true, servers: true, external: true, compromised: true } }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const rawId = useId().replace(/[^a-z0-9]/gi, '');
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];
  const positions = useMemo(() => Object.fromEntries(nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1) - Math.PI / 2;
    const radius = Math.min(205, 70 + Math.sqrt(nodes.length) * 45);
    return [node.id, { x: 460 + Math.cos(angle) * radius, y: 270 + Math.sin(angle) * radius }];
  })), [nodes]);
  const visibleNodes = nodes.filter(n =>
    (filters.servers !== false || n.type !== 'server') &&
    (filters.external !== false || n.type !== 'external_host') &&
    (filters.normal !== false || n.type !== 'endpoint') &&
    (filters.compromised !== false || n.status !== 'compromised')
  );
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e => filters[e.classification] !== false && visibleIds.has(e.source) && visibleIds.has(e.target) && (!timelineTime || !e.first_seen || e.first_seen <= timelineTime));
  const connectedEdgeIds = new Set(edges.filter(edge => edge.source === selectedNodeId || edge.target === selectedNodeId).map(edge => edge.id));

  if (!graphData?.available) return <div className="min-h-[560px] rounded-2xl bg-[#030712] border border-slate-700 flex items-center justify-center text-sm font-mono text-slate-400">{graphData?.reason || 'Network graph unavailable for this capture.'}</div>;
  return <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-[#030712] shadow-2xl">
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#1e293b 1px,transparent 1px),linear-gradient(90deg,#1e293b 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
    <div className="absolute top-3 right-3 z-10 flex gap-1 rounded-lg bg-slate-950/90 p-1 border border-slate-700">
      <button aria-label="Zoom out" onClick={() => setZoom(Math.max(.55, zoom - .15))} className="p-2 text-slate-300 hover:text-white"><Minus size={16} /></button>
      <button aria-label="Zoom in" onClick={() => setZoom(Math.min(1.8, zoom + .15))} className="p-2 text-slate-300 hover:text-white"><Plus size={16} /></button>
      <button aria-label="Fit graph" onClick={() => setZoom(1)} className="p-2 text-slate-300 hover:text-white"><RotateCcw size={16} /></button>
      <button aria-label="Fullscreen" onClick={event => event.currentTarget.closest('.relative').requestFullscreen?.()} className="p-2 text-slate-300 hover:text-white"><Maximize2 size={16} /></button>
    </div>
    <svg viewBox="0 0 920 540" className="relative block h-[560px] w-full" role="img" aria-label="Observed network topology" style={{ cursor: 'grab' }}>
      <defs>{Object.entries(FLOW).map(([kind, color]) => <marker key={kind} id={`${kind}-${rawId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill={color} /></marker>)}</defs>
      <g transform={`translate(460 270) scale(${zoom}) translate(-460 -270)`}>
        {visibleEdges.map(edge => { const a = positions[edge.source], b = positions[edge.target], color = FLOW[edge.classification] || '#64748b'; if (!a || !b) return null; const path = `M ${a.x} ${a.y} L ${b.x} ${b.y}`; const width = Math.min(6, (edge.classification === 'attack' ? 3 : edge.classification === 'suspicious' ? 2 : 1) + Math.log2((edge.flow_count || 0) + 1) * .55); const focused = !selectedNodeId || connectedEdgeIds.has(edge.id); const duration = edge.classification === 'attack' ? '1s' : edge.classification === 'suspicious' ? '1.6s' : '2.5s'; return <g key={edge.id} onClick={() => onSelectEdge?.(edge)} className="cursor-pointer" opacity={focused ? 1 : .22}><title>{`${edge.source} → ${edge.target}\n${edge.protocol} · ${(edge.dst_ports || edge.ports || []).join(', ') || '—'}\n${edge.packet_count} packets · ${edge.byte_count} bytes · ${edge.classification}`}</title>{edge.classification === 'attack' && <path d={path} stroke={color} strokeWidth={width + 7} opacity=".12" />}<path d={path} stroke={color} strokeWidth={width} opacity=".76" markerEnd={`url(#${edge.classification}-${rawId})`} /><circle r={edge.classification === 'attack' ? 4 : 3} fill={color}><animateMotion dur={duration} repeatCount="indefinite" path={path} /></circle>{edge.classification === 'attack' && <circle r="2" fill="#fecaca"><animateMotion begin=".45s" dur={duration} repeatCount="indefinite" path={path} /></circle>}</g>; })}
        {visibleNodes.map(node => { const p = positions[node.id], key = visualKey(node), color = STATUS_COLORS[key], selected = node.id === selectedNodeId, hovered = node.id === hoveredNodeId; const risk = Math.max(0, Math.min(100, Number(node.risk_score) || 0)); const radius = Math.min(27, 10 + Math.log2((node.degree || 0) + 1) * 2.5 + risk / 12) + (selected || hovered ? 3 : 0); const pulse = `${Math.max(.85, 3.2 - risk / 42)}s`; const badge = key === 'compromised' ? 'ALERT' : key === 'suspicious' ? 'WATCH' : key === 'server' ? 'SERVER' : key === 'external_host' ? 'EXT' : key === 'safe' ? 'SAFE' : 'HOST'; return <g key={node.id} transform={`translate(${p.x} ${p.y})`} onMouseEnter={() => setHoveredNodeId(node.id)} onMouseLeave={() => setHoveredNodeId(null)} onClick={() => onSelectNode?.(node)} className="cursor-pointer"><title>{`${node.ip || node.label}\n${node.type} · ${node.status}\nRisk ${node.risk_score ?? '—'} · ${node.degree ?? '—'} connections`}</title><circle r={radius + 14} fill={color} opacity={selected ? '.26' : '.12'}><animate attributeName="opacity" values={selected ? '.18;.42;.18' : '.08;.24;.08'} dur={pulse} repeatCount="indefinite" /></circle><circle r={radius + 7} fill="none" stroke={color} strokeWidth={selected ? 2.5 : 1.25} opacity=".85"><animate attributeName="r" values={`${radius + 5};${radius + 9};${radius + 5}`} dur={pulse} repeatCount="indefinite" /></circle><circle r={radius} fill="#0b1220" stroke={color} strokeWidth={selected ? 3.5 : 2} /><circle r={radius - 4} fill={color} opacity=".10" /><text y="6" textAnchor="middle" fill={color} fontSize="17" fontWeight="700" fontFamily="monospace">{NODE_ICON[key]}</text><g transform={`translate(${radius - 4} ${-radius + 4})`}><rect width="30" height="12" rx="4" fill="#0f172a" stroke={color} strokeWidth="1" /><text x="15" y="8.5" textAnchor="middle" fill={color} fontSize="5.5" fontWeight="700" fontFamily="monospace">{badge}</text></g><text y={radius + 18} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700" fontFamily="monospace">{node.label}</text><text y={radius + 29} textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace">{String(node.status || node.type || 'observed').toUpperCase()}</text></g>; })}
      </g>
    </svg>
    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-[10px] font-mono text-slate-300"><span><i className="text-red-500">●</i> Compromised / Attacker</span><span><i className="text-amber-400">●</i> Suspicious</span><span><i className="text-green-400">●</i> Benign / Safe</span><span><i className="text-sky-400">●</i> Normal Host</span><span><i className="text-purple-400">●</i> Server / Critical Asset</span><span><i className="text-slate-400">●</i> Other / Background</span><span className="ml-auto">● green safe · ● amber suspicious · ● red attack flow</span></div>
  </div>;
}
