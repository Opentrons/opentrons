"""Command side-effect execution logic container."""

import asyncio
from logging import getLogger
from typing import List, Optional, Protocol

from opentrons_shared_data.data_files import MimeType
from opentrons_shared_data.errors.exceptions import (
    EnumeratedError,
    EStopActivatedError,
    PythonException,
)

from ..actions import (
    ActionDispatcher,
    FailCommandAction,
    RunCommandAction,
    SucceedCommandAction,
)
from ..commands import Command, CommandStatus
from ..errors import RunStoppedError
from ..errors.exceptions import EStopActivatedError as PE_EStopActivatedError
from ..notes import CommandNote, CommandNoteTracker
from ..resources import CameraProvider, FileProvider, ModelUtils
from ..resources.camera_provider import ImageParameters
from ..resources.file_provider import ImageCaptureCmdFileNameMetadata
from ..state.state import StateStore
from .equipment import EquipmentHandler
from .gantry_mover import GantryMover
from .labware_movement import LabwareMovementHandler
from .movement import MovementHandler
from .pipetting import PipettingHandler
from .rail_lights import RailLightsHandler
from .run_control import RunControlHandler
from .status_bar import StatusBarHandler
from .task_handler import TaskHandler
from .tip_handler import TipHandler
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.notes import make_error_recovery_debug_note

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
        file_provider: FileProvider,
        camera_provider: CameraProvider,
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
        task_handler: TaskHandler,
        model_utils: Optional[ModelUtils] = None,
        command_note_tracker_provider: Optional[CommandNoteTrackerProvider] = None,
    ) -> None:
        """Initialize the CommandExecutor with access to its dependencies."""
        self._hardware_api = hardware_api
        self._file_provider = file_provider
        self._camera_provider = camera_provider
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
        self._task_handler = task_handler

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
            file_provider=self._file_provider,
            camera_provider=self._camera_provider,
            equipment=self._equipment,
            movement=self._movement,
            gantry_mover=self._gantry_mover,
            labware_movement=self._labware_movement,
            pipetting=self._pipetting,
            tip_handler=self._tip_handler,
            run_control=self._run_control,
            rail_lights=self._rail_lights,
            model_utils=self._model_utils,
            status_bar=self._status_bar,
            command_note_adder=note_tracker,
            task_handler=self._task_handler,
        )

        started_at = self._model_utils.get_timestamp()

        self._action_dispatcher.dispatch(
            RunCommandAction(command_id=queued_command.id, started_at=started_at)
        )
        running_command = self._state_store.commands.get(queued_command.id)
        error_recovery_policy = self._state_store.commands.get_error_recovery_policy()

        log.debug(
            f"Executing {running_command.id}, {running_command.commandType}, {running_command.params}"
        )
        error_occurred = False
        try:
            result = await command_impl.execute(
                running_command.params  # type: ignore[arg-type]
            )

        except (Exception, asyncio.CancelledError) as error:
            # The command encountered an undefined error.

            log.warning(f"Execution of {running_command.id} failed", exc_info=error)
            # TODO(mc, 2022-11-14): mark command as stopped rather than failed
            # https://opentrons.atlassian.net/browse/RCORE-390
            if isinstance(error, asyncio.CancelledError):
                error = RunStoppedError("Run was cancelled")
            elif isinstance(error, EStopActivatedError):
                error = PE_EStopActivatedError(wrapping=[error])
            elif not isinstance(error, EnumeratedError):
                error = PythonException(error)

            error_recovery_type = error_recovery_policy(
                self._state_store.config,
                running_command,
                None,
            )

            note_tracker(make_error_recovery_debug_note(error_recovery_type))
            self._action_dispatcher.dispatch(
                FailCommandAction(
                    error=error,
                    command_id=running_command.id,
                    running_command=running_command,
                    error_id=self._model_utils.generate_id(),
                    failed_at=self._model_utils.get_timestamp(),
                    notes=note_tracker.get_notes(),
                    type=error_recovery_type,
                )
            )
            error_occurred = True

        else:
            if isinstance(result, SuccessData):
                update = {
                    "result": result.public,
                    "status": CommandStatus.SUCCEEDED,
                    "completedAt": self._model_utils.get_timestamp(),
                    "notes": note_tracker.get_notes(),
                }
                succeeded_command = running_command.model_copy(update=update)
                self._action_dispatcher.dispatch(
                    SucceedCommandAction(
                        command=succeeded_command,
                        state_update=result.state_update,
                    ),
                )
            else:
                # The command encountered a defined error.
                error_recovery_type = error_recovery_policy(
                    self._state_store.config,
                    running_command,
                    result,
                )
                note_tracker(make_error_recovery_debug_note(error_recovery_type))
                self._action_dispatcher.dispatch(
                    FailCommandAction(
                        error=result,
                        command_id=running_command.id,
                        running_command=running_command,
                        error_id=result.public.id,
                        failed_at=result.public.createdAt,
                        notes=note_tracker.get_notes(),
                        type=error_recovery_type,
                    )
                )
                error_occurred = True
        finally:
            # Handle error image capture if appropriate
            if error_occurred:
                await self.capture_error_image(running_command)

    def cancel_tasks(self, message: str | None = None) -> None:
        """Cancel all concurrent tasks."""
        self._task_handler.cancel_all(message=message)

    async def capture_error_image(self, running_command: Command) -> None:
        """Capture an image of an error event."""
        try:
            camera_enablement = self._state_store.camera.get_enablement_settings()
            if camera_enablement is None:
                # Utilize the global camera settings
                camera_enablement = await self._camera_provider.get_camera_settings()
            # Only capture photos of errors if the setting to do so is enabled
            if (
                camera_enablement.cameraEnabled
                and camera_enablement.errorRecoveryCameraEnabled
            ):
                # todo(chb, 2025-10-25): Eventually we will need to pass in client provided global settings here
                image_data = await self._camera_provider.capture_image(
                    self._state_store.config.robot_type, ImageParameters()
                )
                commands = self._state_store.commands.get_all()
                prev_command_id = commands[-2].id if len(commands) > 1 else ""
                if image_data:
                    write_result = await self._file_provider.write_file(
                        data=image_data,
                        mime_type=MimeType.IMAGE_JPEG,
                        command_metadata=ImageCaptureCmdFileNameMetadata(
                            command_id=running_command.id,
                            prev_command_id=prev_command_id,
                            step_number=len(commands),
                            base_filename=None,
                            command_timestamp=running_command.createdAt,
                        ),
                    )
                    log.info(
                        f"Image captured of error event with file name: {write_result.name}"
                    )
        except Exception as e:
            log.info(
                f"Failed to capture image of error with the following exception: {e}"
            )
