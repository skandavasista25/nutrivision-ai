
import json
import torch
import torch.nn as nn
from pathlib import Path
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

# Device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])

# Dataset paths
base_path = Path("backend/ml/split_dataset")

train_data = datasets.ImageFolder(base_path / "train", transform=transform)
val_data = datasets.ImageFolder(base_path / "val", transform=transform)

print("Classes:", train_data.classes)
print("Training images:", len(train_data))
print("Validation images:", len(val_data))

assert train_data.classes == val_data.classes, "Class mismatch!"

# Data loaders
train_loader = DataLoader(train_data, batch_size=4, shuffle=True)
val_loader = DataLoader(val_data, batch_size=4, shuffle=False)

# MobileNetV3
weights = models.MobileNet_V3_Small_Weights.DEFAULT
model = models.mobilenet_v3_small(weights=weights)

# Freeze feature extractor
for param in model.parameters():
    param.requires_grad = False

# Replace classifier
input_features = model.classifier[3].in_features
model.classifier[3] = nn.Linear(input_features, len(train_data.classes))

model = model.to(device)

# Loss and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.classifier.parameters(), lr=0.001)

# Training
epochs = 10

for epoch in range(epochs):
    model.train()
    total_loss = 0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    # Validation
    model.eval()
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            predictions = outputs.argmax(dim=1)

            correct += (predictions == labels).sum().item()
            total += labels.size(0)

    print(
        f"Epoch {epoch + 1}/{epochs} | "
        f"Loss: {total_loss / len(train_loader):.4f} | "
        f"Validation accuracy: {100 * correct / total:.2f}%"
    )

# Save model and class names
Path("backend/ml").mkdir(parents=True, exist_ok=True)

torch.save(model.state_dict(), "backend/ml/food_classifier.pth")

with open("backend/ml/class_names.json", "w") as f:
    json.dump(train_data.classes, f)

print("Training complete!")
print("Model and class names saved!")
