"""StatusBar handler."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution.status_bar import StatusBarHandler
from opentrons.hardware_control import HardwareControlAPI, OT2HardwareControlAPI
from opentrons.hardware_control.types import StatusBarState


@pytest.fixture
def subject(
    hardware_api: HardwareControlAPI,
) -> StatusBarHandler:
    """Create a StatusBarHandler with its dependencies mocked out."""
    return StatusBarHandler(hardware_api=hardware_api)


@pytest.mark.parametrize("setting", [StatusBarState.IDLE, StatusBarState.RUN_COMPLETED])
async def test_set_status_bar(
    decoy: Decoy,
    subject: StatusBarHandler,
    hardware_api: OT2HardwareControlAPI,
    setting: StatusBarState,
) -> None:
    """The hardware controller should be called."""
    await subject.set_status_bar(setting)

    decoy.verify(await hardware_api.set_status_bar_state(state=setting), times=1)


@pytest.mark.parametrize(
    argnames=["setting", "should_be_busy"],
    argvalues=[
        [StatusBarState.IDLE, False],
        [StatusBarState.UPDATING, False],
        [StatusBarState.OFF, False],
        [StatusBarState.HARDWARE_ERROR, True],
        [StatusBarState.SOFTWARE_ERROR, True],
        [StatusBarState.RUN_COMPLETED, True],
        [StatusBarState.RUNNING, True],
        [StatusBarState.PAUSED, True],
    ],
)
async def test_check_status_bar_should_not_be_changed(
    decoy: Decoy,
    subject: StatusBarHandler,
    hardware_api: OT2HardwareControlAPI,
    setting: StatusBarState,
    should_be_busy: bool,
) -> None:
    """IDLE, UPDATING, and OFF should be the only states allowed to change."""
    decoy.when(hardware_api.get_status_bar_state()).then_return(setting)

    assert subject.status_bar_should_not_be_changed() == should_be_busy
