from typing import Dict, NamedTuple
from pathlib import Path

ThermocyclerStep = Dict[str, float]


class BundledFirmware(NamedTuple):
    """ Represents an versioned firmware file, generally bundled into the fs"""
    version: str
    path: Path

    def __repr__(self) -> str:
        return f'<BundledFirmware {self.version}, path={self.path}>'


class UpdateError(RuntimeError):
    pass
