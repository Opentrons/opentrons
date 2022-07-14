from __future__ import annotations
from dataclasses import dataclass
import logging
from typing import List, Tuple, Optional

from opentrons_shared_data.gripper import load_definition
from opentrons_shared_data.gripper.dev_types import (
    GripperCustomizableFloat,
    GripperOffset,
    GripperSchemaVersion,
    GripperModel,
    GripperName,
)
from .types import Offset

log = logging.getLogger(__name__)

DEFAULT_GRIPPER_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]


@dataclass(frozen=True)
class GripperConfig:
    display_name: str
    name: GripperName
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
    model_map = {0: GripperModel.V1, 1: GripperModel.V1}
    return model_map[num]


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


def piecewise_force_conversion(
    newton: float, sequence: List[Tuple[float, int]]
) -> float:
    """
    Takes a force in newton and a sequence representing a piecewise
    function for the slope for a force/duty-cycle function, where each
    sub-list in the sequence contains the slope and valid domain for
    the specific linear segment.

    The values come from shared-data/gripper/definitions/gripperVx.json.

    :return: the duty-cycle value for the specified force
    """
    # pick the first item from the seq for which the target is less than
    # the bracketing element
    for i, x in enumerate(sequence):
        if newton <= x[0]:
            if i > 0:
                # get slope m
                prev_x = sequence[i - 1]
                m = (x[0] - prev_x[0]) / (x[1] - prev_x[1])
                return (x[0] - newton) / m + x[1]
            else:
                return newton * x[1] / x[0]
    # return max duty cycle in config
    return sequence[-1][1]
