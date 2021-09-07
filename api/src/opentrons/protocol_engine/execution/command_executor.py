"""Command side-effect execution logic container."""
from logging import getLogger
from typing import Optional

from ..state import StateStore, UpdateCommandAction
from ..resources import ModelUtils
from ..commands import CommandStatus, CommandMapper
from .equipment import EquipmentHandler
from .movement import MovementHandler
from .pipetting import PipettingHandler
from .run_control import RunControlHandler

log = getLogger(__name__)


class CommandExecutor:
    """CommandExecutor container class.

    CommandExecutor manages various child handlers that define procedures to
    execute the side-effects of commands.
    """

    def __init__(
        self,
        state_store: StateStore,
        equipment: EquipmentHandler,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        run_control: RunControlHandler,
        command_mapper: Optional[CommandMapper] = None,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize the CommandExecutor with access to its dependencies."""
        self._state_store = state_store
        self._equipment = equipment
        self._movement = movement
        self._pipetting = pipetting
        self._run_control = run_control
        self._command_mapper = command_mapper or CommandMapper()
        self._model_utils = model_utils or ModelUtils()

    async def execute(self, command_id: str) -> None:
        """Run a given command's execution procedure.

        Arguments:
            command_id: The identifier of the command to execute. The
                command itself will be looked up from state.
        """
        command = self._state_store.commands.get(command_id=command_id)
        command_impl = command._ImplementationCls(
            equipment=self._equipment,
            movement=self._movement,
            pipetting=self._pipetting,
            run_control=self._run_control,
        )

        started_at = self._model_utils.get_timestamp()
        running_command = self._command_mapper.update_command(
            command=command,
            status=CommandStatus.RUNNING,
            startedAt=started_at,
        )

        self._state_store.handle_action(UpdateCommandAction(command=running_command))

        result = None
        error = None
        try:
            log.debug(f"Executing {command.id}, {command.commandType}, {command.data}")
            result = await command_impl.execute(command.data)  # type: ignore[arg-type]
            completed_status = CommandStatus.SUCCEEDED
        except Exception as e:
            log.warn(
                f"Execution of {command.id} failed",
                exc_info=e,
            )
            # TODO(mc, 2021-06-22): differentiate between `ProtocolEngineError`s
            # and unexpected errors when the Command model is ready to accept
            # structured error details
            error = str(e)
            completed_status = CommandStatus.FAILED

        completed_at = self._model_utils.get_timestamp()
        completed_command = self._command_mapper.update_command(
            command=running_command,
            result=result,
            error=error,
            status=completed_status,
            completedAt=completed_at,
        )

        self._state_store.handle_action(UpdateCommandAction(command=completed_command))
