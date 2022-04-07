import time
from typing import Any, Callable, Optional

from requests import Response

Func = Callable[..., Any]


def verify_settings_value(response: Response, id: str, value: str) -> None:
    """Verify settings are updated as expectted"""
    for setting in response.json().get("settings"):
        if setting.get("id") == id:
            assert str(setting.get("value")) == str(value)
            return
    assert False


def wait_until(
    predicate: Func,
    predicate_target: bool,
    timeout_sec: float,
    period_sec: float = 0.25,
    **kwargs: Optional[Any],
) -> bool:
    """Wait until a predicate returns predicate_target or timeout."""
    mustend = time.time() + timeout_sec
    while time.time() < mustend:
        if predicate(**kwargs) == predicate_target:
            return True
        time.sleep(period_sec)
    return False
