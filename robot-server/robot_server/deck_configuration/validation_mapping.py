"""Convert between internal types for validation and HTTP-exposed response models."""

import dataclasses
from typing import Iterable, List

from . import models
from . import validation


def map_in(request: models.DeckConfigurationRequest) -> List[validation.Placement]:
    """Map a request from HTTP to internal types that can be validated."""
    return [
        validation.Placement(cutout_id=p.cutoutId, cutout_fixture_id=p.cutoutFixtureId)
        for p in request.cutoutFixtures
    ]


def map_out(
    validation_errors: Iterable[validation.ConfigurationError],
) -> List[models.InvalidDeckConfiguration]:
    """Map internal results from validation to HTTP-exposed types."""
    return [_map_out_single_error(e) for e in validation_errors]


def _map_out_single_error(
    error: validation.ConfigurationError,
) -> models.InvalidDeckConfiguration:
    # Expose the error details in a developer-facing, kind of lazy way.
    # This format isn't guaranteed by robot-server's HTTP API;
    # it's just meant to help app developers debug their deck config requests.
    meta = {
        "deckConfigurationProblem": error.__class__.__name__,
        # Note that this dataclasses.asdict() will break if the internal error
        # that we're mapping from is ever not a dataclass.
        **dataclasses.asdict(error),
    }
    return models.InvalidDeckConfiguration(
        detail="Invalid deck configuration.", meta=meta
    )
