import functools
import inspect
from contextlib import contextmanager
from typing import Any, Callable, Iterator, Optional, TypeVar, cast

from opentrons.broker import Broker
from opentrons.config import feature_flags
from . import types as command_types


class CommandPublisher:
    """An object with a `Broker` dependency used to publish commands."""

    def __init__(self, broker: Optional[Broker]) -> None:
        """Initialize the publisher with a Broker."""
        self._broker = broker or Broker()  # type: ignore[no-untyped-call]

    @property
    def broker(self) -> Broker:
        """Get the publisher's Broker."""
        return self._broker

    @broker.setter
    def broker(self, broker: Broker) -> None:
        """Set the publisher's Broker."""
        self._broker = broker


CommandMessageCreator = Callable[..., command_types.Command]
"""A function that creates a Command dictionary message."""

FuncT = TypeVar("FuncT", bound=Callable[..., Any])
"""A function wrapped by the @publish decorator."""


def publish(command: CommandMessageCreator) -> Callable[[FuncT], FuncT]:
    """Publish messages before and after the decorated function has run."""

    def _decorator(func: FuncT) -> FuncT:
        @functools.wraps(
            func,
            updated=list(functools.WRAPPER_UPDATES) + ["__globals__"],
        )
        def _decorated(*args: Any, **kwargs: Any) -> Any:
            broker = getattr(args[0], "broker", None)

            assert isinstance(
                broker, Broker
            ), "Only methods of CommandPublisher classes should be decorated."

            # get the values of func arguments, including defaults
            func_sig = _inspect_signature(func)
            bound_func_args = func_sig.bind(*args, **kwargs)
            bound_func_args.apply_defaults()
            func_args = bound_func_args.arguments

            # map func argument values to message creator arguments
            message_creator_sig = _inspect_signature(command)
            message_creator_arg_names = set(message_creator_sig.parameters.keys())
            message_creator_args = {
                n: func_args[n] for n in message_creator_arg_names if n in func_args
            }

            # TODO (artyom, 20170927): we are doing this to be able to use
            # the decorator in Instrument class methods, in which case
            # self is effectively an instrument.
            # To narrow the scope of this hack, we are checking if the
            # command is expecting instrument first.
            # We are also checking if call arguments have 'self' and
            # don't have instruments specified, in which case
            # instruments should take precedence.
            if (
                "instrument" in message_creator_arg_names
                and "instrument" not in message_creator_args
                and "self" in func_args
            ):
                message_creator_args["instrument"] = func_args["self"]

            command_message = command(**message_creator_args)

            with publish_context(broker=broker, command=command_message):
                return func(*args, **kwargs)

        return cast(FuncT, _decorated)

    return _decorator


@contextmanager
def publish_context(broker: Broker, command: command_types.Command) -> Iterator[None]:
    """Publish messages before and after the `with` block has run."""
    capture_errors = feature_flags.enable_protocol_engine()
    error = None

    _do_publish(broker=broker, command=command, when="before", error=None)
    try:
        yield
    except Exception as e:
        error = e
        raise e
    finally:
        if error is None or capture_errors is True:
            _do_publish(broker=broker, command=command, when="after", error=error)


@functools.lru_cache(maxsize=None)
def _inspect_signature(func: Callable[..., Any]) -> inspect.Signature:
    """Inspect function signatures, memoized because it is called very often."""
    return inspect.signature(func)


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
