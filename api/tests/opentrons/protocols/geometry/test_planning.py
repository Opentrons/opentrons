"""Tests for protocol geometry planning module."""

from opentrons.motion_planning import MoveType
from opentrons.protocol_api.labware import Labware
from opentrons.protocols.geometry.planning import get_move_type


def test_get_move_type_general(min_lw: Labware, min_lw2: Labware) -> None:
    """It should identify general moves."""
    from_loc = min_lw.wells()[0].top()
    to_loc = min_lw2.wells()[0].top()

    result = get_move_type(from_loc, to_loc)
    assert result == MoveType.GENERAL_ARC


def test_get_move_type_in_labware(min_lw: Labware) -> None:
    """It should identify general moves."""
    from_loc = min_lw.wells()[0].top()
    to_loc = min_lw.wells()[1].top()

    result = get_move_type(from_loc, to_loc)
    assert result == MoveType.IN_LABWARE_ARC


def test_get_move_type_in_well(min_lw: Labware) -> None:
    """It should identify general moves."""
    from_loc = min_lw.wells()[0].top()
    to_loc = min_lw.wells()[0].bottom()

    result = get_move_type(from_loc, to_loc)
    assert result == MoveType.DIRECT


def test_get_move_type_general_with_force_direct(
    min_lw: Labware, min_lw2: Labware
) -> None:
    """It should identify general moves."""
    from_loc = min_lw.wells()[0].top()
    to_loc = min_lw2.wells()[0].top()

    result = get_move_type(from_loc, to_loc, force_direct=True)
    assert result == MoveType.DIRECT
