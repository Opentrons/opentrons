"""Monitor the execution of commands in a `ProtocolEngine`."""


from dataclasses import dataclass
import typing
import contextlib


from opentrons.protocol_engine import Command, ProtocolEngine


@dataclass
class RunningEvent:
    """Emitted when a command starts running."""

    command: Command


@dataclass
class NoLongerRunningEvent:
    """Emitted when a command stops running--either because it succeeded, or failed."""

    command: Command


Event = typing.Union[RunningEvent, NoLongerRunningEvent]
Callback = typing.Callable[[Event], None]


@contextlib.contextmanager
def monitor_commands(
    protocol_engine: ProtocolEngine,
    callback: Callback,
) -> typing.Generator[None, None, None]:
    """Monitor the execution of commands in `protocol_engine`.

    While this context manager is open, `callback` will be called any time `protocol_engine`
    starts or stops a command.
    """
    # Subscribe to all state updates in protocol_engine.
    # On every update, diff the new state against the last state and see if the currently
    # running command has changed. If it has, emit the appropriate events.

    last_running_id: typing.Optional[str] = None

    def handle_state_update() -> None:
        nonlocal last_running_id

        running_id = protocol_engine.state_view.commands.get_running()
        if running_id != last_running_id:
            if last_running_id is not None:
                callback(
                    NoLongerRunningEvent(
                        protocol_engine.state_view.commands.get(last_running_id)
                    )
                )

            if running_id is not None:
                callback(
                    RunningEvent(protocol_engine.state_view.commands.get(running_id))
                )
        last_running_id = running_id

    with protocol_engine.on_state_update(handle_state_update):
        yield
