"""A collection of motions that define a single move."""
from typing import List, Dict
from dataclasses import dataclass

from opentrons_hardware.drivers.can_bus import NodeId


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
    deltas = {ax: target[ax] - origin[ax] for ax in target.keys()}
    # head (as opposed to head_l and head_r) is not an acceptable target for motion
    deltas.pop(NodeId.head, None)

    move_groups = []
    for axis_node, axis_delta in deltas.items():
        if not axis_delta:
            continue
        move_groups.append(
            [
                {
                    axis_node: MoveGroupSingleAxisStep(
                        distance_mm=axis_delta,
                        velocity_mm_sec=speed if axis_delta > 0 else -speed,
                        duration_sec=abs(axis_delta) / speed,
                    )
                }
            ]
        )

    return move_groups
