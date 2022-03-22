"""Tests for thermocycler_movement_flagger."""


from contextlib import nullcontext as does_not_raise
from typing import Any, ContextManager, NamedTuple, Optional

import pytest
from decoy import Decoy

from opentrons.types import DeckSlotName
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleLocation,
    ModuleModel as PEModuleModel,
)
from opentrons.protocol_engine.errors import ThermocyclerNotOpenError
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.modules import Thermocycler as HardwareThermocycler
from opentrons.hardware_control.modules.types import (
    # Renamed to avoid conflicting with ..types.ModuleModel.
    ModuleType as OpentronsModuleType,
    ThermocyclerModuleModel as OpentronsThermocyclerModuleModel,
)
from opentrons.drivers.types import ThermocyclerLidStatus

from opentrons.protocol_engine.execution.thermocycler_movement_flagger import (
    ThermocyclerMovementFlagger,
)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def subject(
    state_store: StateStore,
    hardware_api: HardwareAPI,
) -> ThermocyclerMovementFlagger:
    """Return a movement flagger initialized with mocked-out dependencies."""
    return ThermocyclerMovementFlagger(
        state_store=state_store,
        hardware_api=hardware_api,
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
            lid_status=None,
            expected_raise_cm=pytest.raises(ThermocyclerNotOpenError),
        ),
        LidStatusAndRaiseSpec(
            lid_status=ThermocyclerLidStatus.OPEN,
            expected_raise_cm=does_not_raise(),
        ),
    ],
)
async def test_raises_depending_on_thermocycler_lid_status(
    lid_status: Optional[ThermocyclerLidStatus],
    expected_raise_cm: ContextManager[Any],
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    decoy: Decoy,
) -> None:
    """When on a Thermocycler, it should raise if the lid isn't open."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        ModuleLocation(moduleId="module-id")
    )

    decoy.when(state_store.modules.get_model(module_id="module-id")).then_return(
        PEModuleModel.THERMOCYCLER_MODULE_V1,
    )
    decoy.when(
        state_store.modules.get_serial_number(module_id="module-id")
    ).then_return("module-serial")

    # These "type: ignore[misc]" comments let us assign to read-only properties,
    # necessary to work around Decoy not being able to stub properties.
    thermocycler = decoy.mock(cls=HardwareThermocycler)
    decoy.when(thermocycler.device_info).then_return({"serial": "module-serial"})
    decoy.when(thermocycler.lid_status).then_return(lid_status)
    decoy.when(
        await hardware_api.find_modules(
            by_model=OpentronsThermocyclerModuleModel.THERMOCYCLER_V1,
            resolved_type=OpentronsModuleType.THERMOCYCLER,
        )
    ).then_return(([thermocycler], None))

    with expected_raise_cm:
        await subject.raise_if_labware_in_non_open_thermocycler(
            labware_id="labware-id",
        )


async def test_raises_if_hardware_module_has_gone_missing(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    decoy: Decoy,
) -> None:
    """It should raise if the hardware module can't be found by its serial no."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        ModuleLocation(moduleId="module-id")
    )

    decoy.when(state_store.modules.get_model(module_id="module-id")).then_return(
        PEModuleModel.THERMOCYCLER_MODULE_V1,
    )
    decoy.when(
        state_store.modules.get_serial_number(module_id="module-id")
    ).then_return("module-serial")

    decoy.when(
        await hardware_api.find_modules(
            by_model=OpentronsThermocyclerModuleModel.THERMOCYCLER_V1,
            resolved_type=OpentronsModuleType.THERMOCYCLER,
        )
    ).then_return(([], None))

    with pytest.raises(ThermocyclerNotOpenError):
        await subject.raise_if_labware_in_non_open_thermocycler(
            labware_id="labware-id",
        )


async def test_passes_if_labware_on_non_thermocycler_module(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if the labware is on a module other than a Thermocycler."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        ModuleLocation(moduleId="module-id")
    )
    decoy.when(state_store.modules.get_model(module_id="module-id")).then_return(
        PEModuleModel.MAGNETIC_MODULE_V1,
    )
    await subject.raise_if_labware_in_non_open_thermocycler("labware-id")


async def test_passes_if_labware_not_on_any_module(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if the labware isn't on a module."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    await subject.raise_if_labware_in_non_open_thermocycler("labware-id")
