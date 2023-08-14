"""Tests for the command lifecycle state."""
import pytest
from collections import OrderedDict
from datetime import datetime
from typing import NamedTuple, Type

from opentrons_shared_data.errors import ErrorCodes
from opentrons.ordered_set import OrderedSet
from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.types import MountType, DeckSlotName
from opentrons.hardware_control.types import DoorState

from opentrons.protocol_engine import commands, errors
from opentrons.protocol_engine.types import DeckSlotLocation, DeckType, WellLocation
from opentrons.protocol_engine.state import Config
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
    DoorChangeAction,
)

from .command_fixtures import (
    create_queued_command,
    create_running_command,
    create_succeeded_command,
    create_failed_command,
)


def _make_config(block_on_door_open: bool = False) -> Config:
    return Config(
        block_on_door_open=block_on_door_open,
        # Choice of robot and deck type is arbitrary.
        robot_type="OT-2 Standard",
        deck_type=DeckType.OT2_STANDARD,
    )


@pytest.mark.parametrize(
    ("is_door_open", "config", "expected_is_door_blocking"),
    [
        (False, _make_config(), False),
        (True, _make_config(), False),
        (False, _make_config(block_on_door_open=True), False),
        (True, _make_config(block_on_door_open=True), True),
    ],
)
def test_initial_state(
    is_door_open: bool,
    config: Config,
    expected_is_door_blocking: bool,
) -> None:
    """It should set the initial state."""
    subject = CommandStore(is_door_open=is_door_open, config=config)

    assert subject.state == CommandState(
        queue_status=QueueStatus.SETUP,
        run_completed_at=None,
        run_started_at=None,
        is_door_blocking=expected_is_door_blocking,
        run_result=None,
        running_command_id=None,
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        all_command_ids=[],
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        latest_command_hash=None,
        stopped_by_estop=False,
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
                    flowRate=1.23,
                    wellLocation=WellLocation(),
                ),
                key="command-key",
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
                    flowRate=1.23,
                    wellLocation=WellLocation(),
                ),
            ),
            expected_cls=commands.Dispense,
            # test when key prop is missing
            command_key="command-id",
        ),
        QueueCommandSpec(
            command_request=commands.DropTipCreate(
                params=commands.DropTipParams(
                    pipetteId="pipette-id",
                    labwareId="labware-id",
                    wellName="well-name",
                ),
                key="command-key",
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
                key="command-key",
            ),
            expected_cls=commands.LoadLabware,
        ),
        QueueCommandSpec(
            command_request=commands.LoadPipetteCreate(
                params=commands.LoadPipetteParams(
                    mount=MountType.LEFT,
                    pipetteName=PipetteNameType.P300_SINGLE,
                ),
                key="command-key",
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
                key="command-key",
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
                key="command-key",
            ),
            expected_cls=commands.MoveToWell,
        ),
        QueueCommandSpec(
            command_request=commands.WaitForResumeCreate(
                params=commands.WaitForResumeParams(message="hello world"),
                key="command-key",
            ),
            expected_cls=commands.WaitForResume,
        ),
        QueueCommandSpec(
            # a WaitForResumeCreate with `pause` should be mapped to
            # a WaitForResume with `commandType="waitForResume"`
            command_request=commands.WaitForResumeCreate(
                commandType="pause",
                params=commands.WaitForResumeParams(message="hello world"),
                key="command-key",
            ),
            expected_cls=commands.WaitForResume,
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
        request_hash=None,
        created_at=created_at,
        command_id=command_id,
    )
    expected_command = expected_cls(
        id=command_id,
        key=command_key,
        createdAt=created_at,
        status=commands.CommandStatus.QUEUED,
        params=command_request.params,  # type: ignore[arg-type]
    )

    subject = CommandStore(is_door_open=False, config=_make_config())
    subject.handle_action(action)

    assert subject.state.commands_by_id == {
        "command-id": CommandEntry(index=0, command=expected_command),
    }

    assert subject.state.all_command_ids == ["command-id"]
    assert subject.state.queued_command_ids == OrderedSet(["command-id"])


