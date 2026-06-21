"""1D ResNet for 12-lead ECG classification.

A compact residual CNN over ``(timesteps, 12)`` inputs (channels-last, the
Keras Conv1D default) with a **multi-label sigmoid** head over the 5 PTB-XL
diagnostic superclasses. This is the standard, well-benchmarked architecture
family for PTB-XL — deep enough to reach macro-AUC ~0.90+, small enough to
train on a single GPU (or slowly on CPU).

Shared by training (Phase 2) and the future inference path (Phase 3), so keep
this import side-effect free apart from the local ``keras`` import.
"""

from __future__ import annotations

from app.ecg.ptbxl.labels import N_CLASSES


def _residual_block(x, filters: int, kernel_size: int, downsample: bool, keras):
    """Two conv layers + identity/projection shortcut (pre-activation style)."""
    layers = keras.layers
    stride = 2 if downsample else 1

    shortcut = x
    if downsample or x.shape[-1] != filters:
        shortcut = layers.Conv1D(filters, 1, strides=stride, padding="same")(x)
        shortcut = layers.BatchNormalization()(shortcut)

    y = layers.Conv1D(filters, kernel_size, strides=stride, padding="same")(x)
    y = layers.BatchNormalization()(y)
    y = layers.ReLU()(y)
    y = layers.Dropout(0.2)(y)
    y = layers.Conv1D(filters, kernel_size, strides=1, padding="same")(y)
    y = layers.BatchNormalization()(y)

    y = layers.add([y, shortcut])
    y = layers.ReLU()(y)
    return y


def build_model(
    timesteps: int,
    n_leads: int = 12,
    n_classes: int = N_CLASSES,
    kernel_size: int = 7,
    stages=(64, 128, 192, 256),
    blocks_per_stage: int = 2,
):
    """Build and compile the model.

    Args:
        timesteps: signal length (1000 for 100 Hz × 10 s).
        stages: filter count per resolution stage; each stage halves the
            time axis once and stacks ``blocks_per_stage`` residual blocks.
    """
    import keras  # local import: keep TF cost off unrelated import paths

    layers = keras.layers
    inputs = keras.Input(shape=(timesteps, n_leads), name="ecg_12lead")

    # Stem.
    x = layers.Conv1D(stages[0], kernel_size, strides=1, padding="same")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)

    # Residual stages.
    for s, filters in enumerate(stages):
        for b in range(blocks_per_stage):
            # Downsample on the first block of every stage except the first.
            downsample = (b == 0 and s > 0)
            x = _residual_block(x, filters, kernel_size, downsample, keras)

    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(n_classes, activation="sigmoid", name="diagnoses")(x)

    model = keras.Model(inputs, outputs, name="ptbxl_resnet1d")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        # Macro AUC is the PTB-XL benchmark metric; track it during training.
        metrics=[
            keras.metrics.AUC(name="auc", multi_label=True, num_labels=n_classes),
        ],
    )
    return model
