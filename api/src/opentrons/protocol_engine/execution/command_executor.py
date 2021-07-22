"""Command side-effect execution logic container."""
from logging import getLogger

from ..state import StateStore, UpdateCommandAction
from ..resources import ResourceProviders
from ..commands import CommandStatus, CommandMapper
from .equipment import EquipmentHandler
from .movement import MovementHandler
from .pipetting import PipettingHandler

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
        command_mapper: CommandMapper,
        resources: ResourceProviders,
    ) -> None:
        """Initialize the CommandExecutor with access to its dependencies."""
        self._state_store = state_store
        self._equipment = equipment
        self._movement = movement
        self._pipetting = pipetting
        self._command_mapper = command_mapper
        self._resources = resources

    async def execute(self, command_id: str) -> None:
        """Run a given command's execution procedure."""
        command = self._state_store.commands.get(command_id=command_id)
        command_impl = command._ImplementationCls(
            equipment=self._equipment,
            movement=self._movement,
            pipetting=self._pipetting,
        )

        result = None
        error = None
        completed_status = CommandStatus.SUCCEEDED
        started_at = self._resources.model_utils.get_timestamp()

        running_command = self._command_mapper.update_command(
            command=command,
            status=CommandStatus.RUNNING,
            startedAt=started_at,
        )

        self._state_store.handle_action(UpdateCommandAction(command=running_command))

        try:
            log.debug(f"Executing {command.id}, {command.commandType}, {command.data}")
            result = await command_impl.execute(command.data)  # type: ignore[arg-type]
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

        completed_at = self._resources.model_utils.get_timestamp()
        completed_command = self._command_mapper.update_command(
            command=running_command,
            result=result,
            error=error,
            status=completed_status,
            completedAt=completed_at,
        )

        self._state_store.handle_action(UpdateCommandAction(command=completed_command))
