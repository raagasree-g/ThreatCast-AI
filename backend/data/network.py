from pathlib import Path

import pandas as pd

from backend.ml.inference import FEATURE_NAMES
from backend.models.schemas import (
    NetworkGraphResponse,
    NetworkActivityResponse,
    NetworkNode,
    TrafficPoint,
    AuthPoint,
    RiskPoint,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

CTU13_STATES_PATH = (
    PROJECT_ROOT
    / "data"
    / "CTU13"
    / "all_network_states.csv"
)


def _load_ctu13_states() -> pd.DataFrame:
    """
    Load CTU13 aggregate network-state observations.
    """

    if not CTU13_STATES_PATH.exists():
        raise FileNotFoundError(
            f"CTU13 network states file not found: "
            f"{CTU13_STATES_PATH}"
        )

    df = pd.read_csv(CTU13_STATES_PATH)

    required_columns = [
        "Scenario",
        "Timestamp",
        *FEATURE_NAMES,
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            "CTU13 CSV is missing required columns: "
            f"{missing_columns}"
        )

    if df.empty:
        raise ValueError(
            "CTU13 network states CSV is empty."
        )

    df["Timestamp"] = pd.to_datetime(
        df["Timestamp"],
        errors="coerce",
    )

    df = df.dropna(
        subset=["Timestamp"]
    )

    for feature in FEATURE_NAMES:
        df[feature] = pd.to_numeric(
            df[feature],
            errors="coerce",
        )

    df = df.dropna(
        subset=FEATURE_NAMES
    )

    if df.empty:
        raise ValueError(
            "CTU13 network states contain no valid feature rows."
        )

    return df.sort_values(
        ["Scenario", "Timestamp"]
    )


def _get_latest_scenario_data() -> pd.DataFrame:
    """
    Get all states for the CTU13 scenario containing
    the latest timestamp.
    """

    df = _load_ctu13_states()

    latest_row = (
        df.sort_values("Timestamp")
        .iloc[-1]
    )

    latest_scenario = latest_row["Scenario"]

    scenario_df = (
        df[
            df["Scenario"] == latest_scenario
        ]
        .sort_values("Timestamp")
        .copy()
    )

    if scenario_df.empty:
        raise ValueError(
            f"No states found for scenario "
            f"{latest_scenario}."
        )

    return scenario_df


def get_network_graph() -> NetworkGraphResponse:
    """
    Return an aggregate CTU13 network representation.

    The deployed CTU13 LSTM does not infer individual hosts,
    compromised nodes, attack paths, or graph edges.

    Therefore no fabricated topology is returned.
    """

    scenario_df = _get_latest_scenario_data()

    latest_state = scenario_df.iloc[-1]

    scenario = str(
        latest_state["Scenario"]
    )

    timestamp = latest_state["Timestamp"]

    if hasattr(timestamp, "isoformat"):
        last_updated = timestamp.isoformat()
    else:
        last_updated = str(timestamp)

    aggregate_node = NetworkNode(
        id="ctu13-network",
        label=f"CTU13 Scenario {scenario}",
        type="gateway",
        ip="N/A",
        risk_score=0,
        state="normal",
        department="Network Aggregate",
        os="N/A",
        observed_activity=(
            "Aggregate network-state observation "
            "from CTU13 telemetry."
        ),
        predicted_action=(
            "No node-level prediction available "
            "from the CTU13 LSTM."
        ),
        active_connections=0,
        is_in_attack_path=False,
    )

    return NetworkGraphResponse(
        nodes=[aggregate_node],
        edges=[],
        attack_path_node_ids=[],
        forecasted_path_node_ids=[],
        high_risk_nodes_count=0,
        last_updated=last_updated,
    )


def get_network_activity() -> NetworkActivityResponse:
    """
    Return recent aggregate CTU13 network activity.

    CTU13 does not provide authentication or privilege-
    escalation event counts, so those values are not fabricated.
    """

    scenario_df = _get_latest_scenario_data()

    recent_states = (
        scenario_df
        .tail(12)
        .copy()
    )

    traffic_series = []
    auth_series = []
    risk_trend = []

    for _, row in recent_states.iterrows():

        timestamp = row["Timestamp"]

        if hasattr(timestamp, "strftime"):
            time_text = timestamp.strftime(
                "%H:%M:%S"
            )
        else:
            time_text = str(timestamp)

        total_bytes = max(
            float(row["Total_Bytes"]),
            0.0,
        )

        total_source_bytes = max(
            float(row["Total_Source_Bytes"]),
            0.0,
        )

        flow_count = max(
            float(row["Flow_Count"]),
            0.0,
        )

        bytes_in_mbps = (
            total_bytes
            * 8.0
            / 30.0
            / 1_000_000.0
        )

        bytes_out_mbps = (
            total_source_bytes
            * 8.0
            / 30.0
            / 1_000_000.0
        )

        flow_change = abs(
            float(row["Flow_Count_Change"])
        )

        anomalous_mbps = (
            flow_change
            * 8.0
            / 30.0
            / 1_000_000.0
        )

        traffic_series.append(
            TrafficPoint(
                time=time_text,
                bytes_in_mbps=round(
                    bytes_in_mbps,
                    6,
                ),
                bytes_out_mbps=round(
                    bytes_out_mbps,
                    6,
                ),
                anomalous_mbps=round(
                    anomalous_mbps,
                    6,
                ),
            )
        )

        auth_series.append(
            AuthPoint(
                time=time_text,
                successful_logins=0,
                failed_logins=0,
                privilege_escalations=0,
            )
        )

        activity_score = min(
            100,
            max(
                0,
                round(
                    flow_count / 10.0
                ),
            ),
        )

        risk_trend.append(
            RiskPoint(
                time=time_text,
                risk_score=activity_score,
                threat_events=0,
            )
        )

    latest_timestamp = (
        recent_states["Timestamp"].iloc[-1]
    )

    if hasattr(
        latest_timestamp,
        "isoformat",
    ):
        last_updated = (
            latest_timestamp.isoformat()
        )
    else:
        last_updated = str(
            latest_timestamp
        )

    return NetworkActivityResponse(
        traffic_series=traffic_series,
        auth_series=auth_series,
        risk_trend=risk_trend,
        last_updated=last_updated,
    )