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
    """Returns a GripperModel from a string in the format X.Y.
    where X is the major model and Y is the minor model
    """
    major_model = num[0]
    minor_model = num[2]
    # we provisioned the some EVT grippers as 01 and some as 10
    # DVT will now be 1.1
    # PVT will now be 1.2
    model_map = {
        "0": {"0": GripperModel.v1, "1": GripperModel.v1},
        "1": {
            "0": GripperModel.v1,
            "1": GripperModel.v1_1,
            "2": GripperModel.v1_2,
            "3": GripperModel.v1_3,
        },
    }
    return model_map[major_model][minor_model]


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
