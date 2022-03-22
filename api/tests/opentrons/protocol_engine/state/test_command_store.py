"""Tests for the command lifecycle state."""
import pytest
from collections import OrderedDict
from datetime import datetime
from typing import NamedTuple, Type

from opentrons.ordered_set import OrderedSet
from opentrons.types import MountType, DeckSlotName
from opentrons.hardware_control.types import DoorStateNotification, DoorState

from opentrons.protocol_engine import commands, errors
from opentrons.protocol_engine.types import DeckSlotLocation, PipetteName, WellLocation

from opentrons.protocol_engine.state.commands import (
    CommandState,
    CommandStore,
    CommandEntry,
    RunResult,
    QueueStatus,
)

from opentrons.protocol_engine.actions import (
    QueueCommandAction,
    UpdateCommandAction,
    FailCommandAction,
    PlayAction,
    PauseAction,
    PauseSource,
    FinishAction,
    FinishErrorDetails,
    StopAction,
    HardwareStoppedAction,
    HardwareEventAction,
)

from .command_fixtures import (
    create_queued_command,
    create_running_command,
    create_succeeded_command,
    create_failed_command,
)


def test_initial_state() -> None:
    """It should set the initial state."""
    subject = CommandStore()

    assert subject.state == CommandState(
        queue_status=QueueStatus.IMPLICITLY_ACTIVE,
        is_hardware_stopped=False,
        is_door_blocking=False,
        run_result=None,
        running_command_id=None,
        queued_command_ids=OrderedSet(),
        all_command_ids=[],
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


class QueueCommandSpec(NamedTuple):
    """Test data for the QueueCommandAction."""

    command_request: commands.CommandCreate
    expected_cls: Type[commands.Command]
    created_at: datetime = datetime(year=2021, month=1, day=1)
    command_id: str = "command-id"
    command_key: str = "command-key"


@pytest.mark.parametrize(
    QueueCommandSpec._fields,
    [
        QueueCommandSpec(
            command_request=commands.AspirateCreate(
                params=commands.AspirateParams(
                    pipetteId="pipette-id",
                    labwareId="labware-id",
                    wellName="well-name",
                    volume=42,
                    wellLocation=WellLocation(),
                ),
            ),
            expected_cls=commands.Aspirate,
        ),
        QueueCommandSpec(
            command_request=commands.DispenseCreate(
                params=commands.DispenseParams(
                    pipetteId="pipette-id",
                    labwareId="labware-id",
                    wellName="well-name",
                    volume=42,
                    wellLocation=WellLocation(),
                )
            ),
            expected_cls=commands.Dispense,
        ),
        QueueCommandSpec(
            command_request=commands.DropTipCreate(
                params=commands.DropTipParams(
                    pipetteId="pipette-id",
                    labwareId="labware-id",
                    wellName="well-name",
                ),
            ),
            expected_cls=commands.DropTip,
        ),
        QueueCommandSpec(
            command_request=commands.LoadLabwareCreate(
                params=commands.LoadLabwareParams(
                    location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
                    loadName="load-name",
                    namespace="namespace",
                    version=42,
                ),
            ),
            expected_cls=commands.LoadLabware,
        ),
        QueueCommandSpec(
            command_request=commands.LoadPipetteCreate(
                params=commands.LoadPipetteParams(
                    mount=MountType.LEFT,
                    pipetteName=PipetteName.P300_SINGLE,
                ),
            ),
            expected_cls=commands.LoadPipette,
        ),
        QueueCommandSpec(
            command_request=commands.PickUpTipCreate(
                params=commands.PickUpTipParams(
                    pipetteId="pipette-id",
                    labwareId="labware-id",
                    wellName="well-name",
                ),
            ),
            expected_cls=commands.PickUpTip,
        ),
        QueueCommandSpec(
            command_request=commands.MoveToWellCreate(
                params=commands.MoveToWellParams(
                    pipetteId="pipette-id",
                    labwareId="labware-id",
                    wellName="well-name",
                ),
            ),
            expected_cls=commands.MoveToWell,
        ),
        QueueCommandSpec(
            command_request=commands.PauseCreate(
                params=commands.PauseParams(message="hello world"),
            ),
            expected_cls=commands.Pause,
        ),
    ],
)
def test_command_store_queues_commands(
    command_request: commands.CommandCreate,
    expected_cls: Type[commands.Command],
    created_at: datetime,
    command_id: str,
    command_key: str,
) -> None:
    """It should add a command to the store."""
    action = QueueCommandAction(
        request=command_request,
        created_at=created_at,
        command_id=command_id,
        command_key=command_key,
    )
    expected_command = expected_cls(
        id=command_id,
        key=command_key,
        createdAt=created_at,
        status=commands.CommandStatus.QUEUED,
        params=command_request.params,  # type: ignore[arg-type]
    )

    subject = CommandStore()
    subject.handle_action(action)

    assert subject.state.commands_by_id == {
        "command-id": CommandEntry(index=0, command=expected_command),
    }
    assert subject.state.all_command_ids == ["command-id"]
    assert subject.state.queued_command_ids == OrderedSet(["command-id"])


def test_command_queue_and_unqueue() -> None:
    """It should queue on QueueCommandAction and dequeue on UpdateCommandAction."""
    queue_1 = QueueCommandAction(
        request=commands.PauseCreate(params=commands.PauseParams()),
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
        command_key="command-key-1",
    )
    queue_2 = QueueCommandAction(
        request=commands.PauseCreate(params=commands.PauseParams()),
        created_at=datetime(year=2022, month=2, day=2),
        command_id="command-id-2",
        command_key="command-key-2",
    )
    update_1 = UpdateCommandAction(
        command=create_running_command(command_id="command-id-1"),
    )
    update_2 = UpdateCommandAction(
        command=create_running_command(command_id="command-id-2"),
    )

    subject = CommandStore()

    subject.handle_action(queue_1)
    assert subject.state.queued_command_ids == OrderedSet(["command-id-1"])

    subject.handle_action(queue_2)
    assert subject.state.queued_command_ids == OrderedSet(
        ["command-id-1", "command-id-2"]
    )

    subject.handle_action(update_2)
    assert subject.state.queued_command_ids == OrderedSet(["command-id-1"])

    subject.handle_action(update_1)
    assert subject.state.queued_command_ids == OrderedSet()


def test_running_command_id() -> None:
    """It should update the running command ID through a command's lifecycle."""
    queue = QueueCommandAction(
        request=commands.PauseCreate(params=commands.PauseParams()),
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
        command_key="command-key-1",
    )
    running_update = UpdateCommandAction(
        command=create_running_command(command_id="command-id-1"),
    )
    completed_update = UpdateCommandAction(
        command=create_succeeded_command(command_id="command-id-1"),
    )

    subject = CommandStore()

    subject.handle_action(queue)
    assert subject.state.running_command_id is None

    subject.handle_action(running_update)
    assert subject.state.running_command_id == "command-id-1"

    subject.handle_action(completed_update)
    assert subject.state.running_command_id is None


def test_running_command_no_queue() -> None:
    """It should add a running command to state, even if there was no queue action."""
    running_update = UpdateCommandAction(
        command=create_running_command(command_id="command-id-1"),
    )
    completed_update = UpdateCommandAction(
        command=create_succeeded_command(command_id="command-id-1"),
    )

    subject = CommandStore()

    subject.handle_action(running_update)
    assert subject.state.all_command_ids == ["command-id-1"]
    assert subject.state.running_command_id == "command-id-1"

    subject.handle_action(completed_update)
    assert subject.state.all_command_ids == ["command-id-1"]
    assert subject.state.running_command_id is None


def test_command_failure_clears_queue() -> None:
    """It should clear the command queue on command failure."""
    queue_1 = QueueCommandAction(
        request=commands.PauseCreate(params=commands.PauseParams()),
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
        command_key="command-key-1",
    )
    queue_2 = QueueCommandAction(
        request=commands.PauseCreate(params=commands.PauseParams()),
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-2",
        command_key="command-key-2",
    )
    running_1 = UpdateCommandAction(
        command=commands.Pause(
            id="command-id-1",
            key="command-key-1",
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            params=commands.PauseParams(),
            status=commands.CommandStatus.RUNNING,
        )
    )
    fail_1 = FailCommandAction(
        command_id="command-id-1",
        error_id="error-id",
        failed_at=datetime(year=2023, month=3, day=3),
        error=errors.ProtocolEngineError("oh no"),
    )

    expected_failed_1 = commands.Pause(
        id="command-id-1",
        key="command-key-1",
        errorId="error-id",
        createdAt=datetime(year=2021, month=1, day=1),
        startedAt=datetime(year=2022, month=2, day=2),
        completedAt=datetime(year=2023, month=3, day=3),
        params=commands.PauseParams(),
        status=commands.CommandStatus.FAILED,
    )
    expected_failed_2 = commands.Pause(
        id="command-id-2",
        key="command-key-2",
        errorId="error-id",
        createdAt=datetime(year=2021, month=1, day=1),
        completedAt=datetime(year=2023, month=3, day=3),
        params=commands.PauseParams(),
        status=commands.CommandStatus.FAILED,
    )

    subject = CommandStore()

    subject.handle_action(queue_1)
    subject.handle_action(queue_2)
    subject.handle_action(running_1)
    subject.handle_action(fail_1)

    assert subject.state.running_command_id is None
    assert subject.state.queued_command_ids == OrderedSet()
    assert subject.state.all_command_ids == ["command-id-1", "command-id-2"]
    assert subject.state.commands_by_id == {
        "command-id-1": CommandEntry(index=0, command=expected_failed_1),
        "command-id-2": CommandEntry(index=1, command=expected_failed_2),
    }


def test_command_store_preserves_handle_order() -> None:
    """It should store commands in the order they are handled."""
    # Any arbitrary 3 commands that compare non-equal (!=) to each other.
    command_a = create_queued_command(command_id="command-id-1")
    command_b = create_running_command(command_id="command-id-2")
    command_c = create_succeeded_command(command_id="command-id-1")

    subject = CommandStore()

    subject.handle_action(UpdateCommandAction(command=command_a))
    assert subject.state.all_command_ids == ["command-id-1"]
    assert subject.state.commands_by_id == {
        "command-id-1": CommandEntry(index=0, command=command_a),
    }

    subject.handle_action(UpdateCommandAction(command=command_b))
    assert subject.state.all_command_ids == ["command-id-1", "command-id-2"]
    assert subject.state.commands_by_id == {
        "command-id-1": CommandEntry(index=0, command=command_a),
        "command-id-2": CommandEntry(index=1, command=command_b),
    }

    subject.handle_action(UpdateCommandAction(command=command_c))
    assert subject.state.all_command_ids == ["command-id-1", "command-id-2"]
    assert subject.state.commands_by_id == {
        "command-id-1": CommandEntry(index=0, command=command_c),
        "command-id-2": CommandEntry(index=1, command=command_b),
    }


@pytest.mark.parametrize("pause_source", PauseSource)
def test_command_store_handles_pause_action(pause_source: PauseSource) -> None:
    """It should clear the running flag on pause."""
    subject = CommandStore()
    subject.handle_action(PauseAction(source=pause_source))

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


@pytest.mark.parametrize("pause_source", PauseSource)
def test_command_store_handles_play_action(pause_source: PauseSource) -> None:
    """It should set the running flag on play."""
    subject = CommandStore()
    subject.handle_action(PauseAction(source=pause_source))
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.ACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_handles_play_according_to_door_state() -> None:
    """It should inactivate/activate command queue according to door state."""
    subject = CommandStore(is_door_blocking=True)
    subject.handle_action(PlayAction())
    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=True,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )

    door_close_event = DoorStateNotification(new_state=DoorState.CLOSED, blocking=False)
    subject.handle_action(HardwareEventAction(event=door_close_event))
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.ACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_handles_finish_action() -> None:
    """It should change to a succeeded state with FinishAction."""
    subject = CommandStore()

    subject.handle_action(PlayAction())
    subject.handle_action(FinishAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=RunResult.SUCCEEDED,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_handles_stop_action() -> None:
    """It should mark the engine as non-gracefully stopped on StopAction."""
    subject = CommandStore()

    subject.handle_action(PlayAction())
    subject.handle_action(StopAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=RunResult.STOPPED,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_cannot_restart_after_should_stop() -> None:
    """It should reject a play action after finish."""
    subject = CommandStore()
    subject.handle_action(FinishAction())
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=RunResult.SUCCEEDED,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_ignores_known_finish_error() -> None:
    """It not store a ProtocolEngineError that comes in with the stop action."""
    subject = CommandStore()
    error_details = FinishErrorDetails(
        error=errors.ProtocolEngineError("oh no"),
        error_id="error-id",
        created_at=datetime(year=2021, month=1, day=1),
    )

    subject.handle_action(FinishAction(error_details=error_details))

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=RunResult.FAILED,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_saves_unknown_finish_error() -> None:
    """It not store a ProtocolEngineError that comes in with the stop action."""
    subject = CommandStore()

    error_details = FinishErrorDetails(
        error=RuntimeError("oh no"),
        error_id="error-id",
        created_at=datetime(year=2021, month=1, day=1),
    )
    subject.handle_action(FinishAction(error_details=error_details))

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=RunResult.FAILED,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={
            "error-id": errors.ErrorOccurrence(
                id="error-id",
                createdAt=datetime(year=2021, month=1, day=1),
                errorType="RuntimeError",
                detail="oh no",
            )
        },
    )


def test_command_store_ignores_stop_after_graceful_finish() -> None:
    """It should no-op on stop if already gracefully finished."""
    subject = CommandStore()

    subject.handle_action(PlayAction())
    subject.handle_action(FinishAction())
    subject.handle_action(StopAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=RunResult.SUCCEEDED,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_ignores_finish_after_non_graceful_stop() -> None:
    """It should no-op on finish if already ungracefully stopped."""
    subject = CommandStore()

    subject.handle_action(PlayAction())
    subject.handle_action(StopAction())
    subject.handle_action(FinishAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=RunResult.STOPPED,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_handles_command_failed() -> None:
    """It should store an error and mark the command if it fails."""
    command = create_running_command(command_id="command-id")
    expected_failed_command = create_failed_command(
        command_id="command-id",
        error_id="error-id",
        completed_at=datetime(year=2022, month=2, day=2),
    )

    subject = CommandStore()
    subject.handle_action(UpdateCommandAction(command=command))
    subject.handle_action(
        FailCommandAction(
            command_id="command-id",
            error_id="error-id",
            failed_at=datetime(year=2022, month=2, day=2),
            error=errors.ProtocolEngineError("oh no"),
        )
    )

    assert subject.state == CommandState(
        queue_status=QueueStatus.IMPLICITLY_ACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=["command-id"],
        queued_command_ids=OrderedSet(),
        commands_by_id={
            "command-id": CommandEntry(index=0, command=expected_failed_command),
        },
        errors_by_id={
            "error-id": errors.ErrorOccurrence(
                id="error-id",
                errorType="ProtocolEngineError",
                createdAt=datetime(year=2022, month=2, day=2),
                detail="oh no",
            )
        },
    )


def test_handles_hardware_stopped() -> None:
    """It should mark the hardware as stopped on HardwareStoppedAction."""
    subject = CommandStore()
    subject.handle_action(HardwareStoppedAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=RunResult.STOPPED,
        is_hardware_stopped=True,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_handles_door_open_and_close_event() -> None:
    """It should update state when door opened and closed after run is played."""
    subject = CommandStore()
    door_open_event = DoorStateNotification(new_state=DoorState.OPEN, blocking=True)
    door_close_event = DoorStateNotification(new_state=DoorState.CLOSED, blocking=False)

    subject.handle_action(PlayAction())
    subject.handle_action(HardwareEventAction(event=door_open_event))

    # Pause queue and update state
    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=True,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )

    subject.handle_action(HardwareEventAction(event=door_close_event))

    # Don't unpause but update state
    assert subject.state == CommandState(
        queue_status=QueueStatus.INACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_handles_door_event_during_idle_run() -> None:
    """It should update state but not pause on door open when implicitly active."""
    subject = CommandStore()
    door_open_event = DoorStateNotification(new_state=DoorState.OPEN, blocking=True)
    door_close_event = DoorStateNotification(new_state=DoorState.CLOSED, blocking=False)

    subject.handle_action(HardwareEventAction(event=door_open_event))

    assert subject.state == CommandState(
        queue_status=QueueStatus.IMPLICITLY_ACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=True,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )

    subject.handle_action(HardwareEventAction(event=door_close_event))

    assert subject.state == CommandState(
        queue_status=QueueStatus.IMPLICITLY_ACTIVE,
        run_result=None,
        is_hardware_stopped=False,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )
