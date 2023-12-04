"""Tests for thermocycler_movement_flagger."""


from contextlib import nullcontext as does_not_raise
from typing import Any, ContextManager, NamedTuple, Optional

import pytest
from decoy import Decoy

from opentrons.types import DeckSlotName
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.state.module_substates.thermocycler_module_substate import (
    ThermocyclerModuleId,
    ThermocyclerModuleSubState,
)
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleLocation,
)
from opentrons.protocol_engine.errors import (
    ThermocyclerNotOpenError,
    WrongModuleTypeError,
)
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import Thermocycler as HardwareThermocycler
from opentrons.drivers.types import ThermocyclerLidStatus

from opentrons.protocol_engine.execution.thermocycler_movement_flagger import (
    ThermocyclerMovementFlagger,
)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def subject(
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
) -> ThermocyclerMovementFlagger:
    """Return a movement flagger initialized with mocked-out dependencies."""
    return ThermocyclerMovementFlagger(
        state_store=state_store,
        hardware_api=hardware_api,
    )


async def test_raises_depending_on_thermocycler_substate_lid_status(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    decoy: Decoy,
) -> None:
    """It should flag movement depending on engine's thermocycler state."""
    decoy.when(
        state_store.modules.get_thermocycler_module_substate(module_id="module-id")
    ).then_return(
        ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=False,
            target_lid_temperature=None,
            target_block_temperature=None,
        ),
    )

    with pytest.raises(ThermocyclerNotOpenError):
        await subject.raise_if_labware_in_non_open_thermocycler(
            labware_parent=ModuleLocation(moduleId="module-id"),
        )


class LidStatusAndRaiseSpec(NamedTuple):
    """Test parametrization data.

    A Thermocycler lid status, and what we expect the subject to raise when it finds
    that the Thermocycler has that lid status.
    """

    # Optional to match current signature of Thermocycler.lid_status.
    # Should change to non-Optional if/when that becomes non-optional.
    lid_status: Optional[ThermocyclerLidStatus]
    expected_raise_cm: ContextManager[Any]


@pytest.mark.parametrize(
    LidStatusAndRaiseSpec._fields,
    [
        LidStatusAndRaiseSpec(
            lid_status=ThermocyclerLidStatus.CLOSED,
            expected_raise_cm=pytest.raises(ThermocyclerNotOpenError),
        ),
        LidStatusAndRaiseSpec(
            lid_status=ThermocyclerLidStatus.IN_BETWEEN,
            expected_raise_cm=pytest.raises(ThermocyclerNotOpenError),
        ),
        LidStatusAndRaiseSpec(
            lid_status=ThermocyclerLidStatus.UNKNOWN,
            expected_raise_cm=pytest.raises(ThermocyclerNotOpenError),
        ),
        LidStatusAndRaiseSpec(
            lid_status=ThermocyclerLidStatus.OPEN,
            expected_raise_cm=does_not_raise(),
        ),
    ],
)
async def test_raises_depending_on_thermocycler_hardware_lid_status(
    lid_status: ThermocyclerLidStatus,
    expected_raise_cm: ContextManager[Any],
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
) -> None:
    """When on a Thermocycler, it should raise if the lid isn't open."""
    decoy.when(
        state_store.modules.get_thermocycler_module_substate(module_id="module-id")
    ).then_return(
        ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=True,
            target_lid_temperature=None,
            target_block_temperature=None,
        ),
    )

    decoy.when(state_store.config.use_virtual_modules).then_return(False)
    decoy.when(
        state_store.modules.get_serial_number(module_id="module-id")
    ).then_return("module-serial")

    thermocycler = decoy.mock(cls=HardwareThermocycler)
    decoy.when(thermocycler.device_info).then_return({"serial": "module-serial"})
    decoy.when(thermocycler.lid_status).then_return(lid_status)
    decoy.when(hardware_api.attached_modules).then_return([thermocycler])

    with expected_raise_cm:
        await subject.raise_if_labware_in_non_open_thermocycler(
            labware_parent=ModuleLocation(moduleId="module-id"),
        )


async def test_raises_if_hardware_module_has_gone_missing(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
) -> None:
    """It should raise if the hardware module can't be found by its serial no."""
    decoy.when(
        state_store.modules.get_thermocycler_module_substate(module_id="module-id")
    ).then_return(
        ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=True,
            target_lid_temperature=None,
            target_block_temperature=None,
        ),
    )

    decoy.when(state_store.config.use_virtual_modules).then_return(False)
    decoy.when(
        state_store.modules.get_serial_number(module_id="module-id")
    ).then_return("module-serial")
    decoy.when(hardware_api.attached_modules).then_return([])

    with pytest.raises(ThermocyclerNotOpenError):
        await subject.raise_if_labware_in_non_open_thermocycler(
            labware_parent=ModuleLocation(moduleId="module-id"),
        )


async def test_passes_if_virtual_module_lid_open(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if a virtual module in analysis has lid open."""
    decoy.when(
        state_store.modules.get_thermocycler_module_substate(module_id="module-id")
    ).then_return(
        ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=True,
            target_lid_temperature=None,
            target_block_temperature=None,
        ),
    )
    decoy.when(state_store.config.use_virtual_modules).then_return(True)
    await subject.raise_if_labware_in_non_open_thermocycler(
        labware_parent=ModuleLocation(moduleId="module-id")
    )


async def test_passes_if_labware_on_non_thermocycler_module(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if the labware is on a module other than a Thermocycler."""
    decoy.when(
        state_store.modules.get_thermocycler_module_substate(module_id="module-id")
    ).then_raise(WrongModuleTypeError("Woops"))
    await subject.raise_if_labware_in_non_open_thermocycler(
        ModuleLocation(moduleId="module-id")
    )


async def test_passes_if_labware_not_on_any_module(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if the labware isn't on a module."""
    await subject.raise_if_labware_in_non_open_thermocycler(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
