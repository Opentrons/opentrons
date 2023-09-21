from dataclasses import dataclass
import typing
import contextlib


from opentrons.protocol_engine import Command, ProtocolEngine


@dataclass
class RunningEvent:
    command: Command


@dataclass
class NoLongerRunningEvent:
    command: Command


Event = typing.Union[RunningEvent, NoLongerRunningEvent]


Callback = typing.Callable[[Event], None]


class _Monitor:
    def __init__(self, engine: ProtocolEngine, callback: Callback):
        self._engine = engine
        self._callback = callback
        self._last_running_id: typing.Optional[str] = None

    def handle_state_update(self) -> None:
        running_id = self._engine.state_view.commands.get_running()
        last_running_id = self._last_running_id

        if running_id != last_running_id:
            if last_running_id is not None:
                self._callback(
                    NoLongerRunningEvent(
                        self._engine.state_view.commands.get(last_running_id)
                    )
                )

            if running_id is not None:
                self._callback(
                    RunningEvent(self._engine.state_view.commands.get(running_id))
                )

        self._last_running_id = running_id


@contextlib.contextmanager
def monitor_commands(
    protocol_engine: ProtocolEngine,
    callback: Callback,
) -> typing.Generator[None, None, None]:
    monitor = _Monitor(protocol_engine, callback)
    with protocol_engine.on_state_update(monitor.handle_state_update):
        yield
