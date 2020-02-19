"""
opentrons.system.log_control: functions for talking to syslog and journald

This is the implementation of the endpoints in
:py:mod:`opentrons.aiohttp.endpoints.logs` and friends.
"""
import asyncio
import logging
import subprocess
import syslog
from typing import Tuple


LOG = logging.getLogger(__name__)

MAX_RECORDS = 100000

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


async def get_records_dumb(selector: str, records: int,
                           mode: str) -> bytes:
    """ Dump the log files.

    :param selector: The syslog selector to limit responses to
    :param records: The maximum number of records to print
    :param mode: A journalctl dump mode. Should be either "short" or "json".
    """
    proc = await asyncio.create_subprocess_exec(
        'journalctl', '--no-pager',
        '-t', selector,
        '-n', str(records),
        '-o', mode,
        '-a',
        stdout=subprocess.PIPE)
    stdout, _ = await proc.communicate()
    return stdout


async def set_syslog_level(level: str) -> Tuple[int, str, str]:
    """
    Set the minimum level for which logs will be sent upstream via syslog-ng.

    This is the function that actually does the work for
    :py:meth:`set_syslog_level_handler`.

    Similar to :py:meth:`opentrons.aiohttp.endpoints.settings.set_log_level`,
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
