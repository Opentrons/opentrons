"""Test Protocol Engine motion planning utility methods."""
import pytest
from typing import Optional

from opentrons.motion_planning.types import MoveType
from opentrons.protocol_engine.state import move_types as subject
from opentrons.protocol_engine.state.pipettes import CurrentWell


@pytest.mark.parametrize(
    ["location", "force_direct", "expected_move_type"],
    [
        (None, False, MoveType.GENERAL_ARC),
        (None, True, MoveType.DIRECT),
        (
            CurrentWell("other-pipette-id", "other-labware-id", "well-name"),
            False,
            MoveType.GENERAL_ARC,
        ),
        (
            CurrentWell("other-pipette-id", "labware-id", "well-name"),
            False,
            MoveType.GENERAL_ARC,
        ),
        (
            CurrentWell("pipette-id", "other-labware-id", "well-name"),
            False,
            MoveType.GENERAL_ARC,
        ),
        (CurrentWell("pipette-id", "labware-id", "well-name"), False, MoveType.DIRECT),
        (
            CurrentWell("pipette-id", "labware-id", "other-well-name"),
            False,
            MoveType.IN_LABWARE_ARC,
        ),
    ],
)
def test_get_move_type_to_well(
    location: Optional[CurrentWell], force_direct: bool, expected_move_type: MoveType
) -> None:
    """It should get the move type for a move to well operation."""
    move_type = subject.get_move_type_to_well(
        "pipette-id", "labware-id", "well-name", location, force_direct
    )

    assert move_type == expected_move_type
