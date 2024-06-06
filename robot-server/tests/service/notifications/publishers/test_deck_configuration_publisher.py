"""Tests for the deck configuration publisher."""
import pytest
from unittest.mock import AsyncMock

from robot_server.service.notifications import DeckConfigurationPublisher, Topics


@pytest.fixture
def notification_client() -> AsyncMock:
    """Mocked notification client."""
    return AsyncMock()


@pytest.fixture
def deck_configuration_publisher(
    notification_client: AsyncMock,
) -> DeckConfigurationPublisher:
    """Instantiate DeckConfigurationPublisher."""
    return DeckConfigurationPublisher(notification_client)


@pytest.mark.asyncio
async def test_publish_current_maintenance_run(
    notification_client: AsyncMock,
    deck_configuration_publisher: DeckConfigurationPublisher,
) -> None:
    """It should publish a notify flag for deck configuration updates."""
    await deck_configuration_publisher.publish_deck_configuration()
    notification_client.publish_advise_refetch_async.assert_awaited_once_with(
        topic=Topics.DECK_CONFIGURATION
    )
