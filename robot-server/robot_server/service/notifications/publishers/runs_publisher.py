import asyncio
from fastapi import Depends
from dataclasses import dataclass
from typing import Callable, Optional

from opentrons.protocol_engine import CurrentCommand, StateSummary, EngineStatus

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from ..notification_client import NotificationClient, get_notification_client
from ..publisher_notifier import PublisherNotifier, get_publisher_notifier
from ..topics import Topics


@dataclass
class RunHooks:
    """Generated during a protocol run. Utilized by RunsPublisher."""

    run_id: str
    get_current_command: Callable[[str], Optional[CurrentCommand]]
    get_state_summary: Callable[[str], Optional[StateSummary]]


@dataclass
class EngineStateSlice:
    """Protocol Engine state relevant to RunsPublisher."""

    current_command: Optional[CurrentCommand] = None
    state_summary_status: Optional[EngineStatus] = None


class RunsPublisher:
    """Publishes protocol runs topics."""

    def __init__(
        self, client: NotificationClient, publisher_notifier: PublisherNotifier
    ) -> None:
        """Returns a configured Runs Publisher."""
        self._client = client
        self._publisher_notifier = publisher_notifier
        self._run_data_manager_polling = asyncio.Event()
        self._poller: Optional[asyncio.Task[None]] = None
        #  Variables and callbacks related to PE state changes.
        self._run_hooks: Optional[RunHooks] = None
        self._engine_state_slice: Optional[EngineStateSlice] = None

        self._publisher_notifier.register_publish_callbacks(
            [self._handle_current_command_change, self._handle_engine_status_change]
        )

    async def initialize(
        self,
        run_id: str,
        get_current_command: Callable[[str], Optional[CurrentCommand]],
        get_state_summary: Callable[[str], Optional[StateSummary]],
    ) -> None:
        """Initialize RunsPublisher with necessary information derived from the current run.

        Args:
            run_id: ID of the current run.
            get_current_command: Callback to get the currently executing command, if any.
            get_state_summary: Callback to get the current run's state summary, if any.
        """
        self._run_hooks = RunHooks(
            run_id=run_id,
            get_current_command=get_current_command,
            get_state_summary=get_state_summary,
        )
        self._engine_state_slice = EngineStateSlice()

        await self._publish_runs_advise_refetch_async()

    async def clean_up_current_run(self) -> None:
        """Publish final refetch and unsubscribe flags."""
        await self._publish_runs_advise_refetch_async()
        await self._publish_runs_advise_unsubscribe_async()

    async def _publish_current_command(self) -> None:
        """Publishes the equivalent of GET /runs/:runId/commands?cursor=null&pageLength=1."""
        await self._client.publish_advise_refetch_async(
            topic=Topics.RUNS_CURRENT_COMMAND
        )

    async def _publish_runs_advise_refetch_async(self) -> None:
        """Publish a refetch flag for relevant runs topics."""
        if self._run_hooks is not None:
            await self._client.publish_advise_refetch_async(topic=Topics.RUNS)
            await self._client.publish_advise_refetch_async(
                topic=f"{Topics.RUNS}/{self._run_hooks.run_id}"
            )

    async def _publish_runs_advise_unsubscribe_async(self) -> None:
        """Publish an unsubscribe flag for relevant runs topics."""
        if self._run_hooks is not None:
            await self._client.publish_advise_unsubscribe_async(
                topic=f"{Topics.RUNS}/{self._run_hooks.run_id}"
            )

    async def _handle_current_command_change(self) -> None:
        """Publish a refetch flag if the current command has changed."""
        if self._run_hooks is not None and self._engine_state_slice is not None:
            current_command = self._run_hooks.get_current_command(
                self._run_hooks.run_id
            )
            if self._engine_state_slice.current_command != current_command:
                await self._publish_current_command()
                self._engine_state_slice.current_command = current_command

    async def _handle_engine_status_change(self) -> None:
        """Publish a refetch flag if the engine status has changed."""
        if self._run_hooks is not None and self._engine_state_slice is not None:
            current_state_summary = self._run_hooks.get_state_summary(
                self._run_hooks.run_id
            )

            if (
                current_state_summary is not None
                and self._engine_state_slice.state_summary_status
                != current_state_summary.status
            ):
                await self._publish_runs_advise_refetch_async()
                self._engine_state_slice.state_summary_status = (
                    current_state_summary.status
                )


_runs_publisher_accessor: AppStateAccessor[RunsPublisher] = AppStateAccessor[
    RunsPublisher
]("runs_publisher")


async def get_runs_publisher(
    app_state: AppState = Depends(get_app_state),
    notification_client: NotificationClient = Depends(get_notification_client),
    publisher_notifier: PublisherNotifier = Depends(get_publisher_notifier),
) -> RunsPublisher:
    """Get a singleton RunsPublisher to publish runs topics."""
    runs_publisher = _runs_publisher_accessor.get_from(app_state)

    if runs_publisher is None:
        runs_publisher = RunsPublisher(
            client=notification_client, publisher_notifier=publisher_notifier
        )
        _runs_publisher_accessor.set_on(app_state, runs_publisher)

    return runs_publisher
