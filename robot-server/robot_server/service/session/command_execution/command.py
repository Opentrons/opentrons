from datetime import datetime
from dataclasses import dataclass, field

from robot_server.service.session.models import IdentifierType, \
    create_identifier, CommandName, CommandDataType, CommandStatus


@dataclass(frozen=True)
class CommandContent:
    name: CommandName
    data: CommandDataType


@dataclass(frozen=True)
class CommandMeta:
    identifier: IdentifierType = field(default_factory=create_identifier)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass(frozen=True)
class CommandResult:
    started_at: datetime
    completed_at: datetime
    status: CommandStatus = CommandStatus.executed


@dataclass(frozen=True)
class Command:
    content: CommandContent
    meta: CommandMeta = field(default_factory=CommandMeta)


@dataclass(frozen=True)
class CompletedCommand:
    content: CommandContent
    meta: CommandMeta
    result: CommandResult


def create_command(name: CommandName, data: CommandDataType) -> Command:
    """Create a command object"""
    return Command(
        content=CommandContent(
            name=name,
            data=data
        )
    )
