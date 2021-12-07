"""Tests for the command lifecycle state."""
import pytest
from collections import OrderedDict
from datetime import datetime
from typing import NamedTuple, Type, cast

from opentrons.types import MountType, DeckSlotName
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands, errors
from opentrons.protocol_engine.types import DeckSlotLocation, PipetteName, WellLocation
from opentrons.protocol_engine.state.commands import CommandState, CommandStore

from opentrons.protocol_engine.actions import (
    QueueCommandAction,
    UpdateCommandAction,
    FailCommandAction,
    PlayAction,
    PauseAction,
    FinishAction,
    FinishErrorDetails,
    StopAction,
    HardwareStoppedAction,
)

from .command_fixtures import (
    create_pending_command,
    create_running_command,
    create_completed_command,
    create_failed_command,
)


def test_initial_state() -> None:
    """It should set the initial state."""
    subject = CommandStore()

    assert subject.state == CommandState(
        is_running_queue=True,
        should_report_result=False,
        is_hardware_stopped=False,
        should_stop=False,
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


class QueueCommandSpec(NamedTuple):
    """Test data for the QueueCommandAction."""

    command_request: commands.CommandCreate
    expected_cls: Type[commands.Command]
    created_at: datetime = datetime(year=2021, month=1, day=1)
    command_id: str = "command-id"


@pytest.mark.parametrize(
    QueueCommandSpec._fields,
    [
        QueueCommandSpec(
            command_request=commands.AddLabwareDefinitionCreate(
                params=commands.AddLabwareDefinitionParams.construct(
                    # TODO(mc, 2021-06-25): do not mock out LabwareDefinition
                    definition=cast(LabwareDefinition, {"mockDefinition": True})
                ),
            ),
            expected_cls=commands.AddLabwareDefinition,
        ),
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
) -> None:
    """It should add a command to the store."""
    action = QueueCommandAction(
        request=command_request,
        created_at=created_at,
        command_id=command_id,
    )
    expected_command = expected_cls(
        id=command_id,
        createdAt=created_at,
        status=commands.CommandStatus.QUEUED,
        params=command_request.params,  # type: ignore[arg-type]
    )

    subject = CommandStore()
    subject.handle_action(action)

    assert subject.state.commands_by_id == OrderedDict({"command-id": expected_command})


def test_command_store_preserves_handle_order() -> None:
    """It should store commands in the order they are handled."""
    # Any arbitrary 3 commands that compare non-equal (!=) to each other.
    command_a = create_pending_command(command_id="command-id-1")
    command_b = create_running_command(command_id="command-id-2")
    command_c = create_completed_command(command_id="command-id-1")

    subject = CommandStore()
    subject.handle_action(UpdateCommandAction(command=command_a))
    subject.handle_action(UpdateCommandAction(command=command_b))

    assert subject.state.commands_by_id == OrderedDict(
        [
            ("command-id-1", command_a),
            ("command-id-2", command_b),
        ]
    )

    subject.handle_action(UpdateCommandAction(command=command_c))
    assert subject.state.commands_by_id == OrderedDict(
        [
            ("command-id-1", command_c),
            ("command-id-2", command_b),
        ]
    )


def test_command_store_handles_pause_action() -> None:
    """It should clear the running flag on pause."""
    subject = CommandStore()
    subject.handle_action(PauseAction())

    assert subject.state == CommandState(
        is_running_queue=False,
        should_report_result=False,
        is_hardware_stopped=False,
        should_stop=False,
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_handles_play_action() -> None:
    """It should set the running flag on play."""
    subject = CommandStore()
    subject.handle_action(PauseAction())
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        is_running_queue=True,
        should_report_result=False,
        is_hardware_stopped=False,
        should_stop=False,
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_handles_finish_action() -> None:
    """It should clear the running flag and set the done flag on FinishAction."""
    subject = CommandStore()

    subject.handle_action(PlayAction())
    subject.handle_action(FinishAction())

    assert subject.state == CommandState(
        is_running_queue=False,
        should_report_result=True,
        is_hardware_stopped=False,
        should_stop=True,
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_handles_stop_action() -> None:
    """It should mark the engine as non-gracefully stopped on StopAction."""
    subject = CommandStore()

    subject.handle_action(PlayAction())
    subject.handle_action(StopAction())

    assert subject.state == CommandState(
        is_running_queue=False,
        should_report_result=False,
        is_hardware_stopped=False,
        should_stop=True,
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )


def test_command_store_cannot_restart_after_should_stop() -> None:
    """It should reject a play action after a stop action."""
    subject = CommandStore()
    subject.handle_action(FinishAction())
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        is_running_queue=False,
        should_report_result=True,
        is_hardware_stopped=False,
        should_stop=True,
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
        is_running_queue=False,
        should_report_result=True,
        is_hardware_stopped=False,
        should_stop=True,
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
        is_running_queue=False,
        should_report_result=True,
        is_hardware_stopped=False,
        should_stop=True,
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
        is_running_queue=False,
        should_report_result=True,
        is_hardware_stopped=False,
        should_stop=True,
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
        is_running_queue=False,
        should_report_result=False,
        is_hardware_stopped=False,
        should_stop=True,
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
        is_running_queue=True,
        should_report_result=False,
        is_hardware_stopped=False,
        should_stop=False,
        commands_by_id=OrderedDict([("command-id", expected_failed_command)]),
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
        is_running_queue=False,
        should_report_result=False,
        is_hardware_stopped=True,
        should_stop=True,
        commands_by_id=OrderedDict(),
        errors_by_id={},
    )
