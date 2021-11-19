"""Command side-effect execution logic container."""
from logging import getLogger
from typing import Optional

from ..state import StateStore
from ..resources import ModelUtils
from ..commands import CommandStatus
from ..actions import ActionDispatcher, UpdateCommandAction, FailCommandAction
from ..errors import ProtocolEngineError, UnexpectedProtocolError
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
        command_impl = command._ImplementationCls(
            equipment=self._equipment,
            movement=self._movement,
            pipetting=self._pipetting,
            run_control=self._run_control,
        )

        started_at = self._model_utils.get_timestamp()
        running_command = command.copy(
            update={
                "status": CommandStatus.RUNNING,
                "startedAt": started_at,
            }
        )

        self._action_dispatcher.dispatch(UpdateCommandAction(command=running_command))

        try:
            log.debug(
                f"Executing {command.id}, {command.commandType}, {command.params}"
            )
            result = await command_impl.execute(command.params)  # type: ignore[arg-type]  # noqa: E501

        except Exception as error:
            log.warn(f"Execution of {command.id} failed", exc_info=error)

            if not isinstance(error, ProtocolEngineError):
                error = UnexpectedProtocolError(error)

            self._action_dispatcher.dispatch(
                FailCommandAction(
                    error=error,
                    command_id=command_id,
                    error_id=self._model_utils.generate_id(),
                    failed_at=self._model_utils.get_timestamp(),
                )
            )

        else:
            completed_command = running_command.copy(
                update={
                    "result": result,
                    "status": CommandStatus.SUCCEEDED,
                    "completedAt": self._model_utils.get_timestamp(),
                }
            )
            self._action_dispatcher.dispatch(
                UpdateCommandAction(command=completed_command)
            )
