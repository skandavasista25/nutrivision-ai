"""Food recognition boundary.

Replace `load_model` / `predict` with a PyTorch or TensorFlow classifier later.
Until a model is loaded this module reports NotImplementedError so the API returns
HTTP 501 and the frontend never shows invented predictions.
"""
from dataclasses import dataclass


@dataclass
class Prediction:
    label: str
    confidence: float


_model = None


def load_model() -> None:
    """Load weights into `_model` (e.g. torch.load or tf.keras.models.load_model)."""
    global _model
    _model = None  # no model connected yet


def predict(image_bytes: bytes) -> list[Prediction]:
    if _model is None:
        raise NotImplementedError("No recognition model is loaded.")
    raise NotImplementedError  # run inference here and return top-k Prediction objects
