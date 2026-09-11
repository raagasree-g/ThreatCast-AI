# ThreatCast AI

### AI-Powered Early Warning for Network Threats

ThreatCast is an explainable cybersecurity intelligence platform that predicts whether a network state is likely to transition into an attack condition within a future warning horizon.

The production system uses a temporal LSTM trained on the CTU13 botnet dataset. Network traffic is converted into 30-second network states, represented using 12 engineered temporal features, and evaluated using a 5-state temporal window.

ThreatCast combines:

- Temporal deep learning
- Early-warning prediction
- SHAP-based explainability
- MITRE ATT&CK-oriented threat interpretation
- Neo4j graph-based data storage
- FastAPI backend services
- React cybersecurity dashboard
- Packet-level graph research
- GraphSAGE-style representation learning
- Temporal Transformer-based latent forecasting

---

## 1. System Overview

ThreatCast is designed around a simple production principle:

> **Observe network behavior → model temporal evolution → predict early warning → explain the prediction → present actionable intelligence.**

The production inference pipeline is:

```text
CTU13 Network Flows
        ↓
30-Second Network-State Aggregation
        ↓
12 Engineered Features
        ↓
5 × 30-Second Temporal Window
        ↓
CTU13 LSTM
        ↓
Early-Warning Probability
        ↓
8% Decision Threshold
        ↓
Normal / Early Warning
        ↓
SHAP Explanation
        ↓
FastAPI
        ↓
Neo4j
        ↓
React Dashboard