from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

import pydantic

from opentrons import config
from .types import CutoutFixturePlacement
from . import file_operators as io


_FILE_NAME = "deck_configuration.json"


class _CutoutFixturePlacementModel(pydantic.BaseModel):
    cutoutId: str
    cutoutFixtureId: str


class _DeckConfigurationModel(pydantic.BaseModel):
    """The on-filesystem representation of a deck configuration."""

    cutoutFixtures: List[_CutoutFixturePlacementModel]
    lastModified: datetime


def save_robot_deck_configuration(
    cutout_fixture_placements: List[CutoutFixturePlacement], last_modified: datetime
) -> None:
    """Replace the stored deck configuration in the filesystem."""
    data = _DeckConfigurationModel.construct(
        cutoutFixtures=[
            _CutoutFixturePlacementModel.construct(
                cutoutId=e.cutout_id, cutoutFixtureId=e.cutout_fixture_id
            )
            for e in cutout_fixture_placements
        ],
        lastModified=last_modified,
    )
    io.save_pydantic_model_to_file(_get_directory_path(), _FILE_NAME, data)


def get_robot_deck_configuration() -> (
    Optional[Tuple[List[CutoutFixturePlacement], datetime]]
):
    """Return the currently stored deck configuration and its last-modified time.

    Or `None`, if the file is missing or corrupt.
    """
    parsed = io.read_pydantic_model_from_file(_get_file_path(), _DeckConfigurationModel)
    if parsed is None:
        return None
    else:
        cutout_fixture_placements = [
            CutoutFixturePlacement(
                cutout_id=e.cutoutId, cutout_fixture_id=e.cutoutFixtureId
            )
            for e in parsed.cutoutFixtures
        ]
        return cutout_fixture_placements, parsed.lastModified


def delete_robot_deck_configuration() -> None:
    io.delete_file(_get_file_path())


def _get_directory_path() -> Path:
    return config.get_opentrons_path("robot_calibration_dir")


def _get_file_path() -> Path:
    return _get_directory_path() / _FILE_NAME
