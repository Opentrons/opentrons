"""Protocol analysis module."""
import logging
from typing import Optional, List

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons import protocol_runner
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.types import RunTimeParamValuesType, RunTimeParameter
import opentrons.util.helpers as datetime_helper
from opentrons.protocol_runner import AbstractRunner, PythonAndLegacyRunner, JsonRunner
from opentrons.protocols.parse import PythonParseMode

import robot_server.errors.error_mappers as em

from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.protocols.analysis_store import AnalysisStore

log = logging.getLogger(__name__)


class ProtocolAnalyzer:
    """A collaborator to perform an analysis of a protocol and store the result."""

    def __init__(
        self,
        analysis_store: AnalysisStore,
        protocol_resource: ProtocolResource,
    ) -> None:
        """Initialize the analyzer and its dependencies."""
        self._analysis_store = analysis_store
        self._protocol_resource = protocol_resource

    async def load_runner(
        self,
        run_time_param_values: Optional[RunTimeParamValuesType],
    ) -> AbstractRunner:
        """Load runner with the protocol and run time parameter values.

        Returns: The Runner instance.
        """
        runner = await protocol_runner.create_simulating_runner(
            robot_type=self._protocol_resource.source.robot_type,
            protocol_config=self._protocol_resource.source.config,
        )
        if isinstance(runner, PythonAndLegacyRunner):
            await runner.load(
                protocol_source=self._protocol_resource.source,
                python_parse_mode=PythonParseMode.NORMAL,
                run_time_param_values=run_time_param_values,
            )
        else:
            assert isinstance(runner, JsonRunner), "Unexpected runner type."
            await runner.load(protocol_source=self._protocol_resource.source)

        return runner

    async def analyze(
        self,
        runner: AbstractRunner,
        analysis_id: str,
        run_time_parameters: Optional[List[RunTimeParameter]] = None,
    ) -> None:
        """Analyze a given protocol, storing the analysis when complete."""
        assert self._protocol_resource is not None
        try:
            result = await runner.run(
                deck_configuration=[],
            )
        except BaseException as error:
            await self.update_to_failed_analysis(
                analysis_id=analysis_id,
                protocol_robot_type=self._protocol_resource.source.robot_type,
                error=error,
                run_time_parameters=run_time_parameters or [],
            )
            return

        log.info(f'Completed analysis "{analysis_id}".')

        await self._analysis_store.update(
            analysis_id=analysis_id,
            robot_type=self._protocol_resource.source.robot_type,
            run_time_parameters=result.parameters,
            commands=result.commands,
            labware=result.state_summary.labware,
            modules=result.state_summary.modules,
            pipettes=result.state_summary.pipettes,
            errors=result.state_summary.errors,
            liquids=result.state_summary.liquids,
        )

    async def update_to_failed_analysis(
        self,
        analysis_id: str,
        protocol_robot_type: RobotType,
        error: BaseException,
        run_time_parameters: List[RunTimeParameter],
    ) -> None:
        """Update analysis store with analysis failure."""
        internal_error = em.map_unexpected_error(error=error)
        await self._analysis_store.update(
            analysis_id=analysis_id,
            robot_type=protocol_robot_type,
            run_time_parameters=run_time_parameters,
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


def create_protocol_analyzer(
    analysis_store: AnalysisStore,
    protocol_resource: ProtocolResource,
) -> ProtocolAnalyzer:
    """Protocol analyzer factory function."""
    return ProtocolAnalyzer(
        analysis_store=analysis_store, protocol_resource=protocol_resource
    )
