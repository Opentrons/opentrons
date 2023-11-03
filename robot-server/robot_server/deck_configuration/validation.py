from dataclasses import dataclass
from typing import List, Union

from opentrons_shared_data.deck import dev_types as deck_types


@dataclass
class MountedCutoutFixture:
    cutout_id: str
    cutout_fixture_id: str


@dataclass
class UnoccupiedCutoutError:
    cutout_id: str


@dataclass
class OvercrowdedCutoutError:
    cutout_id: str
    cutout_fixture_ids: List[str]


@dataclass
class InvalidLocationError:
    cutout_id: str
    cutout_fixture_id: str


@dataclass
class UnrecognizedCutoutError:
    cutout_id: str


@dataclass
class UnrecognizedCutoutFixtureError:
    cutout_fixture_id: str


ConfigurationError = Union[
    UnoccupiedCutoutError,
    OvercrowdedCutoutError,
    InvalidLocationError,
    UnrecognizedCutoutError,
    UnrecognizedCutoutFixtureError,
]


def get_configuration_errors(
    deck_definition: deck_types.DeckDefinitionV4,
    cutout_fixtures: List[MountedCutoutFixture],
) -> List[ConfigurationError]:
    return []
