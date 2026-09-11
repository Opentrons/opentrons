"""Tests for vacuum_module_movement_flagger."""

from unittest.mock import MagicMock

import pytest
from decoy import Decoy

from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.protocol_engine.errors import (
    VacuumModuleStillUnderVacuumError,
    VacuumModuleUnderVacuumError,
    WrongModuleTypeError,
)
from opentrons.protocol_engine.execution.equipment import EquipmentHandler
from opentrons.protocol_engine.execution.vacuum_module_movement_flagger import (
    VacuumModuleMovementFlagger,
)
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.state.module_substates.vacuum_module_substate import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateStore
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    DeckType,
    ModuleLocation,
    ModuleModel,
)
from opentrons.types import DeckSlotName


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def equipment(decoy: Decoy) -> EquipmentHandler:
    """Get a mock in the shape of an EquipmentHandler."""
    return decoy.mock(cls=EquipmentHandler)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def subject(
    state_store: StateStore,
    hardware_api: HardwareAPI,
    equipment: EquipmentHandler,
) -> VacuumModuleMovementFlagger:
    """Return a vacuum module movement flagger initialized with mocked dependencies."""
    return VacuumModuleMovementFlagger(
        state_store=state_store,
        hardware_api=hardware_api,
        equipment=equipment,
    )


async def test_ensure_vacuum_module_is_idle_noops_for_non_module_location(
    subject: VacuumModuleMovementFlagger,
) -> None:
    """It should no-op when labware is not on a module."""
    await subject.ensure_vacuum_module_is_idle(
        labware_parent=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )


async def test_ensure_vacuum_module_is_idle_noops_for_non_vacuum_module(
    decoy: Decoy,
    subject: VacuumModuleMovementFlagger,
    state_store: StateStore,
) -> None:
    """It should no-op when labware is on a non-vacuum module."""
    decoy.when(
        state_store.modules.get_vacuum_module_substate(module_id="module-id")
    ).then_raise(WrongModuleTypeError("not a vacuum module"))

    await subject.ensure_vacuum_module_is_idle(
        labware_parent=ModuleLocation(moduleId="module-id")
    )


async def test_ensure_vacuum_module_is_idle_raises_when_pump_engaged(
    decoy: Decoy,
    subject: VacuumModuleMovementFlagger,
    state_store: StateStore,
) -> None:
    """It should raise when the vacuum module pump is engaged."""
    decoy.when(
        state_store.modules.get_vacuum_module_substate(module_id="vacuum-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-id"),
            pump_engaged=True,
            residual_vacuum=True,
        )
    )

    with pytest.raises(VacuumModuleUnderVacuumError, match="pump engaged"):
        await subject.ensure_vacuum_module_is_idle(
            labware_parent=ModuleLocation(moduleId="vacuum-id")
        )


async def test_ensure_vacuum_module_is_idle_raises_when_pressure_not_equalized(
    decoy: Decoy,
    subject: VacuumModuleMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
) -> None:
    """It should raise with gauge pressure when pressure is not equalized."""
    decoy.when(state_store.config).then_return(
        Config(
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
            use_virtual_modules=False,
        )
    )
    decoy.when(
        state_store.modules.get_vacuum_module_substate(module_id="vacuum-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-id"),
            pump_engaged=False,
            residual_vacuum=False,
        )
    )
    decoy.when(
        state_store.modules.get_serial_number(module_id="vacuum-id")
    ).then_return("vacuum-serial")

    hardware_vacuum_module = MagicMock(spec=VacuumModule)
    hardware_vacuum_module.model.return_value = ModuleModel.VACUUM_MODULE_V1
    hardware_vacuum_module.device_info = {"serial": "vacuum-serial"}
    type(hardware_vacuum_module).pressure_equalized = property(  # noqa: ARG005
        lambda self: False
    )
    type(hardware_vacuum_module).current_gauge_pressure_mbar = property(  # noqa: ARG005
        lambda self: -250.0
    )
    decoy.when(hardware_api.attached_modules).then_return([hardware_vacuum_module])

    with pytest.raises(VacuumModuleStillUnderVacuumError, match="-250") as exc_info:
        await subject.ensure_vacuum_module_is_idle(
            labware_parent=ModuleLocation(moduleId="vacuum-id")
        )

    assert exc_info.value.current_gauge_pressure_mbar == -250.0


async def test_ensure_vacuum_module_is_idle_noops_when_pressure_equalized(
    decoy: Decoy,
    subject: VacuumModuleMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
) -> None:
    """It should no-op when the pump is off and the chamber is at atmospheric pressure."""
    decoy.when(state_store.config).then_return(
        Config(
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
            use_virtual_modules=False,
        )
    )
    decoy.when(
        state_store.modules.get_vacuum_module_substate(module_id="vacuum-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-id"),
            pump_engaged=False,
            residual_vacuum=False,
        )
    )
    decoy.when(
        state_store.modules.get_serial_number(module_id="vacuum-id")
    ).then_return("vacuum-serial")

    hardware_vacuum_module = MagicMock(spec=VacuumModule)
    hardware_vacuum_module.model.return_value = ModuleModel.VACUUM_MODULE_V1
    hardware_vacuum_module.device_info = {"serial": "vacuum-serial"}
    type(hardware_vacuum_module).pressure_equalized = property(  # noqa: ARG005
        lambda self: True
    )
    decoy.when(hardware_api.attached_modules).then_return([hardware_vacuum_module])

    await subject.ensure_vacuum_module_is_idle(
        labware_parent=ModuleLocation(moduleId="vacuum-id")
    )


async def test_ensure_vacuum_module_is_idle_skips_hardware_check_for_virtual_modules(
    decoy: Decoy,
    subject: VacuumModuleMovementFlagger,
    state_store: StateStore,
) -> None:
    """It should not query hardware when using virtual modules and residual is clear."""
    decoy.when(state_store.config).then_return(
        Config(
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
            use_virtual_modules=True,
        )
    )
    decoy.when(
        state_store.modules.get_vacuum_module_substate(module_id="vacuum-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-id"),
            pump_engaged=False,
            residual_vacuum=False,
        )
    )

    await subject.ensure_vacuum_module_is_idle(
        labware_parent=ModuleLocation(moduleId="vacuum-id")
    )


async def test_ensure_vacuum_module_is_idle_raises_virtual_residual_vacuum(
    decoy: Decoy,
    subject: VacuumModuleMovementFlagger,
    state_store: StateStore,
) -> None:
    """It should raise on residual vacuum for virtual modules (analysis)."""
    decoy.when(state_store.config).then_return(
        Config(
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
            use_virtual_modules=True,
        )
    )
    decoy.when(
        state_store.modules.get_vacuum_module_substate(module_id="vacuum-id")
    ).then_return(
        VacuumModuleSubState(
            module_id=VacuumModuleId("vacuum-id"),
            pump_engaged=False,
            residual_vacuum=True,
        )
    )

    with pytest.raises(VacuumModuleStillUnderVacuumError, match="may still be under"):
        await subject.ensure_vacuum_module_is_idle(
            labware_parent=ModuleLocation(moduleId="vacuum-id")
        )
