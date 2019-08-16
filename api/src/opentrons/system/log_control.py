"""
opentrons.system.log_control: functions for talking to syslog and journald

This is the implementation of the endpoints in
:py:mod:`opentrons.server.endpoints.logs` and friends.
"""
import asyncio
import collections
import datetime
import logging
import syslog
from typing import Any, Deque, Dict, List, Tuple

import systemd.journal as journal


LOG = logging.getLogger(__name__)

MAX_RECORDS = 1000000

_SYSLOG_PRIORITY_TO_NAME = {
    syslog.LOG_EMERG: 'emergency',
    syslog.LOG_CRIT: 'critical',
    syslog.LOG_ERR: 'error',
    syslog.LOG_WARNING: 'warning',
    syslog.LOG_INFO: 'info',
    syslog.LOG_DEBUG: 'debug',
    syslog.LOG_ALERT: 'alert',
    syslog.LOG_NOTICE: 'notice'
}


async def get_records(selector: str, record_count: int)\
          -> Deque[Dict[str, Any]]:
    """
    Get log records up to record count.

    The records are dicts from string keys to the arbitrary data provided
    by journald's interface (see
    https://www.freedesktop.org/software/systemd/python-systemd/journal.html ).

    :return: deque[dict[str, Any]]: A deque of records
    """
    loop = asyncio.get_event_loop()
    log_deque: Deque[Dict[str, Any]] = collections.deque(maxlen=record_count)
    with journal.Reader(journal.SYSTEM_ONLY) as r:
        r.add_match(SYSLOG_IDENTIFIER=selector)
        last_time = loop.time()
        for record in r:
            log_deque.append(record)
            now = loop.time()
            if (now-last_time) > 0.1:
                last_time = now
                await asyncio.sleep(0.01)
    return log_deque


def _format_record_text(record: Dict[str, Any]) -> str:
    dict_rec = _format_record_dict(record)
    return f'{dict_rec["time"]} {dict_rec["logger"]} '\
        f'[{dict_rec["level_name"]}]: {dict_rec["message"]}'


async def get_records_text(selector: str, record_count: int) -> str:
    """ Get log records as a newline-separated string of log records.

    Each record is a string of

    ``isotime logger [levelname]: message``
    """
    records = await get_records(selector, record_count)
    return '\n'.join([_format_record_text(record) for record in records])


def _format_record_dict(record: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'logger': record.get('LOGGER', '<unknown>'),
        'level': record.get('PRIORITY'),
        'level_name': _SYSLOG_PRIORITY_TO_NAME.get(  # type: ignore
            record.get('PRIORITY'), '<unknown>'),
        'file': record.get('CODE_FILE', '<unknown>'),
        'line': record.get('CODE_LINE', '<unknown>'),
        'func': record.get('CODE_FUNC', '<unknown>'),
        'time': record.get(
            '__REALTIME_TIMESTAMP',
            datetime.datetime.fromtimestamp(0)).isoformat(),
        'boot': str(record.get('_BOOT_ID', '<unknown>')),
        'message': record.get('MESSAGE', '<unknown>')
    }


async def get_records_serializable(
        selector: str, record_count: int) -> List[Dict[str, Any]]:
    """ Get log records in a structured format that is json serializable.

    Retains the syslog fields
    - 'logger': logger name
    - 'level': syslog priority, as an int
    - 'level_name': the name of the priority
    - 'file': the file from which the record was sourced
    - 'line': the line from which the record was sourced
    - 'func': the function from which the record was sourecd
    - 'time': the time in iso at which the record was sourced
    - 'boot': the boot id, an opaque string different per boot
    - 'message': the actual message
    """
    records = await get_records(selector, record_count)
    return [_format_record_dict(rec) for rec in records]


async def set_syslog_level(level: str) -> Tuple[int, str, str]:
    """
    Set the minimum level for which logs will be sent upstream via syslog-ng.

    This is the function that actually does the work for
    :py:meth:`set_syslog_level_handler`.

    Similar to :py:meth:`opentrons.server.endpoints.settings.set_log_level`,
    the level should be a python log level like "debug", "info", "warning", or
    "error". If it is null, sets the minimum log level to emergency which we
    do not log at since there's not really a matching level in python logging,
    which effectively disables log upstreaming.

    :returns tuple(int, str, str): The error code, stdout, and stderr from
                                   ``syslog-ng-ctl``. ``0`` is success,
                                   anything else is failure
    """
    with open('/var/lib/syslog-ng/min-level', 'w') as ml:
        ml.write(level)
    proc = await asyncio.create_subprocess_exec(
        'syslog-ng-ctl', 'reload',
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    return int(proc.returncode), stdout.decode(), stderr.decode()
