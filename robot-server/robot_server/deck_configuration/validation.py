from collections import defaultdict
from dataclasses import dataclass
from typing import DefaultDict, List, Set, Tuple, Union

from opentrons_shared_data.deck import dev_types as deck_types


@dataclass(frozen=True)
class MountedCutoutFixture:
    cutout_id: str
    cutout_fixture_id: str


@dataclass(frozen=True)
class UnoccupiedCutoutError:
    cutout_id: str


@dataclass(frozen=True)
class OvercrowdedCutoutError:
    cutout_id: str
    cutout_fixture_ids: Tuple[str, ...]
    """All the conflicting cutout fixtures, in input order."""


@dataclass(frozen=True)
class InvalidLocationError:
    cutout_id: str
    cutout_fixture_id: str


@dataclass(frozen=True)
class UnrecognizedCutoutError:
    cutout_id: str


@dataclass(frozen=True)
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
) -> Set[ConfigurationError]:
    errors: Set[ConfigurationError] = set()
    fixtures_by_cutout: DefaultDict[str, List[str]] = defaultdict(list)

    for cutout_fixture in cutout_fixtures:
        fixtures_by_cutout[cutout_fixture.cutout_id].append(
            cutout_fixture.cutout_fixture_id
        )

    expected_cutouts = set(c["id"] for c in deck_definition["locations"]["cutouts"])
    occupied_cutouts = set(fixtures_by_cutout.keys())
    errors.update(
        UnoccupiedCutoutError(cutout_id)
        for cutout_id in expected_cutouts - occupied_cutouts
    )

    for cutout, fixtures in fixtures_by_cutout.items():
        if len(fixtures) > 1:
            errors.add(OvercrowdedCutoutError(cutout, tuple(fixtures)))

    return errors
