from datetime import timedelta, datetime

import pytest
from unittest.mock import patch

from robot_server import util


@pytest.fixture
def mock_start_time():
    return datetime(2020, 5, 1)


@pytest.fixture
def mock_utcnow(mock_start_time):
    """Mock util.datetime.utcnow.

    First call will be mock_start_time. Subsequent calls will increment by
    1 day."""
    class _TimeIncrementer:
        def __init__(self, t):
            self._time = t

        def __call__(self, *args, **kwargs):
            ret = self._time
            self._time += timedelta(days=1)
            return ret

    with patch.object(util, 'datetime') as p:
        p.utcnow.side_effect = _TimeIncrementer(mock_start_time)
        yield p


def test_time_it(mock_utcnow, mock_start_time):
    with util.timeit() as t:
        pass

    assert t.start == mock_start_time
    assert t.end == mock_start_time + timedelta(days=1)


def test_time_it_raises(mock_utcnow, mock_start_time):
    try:
        with util.timeit() as t:
            raise AssertionError()
    except AssertionError:
        pass

    assert t.start == mock_start_time
    assert t.end == mock_start_time + timedelta(days=1)
