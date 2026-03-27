"""Get system logs from journald."""

import asyncio
import subprocess


async def get_records_dumb(
    units: list[str],
    syslog_ids: list[str],
    records: int,
    mode: str,
) -> bytes:
    """Get system logs from journalctl.

    Params:
        units: Limit output to just records from these systemd units.
        syslog_ids: Limit output to just records from these syslog identifiers.
        records: The maximum number of records to extract.
        mode: A journalctl dump mode, like "short-precise" or "json".

    When multiple `units` or `syslog_ids` are specified, journalctl's filtering behavior acts like:

        (unit_1_match or unit_2_match or ...) and (syslog_id_1_match or syslog_id_2_match or ...)

    An empty  `units` means all units, and an empty `syslog_ids` means all syslog IDs.
    """
    selector_array: list[str] = []
    for unit in units:
        selector_array.extend(["-u", unit])
    for syslog_id in syslog_ids:
        selector_array.extend(["-t", syslog_id])

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
