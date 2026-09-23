"""Common utils."""

from __future__ import annotations

import os
from pathlib import Path

from serial.tools.list_ports import comports  # type: ignore[import]


def resolve_ot_module_symlink(device_path: str) -> str:
    """Map a raw serial device path to its Opentrons udev symlink, if any.

    udev creates nodes like ``/dev/ot_module_vacuummodule5 -> ttyACM5``.
    Given ``/dev/ttyACM5`` (as returned by pyserial ``comports()``), return the
    matching ``/dev/ot_module_*`` path by comparing realpaths. Falls back to
    ``device_path`` when no symlink is found.
    """
    try:
        target_real = os.path.realpath(device_path)
    except OSError:
        return device_path

    for link in Path("/dev").glob("ot_module_*"):
        try:
            if os.path.realpath(link) == target_real:
                return str(link)
        except OSError:
            continue
    return device_path


def find_module_port(vid: int, pid: int) -> str:
    """Finds the port of the module with given pid and vid.

    Prefers the ``/dev/ot_module_*`` udev symlink for the matched device when
    present.
    """
    for i in comports():
        if i.vid == vid and i.pid == pid:
            port = resolve_ot_module_symlink(i.device)
            print(f"Found module at port: {port}")
            return port
    raise RuntimeError("could not find connected module.")
