"""Validate a deck configuration."""


from collections import defaultdict
from dataclasses import dataclass
from typing import DefaultDict, FrozenSet, List, Set, Tuple, Union

from opentrons_shared_data.deck import dev_types as deck_types


@dataclass(frozen=True)
class Placement:
    """A placement of a cutout fixture in a cutout."""

    cutout_id: str
    cutout_fixture_id: str


@dataclass(frozen=True)
class UnoccupiedCutoutError:
    """When a cutout has been left empty--no cutout fixtures mounted to it."""

    cutout_id: str


@dataclass(frozen=True)
class OvercrowdedCutoutError:
    """When a cutout has had more than one cutout fixture mounted to it."""

    cutout_id: str
    cutout_fixture_ids: Tuple[str, ...]
    """All the conflicting cutout fixtures, in input order."""


@dataclass(frozen=True)
class InvalidLocationError:
    """When a cutout fixture has been mounted somewhere it cannot be mounted."""

    cutout_id: str
    cutout_fixture_id: str
    allowed_cutout_ids: FrozenSet[str]


@dataclass(frozen=True)
class UnrecognizedCutoutFixtureError:
    """When an cutout fixture has been mounted that's not defined by the deck definition."""

    cutout_fixture_id: str
    allowed_cutout_fixture_ids: FrozenSet[str]


ConfigurationError = Union[
    UnoccupiedCutoutError,
    OvercrowdedCutoutError,
    InvalidLocationError,
    UnrecognizedCutoutFixtureError,
]


def get_configuration_errors(
    deck_definition: deck_types.DeckDefinitionV4,
    placements: List[Placement],
) -> Set[ConfigurationError]:
    """Return all the problems with the given deck configration.

    If there are no problems, return ``{}``.
    """
    errors: Set[ConfigurationError] = set()
    fixtures_by_cutout: DefaultDict[str, List[str]] = defaultdict(list)

    for placement in placements:
        fixtures_by_cutout[placement.cutout_id].append(placement.cutout_fixture_id)

    expected_cutouts = set(c["id"] for c in deck_definition["locations"]["cutouts"])
    occupied_cutouts = set(fixtures_by_cutout.keys())
    errors.update(
        UnoccupiedCutoutError(cutout_id)
        for cutout_id in expected_cutouts - occupied_cutouts
    )

    for cutout, fixtures in fixtures_by_cutout.items():
        if len(fixtures) > 1:
            errors.add(OvercrowdedCutoutError(cutout, tuple(fixtures)))

    for placement in placements:
        found_cutout_fixture = _find_cutout_fixture(
            deck_definition, placement.cutout_fixture_id
        )
        if isinstance(found_cutout_fixture, UnrecognizedCutoutFixtureError):
            errors.add(found_cutout_fixture)
        else:
            allowed_cutout_ids = frozenset(found_cutout_fixture["mayMountTo"])
            if placement.cutout_id not in allowed_cutout_ids:
                errors.add(
                    InvalidLocationError(
                        cutout_id=placement.cutout_id,
                        cutout_fixture_id=placement.cutout_fixture_id,
                        allowed_cutout_ids=allowed_cutout_ids,
                    )
                )

    return errors


def _find_cutout_fixture(
    deck_definition: deck_types.DeckDefinitionV4, cutout_fixture_id: str
) -> Union[deck_types.CutoutFixture, UnrecognizedCutoutFixtureError]:
    cutout_fixtures = deck_definition["cutoutFixtures"]
    try:
        return next(
            cutout_fixture
            for cutout_fixture in cutout_fixtures
            if cutout_fixture["id"] == cutout_fixture_id
        )
    except StopIteration:  # No match found.
        allowed_cutout_fixture_ids = frozenset(
            cutout_fixture["id"] for cutout_fixture in cutout_fixtures
        )
        return UnrecognizedCutoutFixtureError(
            cutout_fixture_id=cutout_fixture_id,
            allowed_cutout_fixture_ids=allowed_cutout_fixture_ids,
        )
