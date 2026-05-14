"""Run router dependency-injection wire-up."""

import contextlib
from typing import Annotated, AsyncGenerator

from fastapi import Depends, status
from sqlalchemy.engine import Engine as SQLEngine

from opentrons.config import feature_flags
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine import DeckType
from opentrons.protocol_engine.resources.file_provider import FileProvider
from opentrons_shared_data.robot.types import RobotType
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .light_control_task import LightController, run_light_task
from .run_auto_deleter import RunAutoDeleter
from .run_data_manager import RunDataManager
from .run_orchestrator_store import NoRunCoordinator, RunOrchestratorStore
from .run_process_pyro_provider import RunProcessPyroProvider
from .run_store import RunStore
from robot_server.camera.settings.store import (
    CameraSettingStore,
    get_camera_setting_store,
)
from robot_server.data_files.dependencies import get_data_file_auto_deleter
from robot_server.data_files.file_auto_deleter import DataFileAutoDeleter
from robot_server.deletion_planner import RunDeletionPlanner
from robot_server.error_recovery.settings.store import (
    ErrorRecoverySettingStore,
    get_error_recovery_setting_store,
)
from robot_server.errors.robot_errors import (
    HardwareNotYetInitialized,
)
from robot_server.file_provider.fastapi_dependencies import get_file_provider
from robot_server.hardware import (
    get_deck_type,
    get_hardware,
    get_robot_type,
)
from robot_server.persistence.fastapi_dependencies import get_sql_engine
from robot_server.service.notifications import (
    RunsPublisher,
    get_runs_publisher,
)
from robot_server.service.pyro_utils.resource_utilities import (
    get_pyro_resource,
    register_run_orchestrator_store_to_pyro_resource,
)
from robot_server.service.task_runner import TaskRunner, get_task_runner
from robot_server.settings import get_settings

_run_store_accessor = AppStateAccessor[RunStore]("run_store")
_run_orchestrator_store_accessor = AppStateAccessor[RunOrchestratorStore](
    "run_orchestrator_store"
)
_run_data_manager_accessor = AppStateAccessor[RunDataManager]("run_data_manager")
_light_control_accessor = AppStateAccessor[LightController]("light_controller")
_run_process_pyro_provider_accessor = AppStateAccessor[RunProcessPyroProvider](
    "run_process_pyro_provider"
)


async def get_run_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, Depends(get_sql_engine)],
) -> RunStore:
    """Get a singleton RunStore to keep track of created runs."""
    run_store = _run_store_accessor.get_from(app_state)

    if run_store is None:
        run_store = RunStore(sql_engine=sql_engine)
        _run_store_accessor.set_on(app_state, run_store)

    return run_store


async def start_light_control_task(
    app_state: AppState,
    hardware_api: HardwareControlAPI,
) -> None:
    """Should be called once to start the light control task during server initialization.

    Note that this function lives in robot_server.runs instead of the robot_server.hardware
    module (where it would more logically fit) due to circular dependencies; the hardware
    module depends on multiple routers that depend on the hardware module.
    """
    light_controller = _light_control_accessor.get_from(app_state)

    if light_controller is None:
        light_controller = LightController(
            api=hardware_api, run_orchestrator_store=None
        )
        get_task_runner(app_state=app_state).run(
            run_light_task, driver=light_controller
        )
        _light_control_accessor.set_on(app_state, light_controller)

    return None


async def mark_light_control_startup_finished(
    app_state: AppState,
    hardware_api: HardwareControlAPI,
) -> None:
    """Should be called once the hardware initialization finishes.

    The task bar's animations change once the hardware is initialized, so it needs a way
    to be notified that the hardware init is complete.
    """
    light_controller = _light_control_accessor.get_from(app_state)
    if light_controller is None:
        raise HardwareNotYetInitialized().as_error(status.HTTP_503_SERVICE_UNAVAILABLE)
    light_controller.mark_initialization_done()


async def get_light_controller(
    app_state: Annotated[AppState, Depends(get_app_state)],
) -> LightController:
    """Get the light controller as a dependency.

    Raises a `HardwareNotYetInitialized` if the light controller hasn't been started yet.
    """
    controller = _light_control_accessor.get_from(app_state=app_state)
    if controller is None:
        raise HardwareNotYetInitialized().as_error(status.HTTP_503_SERVICE_UNAVAILABLE)
    return controller


