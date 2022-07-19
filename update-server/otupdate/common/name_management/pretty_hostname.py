"""Read and write the machine's pretty hostname.

See the `name_management` package docstring for background on the pretty hostname
and how it's distinct from other names on the machine.
"""


import asyncio
from logging import getLogger
from typing import List, Union


_log = getLogger(__name__)


async def get_pretty_hostname(default: str = "no name set") -> str:
    """Get the currently-configured pretty hostname.

    May raise an exception from the underlying ``hostnamectl`` process
    if this happens to run at the same time systemd-hostnamed is restarting.
    """
    # NOTE: The `api` package also retrieves the pretty hostname.
    # This logic must be kept in sync with the logic in `api`.
    result = (
        await _run_command(
            command="hostnamectl",
            # Only get the pretty hostname, not the static or transient one.
            args=["status", "--pretty"],
        )
    ).decode("utf-8")
    # Strip the trailing newline, since it's not part of the actual name value.
    # TODO(mm, 2022-07-18): When we upgrade to systemd 249, use `hostnamectl --json`
    # for CLI output that we can parse more robustly.
    assert len(result) >= 1 and result[-1] == "\n"
    return result[:-1]


async def persist_pretty_hostname(name: str) -> str:
    """Change the robot's pretty hostname.

    Writes the new name to /etc/machine-info so it persists across reboots.

    :param name: The name to set.
    :returns: The name that was set. This may be different from ``name``,
              if the pretty hostname could not be written.
    """
    try:
        # We can't run `hostnamectl --pretty <name>` to write this for us
        # because it fails with a read-only filesystem error, for unknown reasons.
        _rewrite_machine_info(new_pretty_hostname=name)
        checked_name = name
    except OSError:
        _log.exception("Could not set pretty hostname")
        checked_name = await get_pretty_hostname()

    # Now that we've rewritten /etc/machine-info to contain the new pretty hostname,
    # restart systemd-hostnamed so that commands like `hostnamectl status --pretty`
    # pick it up immediately.
    await _run_command(command="systemctl", args=["restart", "systemd-hostnamed"])

    return checked_name


def _rewrite_machine_info(new_pretty_hostname: str) -> None:
    """Write a new value for the pretty hostname.

    :raises OSError: If the new value could not be written.
    """
    try:
        with open("/etc/machine-info") as emi:
            contents = emi.read()
    except OSError:
        _log.exception("Couldn't read /etc/machine-info")
        contents = ""
    new_contents = _rewrite_machine_info_str(
        current_machine_info_contents=contents, new_pretty_hostname=new_pretty_hostname
    )
    with open("/etc/machine-info", "w") as emi:
        emi.write(new_contents)


def _rewrite_machine_info_str(
    current_machine_info_contents: str, new_pretty_hostname: str
) -> str:
    """
    Return current_machine_info_contents - the full contents of
    /etc/machine-info - with the PRETTY_HOSTNAME=... line rewritten to refer
    to new_pretty_hostname.
    """
    current_lines = current_machine_info_contents.splitlines()
    preserved_lines = [
        ln for ln in current_lines if not ln.startswith("PRETTY_HOSTNAME")
    ]
    # FIXME(mm, 2022-04-27): This will not correctly store the pretty hostname
    # if it contains newlines or certain other special characters.
    # https://github.com/Opentrons/opentrons/issues/9960
    new_lines = preserved_lines + [f"PRETTY_HOSTNAME={new_pretty_hostname}"]
    new_contents = "\n".join(new_lines) + "\n"
    return new_contents


# TODO(mm, 2022-07-18): Deduplicate with identical subprocess error-checking code
# in .avahi and .static_hostname modules.
async def _run_command(
    command: Union[str, bytes],
    args: List[Union[str, bytes]],
) -> bytes:
    process = await asyncio.create_subprocess_exec(
        command,
        *args,
        stdin=asyncio.subprocess.DEVNULL,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()
    ret = process.returncode
    if ret != 0:
        _log.error(
            f"Error calling {command!r}: {ret} "
            f"stdout: {stdout!r} stderr: {stderr!r}"
        )
        # TODO(mm, 2022-07-18): Use a structured and specific exception type
        # once this function is deduplicated.
        raise RuntimeError(f"Error calling {command!r}")
    return stdout
