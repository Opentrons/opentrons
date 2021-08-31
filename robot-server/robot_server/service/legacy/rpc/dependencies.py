"""RPC server dependencies for use with FastAPI's dependency injection."""
from fastapi import Depends
from typing import cast

from opentrons.api import MainRouter
from opentrons.hardware_control import (
    API as HardwareAPI,
    ThreadManager,
    ThreadedAsyncLock,
)


from robot_server.app_state import AppState, get_app_state
from robot_server.hardware import get_hardware
from robot_server.service.dependencies import get_motion_lock

from .rpc import RPCServer

_RPC_SERVER_KEY = "rpc_server"


async def get_rpc_server(
    app_state: AppState = Depends(get_app_state),
    hardware: HardwareAPI = Depends(get_hardware),
    lock: ThreadedAsyncLock = Depends(get_motion_lock),
) -> RPCServer:
    """Get the RPC server singleton.

    Must be called within FastAPI's dependency injection system via fastapi.Depends.
    """
    server = getattr(app_state, _RPC_SERVER_KEY, None)

    if server is None:
        thread_manager = cast(ThreadManager, hardware)
        root = MainRouter(thread_manager, lock=lock)
        server = RPCServer(None, root)
        setattr(app_state, _RPC_SERVER_KEY, server)

    return server


async def cleanup_rpc_server(app_state: AppState) -> None:
    """Cleanup and remove the RPC server singleton."""
    server = getattr(app_state, _RPC_SERVER_KEY, None)

    setattr(app_state, _RPC_SERVER_KEY, None)

    if server is not None:
        await server.on_shutdown()
