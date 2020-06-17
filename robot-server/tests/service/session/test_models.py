import pytest
from robot_server.service.session import models


def test_command_type_validation_jog():
    c = models.BasicSessionCommand(**{'command': models.CommandName.jog,
                                      'data': {'vector': [1, 2, 3]}})
    assert c.data == models.calibration_models.JogPosition(vector=(1, 2, 3,))


def test_command_type_validation_jog_fail():
    with pytest.raises(ValueError):
        models.BasicSessionCommand(**{'command': models.CommandName.jog,
                                      'data': {}})


def test_command_type_empty():
    """Test that we create command correctly for
     commands that have no added data."""
    c = models.BasicSessionCommand(
        **{'command': models.CommandName.prepare_pipette,
           'data': {}})
    assert c.data == models.EmptyModel()
