"""Unit tests for `opentrons.protocol_engine.command_monitor`."""


from datetime import datetime
from typing import List

from decoy import Decoy

from opentrons.protocol_engine import CommandStatus, ProtocolEngine, commands
from opentrons.protocol_engine.command_monitor import (
    Event,
    NoLongerRunningEvent,
    RunningEvent,
    monitor_commands as subject,
)
from opentrons.util.broker import Broker


def _make_dummy_command(id: str, completed: bool) -> commands.Command:
    if completed:
        return commands.Comment(
            id=id,
            key=id,
            status=CommandStatus.SUCCEEDED,
            createdAt=datetime(2023, 9, 26),
            params=commands.CommentParams(message=""),
            result=None,
        )
    else:
        return commands.Comment(
            id=id,
            key=id,
            status=CommandStatus.RUNNING,
            createdAt=datetime(2023, 9, 26),
            completedAt=datetime(2023, 9, 26),
            params=commands.CommentParams(message=""),
            result=commands.CommentResult(),
        )


def test_monitor_commands(decoy: Decoy) -> None:
    """Test that it translates state updates into command running/no-longer-running events."""
    mock_protocol_engine = decoy.mock(cls=ProtocolEngine)
    mock_command_view = mock_protocol_engine.state_view.commands
    state_update_broker = Broker[None]()
    decoy.when(mock_protocol_engine.state_update_broker).then_return(
        state_update_broker
    )

    command_1_running = _make_dummy_command(id="command-1", completed=False)
    command_1_completed = _make_dummy_command(id="command-1", completed=True)
    command_2_running = _make_dummy_command(id="command-2", completed=False)
    command_2_completed = _make_dummy_command(id="command-2", completed=True)

    received_events: List[Event] = []

    def callback(event: Event) -> None:
        received_events.append(event)

    with subject(mock_protocol_engine, callback):
        # Feed the subject these states, in sequence:
        #   1. No command running
        #   2. "command-1" running
        #   3. "command-2" running
        #   4. No command running
        # Between each state, notify the subject by publishing a message to the broker that it's
        # subscribed to.

        decoy.when(mock_command_view.get_running()).then_return(None)
        state_update_broker.publish(message=None)

        decoy.when(mock_command_view.get_running()).then_return("command-1")
        decoy.when(mock_command_view.get("command-1")).then_return(command_1_running)
        state_update_broker.publish(message=None)

        decoy.when(mock_command_view.get_running()).then_return("command-2")
        decoy.when(mock_command_view.get("command-1")).then_return(command_1_completed)
        decoy.when(mock_command_view.get("command-2")).then_return(command_2_running)
        state_update_broker.publish(message=None)

        decoy.when(mock_command_view.get_running()).then_return(None)
        decoy.when(mock_command_view.get("command-2")).then_return(command_2_completed)
        state_update_broker.publish(message=None)

    # Make sure the callback converted the sequence of state updates into the expected sequence
    # of events.
    assert received_events == [
        RunningEvent(command_1_running),
        NoLongerRunningEvent(command_1_completed),
        RunningEvent(command_2_running),
        NoLongerRunningEvent(command_2_completed),
    ]
