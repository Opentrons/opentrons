"""Environment."""
from dataclasses import dataclass, fields
from typing import Callable, List

from hardware_testing.opentrons_api.helpers_ot3 import (
    get_temperature_humidity_outside_api_ot3,
    SensorResponseBad,
)
from hardware_testing.opentrons_api.types import OT3Mount


@dataclass
class EnvironmentData:
    """Environment data."""

    celsius_pipette: float
    humidity_pipette: float
    celsius_air: float
    humidity_air: float
    pascals_air: float
    celsius_liquid: float


def read_environment_data(mount: str, is_simulating: bool) -> EnvironmentData:
    """Read blank environment data."""
    mnt = OT3Mount.LEFT if mount == "left" else OT3Mount.RIGHT
    try:
        data = get_temperature_humidity_outside_api_ot3(mnt, is_simulating)
        celsius_pipette, humidity_pipette = data
    except SensorResponseBad as e:
        print(e)
        celsius_pipette = 25.0
        humidity_pipette = 50.0
    # TODO: implement USB environmental sensors
    d = EnvironmentData(
        celsius_pipette=celsius_pipette,
        humidity_pipette=humidity_pipette,
        celsius_air=25.0,
        humidity_air=50.0,
        pascals_air=1000,
        celsius_liquid=25.0,
    )
    return d


def _get_min_max_reading(
    data: List[EnvironmentData], min_or_max_func: Callable
) -> EnvironmentData:
    min_or_max_vals = {
        field.name: min_or_max_func([getattr(d, field.name) for d in data])
        for field in fields(EnvironmentData)
    }
    return EnvironmentData(
        celsius_pipette=min_or_max_vals["celsius_pipette"],
        humidity_pipette=min_or_max_vals["humidity_pipette"],
        celsius_air=min_or_max_vals["celsius_air"],
        humidity_air=min_or_max_vals["humidity_air"],
        pascals_air=min_or_max_vals["pascals_air"],
        celsius_liquid=min_or_max_vals["celsius_liquid"],
    )


def get_min_reading(data: List[EnvironmentData]) -> EnvironmentData:
    """Get min reading."""
    return _get_min_max_reading(data, min)


def get_max_reading(data: List[EnvironmentData]) -> EnvironmentData:
    """Get max reading."""
    return _get_min_max_reading(data, max)


def get_average_reading(data: List[EnvironmentData]) -> EnvironmentData:
    """Get average reading."""
    length = len(data)
    return EnvironmentData(
        celsius_pipette=sum([d.celsius_pipette for d in data]) / length,
        humidity_pipette=sum([d.humidity_pipette for d in data]) / length,
        celsius_air=sum([d.celsius_air for d in data]) / length,
        humidity_air=sum([d.humidity_air for d in data]) / length,
        pascals_air=sum([d.pascals_air for d in data]) / length,
        celsius_liquid=sum([d.celsius_liquid for d in data]) / length,
    )
