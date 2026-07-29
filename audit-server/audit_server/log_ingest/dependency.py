from asyncio import Lock
from pathlib import Path
from typing import Annotated, Final

from anyio import Path as AsyncPath
from fastapi import Depends

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from audit_server.persistence.fastapi_dependencies import get_persistence_directory_root

_robot_logs_directory_init_lock = Lock()
_robot_logs_directory_accessor = AppStateAccessor[Path]("robot_logs_directory")

ROBOT_LOGS_DIRECTORY: Final = "robot_logs"


async def get_robot_logs_directory(
    app_state: Annotated[AppState, Depends(get_app_state)],
    persistence_directory_root: Annotated[
        Path, Depends(get_persistence_directory_root)
    ],
) -> Path:
    """Get the directory to save the robot logs files, creating it if needed."""
    async with _robot_logs_directory_init_lock:
        robot_logs_dir = _robot_logs_directory_accessor.get_from(app_state)
        if robot_logs_dir is None:
            robot_logs_dir = persistence_directory_root / ROBOT_LOGS_DIRECTORY
            await AsyncPath(robot_logs_dir).mkdir(exist_ok=True)
            _robot_logs_directory_accessor.set_on(app_state, robot_logs_dir)

        return robot_logs_dir
