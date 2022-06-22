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
from opentrons.hardware_control.modules import HeaterShaker as HardwareHeaterShaker
from opentrons.hardware_control.modules.types import (
    # Renamed to avoid conflicting with ..types.ModuleModel.
    ModuleType as OpentronsModuleType,
    HeaterShakerModuleModel as OpentronsHeaterShakerModuleModel,
)
#from opentrons.drivers.types import HeaterLidStatus

from opentrons.protocol_engine.execution.heater_shaker_restriction_flagger import (
    HeaterShakerMovementFlagger,
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
) -> HeaterShakerMovementFlagger:
    """Return a movement flagger initialized with mocked-out dependencies."""
    return HeaterShakerMovementFlagger(
        state_store=state_store,
        hardware_api=hardware_api,
    )


async def test_raises_single_channel_on_restricted_movement(
    subject: HeaterShakerMovementFlagger,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    decoy: Decoy,
) -> None:
    decoy.when(state_store.modules.get_all()).then_return([])

    await subject.raise_if_movement_restricted(
        labware_id="labware-id", pipette_id="pipette_id"
    )
