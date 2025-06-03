"""Helpers for commands that alter the position of labware."""

from pydantic import BaseModel, Field

from ..types import LabwareLocationSequence


class LabwareHandlingResultMixin(BaseModel):
    """A result for commands that create a labware entity."""

    labwareId: str = Field(..., description="The id of the labware.")
    locationSequence: LabwareLocationSequence | None = Field(
        None,
        description=(
            "The full location down to the deck on which this labware exists."
            " The reason this can be `null` or omitted is just backwards compatibility,"
            " for older runs and analyses. This should always be present"
            " for new runs and analyses, even for labware whose location is off-deck."
        ),
    )


class LabwarePositionResultMixin(LabwareHandlingResultMixin):
    """A result for commands that create an offsetable labware entity."""

    offsetId: str | None = Field(
        None,
        description="An ID referencing the labware offset that will apply to this labware in this location.",
    )
