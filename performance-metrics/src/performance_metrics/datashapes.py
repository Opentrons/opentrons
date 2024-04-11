"""Defines data classes and enums used in the performance metrics module."""

import dataclasses


@dataclasses.dataclass(frozen=True)
class RawDurationData:
    """Represents raw duration data for a process or function.

    Attributes:
    - function_start_time (int): The start time of the function.
    - duration_measurement_start_time (int): The start time for duration measurement.
    - duration_measurement_end_time (int): The end time for duration measurement.
    """

    func_start: int
    duration_start: int
    duration_end: int
