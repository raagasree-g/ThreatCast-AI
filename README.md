# ThreatCast-AI: AI-Based Network Attack Forecasting

**SIH 2026 Submission | Problem Statement ID: PS26153**
*Title: AI-Based Network Attack Forecasting from Network Traffic Data*

---

## Executive Summary
ThreatCast-AI is an end-to-end network attack forecasting framework designed to predict cyber attack progression before security breaches fully manifest. Unlike conventional static intrusion detection systems (IDS) that trigger post-breach reactive alerts, ThreatCast-AI models **network state transition dynamics** using a **Dual-Head World Model LSTM** to provide early warning attack predictions with an autoregressive $k=3$ step forward rollout.

---

## Key Features & PS26153 Technical Capabilities

1. **Dual-Head World Model LSTM (`world_model_lstm.py`)**:
   - **State Regression Head (`state_head`)**: Predicts the continuous 12-feature raw network state vector $x_{t+1}$ at time $t+1$ (MSE Loss).
   - **Infiltration Classification Head (`infil_head`)**: Predicts early-warning attack probability $P(t+1)$ (BCE Loss).
   - **Autoregressive $k$-Step Rollout**: Implements `k_step_rollout(model, x, k=3)` feeding predicted feature vectors back into future sequence buffers across $k=3$ steps.

2. **Honest Baseline Benchmarking (`compare_baselines.py`)**:
   - Compares **Single-Window Logistic Regression** ($F1 = 0.0333$), **5-Window Sequence-Flattened Logistic Regression** ($F1 = 0.2397$), and **5-Window LSTM** ($F1 = 0.2759$) on identical test splits.
   - Demonstrates measurable F1 score improvements from temporal sequence modeling.

3. **Flag-Derived Pseudo-Packet Features**:
   - Computes TCP flag ratio aggregates (`syn_ratio`, `fin_ratio`, `rst_ratio`, `syn_without_ack_count`) for CTU-13 (`create_network_states.py`) and DAPT2020 (`create_dapt2020_states.py`).

4. **Explainability & ATT&CK Alignment**:
   - SHAP feature attribution (`explain_lstm_shap.py`, `explain_dapt2020_shap.py`).
   - MITRE ATT&CK mapping with confidence scoring (`mitre_attack_mapping.py`, `mitre_dapt2020_mapping.py`).

5. **Full-Stack Application & Neo4j Integration**:
   - FastAPI REST API service (`backend/main.py`).
   - React + Vite dashboard frontend (`frontend/`).
   - Neo4j graph database integration for network topology.

---

## Core Scripts & Execution

### 1. Run World Model Dual-Head LSTM
```bash
python world_model_lstm.py
```

### 2. Run Baseline Comparisons
```bash
python compare_baselines.py
```

### 3. Run Preprocessing & Datasets
```bash
python preprocess_ctu.py
python create_all_network_states.py
python create_sequences.py
```

---

## Documentation
For complete technical details, mathematical formulations, multi-task loss definitions, baseline metric tables, and cross-scenario generalization analysis, refer to [architecture_document.md](architecture_document.md).
