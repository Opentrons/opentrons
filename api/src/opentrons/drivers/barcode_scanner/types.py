from dataclasses import dataclass
from enum import Enum
from typing import Dict


class SoundProfile(Enum):
    FULL_SOUND = 1
    ONLY_ERROR = 2
    OFF = 3


class LEDProfile(Enum):
    SUCCESS_AND_FAILURE = 1
    FAILURE_ONLY = 2
    OFF = 3


@dataclass
class BarcodeModuleInfo:
    serial: str

    def to_dict(self) -> Dict[str, str]:
        """Build command."""
        return {"serial": self.serial}
