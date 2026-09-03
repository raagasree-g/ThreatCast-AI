import os
import pickle
import random

import numpy as np
import pandas as pd
import tensorflow as tf

from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
)

# ============================================================
# REPRODUCIBILITY
# ============================================================

SEED = 42

random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)


# ============================================================
# PATHS
# ============================================================

DATA_FILE = r"E:\Projects\SIH\data\CTU13\all_network_states.csv"

MODEL_FILE = r"E:\Projects\SIH\lstm_early_warning_multiscenario.keras"
SCALER_FILE = r"E:\Projects\SIH\lstm_early_warning_scaler.pkl"


# ============================================================
# SCENARIO SPLIT
# ============================================================

TRAIN_SCENARIOS = [1, 2, 3, 6, 7, 8, 9, 10, 11]
VAL_SCENARIOS = [4, 5]
TEST_SCENARIOS = [12, 13]


# ============================================================
# MODEL FEATURES
# ============================================================

FEATURES = [
    "Flow_Count",
    "Total_Packets",
    "Total_Bytes",
    "Total_Source_Bytes",
    "Avg_Duration",
    "Avg_Packets_Per_Flow",
    "Avg_Bytes_Per_Flow",
    "Flow_Count_Change",
    "Total_Packets_Change",
    "Total_Bytes_Change",
    "Total_Source_Bytes_Change",
    "Avg_Duration_Change",
]

TARGET = "Target_Early_Warning"

SEQUENCE_LENGTH = 5

BATCH_SIZE = 32
EPOCHS = 100

# Prevent extreme class weighting
MAX_CLASS_WEIGHT = 10.0


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("THREATCAST - FINAL 13-SCENARIO LSTM")
print("5-MINUTE EARLY-WARNING EXPERIMENT")
print("=" * 70)

df = pd.read_csv(DATA_FILE)

df["Timestamp"] = pd.to_datetime(df["Timestamp"])

df = df.sort_values(
    ["Scenario", "Timestamp"]
).reset_index(drop=True)

print()
print(f"Dataset shape: {df.shape}")

print()
print("Scenario distribution:")
print(
    df["Scenario"]
    .value_counts()
    .sort_index()
)


# ============================================================
# VERIFY REQUIRED COLUMNS
# ============================================================

required_columns = (
    ["Scenario", "Timestamp", TARGET]
    + FEATURES
)

missing = [
    col for col in required_columns
    if col not in df.columns
]

if missing:
    raise ValueError(
        f"Missing required columns: {missing}"
    )


# ============================================================
# SCENARIO-LEVEL SPLIT
# ============================================================

train_df = df[
    df["Scenario"].isin(TRAIN_SCENARIOS)
].copy()

val_df = df[
    df["Scenario"].isin(VAL_SCENARIOS)
].copy()

test_df = df[
    df["Scenario"].isin(TEST_SCENARIOS)
].copy()


print()
print("=" * 70)
print("SCENARIO SPLIT")
print("=" * 70)

print()
print(
    f"Training scenarios   : {TRAIN_SCENARIOS}"
)

print(
    f"Validation scenarios : {VAL_SCENARIOS}"
)

print(
    f"Test scenarios       : {TEST_SCENARIOS}"
)

print()
print(
    f"Training states   : {len(train_df)}"
)

print(
    f"Validation states : {len(val_df)}"
)

print(
    f"Test states       : {len(test_df)}"
)

print()
print("Training target:")
print(train_df[TARGET].value_counts())

print()
print("Validation target:")
print(val_df[TARGET].value_counts())

print()
print("Test target:")
print(test_df[TARGET].value_counts())


# ============================================================
# SCALE FEATURES
#
# IMPORTANT:
# Scaler is fitted ONLY on training data.
# ============================================================
# Convert model features to floating-point
# so StandardScaler decimal values can be stored safely.
for data in [train_df, val_df, test_df]:
    data[FEATURES] = data[FEATURES].astype(float)
scaler = StandardScaler()

scaler.fit(
    train_df[FEATURES]
)

train_df.loc[:, FEATURES] = scaler.transform(
    train_df[FEATURES]
)

val_df.loc[:, FEATURES] = scaler.transform(
    val_df[FEATURES]
)

