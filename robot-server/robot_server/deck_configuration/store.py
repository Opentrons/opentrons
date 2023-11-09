# noqa: D100

from datetime import datetime
from typing import List, Optional

from . import models


class DeckConfigurationStore:
    """An in-memory stand-in for a persistent store of the robot's deck configuration."""

    def __init__(self) -> None:
        self._cutoutFixtures: List[models.CutoutFixture] = []
        self._last_updated_at: Optional[datetime] = None

    async def set(
        self, request: models.DeckConfigurationRequest, last_updated_at: datetime
    ) -> models.DeckConfigurationResponse:
        """Set the robot's current deck configuration."""
        self._cutoutFixtures = request.cutoutFixtures
        self._last_updated_at = last_updated_at
        return await self.get()

    async def get(self) -> models.DeckConfigurationResponse:
        """Get the robot's current deck configuration."""
        return models.DeckConfigurationResponse.construct(
            cutoutFixtures=self._cutoutFixtures, lastUpdatedAt=self._last_updated_at
        )
