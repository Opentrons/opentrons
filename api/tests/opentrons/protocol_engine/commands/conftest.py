"""Fixtures for protocol engine command tests."""
from __future__ import annotations
from typing import TYPE_CHECKING

import pytest
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.api import API
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    RunControlHandler,
    RailLightsHandler,
    LabwareMovementHandler,
)
from opentrons.protocol_engine.state import StateView

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture
def state_view(decoy: Decoy) -> StateView:
    """Get a mocked out StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Get a mocked out HardwareControlAPI."""
    return decoy.mock(cls=HardwareControlAPI)


@pytest.mark.ot3_only
@pytest.fixture
def ot3_hardware_api(decoy: Decoy) -> OT3API:
    """Get a mocked out OT3API."""
    try:
        from opentrons.hardware_control.ot3api import OT3API

        return decoy.mock(cls=OT3API)
    except ImportError:
        # TODO (tz, 9-23-22) Figure out a better way to use this fixture with OT-3 api only.
        return None  # type: ignore[return-value]


@pytest.fixture
def ot2_hardware_api(decoy: Decoy) -> API:
    """Get a mocked out OT3API."""
    return decoy.mock(cls=API)


@pytest.fixture
def equipment(decoy: Decoy) -> EquipmentHandler:
    """Get a mocked out EquipmentHandler."""
    return decoy.mock(cls=EquipmentHandler)


@pytest.fixture
def movement(decoy: Decoy) -> MovementHandler:
    """Get a mocked out MovementHandler."""
    return decoy.mock(cls=MovementHandler)


"" ""


@pytest.fixture
def labware_movement(decoy: Decoy) -> LabwareMovementHandler:
    """Get a mocked out LabwareMovementHandler."""
    return decoy.mock(cls=LabwareMovementHandler)


@pytest.fixture
def pipetting(decoy: Decoy) -> PipettingHandler:
    """Get a mocked out PipettingHandler."""
    return decoy.mock(cls=PipettingHandler)


@pytest.fixture
def run_control(decoy: Decoy) -> RunControlHandler:
    """Get a mocked out RunControlHandler."""
    return decoy.mock(cls=RunControlHandler)


@pytest.fixture
def rail_lights(decoy: Decoy) -> RailLightsHandler:
    """Get a mocked out RailLightsHandler."""
    return decoy.mock(cls=RailLightsHandler)
