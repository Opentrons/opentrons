from robot_server.service.models.session import CommandName, CommandDataType
from robot_server.service.session.models import IdentifierType, \
    create_identifier


class Command:
    def __init__(self,
                 name: CommandName,
                 data: CommandDataType):
        self._name = name
        self._data = data
        # Create a unique identifier for the command
        self._id = create_identifier()

    @property
    def name(self) -> CommandName:
        return self._name

    @property
    def data(self) -> CommandDataType:
        return self._data

    @property
    def identifier(self) -> IdentifierType:
        return self._id

    def __str__(self) -> str:
        return f"{self.name}:{self.identifier}[{self.data}]"