def test_command_queue_with_hash() -> None:
    """It should queue a command with a command hash and no explicit key."""
    create = commands.WaitForResumeCreate(
        params=commands.WaitForResumeParams(message="hello world"),
    )

    subject = CommandStore(is_door_open=False, config=_make_config())
    subject.handle_action(
        QueueCommandAction(
            request=create,
            request_hash="abc123",
            created_at=datetime(year=2021, month=1, day=1),
            command_id="command-id-1",
        )
    )

    assert subject.state.commands_by_id["command-id-1"].command.key == "abc123"
    assert subject.state.latest_command_hash == "abc123"

    subject.handle_action(
        QueueCommandAction(
            request=create,
            request_hash="def456",
            created_at=datetime(year=2021, month=1, day=1),
            command_id="command-id-2",
        )
    )

    assert subject.state.latest_command_hash == "def456"


def test_command_queue_and_unqueue() -> None:
    """It should queue on QueueCommandAction and dequeue on UpdateCommandAction."""
    queue_1 = QueueCommandAction(
        request=commands.WaitForResumeCreate(params=commands.WaitForResumeParams()),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )
    queue_2 = QueueCommandAction(
        request=commands.WaitForResumeCreate(params=commands.WaitForResumeParams()),
        request_hash=None,
        created_at=datetime(year=2022, month=2, day=2),
        command_id="command-id-2",
    )
    update_1 = UpdateCommandAction(
        command=create_running_command(command_id="command-id-1"),
    )
    update_2 = UpdateCommandAction(
        command=create_running_command(command_id="command-id-2"),
    )

    subject = CommandStore(is_door_open=False, config=_make_config())

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


def test_setup_command_queue_and_unqueue() -> None:
    """It should queue and dequeue on setup commands."""
    queue_1 = QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(),
            intent=commands.CommandIntent.SETUP,
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )
    queue_2 = QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(),
            intent=commands.CommandIntent.SETUP,
        ),
        request_hash=None,
        created_at=datetime(year=2022, month=2, day=2),
        command_id="command-id-2",
    )
    update_1 = UpdateCommandAction(
        command=create_running_command(command_id="command-id-1"),
    )
    update_2 = UpdateCommandAction(
        command=create_running_command(command_id="command-id-2"),
    )

    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(queue_1)
    assert subject.state.queued_setup_command_ids == OrderedSet(["command-id-1"])

    subject.handle_action(queue_2)
    assert subject.state.queued_setup_command_ids == OrderedSet(
        ["command-id-1", "command-id-2"]
    )

    subject.handle_action(update_2)
    assert subject.state.queued_setup_command_ids == OrderedSet(["command-id-1"])

    subject.handle_action(update_1)
    assert subject.state.queued_setup_command_ids == OrderedSet()


def test_setup_queue_action_updates_command_intent() -> None:
    """It should update command source correctly."""
    queue_cmd = QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(),
            intent=commands.CommandIntent.SETUP,
            key="command-key-1",
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )

    expected_pause_cmd = commands.WaitForResume(
        id="command-id-1",
        key="command-key-1",
        createdAt=datetime(year=2021, month=1, day=1),
        params=commands.WaitForResumeParams(),
        status=commands.CommandStatus.QUEUED,
        intent=commands.CommandIntent.SETUP,
    )

    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(queue_cmd)
    assert subject.state.commands_by_id["command-id-1"] == CommandEntry(
        index=0, command=expected_pause_cmd
    )


def test_running_command_id() -> None:
    """It should update the running command ID through a command's lifecycle."""
    queue = QueueCommandAction(
        request=commands.WaitForResumeCreate(params=commands.WaitForResumeParams()),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )
    running_update = UpdateCommandAction(
        command=create_running_command(command_id="command-id-1"),
    )
    completed_update = UpdateCommandAction(
        command=create_succeeded_command(command_id="command-id-1"),
    )

    subject = CommandStore(is_door_open=False, config=_make_config())

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

    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(running_update)
    assert subject.state.all_command_ids == ["command-id-1"]
    assert subject.state.running_command_id == "command-id-1"

    subject.handle_action(completed_update)
    assert subject.state.all_command_ids == ["command-id-1"]
    assert subject.state.running_command_id is None


