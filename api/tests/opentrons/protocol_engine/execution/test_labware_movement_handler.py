"""Test labware movement command execution side effects."""
from __future__ import annotations

from datetime import datetime

import pytest
from decoy import Decoy
from typing import TYPE_CHECKING, List, Union, Optional

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.types import DeckSlotName, Point

from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleLocation,
    OFF_DECK_LOCATION,
    LabwareOffset,
    LabwareOffsetLocation,
    LabwareOffsetVector,
    LabwareLocation,
)

from opentrons.protocol_engine.execution.thermocycler_movement_flagger import (
    ThermocyclerMovementFlagger,
)
from opentrons.protocol_engine.execution.heater_shaker_movement_flagger import (
    HeaterShakerMovementFlagger,
)

from opentrons.protocol_engine.execution.labware_movement import (
    LabwareMovementHandler,
)
from opentrons.protocol_engine.errors import (
    HardwareNotSupportedError,
    GripperNotAttachedError,
    LabwareMovementNotAllowedError,
    ThermocyclerNotOpenError,
    HeaterShakerLabwareLatchNotOpenError,
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


@pytest.fixture
def thermocycler_movement_flagger(decoy: Decoy) -> ThermocyclerMovementFlagger:
    """Get a mocked out ThermocyclerMovementFlagger instance."""
    return decoy.mock(cls=ThermocyclerMovementFlagger)


@pytest.fixture
def heater_shaker_movement_flagger(decoy: Decoy) -> HeaterShakerMovementFlagger:
    """Get a mocked out HeaterShakerMovementFlagger instance."""
    return decoy.mock(cls=HeaterShakerMovementFlagger)


@pytest.mark.ot3_only
@pytest.fixture
def subject(
    ot3_hardware_api: OT3API,
    state_store: StateStore,
    model_utils: ModelUtils,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
    heater_shaker_movement_flagger: HeaterShakerMovementFlagger,
) -> LabwareMovementHandler:
    """Get LabwareMovementHandler for OT3, with its dependencies mocked out."""
    return LabwareMovementHandler(
        hardware_api=ot3_hardware_api,
        state_store=state_store,
        model_utils=model_utils,
        thermocycler_movement_flagger=thermocycler_movement_flagger,
        heater_shaker_movement_flagger=heater_shaker_movement_flagger,
    )


# TODO (spp, 2022-10-18):
#  1. Should write an acceptance test w/ real labware on ot3 deck.
#  2. This test will be split once waypoints generation is moved to motion planning.
@pytest.mark.parametrize(
    argnames=["from_location", "to_location", "module_location", "expected_waypoints"],
    argvalues=[
        (
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            None,
            [
                Point(777, 888, 999),  # gripper retract at current location
                Point(101.1, 102.2, 999),  # move to above slot 1
                Point(101.1, 102.2, 16.8),  # move to labware on slot 1
                Point(101.1, 102.2, 999),  # gripper retract at current location
                Point(201.5, 202.6, 999),  # move to above slot 3
                Point(201.5, 202.6, 17.2),  # move down to labware drop height on slot 3
                Point(201.5, 202.6, 999),  # retract in place
            ],
        ),
        (
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            ModuleLocation(moduleId="module-id"),
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            [
                Point(777, 888, 999),  # gripper retract at current location
                Point(101.1, 102.2, 999),  # move to above slot 1
                Point(101.1, 102.2, 16.8),  # move to labware on slot 1
                Point(101.1, 102.2, 999),  # gripper retract at current location
                Point(211.5, 222.6, 999),  # move to above slot 3
                Point(211.5, 222.6, 47.2),  # move down to labware drop height on module
                Point(211.5, 222.6, 999),  # retract in place
            ],
        ),
        (
            ModuleLocation(moduleId="module-id"),
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            [
                Point(777, 888, 999),  # gripper retract at current location
                Point(111.1, 122.2, 999),  # move to above slot 1
                Point(111.1, 122.2, 46.8),  # move to labware on slot 1
                Point(111.1, 122.2, 999),  # gripper retract at current location
                Point(201.5, 202.6, 999),  # move to above slot 3
                Point(201.5, 202.6, 17.2),  # move down to labware drop height on module
                Point(201.5, 202.6, 999),  # retract in place
            ],
        ),
    ],
)
@pytest.mark.ot3_only
async def test_move_labware_with_gripper(
    decoy: Decoy,
    state_store: StateStore,
    ot3_hardware_api: OT3API,
    subject: LabwareMovementHandler,
    from_location: Union[DeckSlotLocation, ModuleLocation],
    to_location: Union[DeckSlotLocation, ModuleLocation],
    expected_waypoints: List[Point],
    module_location: Optional[DeckSlotLocation],
) -> None:
    """It should perform a labware movement with gripper by delegating to OT3API."""
    decoy.when(ot3_hardware_api.has_gripper()).then_return(True)

    decoy.when(
        await ot3_hardware_api.gantry_position(mount=OT3Mount.GRIPPER)
    ).then_return(Point(x=777, y=888, z=999))
    decoy.when(
        state_store.labware.get_labware_center_position(
            labware_id="my-teleporting-labware"
        )
    ).then_return(Point(x=5.5, y=11, z=16.5))

    if module_location:
        decoy.when(state_store.modules.get_module_offset("module-id")).then_return(
            LabwareOffsetVector(x=10, y=20, z=30)
        )

        decoy.when(state_store.modules.get_location("module-id")).then_return(
            module_location
        )

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
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_5
            ),  # this location doesn't matter for this test
            vector=LabwareOffsetVector(x=0.5, y=0.6, z=0.7),
        )
    )

    await subject.move_labware_with_gripper(
        labware_id="my-teleporting-labware",
        current_location=from_location,
        new_location=to_location,
        new_offset_id="new-offset-id",
    )

    gripper = OT3Mount.GRIPPER
    decoy.verify(
        await ot3_hardware_api.home(axes=[OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.Z_G]),
        await ot3_hardware_api.home_gripper_jaw(),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[0]
        ),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[1]
        ),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[2]
        ),
        await ot3_hardware_api.grip(
            force_newtons=20
        ),  # TODO: replace this once we have this spec in hardware control
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[3]
        ),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[4]
        ),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[5]
        ),
        await ot3_hardware_api.ungrip(),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[6]
        ),
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

    with pytest.raises(LabwareMovementNotAllowedError):
        subject.ensure_valid_gripper_location(off_deck_location)


