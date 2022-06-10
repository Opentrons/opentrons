from __future__ import annotations

"""
opentrons_shared_data.pipette: functions and types for pipette config
"""
import copy
from typing import TYPE_CHECKING
import json
from functools import lru_cache

from .. import load_shared_data

if TYPE_CHECKING:
    from .dev_types import (
        GripperNameSpecs,
        GripperModelSpecs,
        GripperFusedSpec,
        GripperName,
        GripperModel,
    )


def model_config() -> GripperModelSpecs:
    """Load the per-gripper-model config file from within the wheel"""
    return copy.deepcopy(_model_config())


@lru_cache(maxsize=None)
def _model_config() -> GripperModelSpecs:
    return json.loads(
        load_shared_data("gripper/definitions/gripperModelSpecs.json") or "{}"
    )


def name_config() -> GripperNameSpecs:
    """Load the per-gripper-name config file from within the wheel"""
    return _name_config()


@lru_cache(maxsize=None)
def _name_config() -> GripperNameSpecs:
    return json.loads(
        load_shared_data("gripper/definitions/gripperNameSpecs.json") or "{}"
    )


def fuse_specs(
    gripper_model: GripperModel, gripper_name: GripperName = None
) -> GripperFusedSpec:
    """Combine the model and name spec for a given model.

    if gripper_name is not given, the name field of the gripper config
    is used. If it is, the given name must be in the backCompatNames field.
    """
    return copy.deepcopy(_fuse_specs_cached(gripper_model, gripper_name))


@lru_cache(maxsize=None)
def _fuse_specs_cached(
    gripper_model: GripperModel, gripper_name: GripperName = None
) -> GripperFusedSpec:
    """
    Do the work of fusing the specs inside an lru cache. This can't be the
    function that's directly called because we want to return a new object
    all the time, hence the wrapper.
    """
    model_data = _model_config()["config"][gripper_model]
    gripper_name = gripper_name or model_data["name"]

    valid_names = [model_data["name"]]

    if gripper_name not in valid_names:
        raise KeyError(
            f"Gripper name {gripper_name} is not valid for model " f"{gripper_model}"
        )
    name_data = _name_config()[gripper_name]
    # unfortunately, mypy can't verify this way to build typed dicts - we'll
    # make sure it's correct in the tests, and leave the function annotated
    # properly
    return {**model_data, **name_data}  # type: ignore


def dummy_model_for_name(gripper_name: GripperName) -> GripperModel:
    return gripper_name + "_v1"  # type: ignore

