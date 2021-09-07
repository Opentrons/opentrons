"""Protocol file models."""
from __future__ import annotations
from datetime import datetime
from pydantic import Field
from typing import Sequence

from opentrons.protocol_runner import ProtocolFileType
from robot_server.service.json_api import ResourceModel
from .analysis_models import ProtocolAnalysis


class Protocol(ResourceModel):
    """A model representing an uploaded protocol resource."""

    id: str = Field(..., description="A unique identifier for this protocol.")
    createdAt: datetime = Field(..., description="When this protocol was uploaded.")
    protocolType: ProtocolFileType = Field(
        ...,
        description="The type of protocol file (JSON or Python).",
    )
    # TODO(mc, 2021-09-01): consider reporting summary objects here, with the
    # option to `GET /protocols/:pid/analysis/:aid` if needed
    analyses: Sequence[ProtocolAnalysis] = Field(
        ...,
        description="An analysis of how the protocol is expected to run.",
    )
