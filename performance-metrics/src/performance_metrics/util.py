"""Utility functions."""

import typing
import platform
from functools import partial


def format_command(cmd_list: typing.List[str]) -> str:
    """Format the command line for the given process."""
    return " ".join([cmd.strip() for cmd in cmd_list]).strip()


def get_timing_function() -> typing.Callable[[], int]:
    """Returns a timing function for the current platform."""
    time_function: typing.Callable[[], int]
    if platform.system() == "Linux":
        from time import clock_gettime_ns, CLOCK_REALTIME

        time_function = typing.cast(
            typing.Callable[[], int], partial(clock_gettime_ns, CLOCK_REALTIME)
        )
    else:
        from time import time_ns

        time_function = time_ns

    return time_function
