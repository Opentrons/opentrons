from typing import Any, Dict, Type
from typing_extensions import get_args

from .command_unions import Command, CommandCreate


def parse_command(command: Dict[str, Any]) -> Command:
    # TODO: Type checking.
    command_class = _command_classes[command["commandType"]]
    # TODO: Leave room for by_alias, etc.
    return command_class.parse_obj(command)


def parse_command_create(command_create: Dict[str, Any]) -> CommandCreate:
    command_create_class = _command_create_classes[command_create["commandType"]]
    return command_create_class.parse_obj(command_create)


# TODO: Clean this up.
_command_classes: Dict[str, Type[Command]] = {
    command_class.__fields__["commandType"].get_default(): command_class
    for command_class in get_args(Command)
}

# TODO: Clean this up.
_command_create_classes: Dict[str, Type[CommandCreate]] = {
    command_create_class.__fields__["commandType"].get_default(): command_create_class
    for command_create_class in get_args(CommandCreate)
}
