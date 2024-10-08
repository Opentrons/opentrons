"""Run router dependency-injection wire-up."""
from typing import Annotated

from fastapi import Depends, status
from robot_server.error_recovery.settings.store import (
    ErrorRecoverySettingStore,
    get_error_recovery_setting_store,
)
from robot_server.protocols.dependencies import get_protocol_store
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.protocol_store import ProtocolStore
from sqlalchemy.engine import Engine as SQLEngine

from opentrons_shared_data.robot.types import RobotType

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine import DeckType

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from robot_server.hardware import (
    get_hardware,
    get_deck_type,
    get_robot_type,
)
from robot_server.persistence.fastapi_dependencies import get_sql_engine
from robot_server.service.task_runner import get_task_runner, TaskRunner
from robot_server.settings import get_settings
from robot_server.deletion_planner import RunDeletionPlanner
from robot_server.service.notifications import (
    get_runs_publisher,
    RunsPublisher,
)

from .run_auto_deleter import RunAutoDeleter
from .run_orchestrator_store import RunOrchestratorStore, NoRunOrchestrator
from .run_store import RunStore
from .run_data_manager import RunDataManager
from robot_server.errors.robot_errors import (
    HardwareNotYetInitialized,
)
from .light_control_task import LightController, run_light_task

_run_store_accessor = AppStateAccessor[RunStore]("run_store")
_run_orchestrator_store_accessor = AppStateAccessor[RunOrchestratorStore](
    "run_orchestrator_store"
)
_light_control_accessor = AppStateAccessor[LightController]("light_controller")


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


async def get_run_orchestrator_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    hardware_api: Annotated[HardwareControlAPI, Depends(get_hardware)],
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
    deck_type: Annotated[DeckType, Depends(get_deck_type)],
    light_controller: Annotated[LightController, Depends(get_light_controller)],
) -> RunOrchestratorStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    run_orchestrator_store = _run_orchestrator_store_accessor.get_from(app_state)

    if run_orchestrator_store is None:
        run_orchestrator_store = RunOrchestratorStore(
            hardware_api=hardware_api, robot_type=robot_type, deck_type=deck_type
        )
        _run_orchestrator_store_accessor.set_on(app_state, run_orchestrator_store)
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
        orchestrator = run_orchestrator_store.run_orchestrator
    except NoRunOrchestrator:
        return True
    return not orchestrator.run_has_started() or orchestrator.get_is_run_terminal()


async def get_run_data_manager(
    task_runner: Annotated[TaskRunner, Depends(get_task_runner)],
    run_orchestrator_store: Annotated[
        RunOrchestratorStore, Depends(get_run_orchestrator_store)
    ],
    run_store: Annotated[RunStore, Depends(get_run_store)],
    runs_publisher: Annotated[RunsPublisher, Depends(get_runs_publisher)],
    error_recovery_setting_store: Annotated[
        ErrorRecoverySettingStore, Depends(get_error_recovery_setting_store)
    ],
) -> RunDataManager:
    """Get a run data manager to keep track of current/historical run data."""
    return RunDataManager(
        run_orchestrator_store=run_orchestrator_store,
        run_store=run_store,
        error_recovery_setting_store=error_recovery_setting_store,
        task_runner=task_runner,
        runs_publisher=runs_publisher,
    )


async def get_run_auto_deleter(
    run_store: Annotated[RunStore, Depends(get_run_store)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
) -> RunAutoDeleter:
    """Get an `AutoDeleter` to delete old runs."""
    return RunAutoDeleter(
        run_store=run_store,
        protocol_store=protocol_store,
        deletion_planner=RunDeletionPlanner(maximum_runs=get_settings().maximum_runs),
        protocol_kind=ProtocolKind.STANDARD,
    )


async def get_quick_transfer_run_auto_deleter(
    run_store: Annotated[RunStore, Depends(get_run_store)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
) -> RunAutoDeleter:
    """Get an `AutoDeleter` to delete old runs for quick transfer prorotocols."""
    return RunAutoDeleter(
        run_store=run_store,
        protocol_store=protocol_store,
        # NOTE: We dont store quick transfer runs, however we need an additional
        # run slot so we can clone an active run.
        deletion_planner=RunDeletionPlanner(maximum_runs=2),
        protocol_kind=ProtocolKind.QUICK_TRANSFER,
    )
