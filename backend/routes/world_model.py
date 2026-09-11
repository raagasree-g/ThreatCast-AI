from __future__ import annotations

from pathlib import Path

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
)

from backend.data.flagged_flows import (
    get_flagged_flows,
)

from backend.ml.inference import (
    FEATURE_NAMES,
    SEQUENCE_LENGTH,
    predict_early_warning,
)

from backend.ml.input_pipeline import (
    prepare_uploaded_csv,
)

from world_model.attack_stage import (
    get_primary_stage,
    get_scenario_stages,
)

from world_model.ctu13_risk_inference import (
    predict_world_model,
    predict_world_model_batch,
)


router = APIRouter(
    prefix="/api/world-model",
    tags=["World Model"],
)


# ============================================================
# HELPERS
# ============================================================

def _validate_scenario(
    scenario: int | None,
) -> None:
    if scenario is not None and not 1 <= scenario <= 13:
        raise HTTPException(
            status_code=400,
            detail="CTU13 scenario must be between 1 and 13.",
        )


def _get_stage(
    scenario: int | None,
) -> dict | None:

    if scenario is None:
        return None

    if not 1 <= scenario <= 13:
        return None

    return get_primary_stage(scenario)


def _save_upload(
    file: UploadFile,
) -> tuple[Path, Path]:

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename supplied.",
        )

    suffix = Path(
        file.filename
    ).suffix.lower()

    if suffix != ".csv":
        raise HTTPException(
            status_code=400,
            detail="This endpoint accepts CSV files.",
        )

    upload_dir = (
        Path("backend")
        / "data"
        / "uploads"
    )

    upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    temp_path = (
        upload_dir
        / Path(file.filename).name
    )

    return temp_path, upload_dir


def _build_world_model_sequences(
    dataframe,
) -> list[list[list[float]]]:

    if len(dataframe) < SEQUENCE_LENGTH:
        raise ValueError(
            f"At least {SEQUENCE_LENGTH} temporal states "
            f"are required. Received {len(dataframe)}."
        )

    values = (
        dataframe[
            FEATURE_NAMES
        ]
        .astype(float)
        .to_numpy()
    )

    sequences = []

    for end_index in range(
        SEQUENCE_LENGTH,
        len(values) + 1,
    ):

        start_index = (
            end_index - SEQUENCE_LENGTH
        )

        sequence = values[
            start_index:end_index
        ]

        sequences.append(
            sequence.tolist()
        )

    return sequences


# ============================================================
# ATT&CK ACTIVITY INTERPRETATION
# ============================================================

@router.get("/stage/{scenario}")
def get_stage(
    scenario: int,
):
    """
    Return documented CTU13 activity -> ATT&CK interpretation.

    IMPORTANT:
    This is NOT a trained MITRE ATT&CK classifier because
    CTU13 does not provide ground-truth MITRE stage labels.
    """

    _validate_scenario(scenario)

    stages = get_scenario_stages(
        scenario
    )

    primary = get_primary_stage(
        scenario
    )

    return {
        "scenario": scenario,
        "primary_stage": primary,
        "stages": stages,
        "source": (
            "CTU13 documented activity interpretation"
        ),
        "trained_stage_classifier": False,
        "note": (
            "CTU13 does not provide ground-truth "
            "MITRE ATT&CK stage labels. These are "
            "activity-level interpretations and must "
            "not be presented as trained stage predictions."
        ),
    }


# ============================================================
# PRODUCTION LSTM MODEL INFORMATION
# ============================================================

@router.get("/model-info")
def model_info():
    return {
        "model": "CTU13 LSTM Early Warning",
        "sequence_length": SEQUENCE_LENGTH,
        "feature_count": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "input_format": (
            "5 temporal states × 12 features"
        ),
        "state_duration": "30 seconds",
        "temporal_context": "150 seconds",
        "warning_threshold": 0.08,
    }


# ============================================================
# CSV -> PRODUCTION LSTM INFERENCE
# ============================================================

