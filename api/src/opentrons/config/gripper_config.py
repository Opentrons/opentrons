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
    z_idle_current: float
    z_active_current: float
    jaw_reference_voltage: float
    jaw_force_per_duty_cycle: List[Tuple[float, int]]
    base_offset_from_mount: Offset
    jaw_center_offset_from_base: Offset
    pin_one_offset_from_base: Offset
    pin_two_offset_from_base: Offset
    quirks: List[str]


def _verify_value(
    def_specs: GripperCustomizableFloat, override: Optional[float] = None
) -> float:
    if override and def_specs.min <= override <= def_specs.max:
        return override
    return def_specs.default_value


def _get_offset(def_offset: GripperOffset) -> Offset:
    return (def_offset.x, def_offset.y, def_offset.z)


def info_num_to_model(num: int) -> GripperModel:
    model_map = {0: GripperModel.V1}
    return model_map[num]


def extract_gripper_info(info: "GripperInformation") -> Tuple[GripperModel, str]:
    return info_num_to_model(info.model), info.serial


def load(
    gripper_model: GripperModel, gripper_id: Optional[str] = None
) -> GripperConfig:
    gripper_def = load_definition(version=GripperSchemaVersion.V1, model=gripper_model)
    return GripperConfig(
        name="gripper",
        display_name=gripper_def.display_name,
        model=gripper_def.model,
        z_idle_current=_verify_value(gripper_def.z_idle_current),
        z_active_current=_verify_value(gripper_def.z_active_current),
        jaw_reference_voltage=_verify_value(gripper_def.jaw_reference_voltage),
        jaw_force_per_duty_cycle=gripper_def.jaw_force_per_duty_cycle,
        base_offset_from_mount=_get_offset(gripper_def.base_offset_from_mount),
        jaw_center_offset_from_base=_get_offset(
            gripper_def.jaw_center_offset_from_base
        ),
        pin_one_offset_from_base=_get_offset(gripper_def.pin_one_offset_from_base),
        pin_two_offset_from_base=_get_offset(gripper_def.pin_two_offset_from_base),
        quirks=gripper_def.quirks,
    )
