from pathlib import Path
from typing import List

import numpy as np
import pandas as pd
import shap

from backend.ml.inference import (
    FEATURE_NAMES,
    SEQUENCE_LENGTH,
    _load_model,
    _load_scaler,
    predict_early_warning,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
NETWORK_STATES_PATH = (
    PROJECT_ROOT / "data" / "CTU13" / "all_network_states.csv"
)

_background_cache = None
_explainer_cache = None


def _load_background():
    global _background_cache

    if _background_cache is not None:
        return _background_cache

    if not NETWORK_STATES_PATH.exists():
        raise FileNotFoundError(
            f"CTU13 network states not found: {NETWORK_STATES_PATH}"
        )

    df = pd.read_csv(NETWORK_STATES_PATH)

    missing = [
        feature
        for feature in FEATURE_NAMES
        if feature not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing CTU13 features: {missing}"
        )

    values = (
        df[FEATURE_NAMES]
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
        .to_numpy(dtype=np.float32)
    )

    if len(values) < SEQUENCE_LENGTH:
        raise ValueError(
            "Not enough CTU13 states to build SHAP background."
        )

    scaler = _load_scaler()

    scaled = scaler.transform(
        pd.DataFrame(values, columns=FEATURE_NAMES)
    ).astype(np.float32)

    sequences = []

    step = max(1, len(scaled) // 40)

    for end in range(
        SEQUENCE_LENGTH,
        len(scaled) + 1,
        step,
    ):
        sequences.append(
            scaled[end - SEQUENCE_LENGTH:end]
        )

        if len(sequences) >= 40:
            break

    if not sequences:
        raise ValueError(
            "Unable to construct SHAP background sequences."
        )

    _background_cache = np.asarray(
        sequences,
        dtype=np.float32,
    )

    return _background_cache


def _get_explainer():
    global _explainer_cache

    if _explainer_cache is None:
        model = _load_model()
        background = _load_background()

        _explainer_cache = shap.GradientExplainer(
            model,
            background,
        )

    return _explainer_cache


def _normalize_shap_values(values):
    if isinstance(values, list):
        if len(values) != 1:
            raise ValueError(
                f"Expected one SHAP output, got {len(values)}."
            )
        values = values[0]

    values = np.asarray(values)

    if values.ndim == 4:
        if values.shape[-1] == 1:
            values = values[..., 0]
        else:
            values = values[..., 0]

    if values.ndim != 3:
        raise ValueError(
            f"Unexpected live SHAP shape: {values.shape}"
        )

    return values


def explain_sequence(sequence: List[List[float]]) -> dict:
    sequence_array = np.asarray(
        sequence,
        dtype=np.float32,
    )

    expected_shape = (
        SEQUENCE_LENGTH,
        len(FEATURE_NAMES),
    )

    if sequence_array.shape != expected_shape:
        raise ValueError(
            f"Expected sequence shape {expected_shape}, "
            f"received {sequence_array.shape}."
        )

    if not np.isfinite(sequence_array).all():
        raise ValueError(
            "Input sequence contains NaN or infinite values."
        )

    prediction = predict_early_warning(
        sequence_array.tolist()
    )

    scaler = _load_scaler()

    sequence_df = pd.DataFrame(
        sequence_array,
        columns=FEATURE_NAMES,
    )

    scaled_sequence = scaler.transform(
        sequence_df
    ).astype(np.float32)

    model_input = np.expand_dims(
        scaled_sequence,
        axis=0,
    )

    explainer = _get_explainer()

    shap_values = explainer.shap_values(
        model_input
    )

    shap_values = _normalize_shap_values(
        shap_values
    )

    sample_shap = shap_values[0]

    feature_values = sample_shap.mean(axis=0)

    timestep_values = np.abs(sample_shap).sum(axis=1)

    feature_records = []

    for index, feature_name in enumerate(FEATURE_NAMES):
        value = float(feature_values[index])

        feature_records.append(
            {
                "feature": feature_name,
                "shap_value": value,
                "absolute_shap": abs(value),
                "direction": (
                    "increases warning probability"
                    if value > 0
                    else "decreases warning probability"
                    if value < 0
                    else "neutral"
                ),
                "current_value": float(
                    sequence_array[-1, index]
                ),
            }
        )

    feature_records.sort(
        key=lambda item: item["absolute_shap"],
        reverse=True,
    )

    timestep_labels = [
        "T-4",
        "T-3",
        "T-2",
        "T-1",
        "Current state",
    ]

    total_timestep = float(
        timestep_values.sum()
    )

    timestep_records = []

    for index, label in enumerate(timestep_labels):
        raw_value = float(timestep_values[index])

        percentage = (
            raw_value / total_timestep * 100.0
            if total_timestep > 0
            else 0.0
        )

        timestep_records.append(
            {
                "timestep": index + 1,
                "label": label,
                "absolute_shap": raw_value,
                "percentage": round(
                    percentage,
                    2,
                ),
            }
        )

    timestep_records.sort(
        key=lambda item: item["absolute_shap"],
        reverse=True,
    )

    return {
        "prediction": prediction,
        "explanation_method": (
            "LIVE SHAP GradientExplainer"
        ),
        "prediction_specific": True,
        "input_shape": list(sequence_array.shape),
        "features": FEATURE_NAMES,
        "feature_contributions": feature_records,
        "temporal_contributions": timestep_records,
        "note": (
            "SHAP values were computed live from "
            "the exact 5-state input used for this "
            "prediction. They are not loaded from "
            "a precomputed explanation file."
        ),
    }