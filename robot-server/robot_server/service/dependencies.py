from functools import lru_cache

from starlette import status
from fastapi import Depends, HTTPException
from opentrons.api import MainRouter
from opentrons.hardware_control import ThreadManager, ThreadedAsyncLock

from robot_server.hardware_wrapper import HardwareWrapper
from robot_server.service.session.manager import SessionManager
from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.legacy.rpc import RPCServer


# The single instance of the RPCServer
_rpc_server_instance = None

# The single instance of the SessionManager
_session_manager_inst = None

api_wrapper = HardwareWrapper()


async def verify_hardware():
    """
    A dependency that raises an http exception if hardware is not ready. Must
    only be used in PATH operation.
    """
    if not api_wrapper.get_hardware():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Robot is not ready for request")


async def get_hardware() -> ThreadManager:
    """Hardware dependency"""
    return api_wrapper.get_hardware()


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


@lru_cache(maxsize=1)
def get_protocol_manager() -> ProtocolManager:
    """The single protocol manager instance"""
    return ProtocolManager()


def get_session_manager(
        hardware: ThreadManager = Depends(get_hardware),
        motion_lock: ThreadedAsyncLock = Depends(get_motion_lock),
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)) \
        -> SessionManager:
    """The single session manager instance"""
    global _session_manager_inst
    if not _session_manager_inst:
        _session_manager_inst = SessionManager(
            hardware=hardware,
            motion_lock=motion_lock,
            protocol_manager=protocol_manager)
    return _session_manager_inst
