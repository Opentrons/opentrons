"""Dependencies (in the FastAPI sense) that last for the lifetime of the server.

Lifetime dependencies are created when the server starts, before it responds to any
requests, and are cleaned up when the server shuts down, after it stops responding to
requests. This is unlike normal FastAPI dependencies, which are created on-demand when a
request needs them, and are cleaned up after the response is sent.

Something should be a lifetime dependency when any of the following are true:

* We want to initialize it, or start initializing it, as soon as the server starts up.
* We need to clean it up when the server shuts down. Note that because we support hot
  reloading, we do need to explicitly clean up most resources; we can't rely on things
  automatically getting cleaned up when the process ends.
* It's a prerequisite for a different dependency, and that different dependency is
  a lifetime dependency.

This module is a stopgap until FastAPI has some kind of built-in support for lifetime
dependencies. Possibly good tickets to track:

* https://github.com/tiangolo/fastapi/issues/617
* https://github.com/tiangolo/fastapi/pull/3516
"""

import contextlib
from dataclasses import dataclass
import typing

from fastapi import FastAPI

from .slow_initializing import (
    InitializationFailedError,
    SlowInitializing,
    start_initializing as start_slow_initializing,
)

from notify_server.clients.publisher import (
    create as create_notify_server_publisher,
    Publisher as NotifyServerPublisher,
)
from notify_server.settings import Settings as NotifyServerSettings
from opentrons.api import MainRouter as APIMainRouter
from opentrons.hardware_control import ThreadedAsyncLock, ThreadManager
from robot_server.hardware_initialization import initialize as initialize_hardware
from robot_server.service.legacy.rpc import RPCServer
from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.session.manager import SessionManager


_YieldT = typing.TypeVar("_YieldT")
# Helper to be used as the return type annotation of factory functions that are
# provided to contextlib.contextmanager.
_CMFactory = typing.Generator[_YieldT, None, None]
# Ditto, but for contextlib.asynccontextmanager.
_ACMFactory = typing.AsyncGenerator[_YieldT, None]


@contextlib.contextmanager
def _prepared_event_publisher() -> _CMFactory[NotifyServerPublisher]:
    """Return a context manager for a `NotifyServerPublisher`."""
    notify_server_settings = NotifyServerSettings()
    event_publisher = create_notify_server_publisher(
        notify_server_settings.publisher_address.connection_string()
    )
    try:
        yield event_publisher
    finally:
        event_publisher.close()


@contextlib.asynccontextmanager
async def _prepared_thread_manager(
    event_publisher: NotifyServerPublisher,
) -> _ACMFactory[SlowInitializing[ThreadManager]]:
    """Return a context manager for a background-initializing `ThreadManager`.

    When the context manager is entered, the `ThreadManager` will start initializing
    in the background.

    While still inside the context manager, you can use the returned `SlowInitializing`
    to check whether the `ThreadManager` is ready yet, and retrieve it if so.

    When the context manager is exited, the `ThreadManager` will be cleaned up
    appropriately, even if it hasn't finished initializing by that time.
    """

    async def factory() -> ThreadManager:
        return await initialize_hardware(event_publisher)

    slow_initializing = start_slow_initializing(factory)
    try:
        yield slow_initializing
    finally:
        try:
            fully_initialized_result = await slow_initializing.get_when_ready()
        except InitializationFailedError:
            pass
        else:
            fully_initialized_result.clean_up()


@contextlib.asynccontextmanager
async def _prepared_rpc_server(
    thread_manager: SlowInitializing[ThreadManager],
    lock: ThreadedAsyncLock,
) -> _ACMFactory[SlowInitializing[RPCServer]]:
    """Return a context manager for a background-initializing `RPCServer`.

    The background initialization works the same way as in `_prepared_thread_manager()`.
    """

    async def factory() -> RPCServer:
        root = APIMainRouter(hardware=await thread_manager.get_when_ready(), lock=lock)
        return RPCServer(loop=None, root=root)

    slow_initializing = start_slow_initializing(factory)
    try:
        yield slow_initializing
    finally:
        try:
            fully_initialized_result = await slow_initializing.get_when_ready()
        except InitializationFailedError:
            pass
        else:
            await fully_initialized_result.on_shutdown()


@contextlib.contextmanager
def _prepared_protocol_manager() -> _CMFactory[ProtocolManager]:
    """Return a context manager for a `ProtocolManager`."""
    protocol_manager = ProtocolManager()
    try:
        yield protocol_manager
    finally:
        protocol_manager.remove_all()


@contextlib.asynccontextmanager
async def _prepared_session_manager(
    thread_manager: SlowInitializing[ThreadManager],
    motion_lock: ThreadedAsyncLock,
    protocol_manager: ProtocolManager,
) -> _ACMFactory[SessionManager]:
    """Return a context manager for a `SessionManager`."""
    session_manager = SessionManager(
        await thread_manager.get_when_ready(),
        motion_lock,
        protocol_manager,
    )
    try:
        yield session_manager
    finally:
        await session_manager.remove_all()


