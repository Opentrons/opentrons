"""Protocol response model factory."""
from typing import List
from .protocol_store import ProtocolResource
from .protocol_models import Protocol
from .analysis_models import ProtocolAnalysis


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
            protocolType=resource.protocol_type,
            createdAt=resource.created_at,
            analyses=analyses,
        )
