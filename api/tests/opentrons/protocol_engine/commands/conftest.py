"""Fixtures for protocol engine command tests."""
from __future__ import annotations

import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    RunControlHandler,
    RailLightsHandler,
    LabwareMovementHandler,
    StatusBarHandler,
)
from opentrons.protocol_engine.state import StateView


@pytest.fixture
def state_view(decoy: Decoy) -> StateView:
    """Get a mocked out StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def equipment(decoy: Decoy) -> EquipmentHandler:
    """Get a mocked out EquipmentHandler."""
    return decoy.mock(cls=EquipmentHandler)


@pytest.fixture
def movement(decoy: Decoy) -> MovementHandler:
    """Get a mocked out MovementHandler."""
    return decoy.mock(cls=MovementHandler)


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


@pytest.fixture
def status_bar(decoy: Decoy) -> StatusBarHandler:
    """Get a mocked out StatusBarHandler."""
    return decoy.mock(cls=StatusBarHandler)
