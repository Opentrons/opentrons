"""Tests for heater_shaker_movement_flagger."""

import pytest
from contextlib import nullcontext as does_not_raise
from typing import ContextManager, Any, NamedTuple
from decoy import Decoy

from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules.heater_shaker import (
    HeaterShaker as HardwareHeaterShaker,
)

from opentrons.protocol_engine.types import (
    HeaterShakerMovementRestrictors,
    HeaterShakerLatchStatus,
    ModuleLocation,
    DeckSlotLocation,
)
from opentrons.protocol_engine.errors import (
    PipetteMovementRestrictedByHeaterShakerError,
    HeaterShakerLabwareLatchNotOpenError,
    HeaterShakerLabwareLatchStatusUnknown,
    WrongModuleTypeError,
)
from opentrons.protocol_engine.execution.heater_shaker_movement_flagger import (
    HeaterShakerMovementFlagger,
)
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.state.module_substates.heater_shaker_module_substate import (
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)
from opentrons.types import DeckSlotName
from opentrons_shared_data.robot.dev_types import RobotType


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def subject(
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
) -> HeaterShakerMovementFlagger:
    """Return a h/s movement flagger initialized with mocked-out dependencies."""
    return HeaterShakerMovementFlagger(
        state_store=state_store,
        hardware_api=hardware_api,
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
    subject: HeaterShakerMovementFlagger,
    destination_slot: int,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while module is shaking."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=True, latch_status=HeaterShakerLatchStatus.CLOSED, deck_slot=5
        )
    ]

    with expected_raise:
        subject.raise_if_movement_restricted(
            hs_movement_restrictors=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        )


@pytest.mark.parametrize(
    argnames=["robot_type", "destination_slot", "expected_raise"],
    argvalues=[
        [
            "OT-2 Standard",
            4,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # east on OT2
        [
            "OT-2 Standard",
            6,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # west on OT2
        [
            "OT-2 Standard",
            5,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # to h/s on OT2
        ["OT-2 Standard", 8, does_not_raise()],  # north on OT2
        ["OT-2 Standard", 2, does_not_raise()],  # south on OT2
        ["OT-2 Standard", 3, does_not_raise()],  # non-adjacent
        [
            "OT-3 Standard",
            5,
            pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="latch"),
        ],  # to h/s on OT3
        ["OT-3 Standard", 4, does_not_raise()],  # east on OT3
        ["OT-3 Standard", 6, does_not_raise()],  # west on OT3
        ["OT-3 Standard", 8, does_not_raise()],  # north on OT3
        ["OT-3 Standard", 2, does_not_raise()],  # south on OT3
    ],
)
async def test_raises_when_moving_to_restricted_slots_while_latch_open2(
    decoy: Decoy,
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    robot_type: RobotType,
    destination_slot: int,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted while latch is open."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=False, latch_status=HeaterShakerLatchStatus.OPEN, deck_slot=5
        )
    ]
    decoy.when(state_store.config.robot_type).then_return(robot_type)
    with expected_raise:
        subject.raise_if_movement_restricted(
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
                PipetteMovementRestrictedByHeaterShakerError, match="left or right"
            ),
        ],  # east
        [
            6,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError, match="left or right"
            ),
        ],  # west
        [
            8,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError,
                match="non-tip-rack labware",
            ),
        ],  # north, non-tiprack
        [
            2,
            False,
            pytest.raises(
                PipetteMovementRestrictedByHeaterShakerError,
                match="non-tip-rack labware",
            ),
        ],  # south, non-tiprack
        [8, True, does_not_raise()],  # north, tiprack
        [2, True, does_not_raise()],  # south, tiprack
        [5, False, does_not_raise()],  # h/s
        [7, False, does_not_raise()],  # non-adjacent
    ],
)
def test_raises_on_restricted_movement_with_multi_channel(
    decoy: Decoy,
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    destination_slot: int,
    is_tiprack: bool,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise if restricted movement around a heater-shaker is attempted with a multi-channel pipette."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=False,
            latch_status=HeaterShakerLatchStatus.CLOSED,
            deck_slot=5,
        )
    ]
    decoy.when(state_store.config.robot_type).then_return("OT-2 Standard")
    with expected_raise:
        subject.raise_if_movement_restricted(
            hs_movement_restrictors=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=True,
            destination_is_tip_rack=is_tiprack,
        )


def test_does_not_raise_on_movement_with_multi_channel_on_ot3(
    decoy: Decoy,
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
) -> None:
    """It should not raise when pipetting with multichannel around a H/S on OT3."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=False,
            latch_status=HeaterShakerLatchStatus.CLOSED,
            deck_slot=5,
        )
    ]
    decoy.when(state_store.config.robot_type).then_return("OT-3 Standard")
    subject.raise_if_movement_restricted(
        hs_movement_restrictors=heater_shaker_data,
        destination_slot=6,
        is_multi_channel=True,
        destination_is_tip_rack=False,
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
    subject: HeaterShakerMovementFlagger,
    destination_slot: int,
) -> None:
    """It should not raise if single channel pipette moves anywhere near heater-shaker when idle and latch closed."""
    heater_shaker_data = [
        HeaterShakerMovementRestrictors(
            plate_shaking=False,
            latch_status=HeaterShakerLatchStatus.CLOSED,
            deck_slot=5,
        )
    ]

    with does_not_raise():
        subject.raise_if_movement_restricted(
            hs_movement_restrictors=heater_shaker_data,
            destination_slot=destination_slot,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        )


@pytest.mark.parametrize(
    argnames=["latch_status", "expected_raise_cm"],
    argvalues=[
        (
            HeaterShakerLatchStatus.CLOSED,
            pytest.raises(HeaterShakerLabwareLatchNotOpenError),
        ),
        (
            HeaterShakerLatchStatus.UNKNOWN,
            pytest.raises(HeaterShakerLabwareLatchStatusUnknown),
        ),
    ],
)
async def test_raises_depending_on_heater_shaker_substate_latch_status(
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    decoy: Decoy,
    latch_status: HeaterShakerLatchStatus,
    expected_raise_cm: ContextManager[Any],
) -> None:
    """It should flag movement depending on engine's h/s state."""
    decoy.when(
        state_store.modules.get_heater_shaker_module_substate(module_id="module-id")
    ).then_return(
        HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=latch_status,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    )

    with expected_raise_cm:
        await subject.raise_if_labware_latched_on_heater_shaker(
            labware_parent=ModuleLocation(moduleId="module-id")
        )


