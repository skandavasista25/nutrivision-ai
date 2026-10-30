
import random
import shutil
from pathlib import Path

# Original dataset
SOURCE = Path("backend/ml/dataset")

# New split dataset
OUTPUT = Path("backend/ml/split_dataset")

random.seed(42)

classes = ["burger", "dosa", "idli", "pizza", "rice"]
extensions = {".jpg", ".jpeg", ".png", ".webp"}

for category in classes:
    folder = SOURCE / category

    images = [
        img for img in folder.iterdir()
        if img.suffix.lower() in extensions
    ]

    random.shuffle(images)

    total = len(images)

    test_count = max(1, round(total * 0.15))
    val_count = max(1, round(total * 0.15))

    test_images = images[:test_count]
    val_images = images[test_count:test_count + val_count]
    train_images = images[test_count + val_count:]

    splits = {
        "train": train_images,
        "val": val_images,
        "test": test_images
    }

    for split, split_images in splits.items():
        destination = OUTPUT / split / category
        destination.mkdir(parents=True, exist_ok=True)

        for image in split_images:
            shutil.copy2(image, destination / image.name)

        print(f"{category} - {split}: {len(split_images)} images")

print("\nDataset splitting completed!")

