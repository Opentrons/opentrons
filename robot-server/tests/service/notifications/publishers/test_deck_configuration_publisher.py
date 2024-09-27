"""Tests for the deck configuration publisher."""
import pytest
from decoy import Decoy

from robot_server.service.notifications import DeckConfigurationPublisher, topics
from robot_server.service.notifications.notification_client import NotificationClient


@pytest.fixture
def notification_client(decoy: Decoy) -> NotificationClient:
    """Mocked notification client."""
    return decoy.mock(cls=NotificationClient)


@pytest.fixture
def deck_configuration_publisher(
    notification_client: NotificationClient,
) -> DeckConfigurationPublisher:
    """Instantiate DeckConfigurationPublisher."""
    return DeckConfigurationPublisher(notification_client)


def test_publish_current_maintenance_run(
    notification_client: NotificationClient,
    deck_configuration_publisher: DeckConfigurationPublisher,
    decoy: Decoy,
) -> None:
    """It should publish a notify flag for deck configuration updates."""
    deck_configuration_publisher.publish_deck_configuration()
    decoy.verify(notification_client.publish_advise_refetch(topics.DECK_CONFIGURATION))