@contextlib.asynccontextmanager
async def set_up_run_process_pyro_provider(
    app_state: Annotated[AppState, Depends(get_app_state)],
) -> AsyncGenerator[None, None]:
    """Set up the server's singleton `RunProcessPyroProvider`."""
    run_process_pyro_provider = RunProcessPyroProvider()
    _run_process_pyro_provider_accessor.set_on(app_state, run_process_pyro_provider)
    # TODO(2026-04-21) We might want to wrap this into a try/except if this causes local issues
    run_process_pyro_provider.initialize()

    try:
        yield
    finally:
        await run_process_pyro_provider.teardown()


async def get_run_process_pyro_provider(
    app_state: Annotated[AppState, Depends(get_app_state)],
) -> RunProcessPyroProvider:
    """Get a run process pyro provider as a dependency."""
    run_process_pyro_provider = _run_process_pyro_provider_accessor.get_from(
        app_state=app_state
    )
    assert run_process_pyro_provider is not None, (
        "Forgot to initialize run process pyro provider as part of server startup?"
    )
    return run_process_pyro_provider


async def get_run_orchestrator_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    hardware_api: Annotated[HardwareControlAPI, Depends(get_hardware)],
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
    deck_type: Annotated[DeckType, Depends(get_deck_type)],
    light_controller: Annotated[LightController, Depends(get_light_controller)],
    run_process_pyro_provider: Annotated[
        RunProcessPyroProvider, Depends(get_run_process_pyro_provider)
    ],
) -> RunOrchestratorStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    run_orchestrator_store = _run_orchestrator_store_accessor.get_from(app_state)

    if run_orchestrator_store is None:
        run_orchestrator_store = RunOrchestratorStore(
            hardware_api=hardware_api,
            robot_type=robot_type,
            deck_type=deck_type,
            run_process_pyro_provider=run_process_pyro_provider,
        )
        _run_orchestrator_store_accessor.set_on(app_state, run_orchestrator_store)
        # Handle remote hardware registry, if needed
        if feature_flags.hardware_subprocess_enabled():
            register_run_orchestrator_store_to_pyro_resource(
                app_state=app_state, run_orchestrator_store=run_orchestrator_store
            )
            pyro_resource = get_pyro_resource()
            hardware_api.register_callback(
                pyro_resource.create_run_hardware_event_callback()
            )

        # Provide the engine store to the light controller
        light_controller.update_run_orchestrator_store(
            run_orchestrator_store=run_orchestrator_store
        )

    return run_orchestrator_store


async def get_is_okay_to_create_maintenance_run(
    run_orchestrator_store: Annotated[
        RunOrchestratorStore, Depends(get_run_orchestrator_store)
    ],
) -> bool:
    """Whether a maintenance run can be created if a protocol run already exists."""
    try:
        orchestrator = run_orchestrator_store.run_coordinator
    except NoRunCoordinator:
        return True
    return not orchestrator.run_has_started() or orchestrator.get_is_run_terminal()


async def get_run_data_manager(
    app_state: Annotated[AppState, Depends(get_app_state)],
    task_runner: Annotated[TaskRunner, Depends(get_task_runner)],
    run_orchestrator_store: Annotated[
        RunOrchestratorStore, Depends(get_run_orchestrator_store)
    ],
    run_store: Annotated[RunStore, Depends(get_run_store)],
    runs_publisher: Annotated[RunsPublisher, Depends(get_runs_publisher)],
    error_recovery_setting_store: Annotated[
        ErrorRecoverySettingStore, Depends(get_error_recovery_setting_store)
    ],
    camera_setting_store: Annotated[
        CameraSettingStore, Depends(get_camera_setting_store)
    ],
    file_provider: Annotated[FileProvider, Depends(get_file_provider)],
) -> RunDataManager:
    """Get a singleton run data manager to keep track of current/historical run data."""
    run_data_manager = _run_data_manager_accessor.get_from(app_state)

    if run_data_manager is None:
        run_data_manager = RunDataManager(
            run_orchestrator_store=run_orchestrator_store,
            run_store=run_store,
            error_recovery_setting_store=error_recovery_setting_store,
            camera_setting_store=camera_setting_store,
            task_runner=task_runner,
            runs_publisher=runs_publisher,
            file_provider=file_provider,
        )
        _run_data_manager_accessor.set_on(app_state, run_data_manager)

    return run_data_manager


async def get_run_auto_deleter(
    run_store: Annotated[RunStore, Depends(get_run_store)],
    data_file_auto_deleter: Annotated[
        DataFileAutoDeleter, Depends(get_data_file_auto_deleter)
    ],
) -> RunAutoDeleter:
    """Get an `AutoDeleter` to delete old runs."""
    return RunAutoDeleter(
        run_store=run_store,
        deletion_planner=RunDeletionPlanner(maximum_runs=get_settings().maximum_runs),
        data_file_auto_deleter=data_file_auto_deleter,
    )
