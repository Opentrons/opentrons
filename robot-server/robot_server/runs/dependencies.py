"""Run router dependency-injection wire-up."""
from fastapi import Depends, status
from sqlalchemy.engine import Engine as SQLEngine

from opentrons_shared_data.robot.dev_types import RobotType

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
from robot_server.persistence import get_sql_engine
from robot_server.service.task_runner import get_task_runner, TaskRunner
from robot_server.settings import get_settings
from robot_server.deletion_planner import RunDeletionPlanner

from .run_auto_deleter import RunAutoDeleter
from .engine_store import EngineStore
from .run_store import RunStore
from .run_data_manager import RunDataManager
from robot_server.errors.robot_errors import (
    HardwareNotYetInitialized,
)
from .light_control_task import LightController, run_light_task

_run_store_accessor = AppStateAccessor[RunStore]("run_store")
_engine_store_accessor = AppStateAccessor[EngineStore]("engine_store")
_light_control_accessor = AppStateAccessor[LightController]("light_controller")


async def get_run_store(
    app_state: AppState = Depends(get_app_state),
    sql_engine: SQLEngine = Depends(get_sql_engine),
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
        light_controller = LightController(api=hardware_api, engine_store=None)
        get_task_runner(app_state=app_state).run(
            run_light_task, driver=light_controller
        )
        _light_control_accessor.set_on(app_state, light_controller)

    return None


async def get_light_controller(
    app_state: AppState = Depends(get_app_state),
) -> LightController:
    """Get the light controller as a dependency.

    Raises a `HardwareNotYetInitialized` if the light controller hasn't been started yet.
    """
    controller = _light_control_accessor.get_from(app_state=app_state)
    if controller is None:
        raise HardwareNotYetInitialized().as_error(status.HTTP_503_SERVICE_UNAVAILABLE)
    return controller


async def get_engine_store(
    app_state: AppState = Depends(get_app_state),
    hardware_api: HardwareControlAPI = Depends(get_hardware),
    robot_type: RobotType = Depends(get_robot_type),
    deck_type: DeckType = Depends(get_deck_type),
    light_controller: LightController = Depends(get_light_controller),
) -> EngineStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    engine_store = _engine_store_accessor.get_from(app_state)

    if engine_store is None:
        engine_store = EngineStore(
            hardware_api=hardware_api, robot_type=robot_type, deck_type=deck_type
        )
        _engine_store_accessor.set_on(app_state, engine_store)
        # Provide the engine store to the light controller
        light_controller.update_engine_store(engine_store=engine_store)

    return engine_store


async def get_protocol_run_has_been_played(
    engine_store: EngineStore = Depends(get_engine_store),
) -> bool:
    """Whether the current protocol run, if any, has been played."""
    try:
        protocol_run_state = engine_store.engine.state_view
    except AssertionError:
        return False
    return protocol_run_state.commands.has_been_played()


async def get_run_data_manager(
    task_runner: TaskRunner = Depends(get_task_runner),
    engine_store: EngineStore = Depends(get_engine_store),
    run_store: RunStore = Depends(get_run_store),
) -> RunDataManager:
    """Get a run data manager to keep track of current/historical run data."""
    return RunDataManager(
        task_runner=task_runner,
        engine_store=engine_store,
        run_store=run_store,
    )


async def get_run_auto_deleter(
    run_store: RunStore = Depends(get_run_store),
) -> RunAutoDeleter:
    """Get an `AutoDeleter` to delete old runs."""
    return RunAutoDeleter(
        run_store=run_store,
        deletion_planner=RunDeletionPlanner(maximum_runs=get_settings().maximum_runs),
    )
