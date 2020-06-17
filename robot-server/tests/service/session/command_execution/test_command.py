from datetime import timedelta

import pytest
from unittest.mock import patch

from robot_server.service.session.command_execution import command


@pytest.fixture
def test_command():
    return command.create_command(name="name", data={'a': 'b'})


@pytest.fixture
def mock_start_time():
    return command.datetime(2020, 5, 1)


@pytest.fixture
def mock_utcnow(mock_start_time):
    class _TimeIncrementer:
        def __init__(self, t):
            self._time = t

        def __call__(self, *args, **kwargs):
            ret = self._time
            self._time += timedelta(days=1)
            return ret

    with patch.object(command, 'datetime') as p:
        p.utcnow.side_effect = _TimeIncrementer(mock_start_time)
        yield p


def test_completed_timing(test_command, mock_utcnow, mock_start_time):
    with command.Completer(test_command) as c:
        pass

    result = c.completed.result
    assert result.started_at == mock_start_time
    assert result.status == "executed"
    assert result.completed_at == mock_start_time + timedelta(days=1)


def test_completes_with_status(test_command):
    with command.Completer(test_command, success_status="hello") as c:
        pass

    result = c.completed.result
    assert result.status == "hello"


def test_completes_with_error_status(test_command):
    with command.Completer(test_command, TypeError) as c:
        raise TypeError("this failed")

    result = c.completed.result
    assert result.status == "this failed"


def test_completes_unhandled(test_command):
    with pytest.raises(NameError):
        with command.Completer(test_command, TypeError):
            raise NameError("this failed")