def test_command_failure_clears_queues() -> None:
    """It should clear the command queue on command failure."""
    queue_1 = QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(), key="command-key-1"
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )
    queue_2 = QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(), key="command-key-2"
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-2",
    )
    running_1 = UpdateCommandAction(
        command=commands.WaitForResume(
            id="command-id-1",
            key="command-key-1",
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            params=commands.WaitForResumeParams(),
            status=commands.CommandStatus.RUNNING,
        )
    )
    fail_1 = FailCommandAction(
        command_id="command-id-1",
        error_id="error-id",
        failed_at=datetime(year=2023, month=3, day=3),
        error=errors.ProtocolEngineError(message="oh no"),
    )

    expected_failed_1 = commands.WaitForResume(
        id="command-id-1",
        key="command-key-1",
        error=errors.ErrorOccurrence(
            id="error-id",
            createdAt=datetime(year=2023, month=3, day=3),
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
            errorType="ProtocolEngineError",
            detail="oh no",
        ),
        createdAt=datetime(year=2021, month=1, day=1),
        startedAt=datetime(year=2022, month=2, day=2),
        completedAt=datetime(year=2023, month=3, day=3),
        params=commands.WaitForResumeParams(),
        status=commands.CommandStatus.FAILED,
    )
    expected_failed_2 = commands.WaitForResume(
        id="command-id-2",
        key="command-key-2",
        error=None,
        createdAt=datetime(year=2021, month=1, day=1),
        completedAt=datetime(year=2023, month=3, day=3),
        params=commands.WaitForResumeParams(),
        status=commands.CommandStatus.FAILED,
    )

    subject = CommandStore(is_door_open=False, config=_make_config())

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


def test_setup_command_failure_only_clears_setup_command_queue() -> None:
    """It should clear only the setup command queue for a failed setup command.

    This test queues up a non-setup command followed by two setup commands,
    then attempts to run and fail the first setup command and
    """
    cmd_1_non_setup = commands.WaitForResume(
        id="command-id-1",
        key="command-key-1",
        createdAt=datetime(year=2021, month=1, day=1),
        params=commands.WaitForResumeParams(),
        status=commands.CommandStatus.QUEUED,
    )
    queue_action_1_non_setup = QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=cmd_1_non_setup.params, key="command-key-1"
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )
    queue_action_2_setup = QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(),
            intent=commands.CommandIntent.SETUP,
            key="command-key-2",
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-2",
    )
    queue_action_3_setup = QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(),
            intent=commands.CommandIntent.SETUP,
            key="command-key-3",
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-3",
    )

    running_cmd_2 = UpdateCommandAction(
        command=commands.WaitForResume(
            id="command-id-2",
            key="command-key-2",
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            params=commands.WaitForResumeParams(),
            status=commands.CommandStatus.RUNNING,
            intent=commands.CommandIntent.SETUP,
        )
    )
    failed_action_cmd_2 = FailCommandAction(
        command_id="command-id-2",
        error_id="error-id",
        failed_at=datetime(year=2023, month=3, day=3),
        error=errors.ProtocolEngineError(message="oh no"),
    )
    expected_failed_cmd_2 = commands.WaitForResume(
        id="command-id-2",
        key="command-key-2",
        error=errors.ErrorOccurrence(
            id="error-id",
            createdAt=datetime(year=2023, month=3, day=3),
            errorType="ProtocolEngineError",
            detail="oh no",
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
        ),
        createdAt=datetime(year=2021, month=1, day=1),
        startedAt=datetime(year=2022, month=2, day=2),
        completedAt=datetime(year=2023, month=3, day=3),
        params=commands.WaitForResumeParams(),
        status=commands.CommandStatus.FAILED,
        intent=commands.CommandIntent.SETUP,
    )
    expected_failed_cmd_3 = commands.WaitForResume(
        id="command-id-3",
        key="command-key-3",
        error=None,
        createdAt=datetime(year=2021, month=1, day=1),
        completedAt=datetime(year=2023, month=3, day=3),
        params=commands.WaitForResumeParams(),
        status=commands.CommandStatus.FAILED,
        intent=commands.CommandIntent.SETUP,
    )

    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(queue_action_1_non_setup)
    subject.handle_action(queue_action_2_setup)
    subject.handle_action(queue_action_3_setup)
    subject.handle_action(running_cmd_2)
    subject.handle_action(failed_action_cmd_2)

    assert subject.state.running_command_id is None
    assert subject.state.queued_setup_command_ids == OrderedSet()
    assert subject.state.queued_command_ids == OrderedSet(["command-id-1"])
    assert subject.state.all_command_ids == [
        "command-id-1",
        "command-id-2",
        "command-id-3",
    ]
    assert subject.state.commands_by_id == {
        "command-id-1": CommandEntry(index=0, command=cmd_1_non_setup),
        "command-id-2": CommandEntry(index=1, command=expected_failed_cmd_2),
        "command-id-3": CommandEntry(index=2, command=expected_failed_cmd_3),
    }


