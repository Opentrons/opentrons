from collections import namedtuple
from typing import (
    Dict, NamedTuple, Callable, Any, Tuple, Awaitable, Mapping, Union)
from pathlib import Path

ThermocyclerStep = Dict[str, float]

InterruptCallback = Callable[[str], None]

UploadFunction = Callable[[str, str, Dict[str, Any]],
                          Awaitable[Tuple[bool, str]]]

ModuleAtPort = namedtuple('ModuleAtPort', ('port', 'name'))

LiveData = Mapping[str, Union[str, Mapping[str, Union[float, str, None]]]]


class BundledFirmware(NamedTuple):
    """ Represents a versioned firmware file, generally bundled into the fs"""
    version: str
    path: Path

    def __repr__(self) -> str:
        return f'<BundledFirmware {self.version}, path={self.path}>'


class UpdateError(RuntimeError):
    pass


class UnsupportedModuleError(Exception):
    pass


class AbsentModuleError(Exception):
    pass


class ModuleInfo(NamedTuple):
    model: str        # A module model such as "magneticModuleV2"
    fw_version: str   # The version of the firmware
    hw_revision: str  # the revision of the hardware
    serial: str       # the serial number
