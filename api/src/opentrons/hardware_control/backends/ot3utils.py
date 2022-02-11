"""Shared utilities for ot3 hardware control."""

from typing import Dict
from typing_extensions import Literal
from opentrons.config.types import OT3Config, PipetteKind

try:
    from opentrons_hardware.hardware_control.motion_planning import (
        AxisConstraints,
        AxisNames,
        AXIS_NAMES,
    )
except ImportError:
    pass


def _constraint_name_from_axis(ax: "AxisNames") -> Literal["X", "Y", "Z", "P"]:
    lookup: Dict[AxisNames, Literal["X", "Y", "Z", "P"]] = {
        "X": "X",
        "Y": "Y",
        "Z": "Z",
        "A": "Z",
        "B": "P",
        "C": "P",
    }
    return lookup[ax]


def default_system_constraints(
    config: OT3Config,
) -> Dict["AxisNames", "AxisConstraints"]:
    constraints = {}
    for axis in AXIS_NAMES:
        constraints[axis] = AxisConstraints.build(
            config.acceleration.none[_constraint_name_from_axis(axis)],
            config.max_speed_discontinuity.none[_constraint_name_from_axis(axis)],
            config.direction_change_speed_discontinuity.none[
                _constraint_name_from_axis(axis)
            ],
        )
    return constraints


def get_system_constraints(
    config: OT3Config, pipette_kind: PipetteKind
) -> Dict["AxisNames", "AxisConstraints"]:
    # TODO: (2022-02-10) get correct system constraints based on pipette kind
    return default_system_constraints(config)
