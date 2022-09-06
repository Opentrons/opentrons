"""State store actions.

Actions can be passed to the ActionDispatcher, where they will trigger
reactions in objects that subscribe to the pipeline, like the StateStore.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional, Union

from opentrons.protocols.models import LabwareDefinition
from opentrons.hardware_control.types import DoorState
from opentrons.hardware_control.modules import LiveData

from ..commands import Command, CommandCreate
from ..errors import ProtocolEngineError
from ..types import LabwareOffsetCreate, ModuleDefinition, Liquid


@dataclass(frozen=True)
class PlayAction:
    """Start or resume processing commands in the engine."""

    requested_at: datetime


class PauseSource(str, Enum):
    """The source of a PauseAction.

    Attributes:
        CLIENT: the pause came externally, from the engine client.
        PROTOCOL: the pause came from the protocol itself.
    """

    CLIENT = "client"
    PROTOCOL = "protocol"


@dataclass(frozen=True)
class PauseAction:
    """Pause processing commands in the engine."""

    source: PauseSource


@dataclass(frozen=True)
class StopAction:
    """Stop the current engine execution.

    After a StopAction, the engine status will be marked as stopped.
    """


@dataclass(frozen=True)
class FinishErrorDetails:
    """Error details for the payload of a FinishAction."""

    error: Exception
    error_id: str
    created_at: datetime


@dataclass(frozen=True)
class FinishAction:
    """Gracefully stop processing commands in the engine.

    After a FinishAction, the engine status will be marked as `succeeded` or `failed`
    if `set_run_status` is True. If False, status will be `stopped`.
    """

    set_run_status: bool = True
    error_details: Optional[FinishErrorDetails] = None


@dataclass(frozen=True)
class HardwareStoppedAction:
    """An action dispatched after hardware has successfully been stopped."""

    completed_at: datetime


@dataclass(frozen=True)
class DoorChangeAction:
    """Handle events coming in from hardware control."""

    door_state: DoorState


@dataclass(frozen=True)
class QueueCommandAction:
    """Add a command request to the queue."""

    command_id: str
    created_at: datetime
    request: CommandCreate


@dataclass(frozen=True)
class UpdateCommandAction:
    """Update a given command."""

    command: Command


@dataclass(frozen=True)
class FailCommandAction:
    """Mark a given command as failed.

    The given command and all currently queued commands will be marked
    as failed due to the given error.
    """

    # TODO(mc, 2021-11-12): we'll likely need to add the command params
    # to this payload for state reaction purposes
    command_id: str
    error_id: str
    failed_at: datetime
    error: ProtocolEngineError


@dataclass(frozen=True)
class AddLabwareOffsetAction:
    """Add a labware offset, to apply to subsequent `LoadLabwareCommand`s."""

    labware_offset_id: str
    created_at: datetime
    request: LabwareOffsetCreate


@dataclass(frozen=True)
class AddLabwareDefinitionAction:
    """Add a labware definition, to apply to subsequent `LoadLabwareCommand`s."""

    definition: LabwareDefinition


@dataclass(frozen=True)
class AddLiquidAction:
    """Add a liquid, to apply to subsequent `LoadLiquid`s."""

    liquid: Liquid


@dataclass(frozen=True)
class AddModuleAction:
    """Add an attached module directly to state without a location."""

    module_id: str
    serial_number: str
    definition: ModuleDefinition
    module_live_data: LiveData


Action = Union[
    PlayAction,
    PauseAction,
    StopAction,
    FinishAction,
    HardwareStoppedAction,
    DoorChangeAction,
    QueueCommandAction,
    UpdateCommandAction,
    FailCommandAction,
    AddLabwareOffsetAction,
    AddLabwareDefinitionAction,
    AddModuleAction,
    AddLiquidAction,
]
