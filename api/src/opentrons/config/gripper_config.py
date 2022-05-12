from __future__ import annotations
from dataclasses import dataclass
import logging
from typing import Tuple
from typing_extensions import Literal

log = logging.getLogger(__name__)

GripperName = Literal["gripper"]
GripperModel = Literal["gripper_v1"]


@dataclass(frozen=True)
class GripperConfig:
    gripper_offset: Tuple[float, float, float]
    gripper_current: float
    display_name: str
    name: GripperName
    max_travel: float
    home_position: float
    steps_per_mm: float
    idle_current: float
    model: GripperModel
