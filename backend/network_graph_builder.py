"""Build a host topology only from observed PCAP flow evidence.

The graph deliberately consumes the existing packet attribution output; it
does not participate in or alter the risk/world-model inference pipeline.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
import ipaddress
from typing import Any


# Centralized, evidence-score based classification.  ``flagged`` is the
# existing PCAP evidence decision (currently score >= 2); a non-flagged flow
# with observable evidence is suspicious, otherwise it is safe.
SAFE_THRESHOLD = 0.0
SUSPICIOUS_THRESHOLD = 0.0
ATTACK_THRESHOLD = 2.0
SERVER_PORTS = {21, 22, 23, 25, 53, 80, 110, 139, 143, 389, 443, 445, 636, 1433, 3306, 3389, 5432, 5900, 8080}


def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _timestamp(value: Any) -> str | None:
    value = _number(value, float("nan"))
    if value != value:
        return None
    return datetime.fromtimestamp(value, tz=timezone.utc).isoformat()


def _classification(flow: dict[str, Any]) -> str:
    score = _number(flow.get("evidence_score"))
    if bool(flow.get("flagged")) or score >= ATTACK_THRESHOLD:
        return "attack"
    if score > SUSPICIOUS_THRESHOLD:
        return "suspicious"
    return "safe"


def _external(ip: str) -> bool:
    try:
        return not ipaddress.ip_address(ip).is_private
    except ValueError:
        return False


def build_network_graph(
    packet_attribution: dict[str, Any] | None,
    *,
    stage_prediction: dict[str, Any] | None = None,
    show_all_nodes: bool = True,
) -> dict[str, Any]:
    """Serialize all observed PCAP entities and aggregated connections.

    ``show_all_nodes`` is intentionally retained in the contract for callers;
    the default and implementation preserve every observed endpoint.
    CSV inputs contain aggregate telemetry rather than host identities, so an
    honest empty/static payload is returned instead of fabricating a topology.
    """
    flows = (packet_attribution or {}).get("all_flows") or []
    if not isinstance(flows, list) or not flows:
        return {
            "available": False,
            "reason": "Network graph unavailable: host-level flow evidence is not available for this input.",
            "show_all_nodes": show_all_nodes,
            "nodes": [], "edges": [], "timeline": [],
            "statistics": {"total_nodes": 0, "total_edges": 0, "total_connections": 0, "raw_flow_count": 0, "total_packets": 0, "unique_ips": 0, "unique_ports": 0, "safe_flow_count": 0, "suspicious_flow_count": 0, "attack_flow_count": 0, "safe_flows": 0, "suspicious_flows": 0, "attack_flows": 0, "server_count": 0, "critical_asset_count": 0, "external_host_count": 0, "critical_assets": 0, "compromised_hosts": 0},
            "timeline_available": False,
        }

    aggregates: dict[tuple[str, str, str], dict[str, Any]] = {}
    node_data: dict[str, dict[str, Any]] = defaultdict(lambda: {"ports": set(), "destination_ports": set(), "protocols": set(), "in": 0, "out": 0, "packets": 0, "bytes": 0, "first": None, "last": None, "classes": set(), "reasons": []})
    timeline: list[dict[str, Any]] = []
    flow_counts = {"safe": 0, "suspicious": 0, "attack": 0}
    unique_ports: set[int] = set()

    for flow in flows:
        source, target = str(flow.get("src_ip") or ""), str(flow.get("dst_ip") or "")
        if not source or not target:
            continue
        protocol = str(flow.get("protocol") or "OTHER").upper()
        category = _classification(flow)
        flow_counts[category] += 1
        src_port, dst_port = int(_number(flow.get("src_port"))), int(_number(flow.get("dst_port")))
        unique_ports.update({src_port, dst_port})
        packets, byte_count = int(_number(flow.get("packet_count"))), int(_number(flow.get("byte_count")))
        first, last = _number(flow.get("first_seen"), float("nan")), _number(flow.get("last_seen"), float("nan"))
        key = (source, target, protocol)
        edge = aggregates.setdefault(key, {"source": source, "target": target, "protocol": protocol, "ports": set(), "src_ports": set(), "packet_count": 0, "byte_count": 0, "flow_count": 0, "first": first, "last": last, "risk": 0.0, "classification": category, "evidence": []})
        edge["ports"].add(dst_port); edge["src_ports"].add(src_port)
        edge["packet_count"] += packets; edge["byte_count"] += byte_count; edge["flow_count"] += 1
        edge["first"] = min(edge["first"], first) if edge["first"] is not None and first == first else (first if first == first else edge["first"])
        edge["last"] = max(edge["last"], last) if edge["last"] is not None and last == last else (last if last == last else edge["last"])
        edge["risk"] = max(edge["risk"], _number(flow.get("evidence_score")) / max(ATTACK_THRESHOLD, 1.0))
        if category == "attack" or (category == "suspicious" and edge["classification"] == "safe"): edge["classification"] = category
        edge["evidence"].extend(flow.get("evidence_reasons") or [])
        for ip, direction, port in ((source, "out", src_port), (target, "in", dst_port)):
            item = node_data[ip]; item[direction] += 1; item["ports"].add(port); item["protocols"].add(protocol); item["packets"] += packets; item["bytes"] += byte_count; item["classes"].add(category); item["reasons"].extend(flow.get("evidence_reasons") or [])
            if direction == "in":
                item["destination_ports"].add(port)
            item["first"] = min(item["first"], first) if item["first"] is not None and first == first else (first if first == first else item["first"])
            item["last"] = max(item["last"], last) if item["last"] is not None and last == last else (last if last == last else item["last"])

    nodes = []
    for ip, data in node_data.items():
        attack_source = any(edge["source"] == ip and edge["classification"] == "attack" for edge in aggregates.values())
        # A service role is inferred only from ports observed as destinations,
        # never from an ephemeral source port.
        server = bool(data["destination_ports"] & SERVER_PORTS)
        status = "compromised" if attack_source else ("suspicious" if "suspicious" in data["classes"] or "attack" in data["classes"] else "safe")
        node_type = "attacker" if attack_source else ("server" if server else ("external_host" if _external(ip) else "endpoint"))
        risk = 100 if attack_source else (65 if "attack" in data["classes"] else (45 if "suspicious" in data["classes"] else 0))
        nodes.append({"id": ip, "label": ip, "ip": ip, "type": node_type, "status": status, "state": status, "risk": risk, "risk_score": risk, "degree": data["in"] + data["out"], "in_degree": data["in"], "out_degree": data["out"], "active_connections": data["in"] + data["out"], "is_in_attack_path": attack_source, "first_seen": _timestamp(data["first"]), "last_seen": _timestamp(data["last"]), "ports": sorted(data["ports"]), "protocols": sorted(data["protocols"]), "packet_count": data["packets"], "byte_count": data["bytes"], "recent_activity": list(dict.fromkeys(data["reasons"]))[:5], "attack_stage": (stage_prediction or {}).get("primary_stage", {}).get("name") if status == "compromised" else None})

    edges = []
    for index, edge in enumerate(aggregates.values()):
        edges.append({"id": f"flow:{index}:{edge['source']}:{edge['target']}:{edge['protocol']}", "source": edge["source"], "target": edge["target"], "protocol": edge["protocol"], "src_ports": sorted(edge["src_ports"]), "ports": sorted(edge["ports"]), "dst_ports": sorted(edge["ports"]), "packet_count": edge["packet_count"], "byte_count": edge["byte_count"], "flow_count": edge["flow_count"], "first_seen": _timestamp(edge["first"]), "last_seen": _timestamp(edge["last"]), "risk": round(min(edge["risk"], 1.0), 3), "classification": edge["classification"], "status": edge["classification"], "is_attack_path": edge["classification"] == "attack", "evidence": list(dict.fromkeys(edge["evidence"]))})
        if edge["first"] == edge["first"]:
            timeline.append({"timestamp": _timestamp(edge["first"]), "edge_id": edges[-1]["id"], "source": edge["source"], "target": edge["target"], "classification": edge["classification"]})
    timeline.sort(key=lambda event: event["timestamp"] or "")
    server_count = sum(node["type"] == "server" for node in nodes)
    stats = {"total_nodes": len(nodes), "total_edges": len(edges), "total_connections": len(edges), "raw_flow_count": sum(flow_counts.values()), "total_packets": sum(node["packet_count"] for node in nodes) // 2, "unique_ips": len(nodes), "unique_ports": len(unique_ports), "safe_flow_count": flow_counts["safe"], "suspicious_flow_count": flow_counts["suspicious"], "attack_flow_count": flow_counts["attack"], "safe_flows": flow_counts["safe"], "suspicious_flows": flow_counts["suspicious"], "attack_flows": flow_counts["attack"], "server_count": server_count, "critical_asset_count": server_count, "external_host_count": sum(node["type"] == "external_host" for node in nodes), "critical_assets": server_count, "compromised_hosts": sum(node["status"] == "compromised" for node in nodes)}
    return {"available": True, "show_all_nodes": show_all_nodes, "classification_rule": "attack: existing flagged evidence or score >= 2; suspicious: non-flagged evidence score > 0; safe: score = 0", "nodes": nodes, "edges": edges, "timeline": timeline, "timeline_available": bool(timeline), "statistics": stats, "attack_path_node_ids": [node["id"] for node in nodes if node["status"] == "compromised"]}
