# noqa: D100
# todo: docstring

import contextlib
from dataclasses import dataclass
import typing

from fastapi import FastAPI
from starlette.requests import Request

from . import slow_initializing

from notify_server.clients import publisher as notify_server_publisher
from notify_server.settings import Settings as NotifyServerSettings
from opentrons.hardware_control import ThreadedAsyncLock, ThreadManager
from robot_server.hardware_wrapper import HardwareWrapper
from robot_server.service.legacy.rpc import RPCServer


# todo(mm, 2021-08-04): Port get_session_manager() and get_protocol_manager()
# dependencies, and clean them up with their .remove_all() methods.
@dataclass(frozen=True)
class AppDependencySet:
    """All app dependencies that are exposed to the request layer."""

    hardware_wrapper: slow_initializing.SlowInitializing[HardwareWrapper]
    rpc_server: slow_initializing.SlowInitializing[RPCServer]
    motion_lock: ThreadedAsyncLock


class AppDependenciesNotSetError(Exception):  # noqa: D101
    def __init__(self) -> None:  # noqa: D107
        super().__init__(
            "Tried to access app dependencies, but the app has none set."
            " Perhaps app_dependencies.install_startup_shutdown_handlers()"
            " wasn't called, or the server was launched in a way that skips"
            " running startup and shutdown handlers?"
        )


def _set_app_dependencies(app: FastAPI, dependencies: AppDependencySet) -> None:
    app.state.app_dependencies = dependencies


def _get_app_dependencies(app: FastAPI) -> AppDependencySet:
    state = app.state
    try:
        return state.app_dependencies
    except AttributeError as e:
        raise AppDependenciesNotSetError() from e


def get_app_dependencies(request: Request) -> AppDependencySet:
    """Return the app's dependencies.

    This must be called as a FastAPI dependency.
    """
    return _get_app_dependencies(request.app)


@contextlib.asynccontextmanager
async def _event_publisher() -> typing.AsyncGenerator[
    notify_server_publisher.Publisher, None
]:
    """A dependency creating a single notify-server event publisher instance."""
    notify_server_settings = NotifyServerSettings()
    event_publisher = notify_server_publisher.create(
        notify_server_settings.publisher_address.connection_string()
    )
    # fixme(mm, 2021-07-29): Should close, and currently does not.
    yield event_publisher


@contextlib.asynccontextmanager
async def _hardware_wrapper(
    event_publisher: notify_server_publisher.Publisher,
) -> typing.AsyncGenerator[slow_initializing.SlowInitializing[HardwareWrapper], None]:
    async def factory() -> HardwareWrapper:
        hardware_wrapper = HardwareWrapper(event_publisher=event_publisher)
        await hardware_wrapper.initialize()
        return hardware_wrapper

    handle = slow_initializing.start_initializing(factory)
    try:
        yield handle
    finally:
        # todo(mm, 2021-08-04): Any cleanup of hardware wrapper needed here?
        # Probably yes. It has a ThreadManager, which has a thread that needs to be
        # joined.
        pass


@contextlib.asynccontextmanager
async def _rpc_server(
    hardware_wrapper: slow_initializing.SlowInitializing[HardwareWrapper],
    lock: ThreadedAsyncLock,
) -> typing.AsyncGenerator[slow_initializing.SlowInitializing[RPCServer], None]:
    async def factory() -> RPCServer:
        # todo(mm, 2021-08-04): Eliminate wrapper and this indirection.
        assert (await hardware_wrapper.get_when_ready()).get_hardware() is not None

        # todo(mm, 2021-08-04): Inherited from previous code. Why imported here?
        from opentrons.api import MainRouter

        hardware = typing.cast(
            ThreadManager, (await hardware_wrapper.get_when_ready()).get_hardware()
        )
        root = MainRouter(hardware=hardware, lock=lock)
        return RPCServer(loop=None, root=root)

    handle = slow_initializing.start_initializing(factory)
    try:
        yield handle
    finally:
        # todo(mm, 2021-08-04): Waits to clean up. Expected?
        await (await handle.get_when_ready()).on_shutdown()


@contextlib.asynccontextmanager
async def app_dependencies() -> typing.AsyncGenerator[AppDependencySet, None]:
    """Todo: docstring."""
    async with contextlib.AsyncExitStack() as stack:
        motion_lock = ThreadedAsyncLock()
        event_publisher = await stack.enter_async_context(_event_publisher())
        hardware_wrapper = await stack.enter_async_context(
            _hardware_wrapper(event_publisher)
        )
        # todo(mm, 2021-08-04): If wrong arguments are provided to the _rpc_server
        # factory, MyPy doesn't catch it. Why not?
        rpc_server = await stack.enter_async_context(
            _rpc_server(hardware_wrapper=hardware_wrapper, lock=motion_lock)
        )

        complete_result = AppDependencySet(
            hardware_wrapper=hardware_wrapper,
            rpc_server=rpc_server,
            motion_lock=motion_lock,
        )

        yield complete_result


def install_startup_shutdown_handlers(app: FastAPI) -> None:
    """Todo: docstring."""
    # - Must be called exactly once
    # - Purpose is hot reloading
    # - Temporary measure until FastAPI and Starlette support context manager startup

    context_manager = app_dependencies()

    @app.on_event("startup")
    async def on_startup() -> None:
        app.state.app_dependencies = await context_manager.__aenter__()

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        # This shutdown handler has no way of knowing *why* we're shutting down, so the
        # best we can do is pass None as the exception information. This should only
        # matter if context_manager used something like contextlib.suppress to treat
        # exceptions specially.
        await context_manager.__aexit__(None, None, None)
