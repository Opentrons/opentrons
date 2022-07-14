"""Tests for heater_shaker_movement_flagger."""


from contextlib import nullcontext as does_not_raise
from typing import ContextManager, Any

import pytest

from opentrons.protocol_engine.types import HeaterShakerMovementData
from opentrons.protocol_engine.errors import RestrictedPipetteMovementError
from opentrons.protocol_engine.execution.heater_shaker_movement_flagger import (
    raise_if_movement_restricted_by_heater_shaker,
)


@pytest.mark.parametrize(
    argnames=["destination_slot", "expected_raise"],
    argvalues=[
        [4, pytest.raises(RestrictedPipetteMovementError)],  # east
        [6, pytest.raises(RestrictedPipetteMovementError)],  # west
        [8, pytest.raises(RestrictedPipetteMovementError)],  # north
        [2, pytest.raises(RestrictedPipetteMovementError)],  # south
        [5, pytest.raises(RestrictedPipetteMovementError)],  # h/s
        [1, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_when_shaking_on_restricted_movement(
    destination_slot: int,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while module is shaking."""
    heater_shaker_data = [
        HeaterShakerMovementData(plate_shaking=True, latch_closed=True, slot_location=5)
    ]

    with expected_raise:
        await raise_if_movement_restricted_by_heater_shaker(
            heater_shaker_data=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=False,
            is_tiprack=False,
        )


@pytest.mark.parametrize(
    argnames=["destination_slot", "expected_raise"],
    argvalues=[
        [4, pytest.raises(RestrictedPipetteMovementError)],  # east
        [6, pytest.raises(RestrictedPipetteMovementError)],  # west
        [5, pytest.raises(RestrictedPipetteMovementError)],  # h/s
        [8, does_not_raise()],  # north
        [2, does_not_raise()],  # south
        [3, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_when_latch_open_on_restricted_movement(
    destination_slot: int,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while latch is open."""
    heater_shaker_data = [
        HeaterShakerMovementData(
            plate_shaking=False, latch_closed=False, slot_location=5
        )
    ]

    with expected_raise:
        await raise_if_movement_restricted_by_heater_shaker(
            heater_shaker_data=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=False,
            is_tiprack=False,
        )


@pytest.mark.parametrize(
    argnames=["destination_slot", "is_tiprack", "expected_raise"],
    argvalues=[
        [4, False, pytest.raises(RestrictedPipetteMovementError)],  # east
        [6, False, pytest.raises(RestrictedPipetteMovementError)],  # west
        [8, False, pytest.raises(RestrictedPipetteMovementError)],  # north, non-tiprack
        [2, False, pytest.raises(RestrictedPipetteMovementError)],  # south, non-tiprack
        [8, True, does_not_raise()],  # north, tiprack
        [2, True, does_not_raise()],  # south, tiprack
        [5, False, does_not_raise()],  # h/s
        [7, False, does_not_raise()],  # non-adjacent
    ],
)
async def test_raises_multi_channel_on_restricted_movement(
    destination_slot: int,
    is_tiprack: bool,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted with a multi-channel pipette."""
    heater_shaker_data = [
        HeaterShakerMovementData(
            plate_shaking=False, latch_closed=True, slot_location=5
        )
    ]

    with expected_raise:
        await raise_if_movement_restricted_by_heater_shaker(
            heater_shaker_data=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=True,
            is_tiprack=is_tiprack,
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
        HeaterShakerMovementData(
            plate_shaking=False, latch_closed=True, slot_location=5
        )
    ]

    with does_not_raise():
        await raise_if_movement_restricted_by_heater_shaker(
            heater_shaker_data=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=False,
            is_tiprack=False,
        )
