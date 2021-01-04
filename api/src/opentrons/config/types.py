from dataclasses import dataclass
from typing import Dict, Tuple
from typing_extensions import TypedDict


class AxisDict(TypedDict):
    X: float
    Y: float
    Z: float
    A: float
    B: float
    C: float


class CurrentDictDefault(TypedDict):
    default: AxisDict


CurrentDictModelEntries = TypedDict(
    'CurrentDictModelEntries',
    {'2.1': AxisDict,
     'A': AxisDict,
     'B': AxisDict,
     'C': AxisDict},
    total=False)


class CurrentDict(CurrentDictDefault, CurrentDictModelEntries):
    pass


@dataclass
class RobotConfig:
    name: str
    version: int
    gantry_steps_per_mm: Dict[str, float]
    acceleration: Dict[str, float]
    serial_speed: int
    default_pipette_configs: Dict[str, float]
    default_current: CurrentDict
    low_current:  CurrentDict
    high_current: CurrentDict
    default_max_speed: AxisDict
    log_level: str
    z_retract_distance: float
    left_mount_offset: Tuple[float, float, float]
