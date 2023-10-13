"""System time utilities to support /system/time endpoints."""
import asyncio
import logging
from typing import Dict, Tuple, Union, cast
from datetime import datetime, timezone
from opentrons.util.helpers import utc_now

from server_utils.config import IS_ROBOT

from robot_server.system import errors
from robot_server.service.errors import CommonErrorDef

log = logging.getLogger(__name__)


def _str_to_dict(res_str: str) -> Dict[str, Union[str, bool]]:
    res_lines = res_str.splitlines()
    res_dict = {}

    for line in res_lines:
        if line:
            try:
                prop, val = line.split("=")
                res_dict[prop] = (
                    # Convert yes/no to boolean value
                    val
                    if val not in ["yes", "no"]
                    else val == "yes"
                )
            except (ValueError, IndexError) as e:
                log.error(f"Error converting timedatectl status line {line}:  {e}")

    return cast(Dict[str, Union[str, bool]], res_dict)


async def _time_status() -> Dict[str, Union[str, bool]]:
    """Get details of robot's date & time.

    Includes status of RTC (if present) and NTP synchronization.

    Returns:
        Dictionary of status params.
    """
    proc = await asyncio.create_subprocess_shell(
        "timedatectl show",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        loop=asyncio.get_event_loop(),
    )
    out, err = await proc.communicate()
    return _str_to_dict(out.decode())


async def _set_time(time: str) -> Tuple[str, str]:
    """Set the system time by spawning a `date` subprocess.

    Returns:
        Tuple of the output of `date --set` (usually the new date) and any error.
    """
    proc = await asyncio.create_subprocess_shell(
        f'date --utc --set "{time}"',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        loop=asyncio.get_event_loop(),
    )
    out, err = await proc.communicate()
    return out.decode(), err.decode()


async def get_system_time() -> datetime:
    """Get the system time.

    Returns:
        The system time as a UTC datetime object.
    """
    return utc_now()


async def set_system_time(new_time_dt: datetime) -> datetime:
    """Set the system time.

    This operation will error if system time is already being synchronized using
    an RTC or NTP-sync.

    Returns:
        The system time, whether or not it was changed

    Raises:
        SystemSetTimeException: the time was unable to be set using `date --set`
        SystemTimeAlreadySynchronized: the time cannot be set beacuse it is
            already synchronized with NTP and/or an RTC.
    """
    if not IS_ROBOT:
        raise errors.SystemSetTimeException(
            msg="Not supported on dev server.",
            definition=CommonErrorDef.NOT_IMPLEMENTED,
        )

    status = await _time_status()
    if status.get("LocalRTC") is True or status.get("NTPSynchronized") is True:
        # TODO: Update this to handle RTC sync correctly once we introduce RTC
        raise errors.SystemTimeAlreadySynchronized(
            "Cannot set system time; already synchronized with NTP or RTC"
        )
    else:
        new_time_dt = new_time_dt.astimezone(tz=timezone.utc)
        new_time_str = new_time_dt.strftime("%Y-%m-%d %H:%M:%S")
        log.info(f"Setting time to {new_time_str} UTC")
        _, err = await _set_time(new_time_str)
        if err:
            raise errors.SystemSetTimeException(err)
    return utc_now()
