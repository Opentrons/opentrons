"""Protocol analysis module."""

import logging
from typing import List, Optional, Union

import opentrons.protocol_runner.create_simulating_orchestrator as simulating_runner
import opentrons.util.helpers as datetime_helper
from opentrons.config import feature_flags
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.types import (
    CSVRuntimeParamPaths,
    PrimitiveRunTimeParamValuesType,
    RunTimeParameter,
)
from opentrons.protocol_runner import (
    RunOrchestrator,
)
from opentrons.protocol_runner.run_coordinator import ParseMode
from opentrons.util.performance_helpers import TrackingFunctions
from opentrons_shared_data.robot.types import RobotType

import robot_server.errors.error_mappers as em
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.runs.run_process import DirectedRunProcess
from robot_server.runs.run_process_pyro_provider import RunProcessPyroProvider

log = logging.getLogger(__name__)


class ProtocolAnalyzer:
    """A collaborator to perform an analysis of a protocol and store the result."""

    def __init__(
        self,
        analysis_store: AnalysisStore,
        protocol_resource: ProtocolResource,
        run_process_pyro_provider: RunProcessPyroProvider,
    ) -> None:
        """Initialize the analyzer and its dependencies."""
        self._analysis_store = analysis_store
        self._protocol_resource = protocol_resource
        self._coordinator: Optional[Union[RunOrchestrator, DirectedRunProcess]] = None
        self._run_process_pyro_provider = run_process_pyro_provider

    @property
    def protocol_resource(self) -> ProtocolResource:
        """Return the protocol resource."""
        return self._protocol_resource

    async def get_verified_run_time_parameters(self) -> List[RunTimeParameter]:
        """Get the validated RTPs with values set by the client."""
        assert self._coordinator is not None
        return await self._coordinator.get_run_time_parameters()

    async def load_orchestrator(
        self,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType],
        run_time_param_paths: Optional[CSVRuntimeParamPaths],
    ) -> None:
        """Load runner with the protocol and run time parameter values.

        Returns: The RunOrchestrator instance.
        """
        if feature_flags.protocol_subprocess_enabled():
            run_coordinator = await self._run_process_pyro_provider.wait_for_run_proxy(
                simulator=True
            )
            await run_coordinator.create_simulating(self._protocol_resource)
            self._coordinator = run_coordinator
        else:
            self._coordinator = await simulating_runner.create_simulating_orchestrator(
                robot_type=self._protocol_resource.source.robot_type,
                protocol_config=self._protocol_resource.source.config,
            )
        await self._coordinator.load(
            protocol_source=self._protocol_resource.source,
            parse_mode=ParseMode.NORMAL,
            run_time_param_values=run_time_param_values,
            run_time_param_paths=run_time_param_paths,
        )

    @TrackingFunctions.track_analysis
    async def analyze(
        self,
        analysis_id: str,
    ) -> None:
        """Analyze a given protocol, storing the analysis when complete.

        This method should only be called once the run orchestrator is loaded.
        """
        assert self._protocol_resource is not None
        assert self._coordinator is not None
        try:
            try:
                result = await self._coordinator.run(
                    deck_configuration=[],
                )
            except BaseException as error:
                await self.update_to_failed_analysis(
                    analysis_id=analysis_id,
                    protocol_robot_type=self._protocol_resource.source.robot_type,
                    error=error,
                    run_time_parameters=await self._coordinator.get_run_time_parameters(),
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
                liquidClasses=result.state_summary.liquidClasses,
                command_annotations=result.command_annotations,
                command_preconditions=result.command_preconditions,
                labware_offsets=result.state_summary.labwareOffsets,
            )
        finally:
            await self.clean_up()

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
            liquidClasses=[],
            command_annotations=[],
            labware_offsets=[],
        )

    async def clean_up(self) -> None:
        """Stop the simulating run orchestrator.

        Once the analyzer is no longer in use- either because analysis completed
        or was not required, stop the orchestrator so that all its background tasks
        are stopped timely and do not block server shutdown.
        """
        if self._coordinator is not None:
            okay_to_clear = await self._coordinator.get_is_okay_to_clear()
            if okay_to_clear:
                await self._coordinator.stop()
                if feature_flags.protocol_subprocess_enabled():
                    self._run_process_pyro_provider.set_active_process_as_used(
                        simulator=True
                    )
            else:
                log.warning(
                    "Analyzer is no longer in use but orchestrator is busy. "
                    "Cannot stop the orchestrator currently."
                )
            self._coordinator = None


def create_protocol_analyzer(
    analysis_store: AnalysisStore,
    protocol_resource: ProtocolResource,
    run_process_pyro_provider: RunProcessPyroProvider,
) -> ProtocolAnalyzer:
    """Protocol analyzer factory function."""
    return ProtocolAnalyzer(
        analysis_store=analysis_store,
        protocol_resource=protocol_resource,
        run_process_pyro_provider=run_process_pyro_provider,
    )
