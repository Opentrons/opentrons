from datetime import datetime

from robot_server.service.session.models import IdentifierType, \
    create_identifier, CommandName, CommandDataType


class Command:
    def __init__(self,
                 name: CommandName,
                 data: CommandDataType):
        self._name = name
        self._data = data
        # Create a unique identifier for the command
        self._id = create_identifier()
        self._created_on = datetime.utcnow()

    @property
    def name(self) -> CommandName:
        return self._name

    @property
    def data(self) -> CommandDataType:
        return self._data

    @property
    def identifier(self) -> IdentifierType:
        return self._id

    @property
    def created_on(self) -> datetime:
        return self._created_on

    def __str__(self) -> str:
        return f"Command(" \
               f"name={self.name}, " \
               f"identifier={self.identifier}," \
               f"data={self.data}," \
               f"created_on={self.created_on}," \
               f")"
