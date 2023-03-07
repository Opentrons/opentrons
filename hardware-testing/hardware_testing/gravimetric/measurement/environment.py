"""Environment."""
from dataclasses import dataclass, fields
from typing import Callable, List


@dataclass
class EnvironmentData:
    """Environment data."""

    celsius_pipette: float
    celsius_air: float
    humidity_air: float
    pascals_air: float
    celsius_liquid: float


def read_environment_data() -> EnvironmentData:
    """Read blank environment data."""
    d = EnvironmentData(
        celsius_pipette=25.0,
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
