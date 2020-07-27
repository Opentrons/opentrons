from functools import lru_cache

from fastapi import Depends
from opentrons.api import MainRouter
from opentrons.hardware_control import ThreadManager, ThreadedAsyncLock

from robot_server.service.session.manager import SessionManager
from robot_server.service.legacy.rpc import RPCServer
from . import HARDWARE_APP_KEY


# The single instance of the RPCServer
from .protocol.manager import ProtocolManager

_rpc_server_instance = None

# The single instance of the SessionManager
_session_manager_inst = None


async def get_hardware() -> ThreadManager:
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


def get_session_manager(hardware: ThreadManager = Depends(get_hardware)) \
        -> SessionManager:
    """The single session manager instance"""
    global _session_manager_inst
    if not _session_manager_inst:
        _session_manager_inst = SessionManager(hardware=hardware)
    return _session_manager_inst


@lru_cache(maxsize=1)
def get_protocol_manager() -> ProtocolManager:
    """The single protocol manager instance"""
    return ProtocolManager()
