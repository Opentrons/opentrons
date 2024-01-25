"""HTTP-facing JSON models for deck configuration."""


from datetime import datetime
from typing import List, Optional
from typing_extensions import Literal

import pydantic

from robot_server.errors import ErrorDetails


class CutoutFixture(pydantic.BaseModel):
    """A single element of the robot's deck configuration."""

    # These are deliberately typed as plain strs, instead of Enums or Literals,
    # because we want shared-data to be the source of truth.
    #
    # The downside of this is that to use this HTTP interface, you need to be familiar with deck
    # definitions. To make this better, we could perhaps autogenerate OpenAPI / JSON Schema spec
    # fragments from shared-data and inject them here.
    cutoutFixtureId: str = pydantic.Field(
        description=(
            "What kind of cutout fixture is mounted onto the deck."
            " Valid values are the `id`s of `cutoutFixtures` in the"
            " [deck definition](https://github.com/Opentrons/opentrons/tree/edge/shared-data/deck)."
        )
    )
    cutoutId: str = pydantic.Field(
        description=(
            "Where on the deck this cutout fixture is mounted."
            " Valid values are the `id`s of `cutouts` in the"
            " [deck definition](https://github.com/Opentrons/opentrons/tree/edge/shared-data/deck)."
        )
    )


class DeckConfigurationRequest(pydantic.BaseModel):
    """A request to set the robot's deck configuration."""

    cutoutFixtures: List[CutoutFixture] = pydantic.Field(
        description="A full list of all the cutout fixtures that are mounted onto the deck."
    )


class DeckConfigurationResponse(pydantic.BaseModel):
    """A response for the robot's current deck configuration."""

    cutoutFixtures: List[CutoutFixture] = pydantic.Field(
        description="A full list of all the cutout fixtures that are mounted onto the deck."
    )
    lastModifiedAt: Optional[datetime] = pydantic.Field(
        description=(
            "When the deck configuration was last set over HTTP."
            " If that has never happened, this will be `null` or omitted."
        )
    )


class InvalidDeckConfiguration(ErrorDetails):
    """Error details for when a client supplies an invalid deck configuration."""

    id: Literal["InvalidDeckConfiguration"] = "InvalidDeckConfiguration"
    title: str = "Invalid Deck Configuration"
