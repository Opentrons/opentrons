"""Hardware API wrapper module for initialization and management."""
import asyncio
import logging
from pathlib import Path
from fastapi import Depends, status
from typing import Callable, Union
from typing_extensions import Literal

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons import initialize as initialize_api, should_use_ot3
from opentrons.config import IS_ROBOT, ARCHITECTURE, SystemArchitecture
from opentrons.util.helpers import utc_now
from opentrons.hardware_control import ThreadManagedHardware, HardwareControlAPI
from opentrons.hardware_control.simulator_setup import load_simulator_thread_manager
from opentrons.hardware_control.types import HardwareEvent, DoorStateNotification
from opentrons.protocols.api_support.deck_type import (
    guess_from_global_config as guess_deck_type_from_global_config,
)
from opentrons.protocol_engine import DeckType

from notify_server.clients import publisher
from notify_server.settings import Settings as NotifyServerSettings
from notify_server.models import event, topics
from notify_server.models.hardware_event import DoorStatePayload

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from .errors import ErrorDetails
from .settings import get_settings


log = logging.getLogger(__name__)

_hw_api_accessor = AppStateAccessor[ThreadManagedHardware]("hardware_api")
_init_task_accessor = AppStateAccessor["asyncio.Task[None]"]("hardware_init_task")
_event_unsubscribe_accessor = AppStateAccessor[Callable[[], None]](
    "hardware_event_unsubscribe"
)


class HardwareNotYetInitialized(ErrorDetails):
    """An error when accessing the hardware API before it's initialized."""

    id: Literal["HardwareNotYetInitialized"] = "HardwareNotYetInitialized"
    title: str = "Hardware Not Yet Initialized"
    detail: str = "The device's hardware has not finished initializing."


class HardwareFailedToInitialize(ErrorDetails):
    """An error if the hardware API fails to initialize."""

    id: Literal["HardwareFailedToInitialize"] = "HardwareFailedToInitialize"
    title: str = "Hardware Failed to Initialize"


def start_initializing_hardware(app_state: AppState) -> None:
    """Initialize the hardware API singleton, attaching it to global state.

    Returns immediately while the hardware API initializes in the background.
    """
    initialize_task = _init_task_accessor.get_from(app_state)

    if initialize_task is None:
        initialize_task = asyncio.create_task(_initialize_hardware_api(app_state))
        _init_task_accessor.set_on(app_state, initialize_task)


async def clean_up_hardware(app_state: AppState) -> None:
    """Shutdown the HardwareAPI singleton and remove it from global state."""
    initialize_task = _init_task_accessor.get_from(app_state)
    thread_manager = _hw_api_accessor.get_from(app_state)
    unsubscribe_from_events = _event_unsubscribe_accessor.get_from(app_state)

    _init_task_accessor.set_on(app_state, None)
    _hw_api_accessor.set_on(app_state, None)
    _event_unsubscribe_accessor.set_on(app_state, None)

    if initialize_task is not None:
        initialize_task.cancel()
        # Ignore exceptions, since they've already been logged.
        await asyncio.gather(initialize_task, return_exceptions=True)

    if unsubscribe_from_events is not None:
        unsubscribe_from_events()

    if thread_manager is not None:
        thread_manager.clean_up()


# TODO(mm, 2022-10-18): Deduplicate this background initialization infrastructure
# with similar code used for initializing the persistence layer.
async def get_thread_manager(
    app_state: AppState = Depends(get_app_state),
) -> ThreadManagedHardware:
    """Get the ThreadManager'd HardwareAPI as a route dependency.

    Arguments:
        app_state: Global app state from `app.state`, provided by
            FastAPI's dependency injection system via `fastapi.Depends`

    Returns:
        The initialized ThreadManager containing a HardwareAPI

    Raises:
        ApiError: The Hardware API is still initializing or failed to initialize.
    """
    initialize_task = _init_task_accessor.get_from(app_state)
    hardware_api = _hw_api_accessor.get_from(app_state)

    if initialize_task is None or hardware_api is None or not initialize_task.done():
        raise HardwareNotYetInitialized().as_error(status.HTTP_503_SERVICE_UNAVAILABLE)

    if initialize_task.cancelled():
        raise HardwareFailedToInitialize(
            detail="Hardware initialization cancelled."
        ).as_error(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if initialize_task.exception():
        exc = initialize_task.exception()
        raise HardwareFailedToInitialize(detail=str(exc)).as_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) from exc

    return hardware_api