@router.post("/csv")
async def run_csv_inference(
    file: UploadFile = File(...),
    scenario: int | None = None,
):
    """
    Run the existing production CTU13 LSTM on an uploaded CSV.
    """

    _validate_scenario(scenario)

    temp_path, _ = _save_upload(file)

    try:

        content = await file.read()

        temp_path.write_bytes(
            content
        )

        result = prepare_uploaded_csv(
            temp_path,
            scenario=scenario,
        )

        dataframe = result[
            "dataframe"
        ]

        payload = result[
            "payload"
        ]

        prediction = predict_early_warning(
            payload[
                "sequence"
            ]
        )

        detected_scenario = scenario

        if (
            detected_scenario is None
            and "Scenario" in dataframe.columns
            and len(dataframe) > 0
        ):
            detected_scenario = int(
                dataframe[
                    "Scenario"
                ].iloc[-1]
            )

        stage = _get_stage(
            detected_scenario
        )

        return {
            "success": True,
            "pipeline": (
                "CSV → CTU13 LSTM"
            ),
            "filename": file.filename,
            "scenario": detected_scenario,
            "states": len(dataframe),
            "sequence_length": (
                SEQUENCE_LENGTH
            ),
            "features": FEATURE_NAMES,
            "prediction": prediction,
            "stage_interpretation": stage,
            "input": {
                "timestamps": payload[
                    "timestamps"
                ],
                "sequence": payload[
                    "sequence"
                ],
            },
            "research_note": (
                "Inference uses the existing CTU13 "
                "LSTM model and scaler. Attack labels "
                "are not used as model inputs."
            ),
        }

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    finally:

        try:
            temp_path.unlink(
                missing_ok=True
            )
        except Exception:
            pass


# ============================================================
# CSV -> TRAINED WORLD MODEL RISK ROLLOUT
# ============================================================

@router.post("/risk")
async def world_model_risk(
    file: UploadFile = File(...),
    scenario: int | None = None,
):
    """
    Run the trained CTU13 risk world model.

    The complete uploaded scenario is converted into
    chronological 5-state windows. Raw risk logits from
    all windows are collected first so the frozen
    scenario-adaptive calibration can calculate the
    scenario score distribution.

    The API returns the calibrated prediction for the
    latest available 5-state window.
    """

    _validate_scenario(scenario)

    temp_path, _ = _save_upload(file)

    try:

        content = await file.read()

        temp_path.write_bytes(
            content
        )

        result = prepare_uploaded_csv(
            temp_path,
            scenario=scenario,
        )

        dataframe = result[
            "dataframe"
        ]

        payload = result[
            "payload"
        ]

        sequences = (
            _build_world_model_sequences(
                dataframe
            )
        )

        world_model_result = (
            predict_world_model_batch(
                sequences
            )
        )

        detected_scenario = scenario

        if (
            detected_scenario is None
            and "Scenario" in dataframe.columns
            and len(dataframe) > 0
        ):
            detected_scenario = int(
                dataframe[
                    "Scenario"
                ].iloc[-1]
            )

        stage = _get_stage(
            detected_scenario
        )

        return {
            "success": True,
            "pipeline": (
                "CSV → CTU13 Risk World Model"
            ),
            "filename": file.filename,
            "scenario": detected_scenario,
            "states": len(dataframe),
            "input": payload,
            "world_model": world_model_result,
            "stage_interpretation": stage,
        }

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    finally:

        try:
            temp_path.unlink(
                missing_ok=True
            )
        except Exception:
            pass


# ============================================================
# FLAGGED FLOW EVIDENCE
# ============================================================

@router.get("/flagged-flows")
def flagged_flows(
    path: str,
    limit: int = 100,
):
    """
    Return suspicious flow records from a CTU13
    .binetflow file.
    """

    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=400,
            detail="limit must be between 1 and 1000.",
        )

    try:

        flows = get_flagged_flows(
            path,
            limit=limit,
        )

        return {
            "count": len(flows),
            "flows": flows,
        }

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc