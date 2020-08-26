import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone
from opentrons.system import time


@pytest.fixture
def mock_status_str():
    return "Timezone=Etc/UTC\n" \
           "LocalRTC=no\n" \
           "CanNTP=yes\n" \
           "NTP=yes\n" \
           "NTPSynchronized=no\n" \
           "TimeUSec=Fri 2020-08-14 21:44:16 UTC\n"


@pytest.fixture
def mock_status_dict():
    return {'Timezone': 'Etc/UTC',
            'LocalRTC': False,
            'CanNTP': True,
            'NTP': True,
            'NTPSynchronized': False,
            'TimeUSec': 'Fri 2020-08-14 21:44:16 UTC'}


@pytest.fixture
def mock_time():
    # The above time in datetime
    return datetime(2020, 8, 14, 21, 44, 16, tzinfo=timezone.utc)


def test_str_to_dict(mock_status_str, mock_status_dict):
    status_dict = time._str_to_dict(mock_status_str)
    assert status_dict == mock_status_dict

    # Test exception raised for unexpected status string
    with pytest.raises(Exception, match="Error converting timedatectl.*"):
        not_a_status_str = "Something that's not a timedatectl status"
        time._str_to_dict(not_a_status_str)


async def test_set_time_error_response(mock_status_dict):

    async def async_mock_time_status(*args, **kwargs):
        _stat = mock_status_dict
        _stat.update(NTPSynchronized=True)
        return _stat

    time._time_status = MagicMock(side_effect=async_mock_time_status)

    now, err = await time.set_system_time(datetime.now())
    assert err == 'Cannot set system time; ' \
                  'already synchronized with NTP or RTC'


async def test_set_time_response(mock_status_dict, mock_time):

    async def async_mock_time_status(*args, **kwargs):
        _stat = mock_status_dict
        _stat.update(NTPSynchronized=False)
        return _stat

    async def async_mock_set_time(*args, **kwargs):
        return "out", "err"

    time._time_status = MagicMock(side_effect=async_mock_time_status)
    time._set_time = MagicMock(side_effect=async_mock_set_time)

    # System time gets set successfully
    time._set_time.assert_not_called()
    await time.set_system_time(mock_time)
    time._set_time.assert_called_once()

    # Datetime is converted to special format with UTC timezone for _set_time
    await time.set_system_time(datetime.fromisoformat(
        "2020-08-14T16:44:16-05:00"))   # from EST
    time._set_time.assert_called_with("2020-08-14 21:44:16")  # to UTC
