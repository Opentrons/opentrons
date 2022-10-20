"""Test labware movement command execution side effects."""
from __future__ import annotations

from datetime import datetime

import pytest
from decoy import Decoy
from typing import TYPE_CHECKING

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.types import DeckSlotName, Point

from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    Dimensions,
    ModuleLocation,
    OFF_DECK_LOCATION,
    LabwareOffset,
    LabwareOffsetLocation,
    LabwareOffsetVector,
)

from opentrons.protocol_engine.execution.labware_movement import (
    LabwareMovementHandler,
    GRIPPER_OFFSET,
)
from opentrons.protocol_engine.errors import (
    HardwareNotSupportedError,
    GripperNotAttachedError,
    UnsupportedLabwareMovementError,
)
from opentrons.protocol_engine.state import StateStore

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore instance."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mocked out ModelUtils instance."""
    return decoy.mock(cls=ModelUtils)


@pytest.mark.ot3_only
@pytest.fixture
def subject(
    ot3_hardware_api: OT3API,
    state_store: StateStore,
    model_utils: ModelUtils,
) -> LabwareMovementHandler:
    """Get LabwareMovementHandler for OT3, with its dependencies mocked out."""
    return LabwareMovementHandler(
        hardware_api=ot3_hardware_api,
        state_store=state_store,
        model_utils=model_utils,
    )


# TODO (spp, 2022-10-18):
#  1. Should write an acceptance test w/ real labware on ot3 deck.
#  2. This test will be split once waypoints generation is moved to motion planning.
@pytest.mark.ot3_only
async def test_move_labware_with_gripper(
    decoy: Decoy,
    state_store: StateStore,
    ot3_hardware_api: OT3API,
    subject: LabwareMovementHandler,
) -> None:
    """It should perform a labware movement with gripper by delegating to OT3API."""
    decoy.when(ot3_hardware_api.has_gripper()).then_return(True)

    decoy.when(
        await ot3_hardware_api.gantry_position(mount=OT3Mount.GRIPPER)
    ).then_return(Point(x=777, y=888, z=999))
    decoy.when(
        state_store.labware.get_dimensions(labware_id="my-teleporting-labware")
    ).then_return(Dimensions(x=11, y=22, z=33))

    decoy.when(
        state_store.labware.get_slot_center_position(DeckSlotName.SLOT_1)
    ).then_return(Point(x=101, y=102, z=103))

    decoy.when(
        state_store.labware.get_slot_center_position(DeckSlotName.SLOT_3)
    ).then_return(Point(x=201, y=202, z=203))

    decoy.when(
        state_store.labware.get_labware_offset_vector("my-teleporting-labware")
    ).then_return(LabwareOffsetVector(x=0.1, y=0.2, z=0.3))

    decoy.when(state_store.labware.get_labware_offset("new-offset-id")).then_return(
        LabwareOffset(
            id="new-offset-id",
            createdAt=datetime(year=2022, month=10, day=20),
            definitionUri="my-labware",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_3),
            vector=LabwareOffsetVector(x=0.5, y=0.6, z=0.7),
        )
    )

    await subject.move_labware_with_gripper(
        labware_id="my-teleporting-labware",
        current_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        new_offset_id="new-offset-id",
    )

    expected_moves = [
        Point(777, 888, 999),  # gripper retract at current location
        Point(101.1, 102.2 + GRIPPER_OFFSET.y, 999),  # move to above slot 1
        Point(101.1, 102.2 + GRIPPER_OFFSET.y, 16.8),  # move to labware on slot 1
        Point(
            101.1, 102.2 + GRIPPER_OFFSET.y, 999
        ),  # gripper retract at current location
        Point(201.5, 202.6 + GRIPPER_OFFSET.y, 999),  # move to above slot 3
        Point(
            201.5, 202.6 + GRIPPER_OFFSET.y, 17.2
        ),  # move down to labware drop height on slot 3
        Point(201.5, 202.6 + GRIPPER_OFFSET.y, 999),  # retract in place
    ]

    gripper = OT3Mount.GRIPPER
    decoy.verify(
        await ot3_hardware_api.home(axes=[OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.Z_G]),
        await ot3_hardware_api.home_gripper_jaw(),
        await ot3_hardware_api.move_to(mount=gripper, abs_position=expected_moves[0]),
        await ot3_hardware_api.move_to(mount=gripper, abs_position=expected_moves[1]),
        await ot3_hardware_api.move_to(mount=gripper, abs_position=expected_moves[2]),
        await ot3_hardware_api.grip(
            force_newtons=20
        ),  # TODO: replace this once we have this spec in hardware control
        await ot3_hardware_api.move_to(mount=gripper, abs_position=expected_moves[3]),
        await ot3_hardware_api.move_to(mount=gripper, abs_position=expected_moves[4]),
        await ot3_hardware_api.move_to(mount=gripper, abs_position=expected_moves[5]),
        await ot3_hardware_api.ungrip(),
        await ot3_hardware_api.move_to(mount=gripper, abs_position=expected_moves[6]),
    )


async def test_labware_movement_raises_on_ot2(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    model_utils: ModelUtils,
) -> None:
    """It should raise an error when attempting a gripper movement on a non-OT3 bot."""
    subject = LabwareMovementHandler(
        hardware_api=hardware_api,
        state_store=state_store,
        model_utils=model_utils,
    )

    with pytest.raises(HardwareNotSupportedError):
        await subject.move_labware_with_gripper(
            labware_id="labware-id",
            current_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            new_offset_id=None,
        )


@pytest.mark.ot3_only
async def test_labware_movement_raises_without_gripper(
    decoy: Decoy,
    state_store: StateStore,
    ot3_hardware_api: OT3API,
    subject: LabwareMovementHandler,
) -> None:
    """It should raise an error when attempting a gripper movement without a gripper."""
    decoy.when(ot3_hardware_api.has_gripper()).then_return(False)
    with pytest.raises(GripperNotAttachedError):
        await subject.move_labware_with_gripper(
            labware_id="labware-id",
            current_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            new_offset_id=None,
        )


def test_ensure_valid_gripper_location(subject: LabwareMovementHandler) -> None:
    """It should validate on-deck gripper locations."""
    slot_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    module_location = ModuleLocation(moduleId="dummy-module")
    off_deck_location = OFF_DECK_LOCATION

    assert subject.ensure_valid_gripper_location(slot_location) == slot_location
    assert subject.ensure_valid_gripper_location(module_location) == module_location

    with pytest.raises(UnsupportedLabwareMovementError):
        subject.ensure_valid_gripper_location(off_deck_location)
