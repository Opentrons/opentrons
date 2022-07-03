"""Utility to wait.

https://stackoverflow.com/questions/2785821/is-there-an-easy-way-in-python-to-wait-until-certain-condition-is-true
"""
import time
from typing import Any, Callable, Optional

Func = Callable[..., Any]


def wait_until(
    somepredicate: Func,
    timeout_sec: float,
    period_sec: float = 0.25,
    **kwargs: Optional[int],
) -> bool:
    """Wait until some function returns True or timeout."""
    mustend = time.time() + timeout_sec
    while time.time() < mustend:
        if somepredicate(**kwargs):
            return True
        time.sleep(period_sec)
    return False
