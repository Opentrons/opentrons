"""Read and write the machine's pretty hostname.

See the `name_management` package docstring for background on the pretty hostname
and how it's distinct from other names on the machine.
"""


import asyncio
import unicodedata
from logging import getLogger
from typing import List, Union


_log = getLogger(__name__)


def pretty_hostname_is_valid(pretty_hostname: str) -> bool:
    """Return whether we can persist ``pretty_hostname`` in /etc/machine-info.

    Restrictions come from a few places:

    1. For values in general that are stored in /etc/machine-info,
       the file format documentation explicitly allows Unicode
       but says "non-printable characters should not be used."
       There isn't a formal definition of "non-printable" in Unicode,
       so this is up to interpretation.

       https://www.freedesktop.org/software/systemd/man/machine-info.html

    2. For the pretty hostname specifically, systemd disallows
       ASCII < 0x20 (space) and ASCII 0x7f (DEL), but allows everything else.

       This is by experimenting with `hostnamectl set-hostname --pretty`
       and by reading the source code of systemd-hostnamed.
       systemd doesn't formally document these restrictions.

       https://github.com/systemd/systemd/blob/v239/src/hostname/hostnamed.c#L524

    3. This module's parser would get confused by values that contain newlines,
       since it sees the file as a list of newline-separated KEY=VALUE pairs.

    To cover at least all of the above, we disallow code points in the Unicode
    "control" group.
    """
    contains_control_characters = any(
        unicodedata.category(c) == "Cc" for c in pretty_hostname
    )
    return not contains_control_characters


async def get_pretty_hostname(default: str = "no name set") -> str:
    """Get the currently-configured pretty hostname.

    May raise an exception from the underlying ``hostnamectl`` process
    if this happens to run at the same time systemd-hostnamed is restarting.
    """
    # NOTE: The `api` package also retrieves the pretty hostname.
    # This logic must be kept in sync with the logic in `api`.
    result = (
        await _run_subprocess(
            command="hostnamectl",
            args=["--pretty", "status"],
        )
    ).decode("utf-8")
    # Strip the trailing newline, since it's not part of the actual name value.
    # TODO(mm, 2022-07-18): When we upgrade to systemd 249, use `hostnamectl --json`
    # for CLI output that we can parse more robustly.
    assert len(result) >= 1 and result[-1] == "\n"
    return result[:-1]


async def persist_pretty_hostname(new_pretty_hostname: str) -> None:
    """Change the robot's pretty hostname.

    The new name will persist across reboots.

    Args:
        new_pretty_hostname: The name to set. Must be valid;
            see `pretty_hostname_is_valid()`.
    """
    assert pretty_hostname_is_valid(new_pretty_hostname)

    # Set the new pretty hostname.
    #
    # Ideally, we'd do this by running `hostnamectl set-hostname --pretty <new name>`.
    # Unfortunately, that fails with errors related to the filesystem being read-only
    # or the mount point being busy.
    #
    # This apparently has to do with us using a bind mount for the /etc/machine-info
    # file, which is where `hostnamectl` stores the pretty hostname.
    #
    # As a workaround, rewrite /etc/machine-info ourselves.
    _rewrite_machine_info(new_pretty_hostname=new_pretty_hostname)

    # Now that we've rewritten /etc/machine-info to contain the new pretty hostname,
    # restart systemd-hostnamed so that commands like `hostnamectl status --pretty`
    # pick it up immediately.
    await _run_subprocess(
        command="systemctl", args=["reload-or-restart", "systemd-hostnamed"]
    )

    read_back_pretty_hostname = await get_pretty_hostname()
    assert read_back_pretty_hostname == new_pretty_hostname, (
        f"Tried to set pretty hostname to {new_pretty_hostname!r}"
        f" but actually set it to {read_back_pretty_hostname!r}."
        f" This is probably a bug in how we validate or escape the string."
    )


def _quote_and_escape_pretty_hostname_value(pretty_hostname: str) -> str:
    r"""Prepare a string to be used as the PRETTY_HOSTNAME value in /etc/machine-info.

    This function implements the shell-like quoting and escaping rules described in
    the /etc/machine-info documentation.

    Given a string like:

        Hello $ world

    This returns:

        "Hello \$ world"

    (Including adding the double-quote characters at the beginning and end.)

    The returned string can then be inserted into /etc/machine-info, like:

        PRETTY_HOSTNAME="Hello \$ world"

    https://www.freedesktop.org/software/systemd/man/machine-info.html
    """
    assert pretty_hostname_is_valid(pretty_hostname)
    translation_table = str.maketrans(
        # Escape dollar signs, double-quote characters, backslashes, and backticks
        # with a single backslash each.
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


# TODO(mm, 2022-07-18): Deduplicate with identical subprocess error-checking code
# in .avahi and .static_hostname modules.
async def _run_subprocess(
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
