"""Control the machine's static hostname.

See the `name_management` package docstring for background on the static hostname
and how it's distinct from other names on the machine.
"""


import asyncio
import logging
import os
import urllib.parse

from .avahi import restart_daemon as restart_avahi_daemon


_log = logging.getLogger(__name__)


async def set_up_static_hostname() -> str:
    """Automatically configure the machine's static hostname.

    Intended to be run once when the server starts.

    This function:

    1. Picks a good value for the static hostname.
    2. Persists the new value for future boots.
    3. Updates the "live" value for the current boot.
    4. Restarts Avahi so that it advertises using the new live value.
    5. Returns the new static hostname.
    """
    hostname = _choose_static_hostname()

    with open("/etc/hostname", "w") as ehn:
        ehn.write(f"{hostname}\n")

    # First, we run hostnamed which will set the transient hostname
    # and loaded static hostname from the value we just wrote to
    # /etc/hostname
    _log.debug("Setting hostname")
    proc = await asyncio.create_subprocess_exec(
        "hostname",
        hostname,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    ret = proc.returncode
    if ret != 0:
        _log.error(
            f"Error starting hostname: {ret} " f"stdout: {stdout!r} stderr: {stderr!r}"
        )
        raise RuntimeError("Couldn't run hostname")

    # Then, with the hostname set, we can restart avahi
    _log.debug("Restarting avahi")
    await restart_avahi_daemon()
    _log.debug("Updated hostname and restarted avahi OK")

    return hostname


def _choose_static_hostname() -> str:
    """Get a good value for the system's static hostname.

    The static hostname is loaded from, in order of preference:

    1. url-encoding the contents of /var/serial-number, if it is present and not empty.
    2. the systemd-generated machine-id.
    """
    if os.path.exists("/var/serial"):
        serial = open("/var/serial").read().strip()
        if serial:
            # TODO(mm, 2022-04-27): This uses the serial number even if it hasn't
            # been configured and is still the default, like "opentrons."
            _log.info("Using serial for hostname")
            hn = "".join([c for c in urllib.parse.quote(serial, safe="") if c != "%"])
            if hn != serial:
                _log.warning(f"Reencoded serial to {hn}")
            return hn

        else:
            _log.info("Using machine-id for hostname: empty /var/serial")
    else:
        _log.info("Using machine-id for hostname: no /var/serial")

    with open("/etc/machine-id") as f:
        return f.read().strip()[:6]
