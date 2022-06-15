from __future__ import annotations
from dataclasses import dataclass
import logging
from typing import Tuple, Optional
from typing_extensions import Literal

log = logging.getLogger(__name__)

GripperName = Literal["gripper"]
GripperModel = Literal["gripper_v1"]

DEFAULT_GRIPPER_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]


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


DUMMY_GRIPPER_CONFIG = GripperConfig(
    gripper_offset=(0.0, 0.0, 0.0),
    gripper_current=1.0,
    display_name="dummy_gripper",
    name="gripper",
    max_travel=50.0,
    home_position=0.0,
    steps_per_mm=480.0,
    idle_current=0.2,
    model="gripper_v1",
)


def load(
    gripper_model: Optional[int] = None, gripper_id: Optional[int] = None
) -> GripperConfig:
    return DUMMY_GRIPPER_CONFIG  # TODO: load actual gripper config
