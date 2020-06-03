from opentrons.calibration.util import StateMachine

from .base_executor import CommandExecutor, Command


class StateMachineExecutor(CommandExecutor):
    """A command executor that executes StateMachine triggers"""

    def __init__(self, state_machine: StateMachine):
        """
        Constructor

        :param state_machine: A state machine instance
        """
        self. _state_machine = state_machine

    async def execute(self, command: Command):
        """Execute command"""
        await self._state_machine.trigger_transition(
            trigger=command.name.value,
            **(command.data.dict() if command.data else {})
        )
