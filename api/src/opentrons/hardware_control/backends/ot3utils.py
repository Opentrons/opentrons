"""Shared utilities for ot3 hardware control."""

from typing import Dict, Optional, Iterable, List, Tuple
from typing_extensions import Literal
from opentrons.config.types import OT3Config, PipetteKind

try:
    from opentrons_ot3_firmware.constants import NodeId
    from opentrons_hardware.hardware_control.motion_planning import (
        AxisConstraints,
        AxisNames,
        AXIS_NAMES,
        Coordinates,
        Move,
    )
    from opentrons_hardware.hardware_control.motion_planning.move_utils import (
        unit_vector_multiplication,
    )
    from opentrons_hardware.hardware_control.motion import (
        create_step,
        NodeIdMotionValues,
        MoveGroup,
    )
except ImportError:
    pass


# TODO: These methods exist to defer uses of NodeId to inside
# method bodies, which won't be evaluated until called. This is needed
# because the robot server doesn't have opentrons_ot3_firmware as a dep
# which is where they're defined, and therefore you can't have references
# to NodeId that are interpreted at import time because then the robot
# server tests fail when importing hardware controller. This is obviously
# terrible and needs to be fixed.
def axis_nodes() -> List["NodeId"]:
    return [
        NodeId.gantry_x,
        NodeId.gantry_y,
        NodeId.head_l,
        NodeId.head_r,
        NodeId.pipette_left,
        NodeId.pipette_right,
    ]


def node_axes() -> List[str]:
    return ["X", "Y", "Z", "A", "B"]


def axis_to_node(axis: str) -> "NodeId":
    anm = {
        "X": NodeId.gantry_x,
        "Y": NodeId.gantry_y,
        "Z": NodeId.head_l,
        "A": NodeId.head_r,
        "B": NodeId.pipette_left,
        "C": NodeId.pipette_right,
    }
    return anm[axis]


def node_to_axis(node: "NodeId") -> str:
    nam = {
        NodeId.gantry_x: "X",
        NodeId.gantry_y: "Y",
        NodeId.head_l: "Z",
        NodeId.head_r: "A",
        NodeId.pipette_left: "B",
        NodeId.pipette_right: "C",
    }
    return nam[node]


def node_is_axis(node: "NodeId") -> bool:
    try:
        node_to_axis(node)
        return True
    except KeyError:
        return False


def axis_is_node(axis: str) -> bool:
    try:
        axis_to_node(axis)
        return True
    except KeyError:
        return False


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


def _convert_to_node_id_dict(axis_pos: "Coordinates") -> "NodeIdMotionValues":
    target: NodeIdMotionValues = {}
    for axis, pos in axis_pos.to_dict().items():
        if axis_is_node(axis):
            target[axis_to_node(axis)] = pos
    return target


def create_move_group(
    origin: "Coordinates",
    moves: List["Move"],
    present_nodes: Iterable["NodeId"],
) -> Tuple["MoveGroup", Dict["NodeId", float]]:
    pos = _convert_to_node_id_dict(origin)
    move_group: MoveGroup = []
    for move in moves:
        unit_vector = move.unit_vector
        for block in move.blocks:
            distances = unit_vector_multiplication(unit_vector, block.distance)
            node_id_distances = _convert_to_node_id_dict(distances)
            velocities = unit_vector_multiplication(unit_vector, block.initial_speed)
            accelerations = unit_vector_multiplication(unit_vector, block.acceleration)
            step = create_step(
                distance=node_id_distances,
                velocity=_convert_to_node_id_dict(velocities),
                acceleration=_convert_to_node_id_dict(accelerations),
                duration=block.time,
                present_nodes=present_nodes,
            )
            for ax in pos.keys():
                pos[ax] += node_id_distances[ax]
            move_group.append(step)
    return move_group, {k: float(v) for k, v in pos.items()}
