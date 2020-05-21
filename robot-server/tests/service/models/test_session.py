import pytest
from robot_server.service.models import session


def test_command_type_validation_jog():
    c = session.SessionCommand(**{'command': session.SessionCommands.jog,
                                  'data': {'vector': [1, 2, 3]}})
    assert c.data == session.calibration_models.JogPosition(vector=(1, 2, 3,))


def test_command_type_validation_jog_fail():
    with pytest.raises(ValueError):
        session.SessionCommand(**{'command': session.SessionCommands.jog,
                                  'data': {}})


def test_command_type_empty():
    """Test that we create command correctly for
     commands that have no added data."""
    c = session.SessionCommand(
        **{'command': session.SessionCommands.prepare_pipette,
           'data': {}})
    assert c.data == session.EmptyModel()
