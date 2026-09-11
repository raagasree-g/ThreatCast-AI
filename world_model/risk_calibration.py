
"""
Runtime helper for CTU13 scenario-adaptive calibrated risk probabilities.

Use this helper AFTER the world-model endpoint has collected all raw risk
logits for the requested scenario.

Example:
    from world_model.risk_calibration import load_calibration, calibrate_logits

    calibration = load_calibration()
    probabilities = calibrate_logits(
        raw_logits,
        horizon=1,
        calibration=calibration,
    )

`raw_logits` must contain all rollout logits for that horizon in the current
scenario. The helper performs the same unlabeled scenario z-normalization
used during offline calibration, then applies the frozen Platt parameters.
"""

from pathlib import Path
import json
import numpy as np


CALIBRATION_PATH = (
    Path(__file__).resolve().parent
    / "checkpoints"
    / "ctu13_risk"
    / "risk_calibration.json"
)

EPS = 1e-6


def load_calibration(path=CALIBRATION_PATH):
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"Risk calibration artifact not found: {path}"
        )

    with open(path, "r", encoding="utf-8") as f:
        calibration = json.load(f)

    if calibration.get("method") != "scenario_zscore_platt":
        raise ValueError(
            "Unsupported risk calibration method: "
            f"{calibration.get('method')}"
        )

    return calibration


def calibrate_logits(
    raw_logits,
    horizon,
    calibration=None,
):
    if calibration is None:
        calibration = load_calibration()

    key = f"T+{int(horizon)}"

    if key not in calibration["horizons"]:
        raise KeyError(
            f"No calibration parameters for {key}"
        )

    logits = np.asarray(raw_logits, dtype=np.float64)

    if logits.size == 0:
        raise ValueError(
            "Cannot calibrate an empty logit array."
        )

    mean = float(np.mean(logits))
    std = float(np.std(logits))

    if not np.isfinite(std) or std < EPS:
        std = 1.0

    z = (logits - mean) / std

    params = calibration["horizons"][key]

    A = float(params["platt_A"])
    B = float(params["platt_B"])

    transformed = np.clip(
        A * z + B,
        -60.0,
        60.0,
    )

    probabilities = (
        1.0 / (1.0 + np.exp(-transformed))
    )

    return probabilities.astype(float)


def get_threshold(horizon, calibration=None):
    if calibration is None:
        calibration = load_calibration()

    key = f"T+{int(horizon)}"

    return float(
        calibration["horizons"][key]["threshold"]
    )
