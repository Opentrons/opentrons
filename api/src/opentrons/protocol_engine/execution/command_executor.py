"""Command side-effect execution logic container."""
import asyncio
from logging import getLogger
from typing import Optional, List, Protocol

from opentrons.hardware_control import HardwareControlAPI

from opentrons_shared_data.errors.exceptions import (
    EStopActivatedError,
    EnumeratedError,
    PythonException,
)

from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryPolicy

from ..state import StateStore
from ..resources import ModelUtils
from ..commands import (
    CommandStatus,
    AbstractCommandImpl,
    CommandResult,
    CommandPrivateResult,
)
from ..actions import (
    ActionDispatcher,
    RunCommandAction,
    SucceedCommandAction,
    FailCommandAction,
)
from ..errors import RunStoppedError
from ..errors.exceptions import EStopActivatedError as PE_EStopActivatedError
from ..notes import CommandNote, CommandNoteTracker
from .equipment import EquipmentHandler
from .movement import MovementHandler
from .gantry_mover import GantryMover
from .labware_movement import LabwareMovementHandler
from .pipetting import PipettingHandler
from .tip_handler import TipHandler
from .run_control import RunControlHandler
from .rail_lights import RailLightsHandler
from .status_bar import StatusBarHandler


log = getLogger(__name__)


class CommandNoteTrackerProvider(Protocol):
    """The correct shape for a function that provides a CommandNoteTracker.

    This function will be called by the executor once for each call to execute().
    It is mostly useful for testing harnesses.
    """

    def __call__(self) -> CommandNoteTracker:
        """Provide a new CommandNoteTracker."""
        ...


class _NoteTracker(CommandNoteTracker):
    def __init__(self) -> None:
        self._notes: List[CommandNote] = []

    def __call__(self, note: CommandNote) -> None:
        self._notes.append(note)

    def get_notes(self) -> List[CommandNote]:
        return self._notes


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
        gantry_mover: GantryMover,
        labware_movement: LabwareMovementHandler,
        pipetting: PipettingHandler,
        tip_handler: TipHandler,
        run_control: RunControlHandler,
        rail_lights: RailLightsHandler,
        status_bar: StatusBarHandler,
        error_recovery_policy: ErrorRecoveryPolicy,
        model_utils: Optional[ModelUtils] = None,
        command_note_tracker_provider: Optional[CommandNoteTrackerProvider] = None,
    ) -> None:
        """Initialize the CommandExecutor with access to its dependencies."""
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._action_dispatcher = action_dispatcher
        self._equipment = equipment
        self._movement = movement
        self._gantry_mover = gantry_mover
        self._labware_movement = labware_movement
        self._pipetting = pipetting
        self._tip_handler = tip_handler
        self._run_control = run_control
        self._rail_lights = rail_lights
        self._model_utils = model_utils or ModelUtils()
        self._status_bar = status_bar
        self._command_note_tracker_provider = (
            command_note_tracker_provider or _NoteTracker
        )
        self._error_recovery_policy = error_recovery_policy

    async def execute(self, command_id: str) -> None:
        """Run a given command's execution procedure.

        Arguments:
            command_id: The identifier of the command to execute. The
                command itself will be looked up from state.
        """
        queued_command = self._state_store.commands.get(command_id=command_id)
        note_tracker = self._command_note_tracker_provider()
        command_impl = queued_command._ImplementationCls(
            state_view=self._state_store,
            hardware_api=self._hardware_api,
            equipment=self._equipment,
            movement=self._movement,
            gantry_mover=self._gantry_mover,
            labware_movement=self._labware_movement,
            pipetting=self._pipetting,
            tip_handler=self._tip_handler,
            run_control=self._run_control,
            rail_lights=self._rail_lights,
            status_bar=self._status_bar,
            command_note_adder=note_tracker,
        )

        started_at = self._model_utils.get_timestamp()

        self._action_dispatcher.dispatch(
            RunCommandAction(command_id=queued_command.id, started_at=started_at)
        )
        running_command = self._state_store.commands.get(queued_command.id)

        try:
            log.debug(
                f"Executing {running_command.id}, {running_command.commandType}, {running_command.params}"
            )
            if isinstance(command_impl, AbstractCommandImpl):
                result: CommandResult = await command_impl.execute(running_command.params)  # type: ignore[arg-type]
                private_result: Optional[CommandPrivateResult] = None
            else:
                result, private_result = await command_impl.execute(running_command.params)  # type: ignore[arg-type]

        except (Exception, asyncio.CancelledError) as error:
            log.warning(f"Execution of {running_command.id} failed", exc_info=error)
            # TODO(mc, 2022-11-14): mark command as stopped rather than failed
            # https://opentrons.atlassian.net/browse/RCORE-390
            if isinstance(error, asyncio.CancelledError):
                error = RunStoppedError("Run was cancelled")
            elif isinstance(error, EStopActivatedError):
                error = PE_EStopActivatedError(wrapping=[error])
            elif not isinstance(error, EnumeratedError):
                error = PythonException(error)

            self._action_dispatcher.dispatch(
                FailCommandAction(
                    error=error,
                    command_id=running_command.id,
                    running_command=running_command,
                    error_id=self._model_utils.generate_id(),
                    failed_at=self._model_utils.get_timestamp(),
                    notes=note_tracker.get_notes(),
                    # todo(mm, 2024-03-13):
                    # When a command fails recoverably, and we handle it with
                    # WAIT_FOR_RECOVERY or CONTINUE, we want to update our logical
                    # protocol state as if the command succeeded. (e.g. if a tip
                    # pickup failed, pretend that it succeeded and that the tip is now
                    # on the pipette.) However, this currently does the opposite,
                    # acting as if the command never executed.
                    type=self._error_recovery_policy(
                        running_command,
                        error,
                    ),
                )
            )
        else:
            update = {
                "result": result,
                "status": CommandStatus.SUCCEEDED,
                "completedAt": self._model_utils.get_timestamp(),
                "notes": note_tracker.get_notes(),
            }
            succeeded_command = running_command.copy(update=update)
            self._action_dispatcher.dispatch(
                SucceedCommandAction(
                    command=succeeded_command, private_result=private_result
                ),
            )
