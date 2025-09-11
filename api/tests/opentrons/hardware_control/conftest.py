from decoy import Decoy
import pytest

from opentrons.hardware_control.modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from opentrons.hardware_control.execution_manager import ExecutionManager


@pytest.fixture
def module_disconnected_callback(decoy: Decoy) -> ModuleDisconnectedCallback:
    return decoy.mock(cls=ModuleDisconnectedCallback)


@pytest.fixture
def module_error_callback(decoy: Decoy) -> ModuleErrorCallback:
    return decoy.mock(cls=ModuleErrorCallback)


@pytest.fixture
def mock_execution_manager(decoy: Decoy) -> ExecutionManager:
    return decoy.mock(cls=ExecutionManager)
