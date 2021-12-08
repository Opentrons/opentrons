"""Protocol response model factory."""
from typing import List

from opentrons.protocol_runner import PreAnalysis, JsonPreAnalysis

from .analysis_models import ProtocolAnalysis
from .protocol_store import ProtocolResource
from .protocol_models import (
    Protocol,
    ProtocolType,
    ProtocolFile,
    ProtocolFileRole,
    Metadata,
)


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
        return Protocol.construct(
            id=resource.protocol_id,
            createdAt=resource.created_at,
            protocolType=_pre_analysis_to_protocol_type(resource.pre_analysis),
            metadata=Metadata.parse_obj(resource.pre_analysis.metadata),
            analyses=analyses,
            files=[
                # TODO(mc, 2021-11-12): don't report all files as main. Move
                # role determination to PreAnalyzer
                ProtocolFile.construct(name=f.name, role=ProtocolFileRole.MAIN)
                for f in resource.files
            ],
        )
