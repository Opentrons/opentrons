from functools import lru_cache

from opentrons.api import MainRouter
from opentrons.hardware_control import HardwareAPILike, ThreadedAsyncLock
from .rpc.rpc import RPCServer
from . import HARDWARE_APP_KEY


# The single instance of the RPCServer
_rpc_server_instance = None


async def get_hardware() -> HardwareAPILike:
    """Hardware dependency"""
    from .app import app
    # todo Amit 2/11/2020. This function should create and return a singleton
    #  hardware interface.
    return app.extra[HARDWARE_APP_KEY]  # type: ignore


@lru_cache(maxsize=1)
def get_motion_lock() -> ThreadedAsyncLock:
    """
    Get the single motion lock.

    :return: a threaded async lock
    """
    return ThreadedAsyncLock()


async def get_rpc_server() -> RPCServer:
    """The RPC Server instance"""
    global _rpc_server_instance
    if not _rpc_server_instance:
        h = await get_hardware()
        root = MainRouter(h, lock=get_motion_lock())
        _rpc_server_instance = RPCServer(None, root)
    return _rpc_server_instance
