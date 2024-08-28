from dataclasses import dataclass
from typing import Callable, Optional
from fastapi import Depends

from opentrons.protocol_engine.state.state_summary import StateSummary
from opentrons.protocol_engine.types import EngineStatus
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from ..notification_client import NotificationClient, get_notification_client
from ..publisher_notifier import PublisherNotifier, get_pe_publisher_notifier
from .. import topics


@dataclass
class _RunHooks:
    """Generated during a protocol run. Utilized by MaintenanceRunsPublisher."""

    run_id: str
    get_state_summary: Callable[[str], Optional[StateSummary]]


@dataclass
class _EngineStateSlice:
    """Protocol Engine state relevant to MaintenanceRunsPublisher."""

    state_summary_status: Optional[EngineStatus] = None


class MaintenanceRunsPublisher:
    """Publishes maintenance run topics."""

    def __init__(
        self, client: NotificationClient, publisher_notifier: PublisherNotifier
    ) -> None:
        """Returns a configured Maintenance Runs Publisher."""
        self._client = client
        self._run_hooks: Optional[_RunHooks] = None
        self._engine_state_slice: Optional[_EngineStateSlice] = None

        publisher_notifier.register_publish_callbacks(
            [
                self._handle_engine_status_change,
            ]
        )

    async def start_publishing_for_maintenance_run(
        self,
        run_id: str,
        get_state_summary: Callable[[str], Optional[StateSummary]],
    ) -> None:
        """Initialize RunsPublisher with necessary information derived from the current run.

        Args:
            run_id: ID of the current run.
            get_state_summary: Callback to get the current run's state summary, if any.
        """
        self._run_hooks = _RunHooks(
            run_id=run_id,
            get_state_summary=get_state_summary,
        )
        self._engine_state_slice = _EngineStateSlice()

        await self.publish_current_maintenance_run_async()

    async def publish_current_maintenance_run_async(
        self,
    ) -> None:
        """Publishes the equivalent of GET /maintenance_run/current_run"""
        await self._client.publish_advise_refetch_async(
            topic=topics.MAINTENANCE_RUNS_CURRENT_RUN
        )

    def publish_current_maintenance_run(
        self,
    ) -> None:
        """Publishes the equivalent of GET /maintenance_run/current_run"""
        self._client.publish_advise_refetch(topic=topics.MAINTENANCE_RUNS_CURRENT_RUN)

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
                await self.publish_current_maintenance_run_async()
                self._engine_state_slice.state_summary_status = new_state_summary.status


_maintenance_runs_publisher_accessor: AppStateAccessor[
    MaintenanceRunsPublisher
] = AppStateAccessor[MaintenanceRunsPublisher]("maintenance_runs_publisher")


async def get_maintenance_runs_publisher(
    app_state: AppState = Depends(get_app_state),
    notification_client: NotificationClient = Depends(get_notification_client),
    publisher_notifier: PublisherNotifier = Depends(get_pe_publisher_notifier),
) -> MaintenanceRunsPublisher:
    """Get a singleton MaintenanceRunsPublisher to publish maintenance run topics."""
    maintenance_runs_publisher = _maintenance_runs_publisher_accessor.get_from(
        app_state
    )

    if maintenance_runs_publisher is None:
        maintenance_runs_publisher = MaintenanceRunsPublisher(
            client=notification_client, publisher_notifier=publisher_notifier
        )
        _maintenance_runs_publisher_accessor.set_on(
            app_state, maintenance_runs_publisher
        )

    return maintenance_runs_publisher
