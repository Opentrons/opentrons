from datetime import datetime
from dataclasses import dataclass, field
from typing import Any, Optional, Generic, TypeVar

from robot_server.service.session.models.command import CommandStatus, RequestTypes
from robot_server.service.session.models.common import IdentifierType, create_identifier
from opentrons.util.helpers import utc_now


@dataclass(frozen=True)
class CommandMeta:
    identifier: IdentifierType = field(default_factory=create_identifier)
    created_at: datetime = field(default_factory=utc_now)


ResultTypeT = TypeVar("ResultTypeT")


@dataclass(frozen=True)
class CommandResult(Generic[ResultTypeT]):
    started_at: datetime
    completed_at: datetime
    status: CommandStatus = CommandStatus.executed
    data: Optional[ResultTypeT] = None


@dataclass(frozen=True)
class Command:
    request: RequestTypes
    meta: CommandMeta = field(default_factory=CommandMeta)


@dataclass(frozen=True)
class CompletedCommand:
    request: RequestTypes
    meta: CommandMeta
    result: CommandResult[Any]


def create_command(request: RequestTypes) -> Command:
    """Create a command object"""
    return Command(request=request)
