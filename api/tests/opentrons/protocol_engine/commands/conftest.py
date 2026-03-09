"""Fixtures for protocol engine command tests."""

from __future__ import annotations

import pytest
from decoy import Decoy

from opentrons.protocol_engine.actions import ActionDispatcher
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    GantryMover,
    LabwareMovementHandler,
    MovementHandler,
    PipettingHandler,
    RailLightsHandler,
    RunControlHandler,
    StatusBarHandler,
    TaskHandler,
    TipHandler,
)
from opentrons.protocol_engine.resources import (
    ConcurrencyProvider,
    FileProvider,
    ModelUtils,
)
from opentrons.protocol_engine.state.state import StateStore, StateView


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
def tip_handler(decoy: Decoy) -> TipHandler:
    """Get a mocked out EquipmentHandler."""
    return decoy.mock(cls=TipHandler)


@pytest.fixture
def run_control(decoy: Decoy) -> RunControlHandler:
    """Get a mocked out RunControlHandler."""
    return decoy.mock(cls=RunControlHandler)


@pytest.fixture
def rail_lights(decoy: Decoy) -> RailLightsHandler:
    """Get a mocked out RailLightsHandler."""
    return decoy.mock(cls=RailLightsHandler)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mocked out ModelUtils."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def status_bar(decoy: Decoy) -> StatusBarHandler:
    """Get a mocked out StatusBarHandler."""
    return decoy.mock(cls=StatusBarHandler)


@pytest.fixture
def gantry_mover(decoy: Decoy) -> GantryMover:
    """Get a mocked out GantryMover."""
    return decoy.mock(cls=GantryMover)


@pytest.fixture
def file_provider(decoy: Decoy) -> FileProvider:
    """Get a mocked out StateView."""
    return decoy.mock(cls=FileProvider)


@pytest.fixture
def task_handler(decoy: Decoy) -> TaskHandler:
    """Get a mocked out TaskHandler."""
    return decoy.mock(cls=TaskHandler)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mocked out ActionDispatcher.

    Only use this if you are using a real task handler.
    """
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
def concurrency_provider(decoy: Decoy) -> ConcurrencyProvider:
    """Get a mocked out ConcurrencyProvider.

    Only use this if you are using a real task handler.
    """
    return decoy.mock(cls=ConcurrencyProvider)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore.

    Only use this if you are using a real task handler.
    """
    return decoy.mock(cls=StateStore)


@pytest.fixture
def real_concurrency_provider() -> ConcurrencyProvider:
    """Get a real concurrency provider."""
    return ConcurrencyProvider()


@pytest.fixture
def real_task_handler(
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    real_concurrency_provider: ConcurrencyProvider,
) -> TaskHandler:
    """Get a real task handler with mocked dependencies."""
    return TaskHandler(
        state_store=state_store,
        action_dispatcher=action_dispatcher,
        model_utils=model_utils,
        concurrency_provider=real_concurrency_provider,
    )
