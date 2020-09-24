import pytest

from robot_server.service.session.models.command import \
    CalibrationCommand, BasicSessionCommand
from robot_server.service.session.models.common import EmptyModel, \
    JogPosition
from robot_server.service.session.models.session import BasicSession


def test_command_type_validation_jog():
    c = BasicSessionCommand(**{'command': CalibrationCommand.jog,
                               'data': {'vector': [1, 2, 3]}})
    assert c.data == JogPosition(vector=(1, 2, 3,))


def test_command_type_validation_jog_fail():
    with pytest.raises(ValueError):
        BasicSessionCommand(**{'command': CalibrationCommand.jog,
                               'data': {}})


def test_command_type_empty():
    """Test that we create command correctly for
     commands that have no added data."""
    c = BasicSessionCommand(
        **{'command': CalibrationCommand.load_labware,
           'data': {}})
    assert c.data == EmptyModel()


@pytest.mark.parametrize(argnames="create_params",
                         argvalues=[
                            {'createParams': None},
                            {'createParams': {}},
                            {}
                         ])
def test_basic_session_type_validation_no_create_params(create_params):
    """Test that when create params have no mandatory members we accept null,
    and {}"""
    body = {
        "sessionType": "null",
    }
    body.update(create_params)

    session = BasicSession(**body)
    assert session.createParams == create_params.get('createParams')


@pytest.mark.parametrize(argnames="create_params",
                         argvalues=[
                            {'createParams': None},
                            {'createParams': {}},
                            {}
                         ])
def test_basic_session_type_validation_with_create_params(create_params):
    """Test that when create params have mandatory members we reject invalid
    createParams"""
    body = {
        "sessionType": "protocol",
    }
    body.update(create_params)

    with pytest.raises(ValueError):
        BasicSession(**body)
