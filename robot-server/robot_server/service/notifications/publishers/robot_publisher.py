from fastapi import Depends
from dataclasses import dataclass
from typing import Optional, Coroutine, Callable, Any

from opentrons.hardware_control import HardwareControlAPI

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from ..publisher_notifier import PublisherNotifier, get_hardware_publisher_notifier
from ..notification_client import NotificationClient, get_notification_client
from ..topics import Topics


@dataclass
class RobotHooks:
    """Utilized by RobotPublisher."""

    get_light_state: Callable[[], Coroutine[Any, Any, dict[str, bool]]]


@dataclass
class RobotState:
    """Utilized by RobotPublisher."""

    light_state: Optional[bool] = None


class RobotPublisher:
    """Publishes robot topics."""

    def __init__(
        self,
        client: NotificationClient,
        publisher_notifier: PublisherNotifier,
    ) -> None:
        """Returns a configured Maintenance Runs Publisher."""
        self._client = client
        self._publisher_notifier = publisher_notifier
        # Variables and callbacks related to hardware state changes.
        self._robot_hooks: Optional[RobotHooks] = None
        self._robot_state: Optional[RobotState] = None

        self._publisher_notifier.register_publish_callbacks(
            [self._handle_lights_change]
        )

    async def _initialize(self, hardware: HardwareControlAPI) -> None:
        """Initialize RunsPublisher with necessary information derived from the current run.

        Args:
            hardware: The singleton hardware control API.
        """
        self._robot_hooks = RobotHooks(get_light_state=hardware.get_lights)
        self._robot_state = RobotState()

        await self._handle_lights_change()

    async def _publish_lights(self) -> None:
        """Publishes the equivalent of GET /robot/lights."""
        await self._client.publish_advise_refetch_async(topic=Topics.LIGHTS)

    async def _handle_lights_change(self) -> None:
        if self._robot_hooks is not None and self._robot_state is not None:
            light_state = await self._robot_hooks.get_light_state()
            is_light_on = light_state.get("rails", False)

            if self._robot_state.light_state != is_light_on:
                self._robot_state.light_state = is_light_on
                await self._publish_lights()


_robot_publisher_accessor: AppStateAccessor[RobotPublisher] = AppStateAccessor[
    RobotPublisher
]("robot_publisher")


async def initialize_robot_publisher(
    app_state: AppState,
    hardware: HardwareControlAPI,
    notification_client: NotificationClient,
    publisher_notifier: PublisherNotifier,
) -> None:
    """Create a new `NotificationClient` and store it on `app_state` intended for protocol engine.

    Intended to be called just once, when the server starts up.
    """
    robot_publisher = RobotPublisher(
        client=notification_client, publisher_notifier=publisher_notifier
    )
    _robot_publisher_accessor.set_on(app_state, robot_publisher)

    await robot_publisher._initialize(hardware=hardware)


def get_robot_publisher(
    app_state: AppState = Depends(get_app_state),
) -> RobotPublisher:
    """Provides access to the callback used to notify publishers of changes. Intended for hardware."""
    robot_publisher = _robot_publisher_accessor.get_from(app_state)
    assert isinstance(robot_publisher, RobotPublisher)

    return robot_publisher
