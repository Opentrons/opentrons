from typing import Annotated

from fastapi import Depends

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from ..notification_client import NotificationClient, get_notification_client
from .. import topics


class DeckConfigurationPublisher:
    """Publishes deck configuration topics."""

    def __init__(self, client: NotificationClient) -> None:
        """Returns a configured Deck Configuration Publisher."""
        self._client = client

    def publish_deck_configuration(
        self,
    ) -> None:
        """Publishes the equivalent of GET /deck_configuration"""
        self._client.publish_advise_refetch(topic=topics.DECK_CONFIGURATION)


_deck_configuration_publisher_accessor: AppStateAccessor[
    DeckConfigurationPublisher
] = AppStateAccessor[DeckConfigurationPublisher]("deck_configuration_publisher")


async def get_deck_configuration_publisher(
    app_state: Annotated[AppState, Depends(get_app_state)],
    notification_client: Annotated[
        NotificationClient, Depends(get_notification_client)
    ],
) -> DeckConfigurationPublisher:
    """Get a singleton DeckConfigurationPublisher to publish deck configuration topics."""
    deck_configuration_publisher = _deck_configuration_publisher_accessor.get_from(
        app_state
    )

    if deck_configuration_publisher is None:
        deck_configuration_publisher = DeckConfigurationPublisher(
            client=notification_client
        )
        _deck_configuration_publisher_accessor.set_on(
            app_state, deck_configuration_publisher
        )

    return deck_configuration_publisher
