from enum import Enum


class SoundProfile(Enum):
    FULL_SOUND = 1
    ONLY_ERROR = 2
    OFF = 3


class LEDProfile(Enum):
    SUCCESS_AND_FAILURE = 1
    FAILURE_ONLY = 2
    OFF = 3


class BarcodeModuleInfo:
    serial: str
