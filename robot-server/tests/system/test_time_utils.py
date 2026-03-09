"""Tests for time utilities."""
import pytest
from mock import MagicMock, patch
from datetime import datetime, timezone
from typing import Any, Dict, Union

from robot_server.system import errors, time_utils


@pytest.fixture
def mock_status_str() -> str:
    """Get mock output from `timedatectl`."""
    return (
        "Timezone=Etc/UTC\n"
        "LocalRTC=no\n"
        "CanNTP=yes\n"
        "NTP=yes\n"
        "NTPSynchronized=no\n"
        "TimeUSec=Fri 2020-08-14 21:44:16 UTC\n"
    )


@pytest.fixture
def mock_status_dict() -> Dict[str, Union[str, bool]]:
    """Expected dictionary format of `mock_status_str`."""
    return {
        "Timezone": "Etc/UTC",
        "LocalRTC": False,
        "CanNTP": True,
        "NTP": True,
        "NTPSynchronized": False,
        "TimeUSec": "Fri 2020-08-14 21:44:16 UTC",
    }


@pytest.fixture
def mock_time() -> datetime:
    """Get a datetime matching the time in `mock_status_str`."""
    return datetime(2020, 8, 14, 21, 44, 16, tzinfo=timezone.utc)


def test_str_to_dict(
    mock_status_str: str,
    mock_status_dict: Dict[str, Union[str, bool]],
) -> None:
    """It should be able to parse the output string of timedatectl."""
    status_dict = time_utils._str_to_dict(mock_status_str)
    assert status_dict == mock_status_dict


@pytest.mark.parametrize(
    argnames=["mock_status_err_str"],
    argvalues=[[""], ["There is no equal sign"], ["=== Too many ==="]],
)
def test_str_to_dict_does_not_raise_error(mock_status_err_str: str) -> None:
    """It should not raise errors due to parsing failures."""
    res_dict = time_utils._str_to_dict(mock_status_err_str)
    assert res_dict == {}


async def test_set_time_synchronized_error_response(
    mock_status_dict: Dict[str, Union[str, bool]],
) -> None:
    """It should raise an error if time is already synced."""

    async def async_mock_time_status(*args: Any, **kwargs: Any) -> Any:
        _stat = mock_status_dict
        _stat.update(NTPSynchronized=True)
        return _stat

    time_utils._time_status = MagicMock(side_effect=async_mock_time_status)

    with patch("robot_server.system.time_utils.IS_ROBOT", new=True):
        with pytest.raises(errors.SystemTimeAlreadySynchronized):
            await time_utils.set_system_time(datetime.now())


async def test_set_time_general_error_response(
    mock_status_dict: Dict[str, Union[str, bool]],
) -> None:
    """It should raise an error it `date` fails."""

    async def async_mock_time_status(*args: Any, **kwargs: Any) -> Any:
        _stat = mock_status_dict
        _stat.update(NTPSynchronized=False)
        return _stat

    async def async_mock_set_time(*args: Any, **kwargs: Any) -> Any:
        return "out", "An error occurred"

    time_utils._time_status = MagicMock(side_effect=async_mock_time_status)
    time_utils._set_time = MagicMock(side_effect=async_mock_set_time)

    with pytest.raises(errors.SystemSetTimeException):
        await time_utils.set_system_time(datetime.now())


async def test_set_time_response(
    mock_status_dict: Dict[str, Union[str, bool]],
    mock_time: datetime,
) -> None:
    """It should return the correct datetime."""

    async def async_mock_time_status(*args: Any, **kwargs: Any) -> Any:
        _stat = mock_status_dict
        _stat.update(NTPSynchronized=False)
        return _stat

    async def async_mock_set_time(*args: Any, **kwargs: Any) -> Any:
        return "out", ""

    time_utils._time_status = MagicMock(side_effect=async_mock_time_status)
    time_utils._set_time = MagicMock(side_effect=async_mock_set_time)

    with patch("robot_server.system.time_utils.IS_ROBOT", new=True):
        # System time gets set successfully
        time_utils._set_time.assert_not_called()
        await time_utils.set_system_time(mock_time)
        time_utils._set_time.assert_called_once()

        # Datetime is converted to the correct format with UTC for _set_time
        await time_utils.set_system_time(
            datetime.fromisoformat("2020-08-14T16:44:16-05:00")
        )  # from EST
        time_utils._set_time.assert_called_with("2020-08-14 21:44:16")  # to UTC