@contextlib.asynccontextmanager
async def _prepared_everything() -> _ACMFactory["LifetimeDependencySet"]:
    """Return a context manager for a complete `LifetimeDependencySet`."""
    # We already have a bunch of context managers that each represent an individual
    # dependency. This function works by combining them, so that doing this:
    #
    #     with _prepared_everything() as everything:
    #         ...
    #
    # Is equivalent to doing this:
    #
    #     with _dep_a() as a:
    #         with _dep_b(a) as b:
    #             with _dep_c() as c:
    #                 with _dep_d(a, b, c) as d:
    #                     ...

    # For responsiveness during startup, we try not to take too long in here.
    # If a dependency would take a while to initialize, it should be a
    # SlowInitializing so it can do that in the background.
    #
    # And if another dependency depends on that one, it too should be a
    # SlowInitializing, by the transitive property of slow-ification.

    # Beware: For some reason, MyPy at least up to v0.812 does not catch errors
    # in arguments provided to the async context managers here. It thinks each
    # async context manager is typed like `def (*Any, **Any)`. Double-check
    # argument count, type, and order.

    async with contextlib.AsyncExitStack() as stack:
        motion_lock = ThreadedAsyncLock()

        event_publisher = stack.enter_context(_prepared_event_publisher())

        thread_manager = await stack.enter_async_context(
            _prepared_thread_manager(event_publisher=event_publisher)
        )

        rpc_server = await stack.enter_async_context(
            _prepared_rpc_server(thread_manager=thread_manager, lock=motion_lock)
        )

        protocol_manager = stack.enter_context(_prepared_protocol_manager())

        session_manager = await stack.enter_async_context(
            _prepared_session_manager(
                thread_manager=thread_manager,
                motion_lock=motion_lock,
                protocol_manager=protocol_manager,
            )
        )

        complete_result = LifetimeDependencySet(
            motion_lock,
            thread_manager,
            rpc_server,
            protocol_manager,
            session_manager,
        )

        yield complete_result


@dataclass(frozen=True)
class LifetimeDependencySet:
    """All lifetime dependencies that are exposed to request-handling functions."""

    motion_lock: ThreadedAsyncLock
    thread_manager: SlowInitializing[ThreadManager]
    rpc_server: SlowInitializing[RPCServer]
    protocol_manager: ProtocolManager
    session_manager: SessionManager


class NotSetError(Exception):  # noqa: D101
    def __init__(self) -> None:  # noqa: D107
        super().__init__(
            "Tried to access lifetime dependencies, but the app has none set."
            " Perhaps install_startup_shutdown_handlers()"
            " wasn't called, or the server was launched in a way that skips"
            " running startup and shutdown handlers?"
        )


def _store_on_app(app: FastAPI, dependencies: LifetimeDependencySet) -> None:
    # starlette.io/applications/#storing-state-on-the-app-instance
    app.state.app_dependencies = dependencies


def _delete_stored_on_app(app: FastAPI) -> None:
    del app.state.app_dependencies  # Previously set through _store_on_app().


def get(app: FastAPI) -> LifetimeDependencySet:
    """Return the lifetime dependencies associated with `app`."""
    state = app.state
    try:
        return state.app_dependencies  # Previously set through _store_on_app().
    except AttributeError as e:
        raise NotSetError() from e


def install_startup_shutdown_handlers(app: FastAPI) -> None:
    """Arrange for dependencies to be initialized and torn down with `app`.

    Must be called exactly once on our global FastAPI ``app`` object.
    """
    context_manager = _prepared_everything()

    # Currently (Starlette v0.13.2 and FastAPI v0.54.1), we have to split the context
    # manager into two halves. Later versions (Starlette v0.13.5?) will support using a
    # whole `lifespan` context manager as one piece.

    @app.on_event("startup")
    async def on_startup() -> None:
        lifetime_dependencies = await context_manager.__aenter__()
        _store_on_app(app, lifetime_dependencies)

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        # For safety/debuggability, forbid further access to lifetime dependencies,
        # now that we're cleaning them up.
        _delete_stored_on_app(app)

        # This shutdown handler has no way of knowing *why* we're shutting down, so the
        # best we can do is pass None as the exception information, indicating we're
        # shutting down cleanly. This should only make a difference if context_manager
        # comprised something like contextlib.suppress() to attempt to treat exceptions
        # specially.
        await context_manager.__aexit__(None, None, None)


__all__ = [
    "get",
    "install_startup_shutdown_handlers",
    "LifetimeDependencySet",
    "NotSetError",
]
