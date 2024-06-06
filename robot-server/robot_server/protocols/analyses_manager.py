"""A collaborator for managing protocol analyses."""
from typing import Optional

from opentrons.protocol_engine.types import RunTimeParamValuesType

from robot_server.protocols.analysis_models import (
    AnalysisStatus,
    AnalysisSummary,
)
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols import protocol_analyzer
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.service.task_runner import TaskRunner


class AnalysesManager:
    """A Collaborator that manages and provides an interface to Protocol Analyzers."""

    def __init__(self, analysis_store: AnalysisStore, task_runner: TaskRunner) -> None:
        self._analysis_store = analysis_store
        self._task_runner = task_runner

    async def start_analysis(
        self,
        analysis_id: str,
        protocol_resource: ProtocolResource,
        run_time_param_values: Optional[RunTimeParamValuesType],
    ) -> AnalysisSummary:
        """Start an analysis of the given protocol resource with run time param values."""
        analyzer = protocol_analyzer.create_protocol_analyzer(
            analysis_store=self._analysis_store, protocol_resource=protocol_resource
        )
        pending = self._analysis_store.add_pending(
            protocol_id=protocol_resource.protocol_id,
            analysis_id=analysis_id,
        )
        try:
            protocol_runner = await analyzer.load_runner(
                run_time_param_values=run_time_param_values
            )
            pending.runTimeParameters = protocol_runner.run_time_parameters
        except BaseException as error:
            await analyzer.update_to_failed_analysis(
                analysis_id=analysis_id,
                protocol_robot_type=protocol_resource.source.robot_type,
                error=error,
                run_time_parameters=[],
            )
            return AnalysisSummary(
                id=analysis_id,
                status=AnalysisStatus.COMPLETED,
            )

        self._task_runner.run(
            analyzer.analyze,
            runner=protocol_runner,
            analysis_id=analysis_id,
            run_time_parameters=protocol_runner.run_time_parameters,
        )
        return AnalysisSummary(
            id=analysis_id,
            status=AnalysisStatus.PENDING,
            runTimeParameters=pending.runTimeParameters,
        )
