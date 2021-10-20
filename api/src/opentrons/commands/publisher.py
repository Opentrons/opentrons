import functools
import inspect
from contextlib import contextmanager
from typing import (
    Any,
    Callable,
    Dict,
    Generic,
    Iterator,
    Mapping,
    Optional,
    Tuple,
    TypeVar,
    cast,
)

from opentrons.broker import Broker
from opentrons.config import feature_flags
from . import types as command_types


CacheT = TypeVar("CacheT")


class InspectMemoizer(Generic[CacheT]):
    def __init__(self, method: Callable[[Any], CacheT]) -> None:
        self._method = method
        self._cache: Dict[Callable, CacheT] = {}

    def get(self, f: Callable) -> CacheT:
        v = self._cache.get(f)
        if not v:
            v = self._method(f)
            self._cache[f] = v
        return v


signature_cache = InspectMemoizer(inspect.signature)
"""Cache inspect.signature method calls"""
getfullargspec_cache = InspectMemoizer(inspect.getfullargspec)
"""Cache inspect.getfullargspec method calls"""


class CommandPublisher:
    def __init__(self, broker: Optional[Broker]) -> None:
        self._broker = broker or Broker()

    @property
    def broker(self) -> Broker:
        return self._broker

    @broker.setter
    def broker(self, broker: Broker) -> None:
        self._broker = broker


CmdFunction = Callable[..., command_types.Command]


def _do_publish(
    broker: Broker,
    command: command_types.Command,
    when: command_types.MessageSequenceId,
    error: Optional[Exception],
) -> None:
    """Publish a command to the broker from the decorator or ContextManager."""
    name = command["name"]
    payload = command["payload"]
    message: command_types.CommandMessage = {  # type: ignore[assignment,misc]
        "$": when,
        "name": name,
        "payload": payload,
        "error": error,
    }

    if when == "before":
        payload_str = ", ".join(f"{k}: {v}" for k, v in payload.items() if k != "text")
        broker.logger.info(f"{name}: {payload_str}")

    broker.publish(topic=command_types.COMMAND, message=message)


FuncT = TypeVar("FuncT", bound=Callable[..., Any])


def publish(command: CmdFunction) -> Callable[[FuncT], FuncT]:
    """Publish events both before and after the decorated function has run."""
    getfullargspec = getfullargspec_cache.get(command)

    def _decorator(f: FuncT) -> FuncT:
        @functools.wraps(
            f, updated=functools.WRAPPER_UPDATES + ("__globals__",)  # type: ignore[operator]  # noqa: E501
        )
        def _decorated(*args: Any, **kwargs: Any) -> Any:
            broker = getattr(args[0], "broker", None)

            assert isinstance(
                broker, Broker
            ), "Only methods of CommandPublisher classes should be decorated."

            call_args = _get_args(f, args, kwargs)
            command_args = dict(
                zip(
                    reversed(getfullargspec.args),
                    reversed(getfullargspec.defaults or []),
                )
            )

            # TODO (artyom, 20170927): we are doing this to be able to use
            # the decorator in Instrument class methods, in which case
            # self is effectively an instrument.
            # To narrow the scope of this hack, we are checking if the
            # command is expecting instrument first.
            if "instrument" in getfullargspec.args:
                # We are also checking if call arguments have 'self' and
                # don't have instruments specified, in which case
                # instruments should take precedence.
                if "instrument" not in call_args and "self" in call_args:
                    call_args["instrument"] = call_args["self"]

            command_args.update(
                {
                    key: call_args[key]
                    for key in (set(getfullargspec.args) & call_args.keys())
                }
            )
            command_message = command(**command_args)

            with publish_context(broker=broker, command=command_message):
                return f(*args, **kwargs)

        return cast(FuncT, _decorated)

    return _decorator


@contextmanager
def publish_context(broker: Broker, command: command_types.Command) -> Iterator[None]:
    capture_errors = feature_flags.enable_protocol_engine()
    error = None

    try:
        _do_publish(broker=broker, command=command, when="before", error=None)
        yield
    except Exception as e:
        # TODO(mc, 2021-10-19): put this capture behind the PE feature flag
        error = e
        raise e
    finally:
        if error is None or capture_errors is True:
            _do_publish(broker=broker, command=command, when="after", error=error)


def _get_args(f: Callable, args: Tuple, kwargs: Mapping[str, Any]) -> Dict[str, Any]:
    # Create the initial dictionary with args that have defaults
    res = {}
    sig = signature_cache.get(f)
    ismethod = inspect.ismethod(f)
    if ismethod and args[0] is f.__self__:  # type: ignore
        args = args[1:]
    if ismethod:
        res["self"] = f.__self__  # type: ignore

    bound = sig.bind(*args, **kwargs)
    bound.apply_defaults()
    res.update(bound.arguments)
    return res
