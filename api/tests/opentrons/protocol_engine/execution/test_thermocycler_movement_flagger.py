"""Tests for thermocycler_movement_flagger."""


from contextlib import nullcontext as does_not_raise
from typing import Any, ContextManager, NamedTuple, Optional

import pytest
from decoy import Decoy

from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.types import ModuleLocation, ModuleModel
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
def test_raises_if_thermocycler_not_open(
    lid_status: Optional[ThermocyclerLidStatus],
    expected_raise_cm: ContextManager[Any],
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
) -> None:
    """It should raise if the destination labware is in a non-open Thermocycler."""
    subject = ThermocyclerMovementFlagger(
        state_store=state_store,
        hardware_api=hardware_api,
    )

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
