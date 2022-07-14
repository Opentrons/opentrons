"""Read and write the machine's pretty hostname.

See the `name_management` package docstring for background on the pretty hostname
and how it's distinct from other names on the machine.
"""


from logging import getLogger


_log = getLogger(__name__)


class InvalidPrettyHostnameError(ValueError):
    pass


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
