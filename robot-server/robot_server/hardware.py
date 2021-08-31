"""Hardware API initialization and management."""
import asyncio
import logging
from pathlib import Path
from fastapi import Depends, status
from typing import cast
from typing_extensions import Literal

from opentrons import ThreadManager, initialize as initialize_api
from opentrons.config import feature_flags
from opentrons.util.helpers import utc_now
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.simulator_setup import load_simulator
from opentrons.hardware_control.types import HardwareEvent, HardwareEventType

from notify_server.clients import publisher
from notify_server.settings import Settings as NotifyServerSettings
from notify_server.models import event, topics
from notify_server.models.hardware_event import DoorStatePayload

from .app_state import AppState, get_app_state
from .errors import ErrorDetails
from .settings import get_settings

_HARDWARE_API_KEY = "hardware_api"
_HARDWARE_API_INIT_TASK_KEY = "hardware_api_init_task"
_HARDWARE_EVENT_UNSUBSCRIBE_KEY = "hardware_event_unsubscribe"

log = logging.getLogger(__name__)


class HardwareNotYetInitialized(ErrorDetails):
    """An error when accessing the HardwareAPI before it's initialized."""

    id: Literal["HardwareNotYetInitialized"] = "HardwareNotYetInitialized"
    title: str = "Hardware Not Yet Initialized"
    detail: str = "The device's hardware has not finished initializing."


class HardwareFailedToInitialize(ErrorDetails):
    """An error if the HardwareAPI fails to initialize."""

    id: Literal["HardwareFailedToInitialize"] = "HardwareFailedToInitialize"
    title: str = "Hardware Failed to Initialize"


def initialize_hardware(app_state: AppState) -> None:
    """Initialize the HardwareAPI singleton, attaching it to global state."""
    initialize_task = getattr(app_state, _HARDWARE_API_INIT_TASK_KEY, None)

    if initialize_task is None:
        initialize_task = asyncio.create_task(_initialize_hardware_api(app_state))
        setattr(app_state, _HARDWARE_API_INIT_TASK_KEY, initialize_task)


async def cleanup_hardware(app_state: AppState) -> None:
    """Shutdown the HardwareAPI singleton and remove it from global state."""
    initialize_task = getattr(app_state, _HARDWARE_API_INIT_TASK_KEY, None)
    hardware_api = getattr(app_state, _HARDWARE_API_KEY, None)
    unsubscribe_from_events = getattr(app_state, _HARDWARE_EVENT_UNSUBSCRIBE_KEY, None)

    setattr(app_state, _HARDWARE_API_INIT_TASK_KEY, None)
    setattr(app_state, _HARDWARE_API_KEY, None)
    setattr(app_state, _HARDWARE_EVENT_UNSUBSCRIBE_KEY, None)

    if initialize_task is not None:
        initialize_task.cancel()
        await asyncio.gather(initialize_task, return_exceptions=True)

    if unsubscribe_from_events is not None:
        unsubscribe_from_events()

    if hardware_api is not None:
        hardware_api.clean_up()


async def get_hardware(app_state: AppState = Depends(get_app_state)) -> HardwareAPI:
    """Get the HardwareAPI as a route dependency.

    Arguments:
        app_state: Global app state from `app.state`. If unspecified, FastAPI's
            dependency injection system will attempt to provide it.

    Returns:
        The initialized HardwareAPI.

    Raises:
        ApiError: The Hardware API is still initializing or failed to initialize.
    """
    initialize_task = getattr(app_state, _HARDWARE_API_INIT_TASK_KEY, None)
    hardware_api = getattr(app_state, _HARDWARE_API_KEY, None)

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


async def _initialize_hardware_api(app_state: AppState) -> None:
    """Initialize the HardwareAPI and attach it to global state."""
    app_settings = get_settings()
    use_thread_manager = feature_flags.enable_protocol_engine() is False

    if app_settings.simulator_configuration_file_path:
        simulator_config_path = Path(app_settings.simulator_configuration_file_path)
        log.info(f"Loading simulator from {simulator_config_path}")

        if use_thread_manager:
            thread_manager = ThreadManager(load_simulator, simulator_config_path)
            hardware_api = cast(HardwareAPI, thread_manager)
        else:
            hardware_api = await load_simulator(path=simulator_config_path)

    else:
        hardware_api = await initialize_api()

    _initialize_event_watchers(app_state, hardware_api)
    setattr(app_state, _HARDWARE_API_KEY, hardware_api)
    log.info("Opentrons hardware API initialized")


def _initialize_event_watchers(app_state: AppState, hardware_api: HardwareAPI) -> None:
    notify_server_settings = NotifyServerSettings()
    hw_event_publisher = publisher.create(
        notify_server_settings.publisher_address.connection_string()
    )

    def _publish_hardware_event(hw_event: HardwareEvent) -> None:
        if hw_event.event == HardwareEventType.DOOR_SWITCH_CHANGE:
            payload = DoorStatePayload(state=hw_event.new_state)
        else:
            return

        topic = topics.RobotEventTopics.HARDWARE_EVENTS
        hw_event_publisher.send_nowait(
            topic,
            event.Event(createdOn=utc_now(), publisher=__name__, data=payload),
        )

    unsubscribe = hardware_api.register_callback(_publish_hardware_event)
    setattr(app_state, _HARDWARE_EVENT_UNSUBSCRIBE_KEY, unsubscribe)
