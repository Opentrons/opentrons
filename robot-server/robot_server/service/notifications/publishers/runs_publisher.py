from fastapi import Depends
from dataclasses import dataclass
from typing import Callable, Optional

from opentrons.protocol_engine import CommandPointer, StateSummary, EngineStatus

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from ..notification_client import NotificationClient, get_notification_client
from ..publisher_notifier import PublisherNotifier, get_pe_publisher_notifier
from ..topics import Topics


@dataclass
class _RunHooks:
    """Generated during a protocol run. Utilized by RunsPublisher."""

    run_id: str
    get_current_command: Callable[[str], Optional[CommandPointer]]
    get_recovery_target_command: Callable[[str], Optional[CommandPointer]]
    get_state_summary: Callable[[str], Optional[StateSummary]]


@dataclass
class _EngineStateSlice:
    """Protocol Engine state relevant to RunsPublisher."""

    current_command: Optional[CommandPointer] = None
    recovery_target_command: Optional[CommandPointer] = None
    state_summary_status: Optional[EngineStatus] = None


class RunsPublisher:
    """Publishes protocol runs topics."""

    def __init__(
        self, client: NotificationClient, publisher_notifier: PublisherNotifier
    ) -> None:
        """Returns a configured Runs Publisher."""
        self._client = client
        #  Variables and callbacks related to PE state changes.
        self._run_hooks: Optional[_RunHooks] = None
        self._engine_state_slice: Optional[_EngineStateSlice] = None

        publisher_notifier.register_publish_callbacks(
            [
                self._handle_current_command_change,
                self._handle_recovery_target_command_change,
                self._handle_engine_status_change,
            ]
        )

    async def start_publishing_for_run(
        self,
        run_id: str,
        get_current_command: Callable[[str], Optional[CommandPointer]],
        get_recovery_target_command: Callable[[str], Optional[CommandPointer]],
        get_state_summary: Callable[[str], Optional[StateSummary]],
    ) -> None:
        """Initialize RunsPublisher with necessary information derived from the current run.

        Args:
            run_id: ID of the current run.
            get_current_command: Callback to get the currently executing command, if any.
            get_state_summary: Callback to get the current run's state summary, if any.
        """
        self._run_hooks = _RunHooks(
            run_id=run_id,
            get_current_command=get_current_command,
            get_recovery_target_command=get_recovery_target_command,
            get_state_summary=get_state_summary,
        )
        self._engine_state_slice = _EngineStateSlice()

        await self._publish_runs_advise_refetch_async(run_id=run_id)

    async def clean_up_run(self, run_id: str) -> None:
        """Publish final refetch and unsubscribe flags for the given run."""
        await self._publish_runs_advise_refetch_async(run_id=run_id)
        await self._publish_runs_advise_unsubscribe_async(run_id=run_id)

    async def _publish_command_links(self) -> None:
        """Publish an update to the run's command links.

        Corresponds to the `links` field in `GET /runs/:runId/commands`
        (regardless of query parameters).
        """
        await self._client.publish_advise_refetch_async(
            topic=Topics.RUNS_COMMANDS_LINKS
        )

    async def _publish_runs_advise_refetch_async(self, run_id: str) -> None:
        """Publish a refetch flag for relevant runs topics."""
        await self._client.publish_advise_refetch_async(topic=Topics.RUNS)

        if self._run_hooks is not None:
            await self._client.publish_advise_refetch_async(
                topic=f"{Topics.RUNS}/{run_id}"
            )

    async def _publish_runs_advise_unsubscribe_async(self, run_id: str) -> None:
        """Publish an unsubscribe flag for relevant runs topics."""
        if self._run_hooks is not None:
            await self._client.publish_advise_unsubscribe_async(
                topic=f"{Topics.RUNS}/{run_id}"
            )
            await self._client.publish_advise_unsubscribe_async(
                topic=Topics.RUNS_COMMANDS_LINKS
            )
            await self._client.publish_advise_unsubscribe_async(
                topic=f"{Topics.RUNS_PRE_SERIALIZED_COMMANDS}/{run_id}"
            )

    async def publish_pre_serialized_commands_notification(self, run_id: str) -> None:
        """Publishes notification for GET /runs/:runId/commandsAsPreSerializedList."""
        if self._run_hooks is not None:
            await self._client.publish_advise_refetch_async(
                topic=f"{Topics.RUNS_PRE_SERIALIZED_COMMANDS}/{run_id}"
            )

    async def _handle_current_command_change(self) -> None:
        """Publish a refetch flag if the current command has changed."""
        if self._run_hooks is not None and self._engine_state_slice is not None:
            new_current_command = self._run_hooks.get_current_command(
                self._run_hooks.run_id
            )
            if self._engine_state_slice.current_command != new_current_command:
                await self._publish_command_links()
                self._engine_state_slice.current_command = new_current_command

    async def _handle_recovery_target_command_change(self) -> None:
        if self._run_hooks is not None and self._engine_state_slice is not None:
            new_recovery_target_command = self._run_hooks.get_recovery_target_command(
                self._run_hooks.run_id
            )
            if (
                self._engine_state_slice.recovery_target_command
                != new_recovery_target_command
            ):
                await self._publish_command_links()
                self._engine_state_slice.recovery_target_command = (
                    new_recovery_target_command
                )

    async def _handle_engine_status_change(self) -> None:
        """Publish a refetch flag if the engine status has changed."""
        if self._run_hooks is not None and self._engine_state_slice is not None:
            new_state_summary = self._run_hooks.get_state_summary(
                self._run_hooks.run_id
            )

            if (
                new_state_summary is not None
                and self._engine_state_slice.state_summary_status
                != new_state_summary.status
            ):
                await self._publish_runs_advise_refetch_async(
                    run_id=self._run_hooks.run_id
                )
                self._engine_state_slice.state_summary_status = new_state_summary.status


_runs_publisher_accessor: AppStateAccessor[RunsPublisher] = AppStateAccessor[
    RunsPublisher
]("runs_publisher")


async def get_runs_publisher(
    app_state: AppState = Depends(get_app_state),
    notification_client: NotificationClient = Depends(get_notification_client),
    publisher_notifier: PublisherNotifier = Depends(get_pe_publisher_notifier),
) -> RunsPublisher:
    """Get a singleton RunsPublisher to publish runs topics."""
    runs_publisher = _runs_publisher_accessor.get_from(app_state)

    if runs_publisher is None:
        runs_publisher = RunsPublisher(
            client=notification_client, publisher_notifier=publisher_notifier
        )
        _runs_publisher_accessor.set_on(app_state, runs_publisher)

    return runs_publisher
