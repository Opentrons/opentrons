"""Environment."""
from dataclasses import fields
from typing import Callable, List

from hardware_testing.gravimetric.config import EnvironmentData


_CACHED_DATA: List[EnvironmentData] = list()


def clear_cached_data() -> None:
    """Clear cached data."""
    global _CACHED_DATA
    _CACHED_DATA = list()


def read_blank_environment_data() -> EnvironmentData:
    """Read blank environment data."""
    d = EnvironmentData(
        celsius_pipette=25.0,
        celsius_air=25.0,
        humidity_air=50.0,
        pascals_air=1000,
        celsius_liquid=25.0,
    )
    _CACHED_DATA.append(d)
    return d


def get_first_reading() -> EnvironmentData:
    """Get first reading."""
    return _CACHED_DATA[0]


def get_last_reading() -> EnvironmentData:
    """Get last reading."""
    return _CACHED_DATA[-1]


def _get_min_max_reading(min_or_max_func: Callable) -> EnvironmentData:
    min_or_max_vals = {
        field.name: min_or_max_func([getattr(d, field.name) for d in _CACHED_DATA])
        for field in fields(EnvironmentData)
    }
    return EnvironmentData(
        celsius_pipette=min_or_max_vals["celsius_pipette"],
        celsius_air=min_or_max_vals["celsius_air"],
        humidity_air=min_or_max_vals["humidity_air"],
        pascals_air=min_or_max_vals["pascals_air"],
        celsius_liquid=min_or_max_vals["celsius_liquid"],
    )


def get_min_reading() -> EnvironmentData:
    """Get min reading."""
    return _get_min_max_reading(min)


def get_max_reading() -> EnvironmentData:
    """Get max reading."""
    return _get_min_max_reading(max)
