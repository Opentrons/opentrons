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

    move_groups = []

    # First move head
    dza = deltas.get(NodeId.head, 0)
    if dza:
        move_groups.append(
            [
                {
                    NodeId.head: MoveGroupSingleAxisStep(
                        distance_mm=dza,
                        velocity_mm_sec=speed if dza > 0 else -speed,
                        duration_sec=abs(dza) / speed,
                    )
                }
            ]
        )

    # Move x
    dx = deltas.get(NodeId.gantry_x, 0)
    if dx:
        move_groups.append(
            [
                {
                    NodeId.gantry_x: MoveGroupSingleAxisStep(
                        distance_mm=dx,
                        velocity_mm_sec=speed if dx > 0 else -speed,
                        duration_sec=abs(dx) / speed,
                    )
                }
            ]
        )

    # Move x
    dy = deltas.get(NodeId.gantry_y, 0)
    if dy:
        move_groups.append(
            [
                {
                    NodeId.gantry_y: MoveGroupSingleAxisStep(
                        distance_mm=dy,
                        velocity_mm_sec=speed if dy > 0 else -speed,
                        duration_sec=abs(dx) / speed,
                    )
                }
            ]
        )

    return move_groups
