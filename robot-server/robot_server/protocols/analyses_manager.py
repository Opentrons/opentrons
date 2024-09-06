"""A collaborator for managing protocol analyses."""
from typing import Optional

from opentrons.util import helpers as datetime_helper

from opentrons.protocol_engine.types import (
    PrimitiveRunTimeParamValuesType,
    CSVRuntimeParamPaths,
)
from opentrons.protocol_engine.errors import ErrorOccurrence

from robot_server.protocols.analysis_models import (
    AnalysisStatus,
    AnalysisSummary,
)
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols import protocol_analyzer
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.service.task_runner import TaskRunner
import robot_server.errors.error_mappers as em


class FailedToInitializeAnalyzer(Exception):
    """Error raised when analyzer initialization failed."""

    def __init__(self) -> None:
        """Initialize the error's message."""
        super().__init__("Failure while initializing analyzer.")


class AnalysesManager:
    """A Collaborator that manages and provides an interface to Protocol Analyzers."""

    def __init__(self, analysis_store: AnalysisStore, task_runner: TaskRunner) -> None:
        self._analysis_store = analysis_store
        self._task_runner = task_runner

    async def initialize_analyzer(
        self,
        analysis_id: str,
        protocol_resource: ProtocolResource,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType],
        run_time_param_paths: Optional[CSVRuntimeParamPaths],
    ) -> protocol_analyzer.ProtocolAnalyzer:
        """Initialize the protocol analyzer with protocol resource and run time parameter values & fileIds.

        If an error is raised during initialization, then we abandon the analysis process
        and save the failed analysis, along with the error message, to the database.
        See `RunOrchestrator.get_run_time_parameters()` for details of which RTPs get
        saved in the analysis when such a failure occurs.

        Returns: the successfully initialized analyzer that is ready to start analyzing.
        Raises: FailedToInitializeAnalyzer if initialization failed due to error in creating
                the protocol runner or loading the protocol resource or
                validating the run time parameters.
        """
        analyzer = protocol_analyzer.create_protocol_analyzer(
            analysis_store=self._analysis_store,
            protocol_resource=protocol_resource,
        )
        try:
            await analyzer.load_orchestrator(
                run_time_param_values=run_time_param_values,
                run_time_param_paths=run_time_param_paths,
            )
        except Exception as error:
            internal_error = em.map_unexpected_error(error)
            await self._analysis_store.save_initialization_failed_analysis(
                protocol_id=protocol_resource.protocol_id,
                analysis_id=analysis_id,
                robot_type=protocol_resource.source.robot_type,
                run_time_parameters=analyzer.get_verified_run_time_parameters(),
                errors=[
                    ErrorOccurrence.from_failed(
                        id="internal-error",
                        createdAt=datetime_helper.utc_now(),
                        error=internal_error,
                    )
                ],
            )
            raise FailedToInitializeAnalyzer() from error
        return analyzer

    async def start_analysis(
        self,
        analysis_id: str,
        analyzer: protocol_analyzer.ProtocolAnalyzer,
    ) -> AnalysisSummary:
        """Start an analysis of the given protocol resource with verified run time parameters."""
        run_time_parameters = analyzer.get_verified_run_time_parameters()
        self._analysis_store.add_pending(
            protocol_id=analyzer.protocol_resource.protocol_id,
            analysis_id=analysis_id,
            run_time_parameters=run_time_parameters,
        )
        self._task_runner.run(
            analyzer.analyze,
            analysis_id=analysis_id,
        )
        return AnalysisSummary(
            id=analysis_id,
            status=AnalysisStatus.PENDING,
            runTimeParameters=run_time_parameters,
        )
