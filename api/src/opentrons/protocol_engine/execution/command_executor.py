"""Command side-effect execution logic container."""
from logging import getLogger

from ..resources import ResourceProviders
from ..commands import Command, CommandStatus, CommandMapper
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
        equipment: EquipmentHandler,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        command_mapper: CommandMapper,
        resources: ResourceProviders,
    ) -> None:
        """Initialize the CommandExecutor with access to its dependencies."""
        self._equipment = equipment
        self._movement = movement
        self._pipetting = pipetting
        self._command_mapper = command_mapper
        self._resources = resources

    async def execute_by_id(self, command_id: str) -> None:
        raise NotImplementedError("execute_by_id not yet implemented")

    async def execute(self, command: Command) -> Command:
        """Run a given command's execution procedure."""
        command_impl = command._ImplementationCls(
            equipment=self._equipment,
            movement=self._movement,
            pipetting=self._pipetting,
        )

        result = None
        error = None
        status = CommandStatus.SUCCEEDED

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
            status = CommandStatus.FAILED

        completed_at = self._resources.model_utils.get_timestamp()

        return self._command_mapper.update_command(
            command=command,
            result=result,
            error=error,
            status=status,
            completedAt=completed_at,
        )
