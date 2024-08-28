from typing import Annotated

from fastapi import Depends

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from ..notification_client import NotificationClient, get_notification_client
from .. import topics


class MaintenanceRunsPublisher:
    """Publishes maintenance run topics."""

    def __init__(self, client: NotificationClient) -> None:
        """Returns a configured Maintenance Runs Publisher."""
        self._client = client

    def publish_current_maintenance_run(
        self,
    ) -> None:
        """Publishes the equivalent of GET /maintenance_run/current_run"""
        self._client.publish_advise_refetch(topic=topics.MAINTENANCE_RUNS_CURRENT_RUN)


_maintenance_runs_publisher_accessor: AppStateAccessor[
    MaintenanceRunsPublisher
] = AppStateAccessor[MaintenanceRunsPublisher]("maintenance_runs_publisher")


async def get_maintenance_runs_publisher(
    app_state: Annotated[AppState, Depends(get_app_state)],
    notification_client: Annotated[
        NotificationClient, Depends(get_notification_client)
    ],
) -> MaintenanceRunsPublisher:
    """Get a singleton MaintenanceRunsPublisher to publish maintenance run topics."""
    maintenance_runs_publisher = _maintenance_runs_publisher_accessor.get_from(
        app_state
    )

    if maintenance_runs_publisher is None:
        maintenance_runs_publisher = MaintenanceRunsPublisher(
            client=notification_client
        )
        _maintenance_runs_publisher_accessor.set_on(
            app_state, maintenance_runs_publisher
        )

    return maintenance_runs_publisher