def test_command_store_preserves_handle_order() -> None:
    """It should store commands in the order they are handled."""
    # Any arbitrary 3 commands that compare non-equal (!=) to each other.
    command_a = create_queued_command(command_id="command-id-1")
    command_b = create_running_command(command_id="command-id-2")
    command_c = create_succeeded_command(command_id="command-id-1")

    subject = CommandStore(is_door_open=False, config=_make_config())

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
    subject = CommandStore(is_door_open=False, config=_make_config())
    subject.handle_action(PauseAction(source=pause_source))

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=None,
        run_completed_at=None,
        run_started_at=None,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        latest_command_hash=None,
        stopped_by_estop=False,
    )


@pytest.mark.parametrize("pause_source", PauseSource)
def test_command_store_handles_play_action(pause_source: PauseSource) -> None:
    """It should set the running flag on play."""
    subject = CommandStore(is_door_open=False, config=_make_config())
    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))

    assert subject.state == CommandState(
        queue_status=QueueStatus.RUNNING,
        run_result=None,
        run_completed_at=None,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        run_started_at=datetime(year=2021, month=1, day=1),
        latest_command_hash=None,
        stopped_by_estop=False,
    )


def test_command_store_handles_finish_action() -> None:
    """It should change to a succeeded state with FinishAction."""
    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))
    subject.handle_action(FinishAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=RunResult.SUCCEEDED,
        run_completed_at=None,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        run_started_at=datetime(year=2021, month=1, day=1),
        latest_command_hash=None,
        stopped_by_estop=False,
    )


def test_command_store_handles_finish_action_with_stopped() -> None:
    """It should change to a stopped state if FinishAction has set_run_status=False."""
    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))
    subject.handle_action(FinishAction(set_run_status=False))

    assert subject.state.run_result == RunResult.STOPPED


@pytest.mark.parametrize("from_estop", [True, False])
def test_command_store_handles_stop_action(from_estop: bool) -> None:
    """It should mark the engine as non-gracefully stopped on StopAction."""
    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))
    subject.handle_action(StopAction(from_estop=from_estop))

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=RunResult.STOPPED,
        run_completed_at=None,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        run_started_at=datetime(year=2021, month=1, day=1),
        latest_command_hash=None,
        stopped_by_estop=from_estop,
    )


def test_command_store_cannot_restart_after_should_stop() -> None:
    """It should reject a play action after finish."""
    subject = CommandStore(is_door_open=False, config=_make_config())
    subject.handle_action(FinishAction())
    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=RunResult.SUCCEEDED,
        run_completed_at=None,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        run_started_at=None,
        latest_command_hash=None,
        stopped_by_estop=False,
    )


