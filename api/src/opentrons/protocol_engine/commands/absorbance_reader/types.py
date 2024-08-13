"""Move Lid Result model."""

from typing import Optional
from pydantic import BaseModel, Field
from opentrons.protocol_engine.types import LabwareLocation


class MoveLidResult(BaseModel):
    """Input parameters to open the lid on an absorbance reading."""

    lidId: str = Field(..., description="Unique ID of the absorbance reader lid.")
    newLocation: LabwareLocation = Field(..., description="New location of the lid")
    offsetId: Optional[str] = Field(
        # Default `None` instead of `...` so this field shows up as non-required in
        # OpenAPI. The server is allowed to omit it or make it null.
        None,
        description=(
            "An ID referencing the labware offset that will apply to this labware"
            " now that it's in the new location."
            " This offset will be in effect until the labware is moved"
            " with another `moveLabware` command."
            " Null or undefined means no offset applies,"
            " so the default of (0, 0, 0) will be used."
        ),
    )
