import pytest
from decoy import Decoy
from opentrons.hardware_control.types import StatusBarState
from opentrons.hardware_control.backends.status_bar_state import (
    StatusBarStateController,
)
from opentrons_hardware.hardware_control.status_bar import StatusBar


@pytest.fixture
def mock_status_bar_controller(decoy: Decoy) -> StatusBar:
    return decoy.mock(cls=StatusBar)


@pytest.fixture
def subject(mock_status_bar_controller: StatusBar) -> StatusBarStateController:
    return StatusBarStateController(mock_status_bar_controller)


@pytest.mark.parametrize(argnames=["enabled"], argvalues=[[True], [False]])
async def test_status_bar_interface(
    subject: StatusBarStateController, enabled: bool
) -> None:
    """Test setting status bar statuses and make sure the cached status is correct."""
    await subject.set_enabled(enabled)

    settings = {
        StatusBarState.IDLE: StatusBarState.IDLE,
        StatusBarState.RUNNING: StatusBarState.RUNNING,
        StatusBarState.PAUSED: StatusBarState.PAUSED,
        StatusBarState.HARDWARE_ERROR: StatusBarState.HARDWARE_ERROR,
        StatusBarState.SOFTWARE_ERROR: StatusBarState.SOFTWARE_ERROR,
        StatusBarState.CONFIRMATION: StatusBarState.IDLE,
        StatusBarState.RUN_COMPLETED: StatusBarState.RUN_COMPLETED,
        StatusBarState.UPDATING: StatusBarState.UPDATING,
        StatusBarState.ACTIVATION: StatusBarState.IDLE,
        StatusBarState.DISCO: StatusBarState.IDLE,
        StatusBarState.OFF: StatusBarState.OFF,
    }

    for setting, response in settings.items():
        await subject.set_status_bar_state(state=setting)
        assert subject.get_current_state() == response
