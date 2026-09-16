from backend.ml.pcap_attribution import analyze_pcap_attribution
from backend.network_graph_builder import build_network_graph
from fastapi.testclient import TestClient
from backend.main import app


def _flows():
    return analyze_pcap_attribution("threatcast_flagged_flow_test.pcap", limit=100)


def test_graph_contains_all_observed_nodes():
    raw = _flows()
    graph = build_network_graph(raw)
    observed = {flow["src_ip"] for flow in raw["all_flows"]} | {flow["dst_ip"] for flow in raw["all_flows"]}
    assert {node["ip"] for node in graph["nodes"]} == observed


def test_graph_contains_safe_and_attack_connections():
    graph = build_network_graph(_flows())
    assert {edge["classification"] for edge in graph["edges"]} >= {"safe", "attack"}


def test_safe_suspicious_attack_classification():
    flows = [
        {"src_ip": "1.1.1.1", "dst_ip": "1.1.1.2", "protocol": "TCP", "first_seen": 1, "last_seen": 1, "packet_count": 1, "byte_count": 1, "evidence_score": 0, "flagged": False},
        {"src_ip": "2.2.2.1", "dst_ip": "2.2.2.2", "protocol": "TCP", "first_seen": 2, "last_seen": 2, "packet_count": 1, "byte_count": 1, "evidence_score": 1, "flagged": False},
        {"src_ip": "3.3.3.1", "dst_ip": "3.3.3.2", "protocol": "TCP", "first_seen": 3, "last_seen": 3, "packet_count": 1, "byte_count": 1, "evidence_score": 2, "flagged": True},
    ]
    graph = build_network_graph({"all_flows": flows})
    assert {edge["classification"] for edge in graph["edges"]} == {"safe", "suspicious", "attack"}


def test_graph_uses_real_timestamps_and_statistics():
    raw = _flows()
    graph = build_network_graph(raw)
    assert graph["timeline_available"] is True
    assert graph["timeline"][0]["timestamp"]
    assert graph["statistics"]["raw_flow_count"] == len(raw["all_flows"])
    assert graph["statistics"]["total_nodes"] == len(graph["nodes"])


def test_empty_graph_is_honest():
    graph = build_network_graph(None)
    assert graph["available"] is False
    assert graph["nodes"] == []


def test_aggregation_preserves_nodes_and_reduces_connections():
    raw = _flows()
    duplicated = {**raw, "all_flows": raw["all_flows"] + raw["all_flows"]}
    graph = build_network_graph(duplicated)
    assert graph["statistics"]["raw_flow_count"] == len(duplicated["all_flows"])
    assert graph["statistics"]["total_connections"] < graph["statistics"]["raw_flow_count"]


def test_pcap_upload_api_includes_real_network_graph():
    with TestClient(app) as client, open("threatcast_flagged_flow_test.pcap", "rb") as capture:
        response = client.post(
            "/api/world-model/risk",
            files={"file": ("threatcast_flagged_flow_test.pcap", capture, "application/vnd.tcpdump.pcap")},
        )
    assert response.status_code == 200
    graph = response.json()["network_graph"]
    assert len(graph["nodes"]) > 0 and len(graph["edges"]) > 0
    observed = {flow["src_ip"] for flow in _flows()["all_flows"]} | {flow["dst_ip"] for flow in _flows()["all_flows"]}
    assert observed == {node["ip"] for node in graph["nodes"]}


def _flow(source, target, *, score=0, flagged=False, timestamp=1, port=443):
    return {
        "src_ip": source, "dst_ip": target, "protocol": "TCP",
        "src_port": 40000, "dst_port": port, "first_seen": timestamp,
        "last_seen": timestamp + 1, "packet_count": 2, "byte_count": 120,
        "evidence_score": score, "flagged": flagged,
        "evidence_reasons": ["test evidence"] if score else [],
    }


def test_all_observed_ips_become_nodes():
    flows = [_flow("10.0.0.1", "10.0.0.2"), _flow("10.0.0.3", "10.0.0.1")]
    graph = build_network_graph({"all_flows": flows})
    assert {node["ip"] for node in graph["nodes"]} == {"10.0.0.1", "10.0.0.2", "10.0.0.3"}


def test_all_connection_relationships_are_preserved():
    flows = [_flow("10.0.0.1", "10.0.0.2"), _flow("10.0.0.2", "10.0.0.1")]
    graph = build_network_graph({"all_flows": flows})
    assert {(edge["source"], edge["target"]) for edge in graph["edges"]} == {("10.0.0.1", "10.0.0.2"), ("10.0.0.2", "10.0.0.1")}


def test_duplicate_flows_are_aggregated():
    graph = build_network_graph({"all_flows": [_flow("10.0.0.1", "10.0.0.2"), _flow("10.0.0.1", "10.0.0.2", timestamp=5)]})
    assert len(graph["edges"]) == 1
    assert graph["edges"][0]["flow_count"] == 2


def test_safe_edges_are_preserved():
    assert build_network_graph({"all_flows": [_flow("10.0.0.1", "10.0.0.2")]})["edges"][0]["classification"] == "safe"


def test_suspicious_edges_are_preserved():
    assert build_network_graph({"all_flows": [_flow("10.0.0.1", "10.0.0.2", score=1)]})["edges"][0]["classification"] == "suspicious"


def test_attack_edges_are_preserved():
    assert build_network_graph({"all_flows": [_flow("10.0.0.1", "10.0.0.2", score=2, flagged=True)]})["edges"][0]["classification"] == "attack"


def test_attack_overlay_does_not_remove_safe_nodes():
    graph = build_network_graph({"all_flows": [_flow("10.0.0.1", "10.0.0.2", score=2, flagged=True), _flow("10.0.0.3", "10.0.0.4")]})
    assert {node["ip"] for node in graph["nodes"]} == {"10.0.0.1", "10.0.0.2", "10.0.0.3", "10.0.0.4"}


def test_node_statistics_are_backend_derived():
    graph = build_network_graph({"all_flows": [_flow("10.0.0.1", "10.0.0.2", port=443)]})
    node = next(item for item in graph["nodes"] if item["ip"] == "10.0.0.2")
    assert node["in_degree"] == 1 and node["ports"] == [443]
    assert graph["statistics"]["server_count"] == 1


def test_no_fake_nodes_are_created():
    graph = build_network_graph({"all_flows": [_flow("10.0.0.1", "10.0.0.2")]})
    assert graph["statistics"]["total_nodes"] == 2


def test_timeline_uses_actual_timestamps():
    graph = build_network_graph({"all_flows": [_flow("10.0.0.1", "10.0.0.2", timestamp=1_700_000_000)]})
    assert graph["timeline"][0]["timestamp"] == "2023-11-14T22:13:20+00:00"


def test_graph_scales_to_larger_topology():
    # An in-memory fixture exercises aggregation at scale; production graph
    # data is still sourced only from parsed captures.
    flows = [_flow(f"10.0.0.{index}", f"10.0.1.{index}", timestamp=index) for index in range(1, 51)]
    graph = build_network_graph({"all_flows": flows})
    assert graph["statistics"]["total_nodes"] == 100
    assert graph["statistics"]["total_edges"] == 50
