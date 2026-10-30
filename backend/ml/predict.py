
import torch
import torch.nn as nn
import json
import sys
from PIL import Image
from pathlib import Path
from torchvision import transforms, models

# Device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load class names
with open("backend/ml/class_names.json", "r") as f:
    classes = json.load(f)

# Load trained model architecture
model = models.mobilenet_v3_small(weights=None)

input_features = model.classifier[3].in_features
model.classifier[3] = nn.Linear(input_features, len(classes))

model.load_state_dict(
    torch.load(
        "backend/ml/food_classifier.pth",
        map_location=device
    )
)

model = model.to(device)
model.eval()

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])

def predict_food(image_path):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs, dim=1)

    confidence, predicted = probabilities.max(dim=1)

    food = classes[predicted.item()]
    score = confidence.item() * 100

    print("Predicted food:", food)
    print(f"Confidence: {score:.2f}%")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/ml/predict.py path_to_image")
    else:
        predict_food(sys.argv[1])
