from opentrons.hardware_control import PauseManager
from opentrons.hardware_control.types import PauseType


def test_pause_and_delay_separation() -> None:
    """
    Test that pause and delay rely on two separate pause types, and
    do not resume each other
    """
    pause_mgr = PauseManager()
    assert pause_mgr.queue == []

    pause_mgr.pause(PauseType.PAUSE)
    assert pause_mgr.queue == [PauseType.PAUSE]

    pause_mgr.pause(PauseType.DELAY)
    assert pause_mgr.queue == [PauseType.PAUSE, PauseType.DELAY]

    pause_mgr.resume(PauseType.PAUSE)
    assert pause_mgr.queue == [PauseType.DELAY]

    pause_mgr.resume(PauseType.PAUSE)
    assert pause_mgr.queue == [PauseType.DELAY]

    pause_mgr.resume(PauseType.DELAY)
    assert pause_mgr.queue == []
