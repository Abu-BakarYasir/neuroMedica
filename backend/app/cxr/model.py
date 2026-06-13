"""DenseNet-121 with dual heads — the architecture the checkpoint was trained with.

CheXNet-style transfer learning:
  - DenseNet-121 backbone (the checkpoint carries the fine-tuned weights, so we
    instantiate without downloading ImageNet weights and let the state_dict fill in).
  - Shared 512-d feature layer.
  - Two heads: 14-way multi-label pathology head + binary Normal/Abnormal head.

Must stay structurally identical to the training definition or load_state_dict fails.
"""

from __future__ import annotations

import torch
import torch.nn as nn
from torchvision import models


class CheXVisionDenseNet(nn.Module):
    def __init__(self, num_classes: int = 14, dropout: float = 0.3) -> None:
        super().__init__()

        # weights=None: the fine-tuned checkpoint supplies every parameter, so
        # there's no need to fetch ImageNet weights at inference time.
        self.backbone = models.densenet121(weights=None)
        num_features = self.backbone.classifier.in_features
        self.backbone.classifier = nn.Identity()

        self.feature_layer = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout),
        )

        self.multilabel_head = nn.Linear(512, num_classes)
        self.binary_head = nn.Linear(512, 1)

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        features = self.backbone(x)
        features = self.feature_layer(features)
        return {
            "multilabel_logits": self.multilabel_head(features),
            "binary_logits": self.binary_head(features),
        }
