from fastapi import Depends
import asyncio
from typing import Union, Callable, Optional

from opentrons.protocol_engine import (
    CurrentCommand,
)

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from ..notification_client import NotificationClient, get_notification_client
from ..topics import Topics


class RunsPublisher:
    """Publishes protocol runs topics."""

    def __init__(self, client: NotificationClient) -> None:
        self._client = client
        self._run_data_manager_polling = asyncio.Event()
        self._previous_current_command: Union[CurrentCommand, None] = None

    async def begin_polling_engine_store(
        self,
        get_current_command: Callable[[str], Optional[CurrentCommand]],
        run_id: str,
    ) -> None:
        """Continuously poll the engine store for the current_command.

        Args:
            current_command: The currently executing command, if any.
        """
        asyncio.create_task(
            self._poll_engine_store(
                get_current_command=get_current_command, run_id=run_id
            )
        )

    async def stop_polling_engine_store(self):
        """Stops polling the engine store."""
        self._run_data_manager_polling.set()
        await self.publish_async(topic=Topics.RUNS_CURRENT_COMMAND.value)

    async def _poll_engine_store(
        self,
        get_current_command: Callable[[str], Optional[CurrentCommand]],
        run_id: str,
    ) -> None:
        while not self._run_data_manager_polling.is_set():
            await self._publish_current_command(
                get_current_command=get_current_command,
                run_id=run_id,
            )
            await asyncio.sleep(3)

    async def _publish_current_command(
        self,
        get_current_command: Callable[[str], Optional[CurrentCommand]],
        run_id: str,
    ) -> None:
        current_command = get_current_command(run_id)
        if (
            current_command is not None
            and self._previous_current_command != current_command
        ):
            await self.publish_async(topic=Topics.RUNS_CURRENT_COMMAND.value)
            self._previous_current_command = current_command


_runs_publisher_accessor: AppStateAccessor[RunsPublisher] = AppStateAccessor[
    RunsPublisher
]("runs_publisher")


async def get_runs_publisher(
    app_state: AppState = Depends(get_app_state),
    notification_client: NotificationClient = Depends(get_notification_client),
) -> RunsPublisher:
    """Get a singleton RunsPublisher to publish runs topics."""
    runs_publisher = _runs_publisher_accessor.get_from(app_state)

    if runs_publisher is None:
        runs_publisher = RunsPublisher(client=notification_client)
        _runs_publisher_accessor.set_on(app_state, runs_publisher)

    return runs_publisher
