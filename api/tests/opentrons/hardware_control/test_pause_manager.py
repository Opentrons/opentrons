import pytest
from opentrons.hardware_control import PauseManager
from opentrons.hardware_control.types import DoorState, PauseType, PauseResumeError


def test_pause_and_delay_separation():
    """
    Test that pause and delay rely on two separate pause types, and
    do not resume each other
    """
    pause_mgr = PauseManager(door_state=DoorState.CLOSED)
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


def test_door_pause_protocol(enable_door_safety_switch):
    """
    Test that when the door safety switch is enabled, pause cannot
    be resumed until the door is closed
    """
    pause_mgr = PauseManager(door_state=DoorState.CLOSED)
    assert pause_mgr.queue == []

    pause_mgr.set_door(door_state=DoorState.OPEN)
    pause_mgr.pause(PauseType.PAUSE)
    assert pause_mgr.queue == [PauseType.PAUSE]

    with pytest.raises(PauseResumeError):
        pause_mgr.resume(PauseType.PAUSE)
        assert pause_mgr.queue == [PauseType.PAUSE]

    pause_mgr.set_door(door_state=DoorState.CLOSED)
    assert pause_mgr.queue == [PauseType.PAUSE]

    pause_mgr.resume(PauseType.PAUSE)
    assert pause_mgr.queue == []
