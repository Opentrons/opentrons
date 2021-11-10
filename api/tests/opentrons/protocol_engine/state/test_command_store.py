"""Tests for the command lifecycle state."""
import pytest
from collections import OrderedDict
from datetime import datetime
from typing import NamedTuple, Type, cast

from opentrons.types import MountType, DeckSlotName
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands
from opentrons.protocol_engine.types import DeckSlotLocation, PipetteName, WellLocation
from opentrons.protocol_engine.state.commands import CommandState, CommandStore

from opentrons.protocol_engine.actions import (
    QueueCommandAction,
    UpdateCommandAction,
    PlayAction,
    PauseAction,
    StopAction,
)

from .command_fixtures import (
    create_pending_command,
    create_running_command,
    create_completed_command,
)


def test_initial_state() -> None:
    """It should set the initial state."""
    subject = CommandStore()

    assert subject.state == CommandState(
        is_running=True,
        stop_requested=False,
        commands_by_id=OrderedDict(),
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
                    location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
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
        is_running=False,
        stop_requested=False,
        commands_by_id=OrderedDict(),
    )


def test_command_store_handles_play_action() -> None:
    """It should set the running flag on play."""
    subject = CommandStore()
    subject.handle_action(PauseAction())
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        is_running=True,
        stop_requested=False,
        commands_by_id=OrderedDict(),
    )


def test_command_store_handles_stop_action() -> None:
    """It should clear the running flag and set the done flag on stop."""
    subject = CommandStore()

    subject.handle_action(PlayAction())
    subject.handle_action(StopAction())

    assert subject.state == CommandState(
        is_running=False,
        stop_requested=True,
        commands_by_id=OrderedDict(),
    )


def test_command_store_cannot_restart_after_stop() -> None:
    """It should reject a play action after a stop action."""
    subject = CommandStore()
    subject.handle_action(StopAction())
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        is_running=False,
        stop_requested=True,
        commands_by_id=OrderedDict(),
    )