def test_command_store_save_started_completed_run_timestamp() -> None:
    """It should save started and completed timestamps."""
    subject = CommandStore(config=_make_config(), is_door_open=False)
    start_time = datetime(year=2021, month=1, day=1)
    hardware_stopped_time = datetime(year=2022, month=2, day=2)

    subject.handle_action(PlayAction(requested_at=start_time))
    subject.handle_action(
        HardwareStoppedAction(
            completed_at=hardware_stopped_time, finish_error_details=None
        )
    )

    assert subject.state.run_started_at == start_time
    assert subject.state.run_completed_at == hardware_stopped_time


def test_timestamps_are_latched() -> None:
    """It should not change startedAt or completedAt once set."""
    subject = CommandStore(config=_make_config(), is_door_open=False)

    play_time_1 = datetime(year=2021, month=1, day=1)
    play_time_2 = datetime(year=2022, month=2, day=2)
    stop_time_1 = datetime(year=2023, month=3, day=3)
    stop_time_2 = datetime(year=2024, month=4, day=4)

    subject.handle_action(PlayAction(requested_at=play_time_1))
    subject.handle_action(PauseAction(source=PauseSource.CLIENT))
    subject.handle_action(PlayAction(requested_at=play_time_2))
    subject.handle_action(
        HardwareStoppedAction(completed_at=stop_time_1, finish_error_details=None)
    )
    subject.handle_action(
        HardwareStoppedAction(completed_at=stop_time_2, finish_error_details=None)
    )

    assert subject.state.run_started_at == play_time_1
    assert subject.state.run_completed_at == stop_time_1


def test_command_store_wraps_unknown_errors() -> None:
    """Fatal errors that are unknown should be wrapped in EnumeratedErrors.

    Fatal errors can come in through FinishActions and HardwareStoppedActions.
    If these are not descendants of EnumeratedError already, they should be
    wrapped in an EnumeratedError before being converted to an ErrorOccurrence.

    The wrapping EnumeratedError should be an UnexpectedProtocolError for errors that happened
    in the main part of the protocol run, or a PythonException for errors that happened elsewhere.
    """
    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(
        FinishAction(
            error_details=FinishErrorDetails(
                error=RuntimeError("oh no"),
                error_id="error-id-1",
                created_at=datetime(year=2021, month=1, day=1),
            )
        )
    )

    subject.handle_action(
        HardwareStoppedAction(
            completed_at=datetime(year=2022, month=2, day=2),
            finish_error_details=FinishErrorDetails(
                error=RuntimeError("yikes"),
                error_id="error-id-2",
                created_at=datetime(year=2023, month=3, day=3),
            ),
        )
    )

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=RunResult.FAILED,
        run_completed_at=datetime(year=2022, month=2, day=2),
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=errors.ErrorOccurrence(
            id="error-id-1",
            createdAt=datetime(year=2021, month=1, day=1),
            # This is wrapped into an UnexpectedProtocolError because it's not
            # enumerated, and it happened in the main part of the run.
            errorType="UnexpectedProtocolError",
            # Unknown errors use the default error code.
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
            # And it has information about what created it.
            detail="oh no",
            wrappedErrors=[
                errors.ErrorOccurrence(
                    id="error-id-1",
                    createdAt=datetime(year=2021, month=1, day=1),
                    errorType="PythonException",
                    detail="RuntimeError: oh no",
                    errorCode="4000",
                    errorInfo={
                        "class": "RuntimeError",
                        "args": "('oh no',)",
                    },
                    wrappedErrors=[],
                )
            ],
        ),
        finish_error=errors.ErrorOccurrence(
            id="error-id-2",
            createdAt=datetime(year=2023, month=3, day=3),
            # This is wrapped into a PythonException because it's not
            # enumerated, and it happened during the post-run cleanup steps.
            errorType="PythonException",
            # Unknown errors use the default error code.
            errorCode=ErrorCodes.GENERAL_ERROR.value.code,
            # And it has information about what created it.
            detail="RuntimeError: yikes",
            errorInfo={
                "class": "RuntimeError",
                "args": "('yikes',)",
            },
        ),
        run_started_at=None,
        latest_command_hash=None,
        stopped_by_estop=False,
    )


