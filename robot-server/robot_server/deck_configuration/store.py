# noqa: D100

import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

import anyio

from opentrons.calibration_storage import (
    deserialize_deck_configuration,
    serialize_deck_configuration,
)
from opentrons.calibration_storage import types as calibration_storage_types

from opentrons.protocol_engine.types import DeckType

from . import defaults
from . import models
from opentrons.protocol_engine.types import DeckConfigurationType


# TODO(mm, 2023-11-17): Add unit tests for DeckConfigurationStore.
class DeckConfigurationStore:  # noqa: D101
    def __init__(self, deck_type: DeckType, path: Path) -> None:
        """A persistent store of the robot's deck configuration.

        Params:
            deck_type: The type of deck that this robot has. This is used to choose the default
                deck configuration.
            path: The path of the deck configuration file. The file itself does not need to exist
                yet, but its containing directory should.
        """
        # It's important that this initializer doesn't do anything that might fail, like reading
        # files. This is a dependency of the POST /settings/reset endpoint, which should always
        # be available.

        self._deck_type = deck_type
        self._path = anyio.Path(path)

        # opentrons.calibration_storage is not generally safe for concurrent access.
        self._lock = asyncio.Lock()

    async def set(
        self, request: models.DeckConfigurationRequest, last_modified_at: datetime
    ) -> models.DeckConfigurationResponse:
        """Set the robot's current deck configuration.

        You are responsible for validating it against this robot's deck type before passing it in
        to this method.
        """
        async with self._lock:
            await _write(
                path=self._path,
                cutout_fixture_placements=[
                    calibration_storage_types.CutoutFixturePlacement(
                        cutout_fixture_id=e.cutoutFixtureId, cutout_id=e.cutoutId
                    )
                    for e in request.cutoutFixtures
                ],
                last_modified_at=last_modified_at,
            )
            return await self._get_assuming_locked()

    async def get(self) -> models.DeckConfigurationResponse:
        """Get the robot's current deck configuration."""
        async with self._lock:
            return await self._get_assuming_locked()

    async def get_deck_configuration(self) -> DeckConfigurationType:
        """Get the robot's current deck configuration in an expected typing."""
        to_convert = await self.get()
        converted = [
            (item.cutoutId, item.cutoutFixtureId) for item in to_convert.cutoutFixtures
        ]
        return converted

    async def delete(self) -> None:
        """Delete the robot's current deck configuration, resetting it to the default."""
        async with self._lock:
            await self._path.unlink(missing_ok=True)

    async def _get_assuming_locked(self) -> models.DeckConfigurationResponse:
        from_storage = await _read(self._path)
        if from_storage is None:
            # The file was missing or corrupt.
            # We handle both cases the same way: return the default deck configuration.
            # If there was a corrupt file error, we paper it over. This is intended to keep the
            # Opentrons App usable, since it can't always account for critical endpoints returning
            # 5XX errors. We think falling back to an arbitrary default is safe because users
            # of the Opentrons App will always have an opportunity to view and confirm their robot's
            # deck configuration before running a protocol.
            return models.DeckConfigurationResponse.construct(
                cutoutFixtures=defaults.for_deck_definition(
                    self._deck_type.value
                ).cutoutFixtures,
                lastModifiedAt=None,
            )
        else:
            cutout_fixtures_from_storage, last_modified_at = from_storage
            cutout_fixtures = [
                models.CutoutFixture.construct(
                    cutoutFixtureId=e.cutout_fixture_id,
                    cutoutId=e.cutout_id,
                )
                for e in cutout_fixtures_from_storage
            ]
        return models.DeckConfigurationResponse.construct(
            cutoutFixtures=cutout_fixtures,
            lastModifiedAt=last_modified_at,
        )


async def _read(
    path: anyio.Path,
) -> Optional[Tuple[List[calibration_storage_types.CutoutFixturePlacement], datetime]]:
    """Read the deck configuration from the filesystem.

    Return `None` if the file is missing or corrupt.
    """
    try:
        serialized = await path.read_bytes()
    except FileNotFoundError:
        deserialized = None
    else:
        deserialized = deserialize_deck_configuration(serialized)
    return deserialized


async def _write(
    path: anyio.Path,
    cutout_fixture_placements: List[calibration_storage_types.CutoutFixturePlacement],
    last_modified_at: datetime,
) -> None:
    await path.write_bytes(
        serialize_deck_configuration(cutout_fixture_placements, last_modified_at)
    )
