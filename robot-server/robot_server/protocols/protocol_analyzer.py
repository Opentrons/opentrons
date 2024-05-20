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
        self._runner: Optional[AbstractRunner] = None

    async def load_runner(
        self,
        protocol_resource: ProtocolResource,
        run_time_param_values: Optional[RunTimeParamValuesType],
    ) -> List[RunTimeParameter]:
        """Load the runner with the protocl and run time parameters."""
        self._runner = await protocol_runner.create_simulating_runner(
            robot_type=protocol_resource.source.robot_type,
            protocol_config=protocol_resource.source.config,
        )
        if isinstance(self._runner, PythonAndLegacyRunner):
            await self._runner.load(
                protocol_source=protocol_resource.source,
                python_parse_mode=PythonParseMode.NORMAL,
                run_time_param_values=run_time_param_values,
            )
        elif isinstance(self._runner, JsonRunner):
            await self._runner.load(protocol_source=protocol_resource.source)
        return self._runner.run_time_parameters

    async def analyze(
        self,
        protocol_resource: ProtocolResource,
        analysis_id: str,
        run_time_parameters: Optional[List[RunTimeParameter]] = None,
    ) -> None:
        """Analyze a given protocol, storing the analysis when complete."""
        assert self._runner is not None
        try:
            result = await self._runner.run(
                deck_configuration=[],
            )
        except BaseException as error:
            await self.update_to_failed_analysis(
                analysis_id=analysis_id,
                protocol_robot_type=protocol_resource.source.robot_type,
                error=error,
                run_time_parameters=run_time_parameters or [],
            )
            return

        log.info(f'Completed analysis "{analysis_id}".')

        await self._analysis_store.update(
            analysis_id=analysis_id,
            robot_type=protocol_resource.source.robot_type,
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
