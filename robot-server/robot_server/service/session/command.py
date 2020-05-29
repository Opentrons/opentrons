from uuid import uuid4, UUID

from robot_server.service.models.session import CommandName, CommandDataType
from robot_server.service.session.session import Session


class Command:
    def __init__(self,
                 name: CommandName,
                 data: CommandDataType,
                 session: Session):
        self._name = name
        self._data = data
        self._session = session
        # Create a unique identifier for the command
        self._id = uuid4()

    @property
    def name(self) -> CommandName:
        return self._name

    @property
    def data(self) -> CommandDataType:
        return self._data

    @property
    def identifier(self) -> UUID:
        return self._id

    @property
    def session(self) -> Session:
        return self._session

    def execute(self):
        """Execute the command"""
        self._session.execute_command(self)

    def __str__(self) -> str:
        return f"{self.name}:{self.identifier}[{self.data}]"
