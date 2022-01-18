import functools
from abc import ABC, abstractmethod
from typing import Any, cast, Callable, TypeVar

from opentrons.hardware_control import ThreadedAsyncLock


class RobotBusy(ABC):
    @property
    @abstractmethod
    def busy_lock(self) -> ThreadedAsyncLock:
        ...


Func = TypeVar("Func", bound=Callable[..., Any])


def robot_is_busy(func: Func) -> Func:
    """Decorator to mark a function as putting the robot in a busy
    state. Simultaneous attempts to call a busy function (from same or
    separate thread) will result in an exception.
     Must wrap a class of type RobotBusy.

     :raises ThreadedAsyncForbidden: on call during busy.
    """

    @functools.wraps(func)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        self = args[0]
        if self.busy_lock:
            with self.busy_lock.forbid():
                return func(*args, **kwargs)
        else:
            return func(*args, **kwargs)

    return cast(Func, decorated)
