# noqa: D100

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

from opentrons.protocol_engine.types import DeckType

from . import defaults
from . import models
from opentrons.protocol_engine.types import DeckConfigurationType


# TODO(mm, 2023-11-17): Add unit tests for DeckConfigurationStore.
class DeckConfigurationStore:
    """An in-memory stand-in for a persistent store of the robot's deck configuration."""

    def __init__(self, deck_type: DeckType) -> None:
        self._deck_type = deck_type
        self._last_update: Optional[_LastUpdate] = None

    async def set(
        self, request: models.DeckConfigurationRequest, last_modified_at: datetime
    ) -> models.DeckConfigurationResponse:
        """Set the robot's current deck configuration."""
        self._last_update = _LastUpdate(
            cutout_fixtures=request.cutoutFixtures, timestamp=last_modified_at
        )
        return await self.get()

    async def get(self) -> models.DeckConfigurationResponse:
        """Get the robot's current deck configuration."""
        if self._last_update is None:
            return models.DeckConfigurationResponse.construct(
                cutoutFixtures=defaults.for_deck_definition(
                    self._deck_type.value
                ).cutoutFixtures,
                lastModifiedAt=None,
            )
        else:
            return models.DeckConfigurationResponse.construct(
                cutoutFixtures=self._last_update.cutout_fixtures,
                lastModifiedAt=self._last_update.timestamp,
            )

    async def get_deck_configuration(self) -> DeckConfigurationType:
        """Get the robot's current deck configuration in an expected typing."""
        to_convert = await self.get()
        converted = [
            (item.cutoutId, item.cutoutFixtureId) for item in to_convert.cutoutFixtures
        ]
        return converted


@dataclass
class _LastUpdate:
    cutout_fixtures: List[models.CutoutFixture]
    timestamp: datetime
