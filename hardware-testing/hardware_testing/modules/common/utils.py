"""Common utils."""

from serial.tools.list_ports import comports  # type: ignore[import]


def find_module_port(vid: int, pid: int) -> str:
    """Finds the port of the module with given pid and vid."""
    for i in comports():
        if i.vid == vid and i.pid == pid:
            print(f"Found module at port: {i.device}")
            return i.device
    raise RuntimeError("could not find connected module.")