@pytest.mark.parametrize(
    argnames=["from_loc", "to_loc"],
    argvalues=[
        (
            ModuleLocation(moduleId="a-thermocycler-id"),
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        ),
        (
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            ModuleLocation(moduleId="a-thermocycler-id"),
        ),
    ],
)
async def test_ensure_movement_obstructed_by_thermocycler_raises(
    decoy: Decoy,
    subject: LabwareMovementHandler,
    state_store: StateStore,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
    from_loc: LabwareLocation,
    to_loc: LabwareLocation,
) -> None:
    """It should raise error when labware movement is obstructed by thermocycler."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        from_loc
    )
    decoy.when(
        await thermocycler_movement_flagger.raise_if_labware_in_non_open_thermocycler(
            labware_parent=ModuleLocation(moduleId="a-thermocycler-id")
        )
    ).then_raise(ThermocyclerNotOpenError("Thou shall not pass!"))

    with pytest.raises(LabwareMovementNotAllowedError):
        await subject.ensure_movement_not_obstructed_by_module(
            labware_id="labware-id", new_location=to_loc
        )


async def test_ensure_movement_not_obstructed_by_modules(
    decoy: Decoy,
    subject: LabwareMovementHandler,
    state_store: StateStore,
) -> None:
    """It should not raise error when labware movement is not obstructed by thermocycler."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        ModuleLocation(moduleId="a-rando-module-id")
    )
    await subject.ensure_movement_not_obstructed_by_module(
        labware_id="labware-id",
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
    )


@pytest.mark.parametrize(
    argnames=["from_loc", "to_loc"],
    argvalues=[
        (
            ModuleLocation(moduleId="a-heater-shaker-id"),
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        ),
        (
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            ModuleLocation(moduleId="a-heater-shaker-id"),
        ),
    ],
)
async def test_ensure_movement_obstructed_by_heater_shaker_raises(
    decoy: Decoy,
    subject: LabwareMovementHandler,
    heater_shaker_movement_flagger: HeaterShakerMovementFlagger,
    state_store: StateStore,
    from_loc: LabwareLocation,
    to_loc: LabwareLocation,
) -> None:
    """It should raise error when labware movement is obstructed by thermocycler."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        from_loc
    )
    decoy.when(
        await heater_shaker_movement_flagger.raise_if_labware_latched_on_heater_shaker(
            labware_parent=ModuleLocation(moduleId="a-heater-shaker-id")
        )
    ).then_raise(HeaterShakerLabwareLatchNotOpenError("Thou shall not take!"))

    with pytest.raises(LabwareMovementNotAllowedError):
        await subject.ensure_movement_not_obstructed_by_module(
            labware_id="labware-id", new_location=to_loc
        )


async def test_ensure_movement_not_obstructed_does_not_raise_for_slot_locations(
    decoy: Decoy,
    subject: LabwareMovementHandler,
    state_store: StateStore,
) -> None:
    """It should not raise error when moving from slot to slot."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    await subject.ensure_movement_not_obstructed_by_module(
        labware_id="labware-id",
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
    )