test_df.loc[:, FEATURES] = scaler.transform(
    test_df[FEATURES]
)


# ============================================================
# SAVE SCALER
# ============================================================

with open(SCALER_FILE, "wb") as f:
    pickle.dump(scaler, f)

print()
print(f"Scaler saved to: {SCALER_FILE}")


# ============================================================
# CREATE SEQUENCES
#
# Each scenario is handled independently.
#
# For the first states of a scenario, zero-padding is used
# instead of taking data from another scenario.
# ============================================================

def create_sequences(data):

    X = []
    y = []

    for scenario in sorted(
        data["Scenario"].unique()
    ):

        scenario_data = data[
            data["Scenario"] == scenario
        ].sort_values("Timestamp")

        feature_values = (
            scenario_data[FEATURES]
            .values
            .astype(np.float32)
        )

        targets = (
            scenario_data[TARGET]
            .values
            .astype(np.float32)
        )

        for i in range(len(scenario_data)):

            # Correct sequence start.
            # Maximum sequence length = 5.
            start = max(
                0,
                i - SEQUENCE_LENGTH + 1
            )

            sequence = feature_values[
                start:i + 1
            ]

            # Zero-padding at beginning
            if len(sequence) < SEQUENCE_LENGTH:

                padding = np.zeros(
                    (
                        SEQUENCE_LENGTH - len(sequence),
                        len(FEATURES)
                    ),
                    dtype=np.float32
                )

                sequence = np.vstack(
                    [padding, sequence]
                )

            X.append(sequence)

            y.append(targets[i])

    return (
        np.asarray(X, dtype=np.float32),
        np.asarray(y, dtype=np.float32)
    )


# ============================================================
# CREATE TRAIN / VAL / TEST SEQUENCES
# ============================================================

X_train, y_train = create_sequences(train_df)

X_val, y_val = create_sequences(val_df)

X_test, y_test = create_sequences(test_df)


print()
print("=" * 70)
print("SEQUENCE DATA")
print("=" * 70)

print()
print(f"X_train: {X_train.shape}")
print(f"y_train: {y_train.shape}")

print(
    f"X_val  : {X_val.shape}"
)

print(
    f"y_val  : {y_val.shape}"
)

print(
    f"X_test : {X_test.shape}"
)

print(
    f"y_test : {y_test.shape}"
)

print()
print(
    f"Training positives   : {int(y_train.sum())}"
)

print(
    f"Validation positives : {int(y_val.sum())}"
)

print(
    f"Test positives       : {int(y_test.sum())}"
)


# ============================================================
# CLASS WEIGHTS
# ============================================================

negative_count = np.sum(y_train == 0)
positive_count = np.sum(y_train == 1)

if positive_count == 0:
    raise ValueError(
        "Training set contains no positive samples."
    )

raw_positive_weight = (
    negative_count / positive_count
)

positive_weight = min(
    raw_positive_weight,
    MAX_CLASS_WEIGHT
)

class_weight = {
    0: 1.0,
    1: positive_weight,
}

print()
print("=" * 70)
print("CLASS WEIGHT")
print("=" * 70)

print(
    f"Raw positive weight : {raw_positive_weight:.4f}"
)

print(
    f"Used positive weight: {positive_weight:.4f}"
)


# ============================================================
# BUILD LSTM
# ============================================================

model = tf.keras.Sequential([
    tf.keras.layers.Input(
        shape=(
            SEQUENCE_LENGTH,
            len(FEATURES)
        )
    ),

    tf.keras.layers.LSTM(
        64,
        return_sequences=False
    ),

    tf.keras.layers.Dropout(0.30),

    tf.keras.layers.Dense(
        32,
        activation="relu"
    ),

    tf.keras.layers.Dropout(0.20),

    tf.keras.layers.Dense(
        1,
        activation="sigmoid"
    ),
])


model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=0.001
    ),

    loss="binary_crossentropy",

    metrics=[
        tf.keras.metrics.BinaryAccuracy(
            name="accuracy"
        ),

        tf.keras.metrics.Precision(
            name="precision"
        ),

        tf.keras.metrics.Recall(
            name="recall"
        ),

        tf.keras.metrics.AUC(
            name="roc_auc"
        ),

        tf.keras.metrics.AUC(
            name="pr_auc",
            curve="PR"
        ),
    ],
)


