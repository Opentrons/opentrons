"""Command side-effect execution logic container."""
from logging import getLogger
from typing import Optional

from ..state import StateStore
from ..resources import ModelUtils
from ..actions import ActionDispatcher, CommandUpdatedAction, CommandFailedAction
from ..commands import CommandStatus

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
        action_dispatcher: ActionDispatcher,
        equipment: EquipmentHandler,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        run_control: RunControlHandler,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize the CommandExecutor with access to its dependencies."""
        self._state_store = state_store
        self._action_dispatcher = action_dispatcher
        self._equipment = equipment
        self._movement = movement
        self._pipetting = pipetting
        self._run_control = run_control
        self._model_utils = model_utils or ModelUtils()

    async def execute(self, command_id: str) -> None:
        """Run a given command's execution procedure.

        Arguments:
            command_id: The identifier of the command to execute. The
                command itself will be looked up from state.
        """
        command = self._state_store.commands.get(command_id=command_id)

        running_command = command.copy(
            update={
                "status": CommandStatus.RUNNING,
                "startedAt": self._model_utils.get_timestamp(),
            }
        )

        command_impl = command._ImplementationCls(
            equipment=self._equipment,
            movement=self._movement,
            pipetting=self._pipetting,
            run_control=self._run_control,
        )

        self._action_dispatcher.dispatch(CommandUpdatedAction(command=running_command))

        try:
            log.debug(f"Executing {command_id}, {command.commandType}, {command.data}")

            result = await command_impl.execute(command.data)  # type: ignore[arg-type]
            succeeded_command = running_command.copy(
                update={
                    "status": CommandStatus.SUCCEEDED,
                    "completedAt": self._model_utils.get_timestamp(),
                    "result": result,
                }
            )

            self._action_dispatcher.dispatch(
                CommandUpdatedAction(command=succeeded_command)
            )

        except Exception as error:
            log.warn(f"Execution of {command_id} failed", exc_info=error)

            self._action_dispatcher.dispatch(
                CommandFailedAction(
                    error=error,
                    command_id=command_id,
                    error_id=self._model_utils.generate_id(),
                    completed_at=self._model_utils.get_timestamp(),
                )
            )
