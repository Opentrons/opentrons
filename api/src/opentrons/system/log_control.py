"""
opentrons.system.log_control: functions for talking to syslog and journald

This is the implementation of the endpoints in
:py:mod:`opentrons.server.endpoints.logs` and friends.
"""
import asyncio
import logging
import subprocess
from typing import List


LOG = logging.getLogger(__name__)

MAX_RECORDS = 100000
DEFAULT_RECORDS = 50000

UNIT_SELECTORS = [
    "opentrons-robot-server",
    "opentrons-update-server",
    "opentrons-robot-app",
]
SERIAL_SPECIAL = "ALL_SERIAL"
SERIAL_SELECTORS = [
    "opentrons-api-serial",
    "opentrons-api-serial-can",
    "opentrons-api-serial-usbbin",
]


async def get_records_dumb(selector: str, records: int, mode: str) -> bytes:
    """Dump the log files.

    :param selector: The syslog selector to limit responses to
    :param records: The maximum number of records to print
    :param mode: A journalctl dump mode. Should be either "short-precise" or "json".
    """
    selector_array: List[str] = []
    if selector == SERIAL_SPECIAL:
        for serial_selector in SERIAL_SELECTORS:
            selector_array.extend(["-t", serial_selector])
    elif selector in UNIT_SELECTORS:
        selector_array.extend(["-u", selector])
    else:
        selector_array.extend(["-t", selector])

    proc = await asyncio.create_subprocess_exec(
        "journalctl",
        "--no-pager",
        *selector_array,
        "-n",
        str(records),
        "-o",
        mode,
        "-a",
        stdout=subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()
    return stdout
