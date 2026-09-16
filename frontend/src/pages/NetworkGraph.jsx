import React, { useState, useEffect } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

import PageHeader from '../components/common/PageHeader';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import InteractiveNetworkGraph from '../components/network/InteractiveNetworkGraph';
import NodeDetailsDrawer from '../components/network/NodeDetailsDrawer';
import NetworkFilters from '../components/network/NetworkFilters';
import { useNetworkGraph } from '../hooks/useNetworkGraph';

export default function NetworkGraph() {
  const { refreshTrigger, activeScenario } = useOutletContext() || {};

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [uploadedGraph, setUploadedGraph] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('threatcast.networkGraph') || 'null'); } catch { return null; }
  });
  const [filters, setFilters] = useState({ safe: true, suspicious: true, attack: true, background: true, normal: true, servers: true, external: true, compromised: true });
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [playhead, setPlayhead] = useState(0);

  const { graph, loading, error, refetch } = useNetworkGraph();

  useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  useEffect(() => {
    const receive = () => { try { setUploadedGraph(JSON.parse(sessionStorage.getItem('threatcast.networkGraph') || 'null')); } catch { setUploadedGraph(null); } };
    window.addEventListener('threatcast-network-graph', receive);
    return () => window.removeEventListener('threatcast-network-graph', receive);
  }, []);

  useEffect(() => {
    if (!playing || !uploadedGraph?.timeline?.length) return undefined;
    const timer = window.setInterval(() => setPlayhead(value => (value + 1) % uploadedGraph.timeline.length), Math.max(180, 1000 / speed));
    return () => window.clearInterval(timer);
  }, [playing, speed, uploadedGraph]);

  useEffect(() => {
    if (graph?.nodes?.length && !selectedNode) {
      const highRisk =
        graph.nodes.find((node) => node.state === 'compromised') ||
        graph.nodes[0];

      setSelectedNode(highRisk);
    }
  }, [graph, selectedNode]);

  if (loading && !graph) {
    return (
      <LoadingState message="Loading network topology and current telemetry..." />
    );
  }

  if (error && !graph) {
    return (
      <ErrorState
        title="Failed to Load Network Topology"
        message={error}
        onRetry={refetch}
      />
    );
  }

  const activeGraph = uploadedGraph || graph;
  const rawNodes = activeGraph?.nodes || [];

  const filteredNodes = rawNodes.filter((node) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();

      const matchSearch =
        node.id?.toLowerCase().includes(q) ||
        node.label?.toLowerCase().includes(q) ||
        node.ip?.toLowerCase().includes(q) ||
        node.department?.toLowerCase().includes(q);

      if (!matchSearch) return false;
    }

    if (selectedType !== 'all' && node.type !== selectedType) {
      return false;
    }

    if (selectedRisk === 'critical' && node.risk_score <= 75) {
      return false;
    }

    if (selectedRisk === 'high' && node.risk_score <= 50) {
      return false;
    }

    if (selectedRisk === 'normal' && node.risk_score > 50) {
      return false;
    }

    return true;
  });

  const filteredGraph = {
    ...activeGraph,
    nodes: filteredNodes,
  };
  const timeline = activeGraph?.timeline || [];

  return (
    <div className="space-y-6 relative z-10">
      <PageHeader
        title="Network State & Topology"
        subtitle={uploadedGraph ? 'Observed PCAP topology: all hosts and aggregated connections from the latest uploaded capture.' : 'Upload a PCAP in World Model to visualize its observed host topology.'}
        badge="Network Telemetry"
      />

      <NetworkFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedRisk={selectedRisk}
        onRiskChange={setSelectedRisk}
      />

      {!uploadedGraph && <div className="rounded-2xl border border-[#ebdcc7] bg-[#fffbf7] px-5 py-4">
        <p className="text-xs font-mono text-[#6b5845] leading-relaxed">
          <strong className="text-[#b45309]">Model scope:</strong>{' '}
          The CTU13 LSTM analyzes temporal network-state features for
          early-warning prediction. Node-level attribution and graph-based
          prediction are not produced by this model.
        </p>
      </div>}

      {uploadedGraph && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200">
        {Object.keys(filters).map(key => <label key={key} className="flex items-center gap-1"><input type="checkbox" checked={filters[key]} onChange={() => setFilters(current => ({ ...current, [key]: !current[key] }))} /> {key === 'safe' ? 'Safe Traffic' : key === 'suspicious' ? 'Suspicious Traffic' : key === 'attack' ? 'Attack Traffic' : key === 'background' ? 'Background Connections' : key === 'normal' ? 'Normal Hosts' : key === 'servers' ? 'Servers' : key === 'external' ? 'External Hosts' : 'Compromised Hosts'}</label>)}
        <span className="ml-auto font-mono">{activeGraph.statistics?.total_nodes || 0} nodes · {activeGraph.statistics?.total_edges ?? activeGraph.statistics?.total_connections ?? 0} aggregated connections · {activeGraph.statistics?.raw_flow_count || 0} raw flows · {activeGraph.statistics?.safe_flow_count ?? activeGraph.statistics?.safe_flows ?? 0} safe · {activeGraph.statistics?.suspicious_flow_count ?? activeGraph.statistics?.suspicious_flows ?? 0} suspicious · {activeGraph.statistics?.attack_flow_count ?? activeGraph.statistics?.attack_flows ?? 0} attack</span>
      </div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InteractiveNetworkGraph
            graphData={filteredGraph}
            selectedNodeId={selectedNode?.id}
            onSelectNode={setSelectedNode}
            onSelectEdge={setSelectedEdge}
            timelineTime={timeline[playhead]?.timestamp}
            filters={filters}
          />
          {uploadedGraph && <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-950 p-3 text-xs text-slate-200"><button onClick={() => setPlaying(!playing)} className="rounded bg-slate-800 p-2">{playing ? <Pause size={15} /> : <Play size={15} />}</button><button onClick={() => setPlayhead(0)} className="rounded bg-slate-800 p-2"><RotateCcw size={15} /></button><label>Speed <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="ml-1 bg-slate-800"><option value=".5">0.5x</option><option value="1">1x</option><option value="2">2x</option><option value="5">5x</option></select></label><input aria-label="Timeline replay" type="range" min="0" max={Math.max(timeline.length - 1, 0)} value={playhead} onChange={e => setPlayhead(Number(e.target.value))} className="flex-1" disabled={!timeline.length} /><span>{timeline.length ? timeline[playhead]?.timestamp : 'Timeline replay unavailable: timestamp data not available.'}</span></div>}
        </div>

        <div>
          {selectedEdge ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5 text-xs text-slate-200 space-y-2">
              <button onClick={() => setSelectedEdge(null)} className="float-right text-slate-400">×</button><h3 className="font-bold text-white">Connection details</h3>
              <p>{selectedEdge.source} → {selectedEdge.target}</p><p>Protocol: {selectedEdge.protocol} · Source ports: {(selectedEdge.src_ports || []).join(', ') || '—'} · Destination ports: {(selectedEdge.dst_ports || selectedEdge.ports || []).join(', ') || '—'}</p>
              <p>Packets: {selectedEdge.packet_count} · Bytes: {selectedEdge.byte_count} · Aggregated flows: {selectedEdge.flow_count}</p><p>Risk: {Math.round((selectedEdge.risk || 0) * 100)}% · Classification: {selectedEdge.classification}</p><p>First seen: {selectedEdge.first_seen || '—'} · Last seen: {selectedEdge.last_seen || '—'}</p>
              {selectedEdge.evidence?.length ? <p>Evidence: {selectedEdge.evidence.join('; ')}</p> : null}
            </div>
          ) : selectedNode ? (
            <NodeDetailsDrawer
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#ebdcc7] text-[#7a644c] text-xs font-mono">
              Select a network node to inspect available telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
