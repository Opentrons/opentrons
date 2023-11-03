"""Convert between internal types for validation and HTTP-exposed response models."""

from typing import Iterable, List

from . import models
from . import validation


def map_in(request: models.DeckConfigurationRequest) -> List[validation.Placement]:
    return [
        validation.Placement(cutout_id=p.cutoutId, cutout_fixture_id=p.cutoutFixtureId)
        for p in request.cutoutFixtures
    ]


def map_out(
    validation_errors: Iterable[validation.ConfigurationError],
) -> List[models.InvalidDeckConfigurationResponse]:
    # TODO
    return [models.InvalidDeckConfigurationResponse.construct(detail="oh god")]
