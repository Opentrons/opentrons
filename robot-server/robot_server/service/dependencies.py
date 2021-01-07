from functools import lru_cache

from starlette import status
from fastapi import Depends, HTTPException, Header
from opentrons.hardware_control import ThreadManager, ThreadedAsyncLock
from starlette.requests import Request
from starlette.status import HTTP_400_BAD_REQUEST

from robot_server import constants
from robot_server.hardware_wrapper import HardwareWrapper
from robot_server.service.errors import BaseRobotServerError
from robot_server.service.json_api import Error
from robot_server.service.session.manager import SessionManager
from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.legacy.rpc import RPCServer

from notify_server.clients import publisher
from notify_server.settings import Settings as NotifyServerSettings


# The single instance of the RPCServer
_rpc_server_instance = None

# The single instance of the SessionManager
_session_manager_inst = None

api_wrapper = HardwareWrapper()


@lru_cache(maxsize=1)
def get_event_publisher():
    notify_server_settings = NotifyServerSettings()
    event_publisher = publisher.create(
                notify_server_settings.publisher_address.connection_string()
            )
    return event_publisher


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
    from opentrons.api import MainRouter
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


async def check_version_header(
        request: Request,
        opentrons_version: str = Header(
            ...,
            description=f"The requested HTTP API version which must be "
                        f"'{constants.MIN_API_VERSION}' or higher. To use the "
                        f"latest version specify "
                        f"'{constants.API_VERSION_LATEST}'.")
) -> None:
    """Dependency that will check that Opentrons-Version header meets
    requirements."""
    # Get the maximum version accepted by client
    requested_version = (
        int(opentrons_version)
        if opentrons_version != constants.API_VERSION_LATEST else
        constants.API_VERSION
    )

    if requested_version < constants.MIN_API_VERSION:
        error = Error(
            id="OutdatedAPIVersion",
            title="Requested HTTP API version no longer supported",
            detail=(
                f"HTTP API version {constants.MIN_API_VERSION - 1} is "
                "no longer supported. Please upgrade your Opentrons "
                "App or other HTTP API client."
            ),
        )
        raise BaseRobotServerError(
            status_code=HTTP_400_BAD_REQUEST,
            error=error
        )
    else:
        # Attach the api version to request's state dict
        request.state.api_version = min(requested_version,
                                        constants.API_VERSION)
