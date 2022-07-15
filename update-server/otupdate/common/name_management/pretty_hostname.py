"""Read and write the machine's pretty hostname.

See the `name_management` package docstring for background on the pretty hostname
and how it's distinct from other names on the machine.
"""


import unicodedata
from logging import getLogger


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


def get_pretty_hostname(default: str = "no name set") -> str:
    """Get the currently-configured pretty hostname"""
    try:
        with open("/etc/machine-info") as emi:
            contents = emi.read()
    except OSError:
        _log.exception("Couldn't read /etc/machine-info")
        contents = ""
    for line in contents.split("\n"):
        if line.startswith("PRETTY_HOSTNAME="):
            # FIXME(mm, 2022-04-27): This will not correctly read the pretty hostname
            # if it's quoted or contains escaped characters.
            # https://github.com/Opentrons/opentrons/issues/10197
            # Perhaps we should query the pretty hostname from hostnamectl instead of
            # implementing our own parsing.
            return "=".join(line.split("=")[1:])
    _log.warning(f"No PRETTY_HOSTNAME in {contents}, defaulting to {default}")
    return default


def persist_pretty_hostname(name: str) -> str:
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
        checked_name = get_pretty_hostname()
    return checked_name


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
