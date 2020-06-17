import typing
from datetime import datetime
from dataclasses import dataclass, field

from robot_server.service.session.models import IdentifierType, \
    create_identifier, CommandName, CommandDataType


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
    status: str
    started_at: datetime
    completed_at: datetime = field(default_factory=datetime.utcnow)


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


class Completer:
    """Context manager to assist in marking a command complete"""

    def __init__(self,
                 command: Command,
                 *exceptions,
                 success_status: str = "executed"):
        """
        Constructor

        :param command: The command being executed in the context manager
        :param exceptions: Exception types that will be caught and used to
            create the status of the command result. Other exception types
            will result in error response to client
        :param success_status: string used to indicate success.
        """
        self._command = command
        self._exec_time = None
        self._success_status = success_status
        self._exception_types = set(exceptions)
        self.completed: typing.Optional[CompletedCommand] = None

    def __enter__(self):
        self._exec_time = datetime.utcnow()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if not exc_type or exc_type in self._exception_types:
            # There is no exception or it is a type we can use for a status
            # string.
            status = self._success_status if not exc_val else str(exc_val)

            self.completed = CompletedCommand(
                content=self._command.content,
                meta=self._command.meta,
                result=CommandResult(status=status,
                                     started_at=self._exec_time,
                                     completed_at=datetime.utcnow())
            )
            return True
        else:
            return False
