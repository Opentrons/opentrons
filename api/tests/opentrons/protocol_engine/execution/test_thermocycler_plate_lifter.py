"""Test thermocycler plate lifter execution side effects."""
from __future__ import annotations

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.types import (
    ModuleLocation,
    ModuleModel,
    DeckSlotLocation,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.execution.thermocycler_plate_lifter import (
    ThermocyclerPlateLifter,
)
from opentrons.protocol_engine.state import (
    StateStore,
    ThermocyclerModuleId,
    ThermocyclerModuleSubState,
)

from opentrons.hardware_control.modules import Thermocycler
from opentrons.types import DeckSlotName


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
def subject(
    state_store: StateStore,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> ThermocyclerPlateLifter:
    """Get ThermocyclerPlateLifter with its dependencies mocked out."""
    return ThermocyclerPlateLifter(
        state_store=state_store,
        equipment=equipment,
        movement=movement,
    )


async def test_lift_plate_for_labware_movement_from_tc_gen2(
    decoy: Decoy,
    state_store: StateStore,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    subject: ThermocyclerPlateLifter,
) -> None:
    """It should execute plate lift if moving labware from TC Gen2."""
    labware_location = ModuleLocation(moduleId="thermocycler-id")
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(state_store.modules.get_connected_model("thermocycler-id")).then_return(
        ModuleModel.THERMOCYCLER_MODULE_V2
    )
    decoy.when(
        equipment.get_module_hardware_api(
            ThermocyclerModuleId(labware_location.moduleId)
        )
    ).then_return(tc_hardware)
    decoy.when(
        state_store.modules.get_thermocycler_module_substate("thermocycler-id")
    ).then_return(
        ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("abc"),
            is_lid_open=True,
            target_block_temperature=None,
            target_lid_temperature=None,
        )
    )

    async with subject.lift_plate_for_labware_movement(
        labware_location=labware_location
    ):
        decoy.verify(
            await movement.home(axes=None),
            await tc_hardware.lift_plate(),
            await tc_hardware.raise_plate(),
        )
    decoy.verify(
        await tc_hardware.return_from_raise_plate(),
    )


async def test_do_not_lift_plate_if_not_in_tc_gen2(
    decoy: Decoy,
    state_store: StateStore,
    movement: MovementHandler,
    subject: ThermocyclerPlateLifter,
) -> None:
    """It should execute plate lift if moving labware from TC Gen2."""
    decoy.when(state_store.modules.get_connected_model("thermocycler-id")).then_return(
        ModuleModel.THERMOCYCLER_MODULE_V1
    )
    async with subject.lift_plate_for_labware_movement(
        labware_location=ModuleLocation(moduleId="thermocycler-id")
    ):
        pass
    decoy.verify(
        await movement.home(axes=matchers.Anything()),
        times=0,
    )

    async with subject.lift_plate_for_labware_movement(
        labware_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2)
    ):
        pass
    decoy.verify(
        await movement.home(axes=matchers.Anything()),
        times=0,
    )


async def test_do_not_lift_plate_with_lid_closed(
    decoy: Decoy,
    state_store: StateStore,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    subject: ThermocyclerPlateLifter,
) -> None:
    """It should not issue plate lift if lid is not open."""
    labware_location = ModuleLocation(moduleId="thermocycler-id")
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(state_store.modules.get_connected_model("thermocycler-id")).then_return(
        ModuleModel.THERMOCYCLER_MODULE_V2
    )
    decoy.when(
        equipment.get_module_hardware_api(
            ThermocyclerModuleId(labware_location.moduleId)
        )
    ).then_return(tc_hardware)
    decoy.when(
        state_store.modules.get_thermocycler_module_substate("thermocycler-id")
    ).then_return(
        ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("abc"),
            is_lid_open=False,
            target_block_temperature=None,
            target_lid_temperature=None,
        )
    )

    with pytest.raises(AssertionError):
        async with subject.lift_plate_for_labware_movement(
            labware_location=labware_location
        ):
            pass
