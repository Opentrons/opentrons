"""QueueWorker and dependency factory."""

from typing import AsyncGenerator, Callable

from ..actions import ActionDispatcher
from ..resources import CameraProvider, FileProvider
from ..state.state import StateStore
from .command_executor import CommandExecutor
from .equipment import EquipmentHandler
from .gantry_mover import create_gantry_mover
from .labware_movement import LabwareMovementHandler
from .movement import MovementHandler
from .pipetting import create_pipetting_handler
from .queue_worker import QueueWorker
from .run_control import RunControlHandler
from .status_bar import StatusBarHandler
from .task_handler import TaskHandler
from .tip_handler import create_tip_handler
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.execution.rail_lights import RailLightsHandler


def create_queue_worker(
    hardware_api: HardwareControlAPI,
    file_provider: FileProvider,
    camera_provider: CameraProvider,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    command_generator: Callable[[], AsyncGenerator[str, None]],
) -> QueueWorker:
    """Create a ready-to-use QueueWorker instance.

    Arguments:
        hardware_api: Hardware control API to pass down to dependencies.
        file_provider: Provides access to robot server file writing procedures for protocol output.
        camera_provider: Provides access to camera interface with image capture and callbacks.
        state_store: StateStore to pass down to dependencies.
        action_dispatcher: ActionDispatcher to pass down to dependencies.
        error_recovery_policy: ErrorRecoveryPolicy to pass down to dependencies.
        command_generator: Command generator to get the next command to execute.
    """
    gantry_mover = create_gantry_mover(
        hardware_api=hardware_api,
        state_view=state_store,
    )

    equipment_handler = EquipmentHandler(
        hardware_api=hardware_api,
        state_store=state_store,
    )

    movement_handler = MovementHandler(
        hardware_api=hardware_api,
        state_store=state_store,
        gantry_mover=gantry_mover,
    )

    labware_movement_handler = LabwareMovementHandler(
        hardware_api=hardware_api,
        state_store=state_store,
        equipment=equipment_handler,
        movement=movement_handler,
    )

    pipetting_handler = create_pipetting_handler(
        hardware_api=hardware_api,
        state_view=state_store,
    )

    tip_handler = create_tip_handler(
        hardware_api=hardware_api,
        state_view=state_store,
    )

    run_control_handler = RunControlHandler(
        state_store=state_store,
        action_dispatcher=action_dispatcher,
    )
    rail_lights_handler = RailLightsHandler(
        hardware_api=hardware_api,
    )
    task_handler = TaskHandler(
        state_store=state_store, action_dispatcher=action_dispatcher
    )
    status_bar_handler = StatusBarHandler(hardware_api=hardware_api)

    command_executor = CommandExecutor(
        hardware_api=hardware_api,
        file_provider=file_provider,
        camera_provider=camera_provider,
        state_store=state_store,
        action_dispatcher=action_dispatcher,
        equipment=equipment_handler,
        movement=movement_handler,
        gantry_mover=gantry_mover,
        labware_movement=labware_movement_handler,
        pipetting=pipetting_handler,
        tip_handler=tip_handler,
        run_control=run_control_handler,
        rail_lights=rail_lights_handler,
        status_bar=status_bar_handler,
        task_handler=task_handler,
    )

    return QueueWorker(
        state_store=state_store,
        command_executor=command_executor,
        command_generator=command_generator,
    )
