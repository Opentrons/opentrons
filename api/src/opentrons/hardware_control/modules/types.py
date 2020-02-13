from collections import namedtuple
from typing import Dict, NamedTuple, Callable, Any, Tuple, Awaitable
from pathlib import Path

ThermocyclerStep = Dict[str, float]

InterruptCallback = Callable[[str], None]

UploadFunction = Callable[[str, str, Dict[str, Any]],
                          Awaitable[Tuple[bool, str]]]

ModuleAtPort = namedtuple('ModuleAtPort', ('port', 'name'))


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
