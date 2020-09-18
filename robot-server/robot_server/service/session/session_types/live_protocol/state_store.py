from typing import Dict, List, Optional
from robot_server.service.session.command_execution import (
    Command, CommandResult)


class StateStore:
    def __init__(self):
        self._commands: List[Command] = []
        self._command_results_map: Dict[str, CommandResult] = dict()

    def handle_command_request(self, command: Command) -> None:
        """
        Place a newly requested command in the state store.
        """
        self._commands.append(command)

    # TODO(mc, 2020-09-17): add calls to subtree handlers
    def handle_command_result(
            self, command: Command, result: CommandResult) -> None:
        """
        Update the state upon completion of a handled command.
        """
        self._command_results_map[command.meta.identifier] = result

    def get_commands(self) -> List[Command]:
        """
        Selector method to return the current state of all commands
        """
        return self._commands

    def get_command_result_by_id(
            self, identifier: str) -> Optional[CommandResult]:
        """
        Selector method to return the result of a command by ID if that
        command has completed.
        """
        return self._command_results_map.get(identifier)
