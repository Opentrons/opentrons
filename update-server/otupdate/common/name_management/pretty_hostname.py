"""Read and write the machine's pretty hostname.

See the `name_management` package docstring for background on the pretty hostname
and how it's distinct from other names on the machine.
"""


import asyncio
import unicodedata
from logging import getLogger
from typing import List, Optional, Union


_log = getLogger(__name__)


class InvalidPrettyHostnameError(ValueError):
    pass


def pretty_hostname_is_valid(pretty_hostname: str) -> bool:
    """Return whether we can persist ``pretty_hostname`` in /etc/machine-info.

    Restrictions come from a few places:

    1. For values in general that are stored in /etc/machine/info,
       the file format documentation explicitly allows Unicode
       but says "non-printable characters should not be used."
       There isn't a formal definition of "non-printable" in Unicode,
       so this is up to interpretation.

       https://www.freedesktop.org/software/systemd/man/machine-info.html

    2. For the pretty hostname specifically, systemd disallows
       ASCII < 0x20 (space) and ASCII 0x7f (DEL), but allows everything else.

       This is by experimenting with `hostnamectl set-hostname --pretty`
       and by reading the source code of systemd-hostnamed.
       systemd doesn't formally document its limitations on the pretty hostname.

       https://github.com/systemd/systemd/blob/v239/src/hostname/hostnamed.c#L524

    3. This module's parser would get confused by values that contain newlines,
       since it sees the file as a list of newline-separated KEY=VALUE pairs.

    To cover at least all of the above, we disallow code points in the Unicode
    "control" group.
    """
    contains_control = any(unicodedata.category(c) == "Cc" for c in pretty_hostname)
    return not contains_control


async def get_pretty_hostname(default: str = "no name set") -> str:
    """Get the currently-configured pretty hostname"""
    result = (
        await _run_command(
            command="hostnamectl",
            # Only get the pretty hostname, not the static or transient one.
            args=["status", "--pretty"],
        )
    ).decode("utf-8")
    assert len(result) >= 1 and result[-1] == "\n"
    return result[:-1]


async def persist_pretty_hostname(new_pretty_hostname: str) -> None:
    """Change the robot's pretty hostname.

    Writes the new name to /etc/machine-info so it persists across reboots.

    Args:
        new_pretty_hostname: The name to set.

    Raises:
        InvalidPrettyHostnameError: If the given name wouldn't be valid.
            The persisted name is left unchanged.
    """
    if not pretty_hostname_is_valid(new_pretty_hostname):
        # TODO BEFORE MERGE: Add a nice message.
        raise InvalidPrettyHostnameError()

    # We can't run `hostnamectl --pretty <name>` to write this for us
    # because it fails with errors related to the filesystem being read-only
    # or the mount point being busy, apparently because of our bind mount.
    _rewrite_machine_info(new_pretty_hostname=new_pretty_hostname)

    # TODO BEFORE MERGE: Explain this.
    await _run_command(command="systemctl", args=["restart", "systemd-hostnamed"])

    set_pretty_hostname = await get_pretty_hostname()
    if set_pretty_hostname != new_pretty_hostname:
        # TODO BEFORE MERGE: Should we restore the original file contents here?
        _log.error(
            f"Tried to set pretty hostname to {new_pretty_hostname!r}"
            f" but actually set it to {set_pretty_hostname!r}."
            f" This is probably a bug in how we validate or escape it."
        )


# TODO: Deduplicate with other subprocess stuff in update-server.
async def _run_command(
    command: Union[str, bytes],
    args: List[Union[str, bytes]],
    input: Optional[bytes] = None,
) -> bytes:
    process = await asyncio.create_subprocess_exec(
        command,
        *args,
        stdin=asyncio.subprocess.DEVNULL if input is None else asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate(input)
    ret = process.returncode
    if ret != 0:
        _log.error(
            f"Error calling {command!r}: {ret} "
            f"stdout: {stdout!r} stderr: {stderr!r}"
        )
        raise RuntimeError(f"Error calling {command!r}")
    return stdout


def _quote_and_escape_pretty_hostname_value(pretty_hostname: str) -> str:
    # TODO: Explain background of shell-ish syntax.
    if not pretty_hostname_is_valid(pretty_hostname):
        raise InvalidPrettyHostnameError()
    translation_table = str.maketrans(
        {
            "$": r"\$",
            '"': r"\"",
            "\\": "\\\\",
            "`": r"\`",
        }
    )
    escaped = pretty_hostname.translate(translation_table)
    quoted_and_escaped = f'"{escaped}"'
    return quoted_and_escaped


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
    new_lines = preserved_lines + [
        f"PRETTY_HOSTNAME={_quote_and_escape_pretty_hostname_value(new_pretty_hostname)}"
    ]
    new_contents = "\n".join(new_lines) + "\n"
    return new_contents
