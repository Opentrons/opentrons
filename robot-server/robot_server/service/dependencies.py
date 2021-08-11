import typing
from datetime import datetime, timezone
from typing_extensions import Literal
from uuid import uuid4

from fastapi import Depends, HTTPException, Header
from starlette import status
from starlette.datastructures import State
from starlette.requests import Request

from opentrons.hardware_control import ThreadManager, ThreadedAsyncLock

from robot_server import app
from robot_server import constants, util, errors
from robot_server.service.session.manager import SessionManager
from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.legacy.rpc import RPCServer
from robot_server.slow_initializing import InitializationOngoingError, SlowInitializing
from robot_server.lifetime_dependencies import LifetimeDependencySet


class OutdatedApiVersionResponse(errors.ErrorDetails):
    """An error returned when you request an outdated HTTP API version."""

    id: Literal["OutdatedAPIVersion"] = "OutdatedAPIVersion"
    title: str = "Requested HTTP API version no longer supported"
    detail: str = (
        f"HTTP API version {constants.MIN_API_VERSION - 1} is "
        "no longer supported. Please upgrade your Opentrons "
        "App or other HTTP API client."
    )


async def get_app_state() -> State:
    """Get the Starlette application's state from the framework.

    See https://www.starlette.io/applications/#storing-state-on-the-app-instance
    for more details.
    """

    # Ideally, we would avoid this global variable access by using FastAPI's built-in
    # `request` dependency (fastapi.tiangolo.com/advanced/using-request-directly/) and
    # returning `request.app.state`. However, this function might be a dependency of a
    # WebSocket endpoint, and current FastAPI (v0.54.1) raises internal errors when
    # WebSocket endpoints depend on `request`.
    return app.state


async def get_lifetime_dependencies(
    state: State = Depends(get_app_state)
) -> LifetimeDependencySet:
    return lifetime_dependencies.get_lifetime_dependencies(state)


async def get_hardware(state: State = Depends(get_app_state)) -> ThreadManager:
    """Hardware dependency"""
    slow_initializing_hardware: SlowInitializing[ThreadManager] = state.hardware
    try:
        return slow_initializing_hardware.get_if_ready()
    except InitializationOngoingError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Robot motor controller is not ready.",
        ) from None


async def get_motion_lock(
    app_dependencies: AppDependencySet = Depends(get_app_dependencies),
) -> ThreadedAsyncLock:
    """Get the single motion lock.

    :return: a threaded async lock
    """
    return app_dependencies.motion_lock


async def get_rpc_server(
    app_dependencies: AppDependencySet = Depends(get_app_dependencies),
) -> RPCServer:
    """The RPC Server instance"""
    # todo: Handle exception
    return app_dependencies.rpc_server.get_if_ready()


@util.call_once
async def get_protocol_manager() -> ProtocolManager:
    """The single protocol manager instance"""
    return ProtocolManager()


@util.call_once
async def get_session_manager(
    hardware: ThreadManager = Depends(get_hardware),
    motion_lock: ThreadedAsyncLock = Depends(get_motion_lock),
    protocol_manager: ProtocolManager = Depends(get_protocol_manager),
) -> SessionManager:
    """The single session manager instance"""
    return SessionManager(
        hardware=hardware, motion_lock=motion_lock, protocol_manager=protocol_manager
    )


async def check_version_header(
    request: Request,
    opentrons_version: typing.Union[int, constants.API_VERSION_LATEST_TYPE] = Header(
        ...,
        description=f"The requested HTTP API version which must be at "
        f"least '{constants.MIN_API_VERSION}' or higher. To "
        f"use the latest version specify "
        f"'{constants.API_VERSION_LATEST}'.",
    ),
) -> None:
    """Dependency that will check that Opentrons-Version header meets
    requirements."""
    # Get the maximum version accepted by client
    requested_version = (
        int(opentrons_version)
        if opentrons_version != constants.API_VERSION_LATEST
        else constants.API_VERSION
    )

    if requested_version < constants.MIN_API_VERSION:
        raise OutdatedApiVersionResponse().as_error(status.HTTP_400_BAD_REQUEST)
    else:
        # Attach the api version to request's state dict
        request.state.api_version = min(requested_version, constants.API_VERSION)


def get_unique_id() -> str:
    """Get a unique ID string to use as a resource identifier."""
    return str(uuid4())


def get_current_time() -> datetime:
    """Get the current time in UTC to use as a resource timestamp."""
    return datetime.now(tz=timezone.utc)
