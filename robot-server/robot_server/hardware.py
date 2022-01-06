"""Hardware API wrapper module for initialization and management."""
import asyncio
import logging
from pathlib import Path
from fastapi import Depends, status
from typing import Callable, Union
from typing_extensions import Literal

from opentrons import initialize as initialize_api, should_use_ot3
from opentrons.config import IS_ROBOT, ARCHITECTURE, SystemArchitecture
from opentrons.util.helpers import utc_now
from opentrons.hardware_control import BaseHardwareControl
from opentrons.hardware_control.simulator_setup import load_simulator
from opentrons.hardware_control.types import HardwareEvent, DoorStateNotification

from notify_server.clients import publisher
from notify_server.settings import Settings as NotifyServerSettings
from notify_server.models import event, topics
from notify_server.models.hardware_event import DoorStatePayload

from .app_state import AppState, AppStateValue, get_app_state
from .errors import ErrorDetails
from .settings import get_settings


log = logging.getLogger(__name__)

_hw_api = AppStateValue[BaseHardwareControl]("hardware_api")
_init_task = AppStateValue["asyncio.Task[None]"]("hardware_init_task")
_event_unsubscribe = AppStateValue[Callable[[], None]]("hardware_event_unsubscribe")


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
    initialize_task = _init_task.get_from(app_state)

    if initialize_task is None:
        initialize_task = asyncio.create_task(_initialize_hardware_api(app_state))
        _init_task.set_on(app_state, initialize_task)


async def cleanup_hardware(app_state: AppState) -> None:
    """Shutdown the HardwareAPI singleton and remove it from global state."""
    initialize_task = _init_task.get_from(app_state)
    hardware_api = _hw_api.get_from(app_state)
    unsubscribe_from_events = _event_unsubscribe.get_from(app_state)

    _init_task.set_on(app_state, None)
    _hw_api.set_on(app_state, None)
    _event_unsubscribe.set_on(app_state, None)

    if initialize_task is not None:
        initialize_task.cancel()
        await asyncio.gather(initialize_task, return_exceptions=True)

    if unsubscribe_from_events is not None:
        unsubscribe_from_events()

    if hardware_api is not None:
        hardware_api.clean_up()


async def get_hardware(
    app_state: AppState = Depends(get_app_state),
) -> BaseHardwareControl:
    """Get the HardwareAPI as a route dependency.

    Arguments:
        app_state: Global app state from `app.state`, provided by
            FastAPI's dependency injection system via `fastapi.Depends`

    Returns:
        The initialized HardwareAPI.

    Raises:
        ApiError: The Hardware API is still initializing or failed to initialize.
    """
    initialize_task = _init_task.get_from(app_state)
    hardware_api = _hw_api.get_from(app_state)

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
            hardware_api = await load_simulator(path=simulator_config_path)

        else:
            hardware_api = await initialize_api()

        _initialize_event_watchers(app_state, hardware_api)
        _hw_api.set_on(app_state, hardware_api)

        if systemd_available:
            try:
                import systemd.daemon  # type: ignore

                systemd.daemon.notify("READY=1")
            except ImportError:
                pass

        log.info("Opentrons hardware API initialized")

    except Exception:
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
    app_state: AppState, hardware_api: BaseHardwareControl
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
    _event_unsubscribe.set_on(app_state, unsubscribe)
