"""Shared utilities for ot3 hardware control."""

from typing import Dict
from opentrons.config.types import OT3Config, PipetteKind
from opentrons.hardware_control.types import Axis

try:
    from opentrons_hardware.hardware_control.motion_planning import (
        AxisConstraints,
    )
except ImportError:
    pass


def _constraint_name_from_axis(ax: Axis) -> str:
    return {
        Axis.X: "X",
        Axis.Y: "Y",
        Axis.Z: "Z",
        Axis.A: "Z",
        Axis.B: "P",
        Axis.C: "P",
    }[ax]


def default_system_constraints(config: OT3Config) -> Dict[str, "AxisConstraints"]:
    constraints = {}
    for axis in Axis:
        constraints[str(axis.name)] = AxisConstraints.build(
            config.acceleration.none[_constraint_name_from_axis(axis)],
            config.max_speed_discontinuity.none[_constraint_name_from_axis(axis)],
            config.direction_change_speed_discontinuity.none[
                _constraint_name_from_axis(axis)
            ],
        )
    return constraints


def get_system_constraints(
    config: OT3Config, pipette_kind: PipetteKind
) -> Dict[str, "AxisConstraints"]:
    # TODO: (2022-02-10) get correct system constraints based on pipette kind
    default = default_system_constraints(config)
    return default