class LatchStatusAndRaiseSpec(NamedTuple):
    """Test parametrization data.

    A H/S labware latch status, and what we expect the subject to raise when a h/s
    has that latch status.
    """

    latch_status: HeaterShakerLabwareLatchStatus
    expected_raise_cm: ContextManager[Any]


@pytest.mark.parametrize(
    LatchStatusAndRaiseSpec._fields,
    [
        LatchStatusAndRaiseSpec(
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_UNKNOWN,
            expected_raise_cm=pytest.raises(HeaterShakerLabwareLatchNotOpenError),
        ),
        LatchStatusAndRaiseSpec(
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_CLOSED,
            expected_raise_cm=pytest.raises(HeaterShakerLabwareLatchNotOpenError),
        ),
        LatchStatusAndRaiseSpec(
            latch_status=HeaterShakerLabwareLatchStatus.CLOSING,
            expected_raise_cm=pytest.raises(HeaterShakerLabwareLatchNotOpenError),
        ),
        LatchStatusAndRaiseSpec(
            latch_status=HeaterShakerLabwareLatchStatus.OPENING,
            expected_raise_cm=pytest.raises(HeaterShakerLabwareLatchNotOpenError),
        ),
        LatchStatusAndRaiseSpec(
            latch_status=HeaterShakerLabwareLatchStatus.UNKNOWN,
            expected_raise_cm=pytest.raises(HeaterShakerLabwareLatchNotOpenError),
        ),
        LatchStatusAndRaiseSpec(
            latch_status=HeaterShakerLabwareLatchStatus.IDLE_OPEN,
            expected_raise_cm=does_not_raise(),
        ),
    ],
)
async def test_raises_depending_on_heater_shaker_latch_status(
    decoy: Decoy,
    latch_status: HeaterShakerLabwareLatchStatus,
    expected_raise_cm: ContextManager[Any],
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
) -> None:
    """When on a H/S, it should raise if the latch isn't open."""
    decoy.when(
        state_store.modules.get_heater_shaker_module_substate(module_id="module-id")
    ).then_return(
        HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.OPEN,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    )

    decoy.when(state_store.config.use_virtual_modules).then_return(False)
    decoy.when(
        state_store.modules.get_serial_number(module_id="module-id")
    ).then_return("module-serial")

    heater_shaker = decoy.mock(cls=HardwareHeaterShaker)
    decoy.when(hardware_api.attached_modules).then_return([heater_shaker])
    decoy.when(heater_shaker.device_info).then_return({"serial": "module-serial"})
    decoy.when(heater_shaker.labware_latch_status).then_return(latch_status)

    with expected_raise_cm:
        await subject.raise_if_labware_latched_on_heater_shaker(
            labware_parent=ModuleLocation(moduleId="module-id"),
        )


async def test_raises_if_hardware_module_has_gone_missing(
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
) -> None:
    """It should raise if the hardware module can't be found by its serial no."""
    decoy.when(
        state_store.modules.get_heater_shaker_module_substate(module_id="module-id")
    ).then_return(
        HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.OPEN,
            is_plate_shaking=False,
            plate_target_temperature=None,
        ),
    )

    decoy.when(state_store.config.use_virtual_modules).then_return(False)
    decoy.when(
        state_store.modules.get_serial_number(module_id="module-id")
    ).then_return("module-serial")
    decoy.when(hardware_api.attached_modules).then_return([])

    with pytest.raises(HeaterShakerLabwareLatchNotOpenError):
        await subject.raise_if_labware_latched_on_heater_shaker(
            labware_parent=ModuleLocation(moduleId="module-id"),
        )


async def test_passes_if_virtual_module_latch_open(
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if a virtual module in analysis has latch open."""
    decoy.when(
        state_store.modules.get_heater_shaker_module_substate(module_id="module-id")
    ).then_return(
        HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.OPEN,
            is_plate_shaking=False,
            plate_target_temperature=None,
        ),
    )
    decoy.when(state_store.config.use_virtual_modules).then_return(True)
    await subject.raise_if_labware_latched_on_heater_shaker(
        labware_parent=ModuleLocation(moduleId="module-id")
    )


async def test_passes_if_labware_on_non_heater_shaker_module(
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if the labware is on a module other than a Heater-Shaker."""
    decoy.when(
        state_store.modules.get_heater_shaker_module_substate(module_id="module-id")
    ).then_raise(WrongModuleTypeError("Woops"))
    await subject.raise_if_labware_latched_on_heater_shaker(
        ModuleLocation(moduleId="module-id")
    )


async def test_passes_if_labware_not_on_any_module(
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if the labware isn't on a module."""
    await subject.raise_if_labware_latched_on_heater_shaker(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
