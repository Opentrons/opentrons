"""Protocol analysis module."""
import logging

from opentrons import protocol_runner
from opentrons.protocol_engine.errors import ErrorOccurrence
import opentrons.util.helpers as datetime_helper

import robot_server.errors.error_mappers as em

from .protocol_store import ProtocolResource
from .analysis_store import AnalysisStore

log = logging.getLogger(__name__)


class ProtocolAnalyzer:
    """A collaborator to perform an analysis of a protocol and store the result."""

    def __init__(
        self,
        analysis_store: AnalysisStore,
    ) -> None:
        """Initialize the analyzer and its dependencies."""
        self._analysis_store = analysis_store

    async def analyze(
        self,
        protocol_resource: ProtocolResource,
        analysis_id: str,
    ) -> None:
        """Analyze a given protocol, storing the analysis when complete."""
        runner = await protocol_runner.create_simulating_runner(
            robot_type=protocol_resource.source.robot_type,
            protocol_config=protocol_resource.source.config,
        )
        try:
            result = await runner.run(
                protocol_source=protocol_resource.source, deck_configuration=[]
            )
        except BaseException as error:
            internal_error = em.map_unexpected_error(error=error)
            await self._analysis_store.update(
                analysis_id=analysis_id,
                robot_type=protocol_resource.source.robot_type,
                commands=[],
                labware=[],
                modules=[],
                pipettes=[],
                errors=[
                    ErrorOccurrence.from_failed(
                        # TODO(tz, 2-15-24): replace with a different error type
                        #  when we are able to support different errors.
                        id="internal-error",
                        createdAt=datetime_helper.utc_now(),
                        error=internal_error,
                    )
                ],
                liquids=[],
            )
            return

        log.info(f'Completed analysis "{analysis_id}".')

        await self._analysis_store.update(
            analysis_id=analysis_id,
            robot_type=protocol_resource.source.robot_type,
            commands=result.commands,
            labware=result.state_summary.labware,
            modules=result.state_summary.modules,
            pipettes=result.state_summary.pipettes,
            errors=result.state_summary.errors,
            liquids=result.state_summary.liquids,
        )
