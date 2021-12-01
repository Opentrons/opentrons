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
    ModuleModel,
)
from opentrons.protocol_engine.errors import ThermocyclerNotOpenError
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.modules import Thermocycler as HardwareThermocycler
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


class RaiseIfThermocyclerNotOpenSpec(NamedTuple):
    """Parametrization data for test_move_to_well_raises_if_thermocycler_not_open()."""

    # Optional to match current signature of Thermocycler.lid_status.
    # Should change to non-Optional if/when that becomes non-optional.
    lid_status: Optional[ThermocyclerLidStatus]
    expected_raise_cm: ContextManager[Any]


@pytest.mark.parametrize(
    RaiseIfThermocyclerNotOpenSpec._fields,
    [
        RaiseIfThermocyclerNotOpenSpec(
            lid_status=ThermocyclerLidStatus.CLOSED,
            expected_raise_cm=pytest.raises(ThermocyclerNotOpenError),
        ),
        RaiseIfThermocyclerNotOpenSpec(
            lid_status=ThermocyclerLidStatus.IN_BETWEEN,
            expected_raise_cm=pytest.raises(ThermocyclerNotOpenError),
        ),
        RaiseIfThermocyclerNotOpenSpec(
            lid_status=None,
            expected_raise_cm=pytest.raises(ThermocyclerNotOpenError),
        ),
        RaiseIfThermocyclerNotOpenSpec(
            lid_status=ThermocyclerLidStatus.OPEN,
            expected_raise_cm=does_not_raise(),
        ),
    ],
)
def test_raises_depending_on_thermocycler_lid_status(
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
        ModuleModel.THERMOCYCLER_MODULE_V1,
    )
    decoy.when(state_store.modules.get_serial(module_id="module-id")).then_return(
        "module-serial"
    )

    # These "type: ignore[misc]" comments let us assign to read-only properties,
    # necessary to work around Decoy not being able to stub properties.
    thermocycler = decoy.mock(cls=HardwareThermocycler)
    thermocycler.device_info = {"serial": "module-serial"}  # type: ignore[misc]
    thermocycler.lid_status = lid_status  # type: ignore[misc]
    hardware_api.attached_modules = [thermocycler]  # type: ignore[misc]

    with expected_raise_cm:
        subject.raise_if_labware_in_non_open_thermocycler(
            labware_id="labware-id",
        )


def test_raises_if_hardware_module_has_gone_missing(
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
        ModuleModel.THERMOCYCLER_MODULE_V1,
    )
    decoy.when(state_store.modules.get_serial(module_id="module-id")).then_return(
        "module-serial"
    )

    # This "type: ignore[misc]" lets us assign to the read-only property,
    # necessary to work around Decoy not being able to stub properties.
    hardware_api.attached_modules = []  # type: ignore[misc]

    with pytest.raises(ThermocyclerNotOpenError):
        subject.raise_if_labware_in_non_open_thermocycler(
            labware_id="labware-id",
        )


def test_passes_if_labware_on_non_thermocycler_module(
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
        ModuleModel.MAGNETIC_MODULE_V1,
    )
    subject.raise_if_labware_in_non_open_thermocycler("labware-id")


def test_passes_if_labware_not_on_any_module(
    subject: ThermocyclerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    decoy: Decoy,
) -> None:
    """It shouldn't raise if the labware isn't on a module."""
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    subject.raise_if_labware_in_non_open_thermocycler("labware-id")
