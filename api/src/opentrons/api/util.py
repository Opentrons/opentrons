import functools
from abc import ABC, abstractmethod
from typing import Any, cast, Callable, TypeVar

from opentrons.config.feature_flags import enable_http_protocol_sessions
from opentrons.hardware_control import ThreadedAsyncLock


class RobotBusy(ABC):
    @property
    @abstractmethod
    def busy_lock(self) -> ThreadedAsyncLock:
        ...


Func = TypeVar('Func', bound=Callable[..., Any])


def robot_is_busy(func: Func) -> Func:
    """ Decorator to mark a function as putting the robot in a busy
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


def requires_http_protocols_disabled(func: Func) -> Func:
    """Decorator that makes sure the enableHttpProtocolSessions is disabled
    before proceeding.

    :raises RuntimeError: if enableHttpProtocolSessions is enabled
    """
    @functools.wraps(func)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        if enable_http_protocol_sessions():
            raise RuntimeError(
                "Please disable the 'Enable Experimental HTTP Protocol "
                "Sessions' advanced setting for this robot if you'd like to "
                "upload protocols from the Opentrons App")
        return func(*args, **kwargs)

    return cast(Func, decorated)
