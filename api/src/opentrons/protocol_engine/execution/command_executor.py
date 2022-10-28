"""Command side-effect execution logic container."""
from logging import getLogger
from typing import Optional

from opentrons.hardware_control import HardwareControlAPI

from ..state import StateStore
from ..resources import ModelUtils
from ..commands import CommandStatus
from ..actions import ActionDispatcher, UpdateCommandAction, FailCommandAction
from ..errors import ProtocolEngineError, UnexpectedProtocolError
from .equipment import EquipmentHandler
from .movement import MovementHandler
from .labware_movement import LabwareMovementHandler
from .pipetting import PipettingHandler
from .run_control import RunControlHandler
from .rail_lights import RailLightsHandler


log = getLogger(__name__)


class CommandExecutor:
    """CommandExecutor container class.

    CommandExecutor manages various child handlers that define procedures to
    execute the side-effects of commands.
    """

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_store: StateStore,
        action_dispatcher: ActionDispatcher,
        equipment: EquipmentHandler,
        movement: MovementHandler,
        labware_movement: LabwareMovementHandler,
        pipetting: PipettingHandler,
        run_control: RunControlHandler,
        rail_lights: RailLightsHandler,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize the CommandExecutor with access to its dependencies."""
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._action_dispatcher = action_dispatcher
        self._equipment = equipment
        self._movement = movement
        self._labware_movement = labware_movement
        self._pipetting = pipetting
        self._run_control = run_control
        self._rail_lights = rail_lights
        self._model_utils = model_utils or ModelUtils()

    async def execute(self, command_id: str) -> None:
        """Run a given command's execution procedure.

        Arguments:
            command_id: The identifier of the command to execute. The
                command itself will be looked up from state.
        """
        command = self._state_store.commands.get(command_id=command_id)
        command_impl = command._ImplementationCls(
            state_view=self._state_store,
            hardware_api=self._hardware_api,
            equipment=self._equipment,
            movement=self._movement,
            labware_movement=self._labware_movement,
            pipetting=self._pipetting,
            run_control=self._run_control,
            rail_lights=self._rail_lights,
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
            result = await command_impl.execute(command.params)  # type: ignore[arg-type]

        except Exception as error:
            log.warning(f"Execution of {command.id} failed", exc_info=error)

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
