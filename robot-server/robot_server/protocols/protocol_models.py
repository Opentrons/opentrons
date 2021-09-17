"""Protocol file models."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Extra, Field
from typing import Sequence

from opentrons.protocol_runner import ProtocolFileType
from robot_server.service.json_api import ResourceModel
from .analysis_models import ProtocolAnalysis


class Metadata(BaseModel):
    """Extra, nonessential information about the protocol.

    This can include data like:

    * A human-readable title and description.
    * A last-modified date.
    * A list of authors.

    Metadata may contain fields other than those explicitly
    listed in this schema.

    The metadata *should not* include information needed
    to run the protocol correctly. For historical reasons, Python
    protocols define their `apiLevel` inside their metadata, but
    this should be considered an exception to the rule.
    """

    # todo(mm, 2021-09-17): Revise these docs after specifying
    # metadata more. github.com/Opentrons/opentrons/issues/8334

    class Config:
        """Tell Pydantic that metadata objects can have arbitrary fields."""

        extra = Extra.allow


class Protocol(ResourceModel):
    """A model representing an uploaded protocol resource."""

    id: str = Field(..., description="A unique identifier for this protocol.")

    createdAt: datetime = Field(
        ...,
        description=(
            "When this protocol was *uploaded.*"
            " (`metadata` may have information about"
            " when this protocol was *authored.*)"
        ),
    )

    protocolType: ProtocolFileType = Field(
        ...,
        description="The type of protocol file (JSON or Python).",
    )

    # todo(mm, 2021-09-16): Investigate whether something like `dict[str, Any]` would
    # be a better way (e.g. produce better OpenAPI) to represent an arbitrary JSON obj.
    metadata: Metadata

    # TODO(mc, 2021-09-01): consider reporting summary objects here, with the
    # option to `GET /protocols/:pid/analysis/:aid` if needed
    analyses: Sequence[ProtocolAnalysis] = Field(
        ...,
        description="An analysis of how the protocol is expected to run.",
    )
