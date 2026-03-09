import pytest
from decoy import Decoy

from opentrons_hardware.hardware_control.status_bar import StatusBar

from opentrons.hardware_control.backends.status_bar_state import (
    StatusBarStateController,
)
from opentrons.hardware_control.types import StatusBarState, StatusBarUpdateEvent


@pytest.fixture
def mock_status_bar_controller(decoy: Decoy) -> StatusBar:
    return decoy.mock(cls=StatusBar)


@pytest.fixture
def subject(mock_status_bar_controller: StatusBar) -> StatusBarStateController:
    return StatusBarStateController(mock_status_bar_controller)


SETTINGS = {
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


@pytest.mark.parametrize(argnames=["enabled"], argvalues=[[True], [False]])
@pytest.mark.parametrize("setting", list(SETTINGS.keys()))
async def test_status_bar_interface(
    decoy: Decoy,
    subject: StatusBarStateController,
    enabled: bool,
    setting: StatusBarState,
) -> None:
    """Test setting status bar statuses and make sure the cached status is correct. Also
    verify that the listeners are called with the correct status bar state and enabled
    status."""
    listener_1 = decoy.mock(name="listener_1")
    listener_2 = decoy.mock(name="listener_2")
    subject.add_listener(listener_1)
    subject.add_listener(listener_2)

    await subject.set_enabled(enabled)
    await subject.set_status_bar_state(state=setting)
    assert subject.get_current_state() == SETTINGS[setting]

    decoy.verify(
        listener_1(StatusBarUpdateEvent(SETTINGS[setting], enabled)),
        listener_2(StatusBarUpdateEvent(SETTINGS[setting], enabled)),
    )
