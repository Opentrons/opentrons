# noqa: D100

import asyncio
from datetime import datetime
from typing import List

import anyio

from opentrons import calibration_storage
from opentrons.calibration_storage import types as calibration_storage_types

from . import models


class DeckConfigurationStore:
    """An in-memory stand-in for a persistent store of the robot's deck configuration."""

    def __init__(self) -> None:
        # opentrons.calibration_storage is not generally safe for concurrent access.
        #
        # TODO(mm, 2023-11-20): The POST /settings/reset endpoint circumvents this lock by directly
        # interacting with opentrons.calibration_storage.
        self._calibration_storage_lock = asyncio.Lock()

    async def set(
        self, request: models.DeckConfigurationRequest, last_updated_at: datetime
    ) -> models.DeckConfigurationResponse:
        """Set the robot's current deck configuration."""
        async with self._calibration_storage_lock:
            calibration_storage.save_robot_deck_configuration(
                cutout_fixture_placements=[
                    calibration_storage_types.CutoutFixturePlacement(
                        cutout_fixture_id=e.cutoutFixtureId, cutout_id=e.cutoutId
                    )
                    for e in request.cutoutFixtures
                ],
                last_updated_at=last_updated_at,
            )
            return await self._get_assuming_locked()

    async def get(self) -> models.DeckConfigurationResponse:
        """Get the robot's current deck configuration."""
        async with self._calibration_storage_lock:
            return await self._get_assuming_locked()

    async def _get_assuming_locked(self) -> models.DeckConfigurationResponse:
        from_storage = await anyio.to_thread.run_sync(
            calibration_storage.get_robot_deck_configuration
        )
        if from_storage is None:
            # TODO: Figure out where and how to populate the default deck configuration.
            cutout_fixtures: List[models.CutoutFixture] = []
            last_updated_at = None
        else:
            cutout_fixtures_from_storage, last_updated_at = from_storage
            cutout_fixtures = [
                models.CutoutFixture.construct(
                    cutoutFixtureId=e.cutout_fixture_id,
                    cutoutId=e.cutout_id,
                )
                for e in cutout_fixtures_from_storage
            ]
        return models.DeckConfigurationResponse.construct(
            cutoutFixtures=cutout_fixtures,
            lastUpdatedAt=last_updated_at,
        )
