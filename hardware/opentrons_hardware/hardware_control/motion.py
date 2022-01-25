"""A collection of motions that define a single move."""
from typing import List, Dict
from dataclasses import dataclass
import numpy as np  # type: ignore[import]
from logging import getLogger

from opentrons_ot3_firmware.constants import NodeId

LOG = getLogger(__name__)


@dataclass(frozen=True)
class MoveGroupSingleAxisStep:
    """A single move in a move group."""

    distance_mm: float
    velocity_mm_sec: float
    duration_sec: float


MoveGroupStep = Dict[
    NodeId,
    MoveGroupSingleAxisStep,
]

MoveGroup = List[MoveGroupStep]

MoveGroups = List[MoveGroup]

MAX_SPEEDS = {
    NodeId.gantry_x: 50,
    NodeId.gantry_y: 50,
    NodeId.head_l: 50,
    NodeId.head_r: 50,
    NodeId.pipette: 2,
}


def create(
    origin: Dict[NodeId, float], target: Dict[NodeId, float], speed: float
) -> MoveGroups:
    """Create a move.

    Args:
        origin: Start position.
        target: Target position.
        speed: the speed

    Returns:
        A Move
    """
    # Raise KeyError if axis is missing from origin
    deltas = {ax: float(target[ax] - origin[ax]) for ax in target.keys()}
    # head (as opposed to head_l and head_r) is not an acceptable target for motion
    deltas.pop(NodeId.head, None)

    ordered_nodes = [
        NodeId.gantry_x,
        NodeId.gantry_y,
        NodeId.head_r,
        NodeId.head_l,
        NodeId.pipette,
    ]
    vec = np.array([deltas.get(node, 0) for node in ordered_nodes])
    if any(np.isnan(vec)):
        raise RuntimeError(vec)
    distance = np.sqrt(vec.dot(vec))
    if np.isnan(distance):
        raise RuntimeError(distance)
    if distance == 0:
        return []
    direction = vec / distance
    speeds_mm_per_s = speed * direction
    time_s = distance / speed
    LOG.info(
        f"{origin}->{target}={deltas}; distance={distance}mm "
        f"@{speeds_mm_per_s}mm/s for {time_s}s"
    )
    if any(np.isnan(speeds_mm_per_s)):
        raise RuntimeError(speeds_mm_per_s)
    speed_abs = np.abs(speeds_mm_per_s)
    for node_num, node in enumerate(ordered_nodes):
        if MAX_SPEEDS[node] < speed_abs[node_num]:
            speed_abs = np.multiply(speed_abs, MAX_SPEEDS[node] / speed_abs[node_num])
    scaled_speeds = np.copysign(speed_abs, speeds_mm_per_s)
    time_s_scaled = round(distance / np.sqrt(scaled_speeds.dot(scaled_speeds)), 6)
    LOG.info(
        f"Speed scaling {speeds_mm_per_s}->{scaled_speeds}, "
        f"{time_s}s -> {time_s_scaled}s"
    )
    step: MoveGroupStep = {}
    for axis_node, axis_delta, axis_speed in zip(ordered_nodes, vec, scaled_speeds):
        step[axis_node] = MoveGroupSingleAxisStep(
            distance_mm=axis_delta,
            velocity_mm_sec=axis_speed,
            duration_sec=time_s_scaled,
        )

    return [[step]]
