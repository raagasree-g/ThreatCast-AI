from __future__ import annotations

from pathlib import Path

import pandas as pd

from backend.ml.input_pipeline import dataframe_to_sequence


PACKET_FEATURES = [
    "Packet_Count",
    "Avg_Packet_Size",
    "Packet_Size_Variance",
    "TTL_Mean",
    "TTL_Variance",
    "TCP_Window_Mean",
    "TCP_Window_Variance",
    "TCP_SYN_Count",
    "TCP_ACK_Count",
    "TCP_RST_Count",
    "TCP_FIN_Count",
    "TCP_PSH_Count",
    "Fragmented_Packet_Count",
    "Unique_Source_IPs",
    "Unique_Destination_IPs",
    "Unique_Destination_Ports",
    "Max_Unique_Ports_Per_Source",
    "Port_Scan_Signature",
    "Scan_Entropy",
    "Window_Duration",
]


def load_packet_features(path: str | Path) -> pd.DataFrame:
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(path)

    df = pd.read_csv(path)

    missing = [
        column
        for column in PACKET_FEATURES
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Missing packet features: "
            + ", ".join(missing)
        )

    return df


def summarize_packet_evidence(
    df: pd.DataFrame,
) -> dict:
    latest = df.iloc[-1]

    return {
        "packet_count": float(
            latest["Packet_Count"]
        ),
        "syn_count": float(
            latest["TCP_SYN_Count"]
        ),
        "ack_count": float(
            latest["TCP_ACK_Count"]
        ),
        "rst_count": float(
            latest["TCP_RST_Count"]
        ),
        "unique_source_ips": float(
            latest["Unique_Source_IPs"]
        ),
        "unique_destination_ips": float(
            latest["Unique_Destination_IPs"]
        ),
        "unique_destination_ports": float(
            latest["Unique_Destination_Ports"]
        ),
        "port_scan_signature": float(
            latest["Port_Scan_Signature"]
        ),
        "scan_entropy": float(
            latest["Scan_Entropy"]
        ),
    }