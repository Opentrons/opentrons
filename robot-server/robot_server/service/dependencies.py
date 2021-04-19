import typing

from starlette import status
from fastapi import Depends, HTTPException, Header
from starlette.requests import Request
from opentrons.hardware_control import ThreadManager, ThreadedAsyncLock

from robot_server import constants, util
from robot_server.hardware_wrapper import HardwareWrapper
from robot_server.service.errors import BaseRobotServerError
from robot_server.service.json_api import Error
from robot_server.service.session.manager import SessionManager
from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.legacy.rpc import RPCServer

from notify_server.clients import publisher
from notify_server.settings import Settings as NotifyServerSettings


@util.call_once
async def get_event_publisher() -> publisher.Publisher:
    """A dependency creating a single notify-server event
    publisher instance."""
    notify_server_settings = NotifyServerSettings()
    event_publisher = publisher.create(
        notify_server_settings.publisher_address.connection_string()
    )
    return event_publisher


@util.call_once
async def get_hardware_wrapper(
        event_publisher: publisher.Publisher = Depends(get_event_publisher)) \
        -> HardwareWrapper:
    """Get the single HardwareWrapper instance."""
    return HardwareWrapper(event_publisher=event_publisher)


async def verify_hardware(
        api_wrapper: HardwareWrapper = Depends(get_hardware_wrapper)) -> None:
    """
    A dependency that raises an http exception if hardware is not ready. Must
    only be used in PATH operation.
    """
    if not api_wrapper.get_hardware():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Robot is not ready for request")


async def get_hardware(
        api_wrapper: HardwareWrapper = Depends(get_hardware_wrapper)) \
        -> ThreadManager:
    """Hardware dependency"""
    return api_wrapper.get_hardware()


@util.call_once
async def get_motion_lock() -> ThreadedAsyncLock:
    """
    Get the single motion lock.

    :return: a threaded async lock
    """
    return ThreadedAsyncLock()


@util.call_once
async def get_rpc_server(
        hardware: ThreadManager = Depends(get_hardware),
        lock: ThreadedAsyncLock = Depends(get_motion_lock)
) -> RPCServer:
    """The RPC Server instance"""
    from opentrons.api import MainRouter
    root = MainRouter(hardware, lock=lock)
    return RPCServer(None, root)


@util.call_once
async def get_protocol_manager() -> ProtocolManager:
    """The single protocol manager instance"""
    return ProtocolManager()


@util.call_once
async def get_session_manager(
        hardware: ThreadManager = Depends(get_hardware),
        motion_lock: ThreadedAsyncLock = Depends(get_motion_lock),
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)) \
        -> SessionManager:
    """The single session manager instance"""
    return SessionManager(
        hardware=hardware,
        motion_lock=motion_lock,
        protocol_manager=protocol_manager)


async def check_version_header(
        request: Request,
        opentrons_version: typing.Union[
            int, constants.API_VERSION_LATEST_TYPE
        ] = Header(
            ...,
            description=f"The requested HTTP API version which must be at "
                        f"least '{constants.MIN_API_VERSION}' or higher. To "
                        f"use the latest version specify "
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
            status_code=status.HTTP_400_BAD_REQUEST,
            error=error
        )
    else:
        # Attach the api version to request's state dict
        request.state.api_version = min(requested_version,
                                        constants.API_VERSION)
