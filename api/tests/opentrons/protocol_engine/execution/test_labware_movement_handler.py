"""Test labware movement command execution side effects."""
from __future__ import annotations

from datetime import datetime

import pytest
from decoy import Decoy, matchers
from typing import TYPE_CHECKING, Union

from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons_shared_data.gripper.constants import (
    LABWARE_GRIP_FORCE,
    IDLE_STATE_GRIP_FORCE,
)
from opentrons.hardware_control import HardwareControlAPI
from opentrons.types import DeckSlotName, Point

from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleLocation,
    OnLabwareLocation,
    OFF_DECK_LOCATION,
    LabwareOffset,
    LabwareOffsetLocation,
    LabwareOffsetVector,
    LabwareLocation,
    NonStackedLocation,
    LabwareMovementOffsetData,
    ModuleModel,
)
from opentrons.protocol_engine.execution.thermocycler_plate_lifter import (
    ThermocyclerPlateLifter,
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
def equipment(decoy: Decoy) -> EquipmentHandler:
    """Get a mocked out EquipmentHandler instance."""
    return decoy.mock(cls=EquipmentHandler)


@pytest.fixture
def movement(decoy: Decoy) -> MovementHandler:
    """Get a mocked out MovementHandler."""
    return decoy.mock(cls=MovementHandler)


@pytest.fixture
def thermocycler_plate_lifter(decoy: Decoy) -> ThermocyclerPlateLifter:
    """Get a mocked out ThermocyclerPlateLifter instance."""
    return decoy.mock(cls=ThermocyclerPlateLifter)


@pytest.fixture
def thermocycler_movement_flagger(decoy: Decoy) -> ThermocyclerMovementFlagger:
    """Get a mocked out ThermocyclerMovementFlagger instance."""
    return decoy.mock(cls=ThermocyclerMovementFlagger)


@pytest.fixture
def heater_shaker_movement_flagger(decoy: Decoy) -> HeaterShakerMovementFlagger:
    """Get a mocked out HeaterShakerMovementFlagger instance."""
    return decoy.mock(cls=HeaterShakerMovementFlagger)


def default_experimental_movement_data() -> LabwareMovementOffsetData:
    """Experimental movement data with default values."""
    return LabwareMovementOffsetData(
        pickUpOffset=None,
        dropOffset=None,
    )


@pytest.mark.ot3_only
@pytest.fixture
def subject(
    ot3_hardware_api: OT3API,
    state_store: StateStore,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    thermocycler_plate_lifter: ThermocyclerPlateLifter,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
    heater_shaker_movement_flagger: HeaterShakerMovementFlagger,
) -> LabwareMovementHandler:
    """Get LabwareMovementHandler for OT3, with its dependencies mocked out."""
    return LabwareMovementHandler(
        hardware_api=ot3_hardware_api,
        state_store=state_store,
        equipment=equipment,
        movement=movement,
        thermocycler_plate_lifter=thermocycler_plate_lifter,
        thermocycler_movement_flagger=thermocycler_movement_flagger,
        heater_shaker_movement_flagger=heater_shaker_movement_flagger,
    )


# TODO (spp, 2022-10-18):
#  1. Should write an acceptance test w/ real labware on ot3 deck.
#  2. This test will be split once waypoints generation is moved to motion planning.
@pytest.mark.parametrize(
    argnames=["from_location", "to_location", "extra_pickup_offset"],
    argvalues=[
        (
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            0,
        ),
        (
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            ModuleLocation(moduleId="module-id"),
            0,
        ),
        (
            OnLabwareLocation(labwareId="a-labware-id"),
            OnLabwareLocation(labwareId="another-labware-id"),
            0,
        ),
        (
            ModuleLocation(moduleId="tc2-id"),
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            # This test picks up from a TC2, so it should pick up 3.5mm higher.
            3.5,
        ),
    ],
)
@pytest.mark.ot3_only
async def test_move_labware_with_gripper(
    decoy: Decoy,
    state_store: StateStore,
    thermocycler_plate_lifter: ThermocyclerPlateLifter,
    ot3_hardware_api: OT3API,
    subject: LabwareMovementHandler,
    from_location: Union[DeckSlotLocation, ModuleLocation, OnLabwareLocation],
    to_location: Union[DeckSlotLocation, ModuleLocation, OnLabwareLocation],
    extra_pickup_offset: float,
) -> None:
    """It should perform a labware movement with gripper by delegating to OT3API."""
    decoy.when(state_store.config.use_virtual_gripper).then_return(False)
    decoy.when(ot3_hardware_api.has_gripper()).then_return(True)

    decoy.when(state_store.modules.get_connected_model("tc2-id")).then_return(
        ModuleModel.THERMOCYCLER_MODULE_V2
    )

    decoy.when(
        await ot3_hardware_api.gantry_position(mount=OT3Mount.GRIPPER)
    ).then_return(Point(x=777, y=888, z=999))

    decoy.when(
        state_store.geometry.get_labware_center(
            labware_id="my-teleporting-labware", location=from_location
        )
    ).then_return(Point(101, 102, 119.5))

    decoy.when(
        state_store.geometry.get_labware_center(
            labware_id="my-teleporting-labware", location=to_location
        )
    ).then_return(Point(201, 202, 219.5))

    mock_tc_context_manager = decoy.mock()
    decoy.when(
        thermocycler_plate_lifter.lift_plate_for_labware_movement(
            labware_location=from_location
        )
    ).then_return(mock_tc_context_manager)

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
    user_offset_data = LabwareMovementOffsetData(
        pickUpOffset=LabwareOffsetVector(x=-1, y=-2, z=-3),
        dropOffset=LabwareOffsetVector(x=1, y=2, z=3),
    )

    expected_waypoints = [
        Point(777, 888, 999),  # gripper retract at current location
        Point(100, 100, 999),  # move to above slot 1
        Point(100, 100, 116.5 + extra_pickup_offset),  # move to labware on slot 1
        Point(100, 100, 999),  # gripper retract at current location
        Point(202.0, 204.0, 999),  # move to above slot 3
        Point(202.0, 204.0, 222.5),  # move down to labware drop height on slot 3
        Point(201.5, 202.6, 999),  # retract in place
    ]

    await subject.move_labware_with_gripper(
        labware_id="my-teleporting-labware",
        current_location=from_location,
        new_location=to_location,
        user_offset_data=user_offset_data,
    )

    gripper = OT3Mount.GRIPPER
    decoy.verify(
        await ot3_hardware_api.home(axes=[Axis.Z_L, Axis.Z_R, Axis.Z_G]),
        await mock_tc_context_manager.__aenter__(),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[0]
        ),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[1]
        ),
        await ot3_hardware_api.home_gripper_jaw(),
        await ot3_hardware_api.move_to(
            mount=gripper, abs_position=expected_waypoints[2]
        ),
        # TODO: see https://opentrons.atlassian.net/browse/RLAB-214
        await ot3_hardware_api.grip(force_newtons=LABWARE_GRIP_FORCE),
        # TODO: see https://opentrons.atlassian.net/browse/RLAB-215
        await ot3_hardware_api.home(axes=[Axis.Z_G]),
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
        # TODO: see https://opentrons.atlassian.net/browse/RLAB-215
        await ot3_hardware_api.home(axes=[Axis.Z_G]),
        # TODO: see https://opentrons.atlassian.net/browse/RLAB-214
        await ot3_hardware_api.grip(force_newtons=IDLE_STATE_GRIP_FORCE),
    )


