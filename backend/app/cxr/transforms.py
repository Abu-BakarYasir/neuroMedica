"""Evaluation preprocessing for chest X-ray inference.

Mirrors the eval pipeline the model was served with: resize to 320x320, convert
to a tensor, and apply ImageNet normalization (the DenseNet-121 backbone was
pretrained on ImageNet, so its statistics are the standard choice even for
grayscale radiographs rendered as 3-channel RGB). No augmentation, no CLAHE —
keeping inference dependency-light (no OpenCV) and deterministic.
"""

from __future__ import annotations

from torchvision import transforms

IMAGE_SIZE = 320

# ImageNet normalization statistics (backbone was pretrained on ImageNet).
_IMAGENET_MEAN = [0.485, 0.456, 0.406]
_IMAGENET_STD = [0.229, 0.224, 0.225]


def get_eval_transforms(image_size: int = IMAGE_SIZE) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=_IMAGENET_MEAN, std=_IMAGENET_STD),
        ]
    )