def test_command_store_preserves_enumerated_errors() -> None:
    """If an error is derived from EnumeratedError, it should be stored as-is."""

    class MyCustomError(errors.ProtocolEngineError):
        def __init__(self, message: str) -> None:
            super().__init__(ErrorCodes.PIPETTE_NOT_PRESENT, message)

    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(
        FinishAction(
            error_details=FinishErrorDetails(
                error=MyCustomError(message="oh no"),
                error_id="error-id-1",
                created_at=datetime(year=2021, month=1, day=1),
            )
        )
    )

    subject.handle_action(
        HardwareStoppedAction(
            completed_at=datetime(year=2022, month=2, day=2),
            finish_error_details=FinishErrorDetails(
                error=MyCustomError(message="yikes"),
                error_id="error-id-2",
                created_at=datetime(year=2023, month=3, day=3),
            ),
        )
    )

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=RunResult.FAILED,
        run_completed_at=datetime(year=2022, month=2, day=2),
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=errors.ErrorOccurrence(
            id="error-id-1",
            createdAt=datetime(year=2021, month=1, day=1),
            errorType="MyCustomError",
            detail="oh no",
            errorCode=ErrorCodes.PIPETTE_NOT_PRESENT.value.code,
        ),
        finish_error=errors.ErrorOccurrence(
            id="error-id-2",
            createdAt=datetime(year=2023, month=3, day=3),
            errorType="MyCustomError",
            detail="yikes",
            errorCode=ErrorCodes.PIPETTE_NOT_PRESENT.value.code,
        ),
        run_started_at=None,
        latest_command_hash=None,
        stopped_by_estop=False,
    )


def test_command_store_ignores_stop_after_graceful_finish() -> None:
    """It should no-op on stop if already gracefully finished."""
    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))
    subject.handle_action(FinishAction())
    subject.handle_action(StopAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=RunResult.SUCCEEDED,
        run_completed_at=None,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        run_started_at=datetime(year=2021, month=1, day=1),
        latest_command_hash=None,
        stopped_by_estop=False,
    )


def test_command_store_ignores_finish_after_non_graceful_stop() -> None:
    """It should no-op on finish if already ungracefully stopped."""
    subject = CommandStore(is_door_open=False, config=_make_config())

    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))
    subject.handle_action(StopAction())
    subject.handle_action(FinishAction())

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=RunResult.STOPPED,
        run_completed_at=None,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        run_started_at=datetime(year=2021, month=1, day=1),
        latest_command_hash=None,
        stopped_by_estop=False,
    )


def test_command_store_handles_command_failed() -> None:
    """It should store an error and mark the command if it fails."""
    command = create_running_command(command_id="command-id")

    expected_error_occurrence = errors.ErrorOccurrence(
        id="error-id",
        errorType="ProtocolEngineError",
        createdAt=datetime(year=2022, month=2, day=2),
        detail="oh no",
        errorCode=ErrorCodes.GENERAL_ERROR.value.code,
    )

    expected_failed_command = create_failed_command(
        command_id="command-id",
        error=expected_error_occurrence,
        completed_at=datetime(year=2022, month=2, day=2),
    )

    subject = CommandStore(is_door_open=False, config=_make_config())
    subject.handle_action(UpdateCommandAction(command=command))
    subject.handle_action(
        FailCommandAction(
            command_id="command-id",
            error_id="error-id",
            failed_at=datetime(year=2022, month=2, day=2),
            error=errors.ProtocolEngineError(message="oh no"),
        )
    )

    assert subject.state == CommandState(
        queue_status=QueueStatus.SETUP,
        run_result=None,
        run_completed_at=None,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=["command-id"],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id={
            "command-id": CommandEntry(index=0, command=expected_failed_command),
        },
        run_error=None,
        finish_error=None,
        run_started_at=None,
        latest_command_hash=None,
        stopped_by_estop=False,
    )