async def get_hardware(
    thread_manager: ThreadManagedHardware = Depends(get_thread_manager),
) -> HardwareControlAPI:
    """Get the HardwareAPI as a route dependency.

    Arguments:
        thread_manager: The global thread manager singleton, provided by
            FastAPI's dependency injection system via `fastapi.Depends`

    Returns:
        The same object, but this time properly typed as a hardware controller.
        It is still a ThreadManager and provides the same guarantees that
        everything will be run in another thread, but will be checked by mypy
        as if it was the hardware controller.

    Raises:
        ApiError: The Hardware API is still initializing or failed to initialize.
    """
    return thread_manager.wrapped()


async def get_robot_type() -> RobotType:
    """Return what kind of robot this server is running on."""
    return "OT-3 Standard" if should_use_ot3() else "OT-2 Standard"


async def get_deck_type() -> DeckType:
    """Return what kind of deck the robot that this server is running on has."""
    return DeckType(guess_deck_type_from_global_config())


async def _initialize_hardware_api(app_state: AppState) -> None:
    """Initialize the HardwareAPI and attach it to global state."""
    try:
        app_settings = get_settings()
        simulator_config = app_settings.simulator_configuration_file_path
        systemd_available = IS_ROBOT and ARCHITECTURE != SystemArchitecture.HOST

        if systemd_available and not should_use_ot3():
            # During boot, opentrons-gpio-setup.service will be blinking the
            # front button light. Kill it here and wait for it to exit so it releases
            # that GPIO line. Otherwise, our hardware initialization would get a
            # "device already in use" error.
            service_to_stop = "opentrons-gpio-setup"
            command = ["systemctl", "stop", service_to_stop]
            subprocess = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await subprocess.communicate()
            if subprocess.returncode == 0:
                log.info(f"Stopped {service_to_stop}.")
            else:
                raise RuntimeError(
                    f"Error stopping {service_to_stop}.",
                    {
                        "returncode": subprocess.returncode,
                        "stdout": stdout,
                        "stderr": stderr,
                    },
                )

        if simulator_config:
            simulator_config_path = Path(simulator_config)
            log.info(f"Loading simulator from {simulator_config_path}")
            hardware_api = await load_simulator_thread_manager(
                path=simulator_config_path
            )

        else:
            hardware_api = await initialize_api()

        _initialize_event_watchers(app_state, hardware_api)
        _hw_api_accessor.set_on(app_state, hardware_api)

        if systemd_available:
            try:
                import systemd.daemon  # type: ignore

                systemd.daemon.notify("READY=1")
            except ImportError:
                pass

        log.info("Opentrons hardware API initialized")

    except Exception:
        # If something went wrong, log it here, in case the robot is powered off
        # ungracefully before our cleanup code has a chance to run and receive
        # the exception.
        #
        # todo(mm, 2021-10-22): Logging this exception should be the responsibility
        # of calling code, but currently, nothing catches exceptions raised from
        # this background initialization task. Once that's fixed, this log.error()
        # should be removed,
        log.exception("Exception during hardware background initialization.")
        raise


# TODO(mc, 2021-09-01): if we're ever going to actually use the notification
# server, this logic needs to be in its own unit and not tucked away here in
# test-less wrapper module
def _initialize_event_watchers(
    app_state: AppState,
    hardware_api: ThreadManagedHardware,
) -> None:
    """Initialize notification publishing for hardware events."""
    notify_server_settings = NotifyServerSettings()
    hw_event_publisher = publisher.create(
        notify_server_settings.publisher_address.connection_string()
    )

    def _publish_hardware_event(hw_event: Union[str, HardwareEvent]) -> None:
        if isinstance(hw_event, DoorStateNotification):
            payload = DoorStatePayload(state=hw_event.new_state)
        else:
            return

        topic = topics.RobotEventTopics.HARDWARE_EVENTS
        hw_event_publisher.send_nowait(
            topic,
            event.Event(createdOn=utc_now(), publisher=__name__, data=payload),
        )

    unsubscribe = hardware_api.register_callback(_publish_hardware_event)
    _event_unsubscribe_accessor.set_on(app_state, unsubscribe)
