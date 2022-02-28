"""Shared utilities for ot3 hardware control."""
from typing import Dict, Iterable, List, Tuple, TypeVar
from opentrons.config.types import OT3MotionSettings, GantryLoad
from opentrons.hardware_control.types import OT3Axis, OT3AxisKind, OT3AxisMap
import numpy as np


from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.hardware_control.motion_planning import (
    AxisConstraints,
    SystemConstraints,
    Coordinates,
    Move,
    CoordinateValue,
)
from opentrons_hardware.hardware_control.motion_planning.move_utils import (
    unit_vector_multiplication,
)
from opentrons_hardware.hardware_control.motion import (
    create_step,
    NodeIdMotionValues,
    MoveGroup,
    MoveStopCondition
)


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


def node_axes() -> List[OT3Axis]:
    return [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.P_L, OT3Axis.P_R]


def axis_to_node(axis: OT3Axis) -> "NodeId":
    anm = {
        OT3Axis.X: NodeId.gantry_x,
        OT3Axis.Y: NodeId.gantry_y,
        OT3Axis.Z_L: NodeId.head_l,
        OT3Axis.Z_R: NodeId.head_r,
        OT3Axis.P_L: NodeId.pipette_left,
        OT3Axis.P_R: NodeId.pipette_right,
    }
    return anm[axis]


def node_to_axis(node: "NodeId") -> OT3Axis:
    nam = {
        NodeId.gantry_x: OT3Axis.X,
        NodeId.gantry_y: OT3Axis.Y,
        NodeId.head_l: OT3Axis.Z_L,
        NodeId.head_r: OT3Axis.Z_R,
        NodeId.pipette_left: OT3Axis.P_L,
        NodeId.pipette_right: OT3Axis.P_R,
    }
    return nam[node]


def node_is_axis(node: "NodeId") -> bool:
    try:
        node_to_axis(node)
        return True
    except KeyError:
        return False


def axis_is_node(axis: OT3Axis) -> bool:
    try:
        axis_to_node(axis)
        return True
    except KeyError:
        return False


def get_system_constraints(
    config: OT3MotionSettings,
    gantry_load: GantryLoad,
) -> "SystemConstraints[OT3Axis]":
    conf_by_pip = config.by_gantry_load(gantry_load)
    constraints = {}
    for axis_kind in [OT3AxisKind.P, OT3AxisKind.X, OT3AxisKind.Y, OT3AxisKind.Z]:
        for axis in OT3Axis.of_kind(axis_kind):
            constraints[axis] = AxisConstraints.build(
                conf_by_pip["acceleration"][axis_kind],
                conf_by_pip["max_speed_discontinuity"][axis_kind],
                conf_by_pip["direction_change_speed_discontinuity"][axis_kind],
            )
    return constraints


def _convert_to_node_id_dict(
    axis_pos: Coordinates[OT3Axis, CoordinateValue],
) -> NodeIdMotionValues:
    target: NodeIdMotionValues = {}
    for axis, pos in axis_pos.items():
        if axis_is_node(axis):
            target[axis_to_node(axis)] = np.float64(pos)
    return target


def create_move_group(
    origin: Coordinates[OT3Axis, CoordinateValue],
    moves: List[Move[OT3Axis]],
    present_nodes: Iterable[NodeId],
) -> Tuple[MoveGroup, Dict[NodeId, float]]:
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
                stop_condition=stop_condition
            )
            for ax in pos.keys():
                pos[ax] += node_id_distances.get(ax, 0)
            move_group.append(step)
    return move_group, {k: float(v) for k, v in pos.items()}


AxisMapPayload = TypeVar("AxisMapPayload")


def axis_convert(
    axis_map: Dict["NodeId", AxisMapPayload], default_value: AxisMapPayload
) -> OT3AxisMap[AxisMapPayload]:
    ret: OT3AxisMap[AxisMapPayload] = {k: default_value for k in node_axes()}
    for node, value in axis_map.items():
        if node_is_axis(node):
            ret[node_to_axis(node)] = value
    return ret
