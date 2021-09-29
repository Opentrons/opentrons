"""Protocol response model factory."""
from typing import List

from opentrons.protocol_runner import PreAnalysis, JsonPreAnalysis

from .protocol_store import ProtocolResource
from .protocol_models import Protocol, ProtocolType, Metadata
from .analysis_models import ProtocolAnalysis


def _pre_analysis_to_protocol_type(pre_analysis: PreAnalysis) -> ProtocolType:
    if isinstance(pre_analysis, JsonPreAnalysis):
        return ProtocolType.JSON
    else:
        return ProtocolType.PYTHON


class ResponseBuilder:
    """Interface to construct protocol resource models from data."""

    @staticmethod
    def build(
        resource: ProtocolResource,
        analyses: List[ProtocolAnalysis],
    ) -> Protocol:
        """Build a protocol resource model.

        Arguments:
            resource: Protocol data from the ProtocolStore.
            analysis: Analysis from the AnalysisStore.

        Returns:
            Protocol model representing the resource.
        """
        return Protocol(
            id=resource.protocol_id,
            createdAt=resource.created_at,
            protocolType=_pre_analysis_to_protocol_type(resource.pre_analysis),
            metadata=Metadata.parse_obj(resource.pre_analysis.metadata),
            analyses=analyses,
        )
