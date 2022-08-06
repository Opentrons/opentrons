"""Tests for heater_shaker_movement_flagger."""


from contextlib import nullcontext as does_not_raise
from typing import ContextManager, Any

import pytest

from opentrons.protocol_engine.types import HeaterShakerMovementRestrictors
from opentrons.protocol_engine.errors import (
    PipetteMovementRestrictedByHeaterShakerError,
)
from opentrons.protocol_engine.execution.heater_shaker_movement_flagger import (
    raise_if_movement_restricted,
)


@pytest.mark.parametrize(
    argnames=["destination_slot", "expected_raise"],
    argvalues=[
        [
            4,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # east
        [
            6,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # west
        [
            8,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # north
        [
            2,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # south
        [
            5,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="shaking"
            ),
        ],  # h/s
        [1, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_when_moving_to_restricted_slots_while_shaking(
    destination_slot: int,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while module is shaking."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=True, latch_closed=True, deck_slot=5
        )
    ]

    with expected_raise:
        raise_if_movement_restricted(
            hs_movement_restrictors=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        )


@pytest.mark.parametrize(
    argnames=["destination_slot", "expected_raise"],
    argvalues=[
        [
            4,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # east
        [
            6,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # west
        [
            5,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # h/s
        [8, does_not_raise()],  # north
        [2, does_not_raise()],  # south
        [3, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_when_moving_to_restricted_slots_while_latch_open(
    destination_slot: int,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while latch is open."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=False, latch_closed=False, deck_slot=5
        )
    ]

    with expected_raise:
        raise_if_movement_restricted(
            hs_movement_restrictors=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        )


@pytest.mark.parametrize(
    argnames=["destination_slot", "is_tiprack", "expected_raise"],
    argvalues=[
        [
            4,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="east or west"
            ),
        ],  # east
        [
            6,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="east or west"
            ),
        ],  # west
        [
            8,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="tip rack"
            ),
        ],  # north, non-tiprack
        [
            2,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="tip rack"
            ),
        ],  # south, non-tiprack
        [8, True, does_not_raise()],  # north, tiprack
        [2, True, does_not_raise()],  # south, tiprack
        [5, False, does_not_raise()],  # h/s
        [7, False, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_on_restricted_movement_with_multi_channel(
    destination_slot: int,
    is_tiprack: bool,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted with a multi-channel pipette."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=False, latch_closed=True, deck_slot=5
        )
    ]

    with expected_raise:
        raise_if_movement_restricted(
            hs_movement_restrictors=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=True,
            destination_is_tip_rack=is_tiprack,
        )


@pytest.mark.parametrize(
    argnames=["destination_slot"],
    argvalues=[
        [4],  # east
        [6],  # west
        [5],  # h/s
        [8],  # north
        [2],  # south
        [9],  # non-adjacent
    ],
)
async def test_does_not_raise_when_idle_and_latch_closed(
    destination_slot: int,
) -> None:
    """It should not raise if single channel pipette moves anywhere near heater-shaker when idle and latch closed."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=False, latch_closed=True, deck_slot=5
        )
    ]

    with does_not_raise():
        raise_if_movement_restricted(
            hs_movement_restrictors=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        )
