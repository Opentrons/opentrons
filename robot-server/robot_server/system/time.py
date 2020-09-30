import asyncio
import logging
from typing import Dict, Tuple, Union
from datetime import datetime, timezone
from opentrons.util.helpers import utc_now
from opentrons.config import IS_ROBOT
from robot_server.system import errors
from robot_server.service.errors import CommonErrorDef

log = logging.getLogger(__name__)


def _str_to_dict(res_str) -> Dict[str, Union[str, bool]]:
    res_lines = res_str.splitlines()
    res_dict = {}

    for line in res_lines:
        if line:
            try:
                prop, val = line.split('=')
                res_dict[prop] = val if val not in ['yes', 'no'] \
                    else val == 'yes'  # Convert yes/no to boolean value
            except (ValueError, IndexError) as e:
                log.error(f'Error converting timedatectl status line {line}:'
                          f' {e}')
    return res_dict


async def _time_status(loop: asyncio.AbstractEventLoop = None
                       ) -> Dict[str, Union[str, bool]]:
    """
    Get details of robot's date & time, with specifics of RTC (if present)
    & status of NTP synchronization.
    :return: Dictionary of status params.
    """
    proc = await asyncio.create_subprocess_shell(
        'timedatectl show',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        loop=loop or asyncio.get_event_loop()
    )
    out, err = await proc.communicate()
    return _str_to_dict(out.decode())


async def _set_time(time: str,
                    loop: asyncio.AbstractEventLoop = None) -> Tuple[str, str]:
    """
    :return: tuple of output of date --set (usually the new date)
        & error, if any.
    """
    proc = await asyncio.create_subprocess_shell(
        f'date --utc --set \"{time}\"',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        loop=loop or asyncio.get_event_loop()
    )
    out, err = await proc.communicate()
    return out.decode(), err.decode()


async def get_system_time(loop: asyncio.AbstractEventLoop = None) -> datetime:
    """
    :return: Just the system time as a UTC datetime object.
    """
    return utc_now()


async def set_system_time(new_time_dt: datetime,
                          loop: asyncio.AbstractEventLoop = None
                          ) -> datetime:
    """
    Set the system time unless system time is already being synchronized using
    an RTC or NTPsync.
    Raise error with message, if any.
    :return: current date read.
    """
    if not IS_ROBOT:
        raise errors.SystemSetTimeException(
            msg="Not supported on dev server.",
            definition=CommonErrorDef.NOT_IMPLEMENTED)

    status = await _time_status(loop)
    if status.get('LocalRTC') is True or status.get('NTPSynchronized') is True:
        # TODO: Update this to handle RTC sync correctly once we introduce RTC
        raise errors.SystemTimeAlreadySynchronized(
            'Cannot set system time; already synchronized with NTP or RTC')
    else:
        new_time_dt = new_time_dt.astimezone(tz=timezone.utc)
        new_time_str = new_time_dt.strftime("%Y-%m-%d %H:%M:%S")
        log.info(f'Setting time to {new_time_str} UTC')
        _, err = await _set_time(new_time_str)
        if err:
            raise errors.SystemSetTimeException(err)
    return utc_now()
