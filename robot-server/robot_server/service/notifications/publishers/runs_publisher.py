from fastapi import Depends
import asyncio
import logging
from typing import Union, Callable, Optional

from opentrons.protocol_engine import CurrentCommand, StateSummary, EngineStatus

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from ..notification_client import NotificationClient, get_notification_client
from ..topics import Topics


log: logging.Logger = logging.getLogger(__name__)

POLL_INTERVAL = 1


class RunsPublisher:
    """Publishes protocol runs topics."""

    def __init__(self, client: NotificationClient) -> None:
        """Returns a configured Runs Publisher."""
        self._client = client
        self._run_data_manager_polling = asyncio.Event()
        self._previous_current_command: Union[CurrentCommand, None] = None
        self._previous_state_summary_status: Union[EngineStatus, None] = None
        self._poller: Optional[asyncio.Task[None]] = None

    # TODO(jh, 2023-02-02): Instead of polling, emit current_commands directly from PE.
    async def begin_polling_engine_store(
        self,
        get_current_command: Callable[[str], Optional[CurrentCommand]],
        get_state_summary: Callable[[str], Optional[StateSummary]],
        run_id: str,
    ) -> None:
        """Continuously poll the engine store for the current_command.

        Args:
            get_current_command: Callback to get the currently executing command, if any.
            get_state_summary: Callback to get the current run's state summary, if any.
            run_id: ID of the current run.
        """
        if self._poller is None:
            self._poller = asyncio.create_task(
                self._poll_engine_store(
                    get_current_command=get_current_command,
                    run_id=run_id,
                    get_state_summary=get_state_summary,
                )
            )
        else:
            await self.stop_polling_engine_store()
            self._poller = asyncio.create_task(
                self._poll_engine_store(
                    get_current_command=get_current_command,
                    run_id=run_id,
                    get_state_summary=get_state_summary,
                )
            )

    async def stop_polling_engine_store(self) -> None:
        """Stops polling the engine store. Run-related topics will publish as the poller is cancelled."""
        if self._poller is not None:
            self._run_data_manager_polling.set()
            self._poller.cancel()

    def publish_runs_advise_refetch(self, run_id: str) -> None:
        """Publishes the equivalent of GET /runs and GET /runs/:runId.

        Args:
            run_id: ID of the current run.
        """
        self._client.publish_advise_refetch(topic=Topics.RUNS)
        self._client.publish_advise_refetch(topic=f"{Topics.RUNS}/{run_id}")

    def publish_runs_advise_unsubscribe(self, run_id: str) -> None:
        """Publishes the equivalent of GET /runs and GET /runs/:runId.

        Args:
            run_id: ID of the current run.
        """
        self._client.publish_advise_unsubscribe(topic=Topics.RUNS)
        self._client.publish_advise_unsubscribe(topic=f"{Topics.RUNS}/{run_id}")

    async def _poll_engine_store(
        self,
        get_current_command: Callable[[str], Optional[CurrentCommand]],
        get_state_summary: Callable[[str], Optional[StateSummary]],
        run_id: str,
    ) -> None:
        """Asynchronously publish new current commands.

        Args:
            get_current_command: Retrieves the engine store's current command.
            get_state_summary: Retrieves the engine store's state summary.
            run_id: ID of the current run.
        """
        try:
            await self._poll_for_run_id_info(
                get_current_command=get_current_command,
                get_state_summary=get_state_summary,
                run_id=run_id,
            )
        except asyncio.CancelledError:
            self._clean_up_poller()
            await self._publish_runs_advise_unsubscribe_async(run_id=run_id)
            await self._client.publish_advise_refetch_async(
                topic=Topics.RUNS_CURRENT_COMMAND
            )
        except Exception as e:
            log.error(f"Error within run data manager poller: {e}")

    async def _poll_for_run_id_info(
        self,
        get_current_command: Callable[[str], Optional[CurrentCommand]],
        get_state_summary: Callable[[str], Optional[StateSummary]],
        run_id: str,
    ):
        """Poll the engine store for a specific run's state while the poll is active.

        Args:
            get_current_command: Retrieves the engine store's current command.
            get_state_summary: Retrieves the engine store's state summary.
            run_id: ID of the current run.
        """

        while not self._run_data_manager_polling.is_set():
            current_command = get_current_command(run_id)
            current_state_summary = get_state_summary(run_id)
            current_state_summary_status = (
                current_state_summary.status if current_state_summary else None
            )

            if self._previous_current_command != current_command:
                await self._publish_current_command()
                self._previous_current_command = current_command

            if self._previous_state_summary_status != current_state_summary_status:
                await self._publish_runs_advise_refetch_async(run_id=run_id)
                self._previous_state_summary_status = current_state_summary_status
            await asyncio.sleep(POLL_INTERVAL)

    async def _publish_current_command(
        self,
    ) -> None:
        """Publishes the equivalent of GET /runs/:runId/commands?cursor=null&pageLength=1."""
        await self._client.publish_advise_refetch_async(
            topic=Topics.RUNS_CURRENT_COMMAND
        )

    async def _publish_runs_advise_refetch_async(self, run_id: str) -> None:
        """Asynchronously publishes the equivalent of GET /runs and GET /runs/:runId via a refetch message.

        Args:
            run_id: ID of the current run.
        """
        await self._client.publish_advise_refetch_async(topic=Topics.RUNS)
        await self._client.publish_advise_refetch_async(topic=f"{Topics.RUNS}/{run_id}")

    async def _publish_runs_advise_unsubscribe_async(self, run_id: str) -> None:
        """Asynchronously publishes the equivalent of GET /runs and GET /runs/:runId via an unsubscribe message.

        Args:
            run_id: ID of the current run.
        """
        await self._client.publish_advise_unsubscribe_async(topic=Topics.RUNS)
        await self._client.publish_advise_unsubscribe_async(
            topic=f"{Topics.RUNS}/{run_id}"
        )

    def _clean_up_poller(self) -> None:
        """Cleans up the runs data manager poller."""
        self._poller = None
        self._run_data_manager_polling.clear()
        self._previous_current_command = None
        self._previous_state_summary_status = None


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