async def test_labware_movement_raises_on_ot2(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should raise an error when attempting a gripper movement on a non-OT3 bot."""
    decoy.when(state_store.config.use_virtual_gripper).then_return(False)
    subject = LabwareMovementHandler(
        hardware_api=hardware_api,
        state_store=state_store,
        equipment=equipment,
        movement=movement,
    )

    with pytest.raises(HardwareNotSupportedError):
        await subject.move_labware_with_gripper(
            labware_id="labware-id",
            current_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            user_offset_data=default_experimental_movement_data(),
        )


@pytest.mark.ot3_only
async def test_labware_movement_skips_for_virtual_gripper(
    decoy: Decoy,
    state_store: StateStore,
    ot3_hardware_api: OT3API,
    subject: LabwareMovementHandler,
) -> None:
    """It should neither raise error nor move gripper when using virtual gripper."""
    decoy.when(state_store.config.use_virtual_gripper).then_return(True)
    await subject.move_labware_with_gripper(
        labware_id="labware-id",
        current_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        user_offset_data=default_experimental_movement_data(),
    )
    decoy.verify(
        await ot3_hardware_api.move_to(
            mount=matchers.Anything(), abs_position=matchers.Anything()
        ),
        times=0,
        ignore_extra_args=True,
    )


@pytest.mark.ot3_only
async def test_labware_movement_raises_without_gripper(
    decoy: Decoy,
    state_store: StateStore,
    ot3_hardware_api: OT3API,
    subject: LabwareMovementHandler,
) -> None:
    """It should raise an error when attempting a gripper movement without a gripper."""
    decoy.when(state_store.config.use_virtual_gripper).then_return(False)
    decoy.when(ot3_hardware_api.has_gripper()).then_return(False)
    with pytest.raises(GripperNotAttachedError):
        await subject.move_labware_with_gripper(
            labware_id="labware-id",
            current_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            user_offset_data=default_experimental_movement_data(),
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
    from_loc: NonStackedLocation,
    to_loc: LabwareLocation,
) -> None:
    """It should raise error when labware movement is obstructed by thermocycler."""
    decoy.when(
        state_store.labware.get_parent_location(labware_id="labware-id")
    ).then_return(from_loc)
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
    decoy.when(
        state_store.labware.get_parent_location(labware_id="labware-id")
    ).then_return(ModuleLocation(moduleId="a-rando-module-id"))
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
    from_loc: NonStackedLocation,
    to_loc: LabwareLocation,
) -> None:
    """It should raise error when labware movement is obstructed by thermocycler."""
    decoy.when(
        state_store.labware.get_parent_location(labware_id="labware-id")
    ).then_return(from_loc)
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
    decoy.when(
        state_store.labware.get_parent_location(labware_id="labware-id")
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_1))
    await subject.ensure_movement_not_obstructed_by_module(
        labware_id="labware-id",
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
    )
