from __future__ import annotations
import logging

from opentrons_shared_data.gripper import (
    load_definition,
    GripperModel,
    GripperDefinition,
    GripForceProfile,
)

log = logging.getLogger(__name__)

DEFAULT_GRIPPER_CALIBRATION_OFFSET = [0.0, 0.0, 0.0]


def info_num_to_model(num: str) -> GripperModel:
    major_model = num[0]
    model_map = {"0": GripperModel.v1, "1": GripperModel.v1}
    return model_map[major_model]


def load(gripper_model: GripperModel) -> GripperDefinition:
    return load_definition(gripper_model)


def duty_cycle_by_force(newton: float, profile: GripForceProfile) -> float:
    """
    Takes a force in newton and a sequence representing the polymomial
    equation of the gripper's force function in terms of duty cycle, where the
    integer represent the degree of the indeterminate (duty cycle), and
    the float representing its constant coefficient.

    The values come from shared-data/gripper/definitions/{schemaVersion}/{model}.json.

    :return: the duty-cycle value for the specified force
    """
    if profile.min <= newton <= profile.max:
        return sum(ele[1] * (newton ** ele[0]) for ele in profile.polynomial)
    else:
        raise ValueError("Gripper force out of bounds")
