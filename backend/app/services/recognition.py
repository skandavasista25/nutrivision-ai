
import io
import json
from pathlib import Path
from dataclasses import dataclass

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms


@dataclass
class Prediction:
    label: str
    confidence: float


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "ml" / "food_classifier.pth"
CLASSES_PATH = BASE_DIR / "ml" / "class_names.json"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_model = None
_classes = []


transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])


def load_model() -> None:
    global _model, _classes

    with open(CLASSES_PATH, "r") as f:
        _classes = json.load(f)

    model = models.mobilenet_v3_small(weights=None)

    input_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(
        input_features, len(_classes)
    )

    state_dict = torch.load(
        MODEL_PATH,
        map_location=device
    )

    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    _model = model

    print("NutriVision food recognition model loaded!")


def predict(image_bytes: bytes) -> list[Prediction]:
    if _model is None:
        raise RuntimeError("Recognition model is not loaded.")

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = _model(image_tensor)
        probabilities = torch.softmax(outputs, dim=1)

    top_count = min(3, len(_classes))
    scores, indices = torch.topk(probabilities, top_count)

    predictions = []

    for score, index in zip(scores[0], indices[0]):
        predictions.append(
            Prediction(
                label=_classes[index.item()],
                confidence=round(score.item(), 4)
            )
        )

    return predictions