print()
print("=" * 70)
print("MODEL")
print("=" * 70)

model.summary()


# ============================================================
# CALLBACKS
# ============================================================

callbacks = [

    tf.keras.callbacks.EarlyStopping(
        monitor="val_pr_auc",
        mode="max",
        patience=15,
        restore_best_weights=True,
        verbose=1,
    ),

    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_pr_auc",
        mode="max",
        factor=0.5,
        patience=6,
        min_lr=1e-6,
        verbose=1,
    ),
]


# ============================================================
# TRAIN
# ============================================================

print()
print("=" * 70)
print("TRAINING")
print("=" * 70)

history = model.fit(
    X_train,
    y_train,

    validation_data=(
        X_val,
        y_val
    ),

    epochs=EPOCHS,

    batch_size=BATCH_SIZE,

    class_weight=class_weight,

    callbacks=callbacks,

    verbose=1,
)


# ============================================================
# SAVE MODEL
# ============================================================

model.save(
    MODEL_FILE
)

print()
print(
    f"Model saved to: {MODEL_FILE}"
)


# ============================================================
# VALIDATION PREDICTIONS
# ============================================================

val_prob = model.predict(
    X_val,
    verbose=0
).ravel()


# ============================================================
# SELECT THRESHOLD USING VALIDATION SET
#
# Threshold is selected ONLY using validation data.
# Test data remains untouched.
# ============================================================

thresholds = np.arange(
    0.05,
    0.96,
    0.01
)

best_threshold = 0.50
best_f1 = -1.0

for threshold in thresholds:

    val_pred = (
        val_prob >= threshold
    ).astype(int)

    score = f1_score(
        y_val,
        val_pred,
        zero_division=0
    )

    if score > best_f1:

        best_f1 = score
        best_threshold = threshold


val_pred = (
    val_prob >= best_threshold
).astype(int)


print()
print("=" * 70)
print("VALIDATION THRESHOLD")
print("=" * 70)

print(
    f"Best threshold: {best_threshold:.2f}"
)

print(
    f"Validation F1 : {best_f1:.4f}"
)

print(
    f"Validation recall: "
    f"{recall_score(y_val, val_pred, zero_division=0):.4f}"
)


# ============================================================
# FINAL TEST
# ============================================================

test_prob = model.predict(
    X_test,
    verbose=0
).ravel()

test_pred = (
    test_prob >= best_threshold
).astype(int)


# ============================================================
# METRICS
# ============================================================

accuracy = accuracy_score(
    y_test,
    test_pred
)

precision = precision_score(
    y_test,
    test_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    test_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    test_pred,
    zero_division=0
)

tn, fp, fn, tp = confusion_matrix(
    y_test,
    test_pred,
    labels=[0, 1]
).ravel()

fpr = (
    fp / (fp + tn)
    if (fp + tn) > 0
    else 0.0
)

roc_auc = roc_auc_score(
    y_test,
    test_prob
)

pr_auc = average_precision_score(
    y_test,
    test_prob
)


# ============================================================
# FINAL RESULTS
# ============================================================

print()
print("=" * 70)
print("FINAL TEST RESULTS")
print("=" * 70)

print(
    f"Test scenarios : {TEST_SCENARIOS}"
)

print(
    f"Threshold       : {best_threshold:.2f}"
)

print()

print(
    f"Accuracy        : {accuracy:.4f}"
)

print(
    f"Precision       : {precision:.4f}"
)

print(
    f"Recall          : {recall:.4f}"
)

print(
    f"F1 Score        : {f1:.4f}"
)

print(
    f"FPR             : {fpr:.4f}"
)

print(
    f"ROC-AUC         : {roc_auc:.4f}"
)

print(
    f"PR-AUC          : {pr_auc:.4f}"
)

print()

print("Confusion Matrix:")
print(
    f"TN: {tn}"
)

print(
    f"FP: {fp}"
)

print(
    f"FN: {fn}"
)

print(
    f"TP: {tp}"
)

print()
print("=" * 70)
print("FINAL LSTM EXPERIMENT COMPLETE")
print("=" * 70)