def test_handles_hardware_stopped() -> None:
    """It should mark the hardware as stopped on HardwareStoppedAction."""
    subject = CommandStore(is_door_open=False, config=_make_config())
    completed_at = datetime(year=2021, day=1, month=1)
    subject.handle_action(
        HardwareStoppedAction(completed_at=completed_at, finish_error_details=None)
    )

    assert subject.state == CommandState(
        queue_status=QueueStatus.PAUSED,
        run_result=RunResult.STOPPED,
        run_completed_at=completed_at,
        is_door_blocking=False,
        running_command_id=None,
        all_command_ids=[],
        queued_command_ids=OrderedSet(),
        queued_setup_command_ids=OrderedSet(),
        commands_by_id=OrderedDict(),
        run_error=None,
        finish_error=None,
        run_started_at=None,
        latest_command_hash=None,
        stopped_by_estop=False,
    )


@pytest.mark.parametrize(
    ("is_door_open", "config", "expected_queue_status"),
    [
        (False, _make_config(), QueueStatus.RUNNING),
        (True, _make_config(), QueueStatus.RUNNING),
        (False, _make_config(block_on_door_open=True), QueueStatus.RUNNING),
        (True, _make_config(block_on_door_open=True), QueueStatus.PAUSED),
    ],
)
def test_command_store_handles_play_according_to_initial_door_state(
    is_door_open: bool,
    config: Config,
    expected_queue_status: QueueStatus,
) -> None:
    """It should set command queue state on play action according to door state."""
    subject = CommandStore(is_door_open=is_door_open, config=config)
    start_time = datetime(year=2021, month=1, day=1)
    subject.handle_action(PlayAction(requested_at=start_time))

    assert subject.state.queue_status == expected_queue_status
    assert subject.state.run_started_at == start_time


@pytest.mark.parametrize(
    ("config", "expected_is_door_blocking"),
    [
        (_make_config(block_on_door_open=True), True),
        (_make_config(block_on_door_open=False), False),
    ],
)
def test_handles_door_open_and_close_event_before_play(
    config: Config, expected_is_door_blocking: bool
) -> None:
    """It should update state but not pause on door open whenis setup."""
    subject = CommandStore(is_door_open=False, config=config)

    subject.handle_action(DoorChangeAction(door_state=DoorState.OPEN))

    assert subject.state.queue_status == QueueStatus.SETUP
    assert subject.state.is_door_blocking is expected_is_door_blocking

    subject.handle_action(DoorChangeAction(door_state=DoorState.CLOSED))

    assert subject.state.queue_status == QueueStatus.SETUP
    assert subject.state.is_door_blocking is False


@pytest.mark.parametrize(
    ("config", "expected_queue_status", "expected_is_door_blocking"),
    [
        (_make_config(block_on_door_open=True), QueueStatus.PAUSED, True),
        (_make_config(block_on_door_open=False), QueueStatus.RUNNING, False),
    ],
)
def test_handles_door_open_and_close_event_after_play(
    config: Config, expected_queue_status: QueueStatus, expected_is_door_blocking: bool
) -> None:
    """It should update state when door opened and closed after run is played."""
    subject = CommandStore(is_door_open=False, config=config)

    subject.handle_action(PlayAction(requested_at=datetime(year=2021, month=1, day=1)))
    subject.handle_action(DoorChangeAction(door_state=DoorState.OPEN))

    assert subject.state.queue_status == expected_queue_status
    assert subject.state.is_door_blocking is expected_is_door_blocking

    subject.handle_action(DoorChangeAction(door_state=DoorState.CLOSED))

    assert subject.state.queue_status == expected_queue_status
    assert subject.state.is_door_blocking is False
