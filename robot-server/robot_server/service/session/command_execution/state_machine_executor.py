from opentrons.calibration.util import StateMachine, StateMachineError

from .base_executor import CommandExecutor, Command
from robot_server.service.session.models import CommandName, CommandDataType
from robot_server.service.session import errors


class StateMachineExecutor(CommandExecutor):
    """A command executor that executes StateMachine triggers"""

    def __init__(self, state_machine: StateMachine):
        """
        Constructor

        :param state_machine: A state machine instance
        """
        self. _state_machine = state_machine

    async def execute(self, command: CommandName, data: CommandDataType) \
            -> Command:
        """Execute command"""
        try:
            await self._state_machine.trigger_transition(
                trigger=command.value,
                **(data.dict() if data else {})
            )
        except AssertionError as e:
            raise errors.CommandExecutionException(str(e))
        except StateMachineError as e:
            raise errors.UnsupportedCommandException(str(e))

        return Command(name=command, data=data)
