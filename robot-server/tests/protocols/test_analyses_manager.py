"""Tests for the Analyses Manager interface."""
import pytest
from decoy import Decoy
from datetime import datetime
from pathlib import Path

from opentrons import protocol_runner
from opentrons.protocol_engine.types import BooleanParameter
from opentrons.protocol_reader import ProtocolSource, JsonProtocolConfig
from opentrons_shared_data.robot.dev_types import RobotType

from robot_server.protocols import protocol_analyzer
from robot_server.protocols.analyses_manager import AnalysesManager
from robot_server.protocols.analysis_models import (
    AnalysisSummary,
    AnalysisStatus,
    PendingAnalysis,
)
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.service.task_runner import TaskRunner


@pytest.fixture
def analysis_store(decoy: Decoy) -> AnalysisStore:
    """Get a mocked out AnalysisStore interface."""
    return decoy.mock(cls=AnalysisStore)


@pytest.fixture
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mocked out TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture(autouse=True)
def patch_mock_create_protocol_analyzer(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace ProtocolAnalyzer with a mock."""
    mock = decoy.mock(func=protocol_analyzer.create_protocol_analyzer)
    monkeypatch.setattr(protocol_analyzer, "create_protocol_analyzer", mock)


@pytest.fixture(autouse=True)
def patch_mock_create_simulating_runner(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace protocol_runner.check() with a mock."""
    mock = decoy.mock(func=protocol_runner.create_simulating_runner)
    monkeypatch.setattr(protocol_runner, "create_simulating_runner", mock)


@pytest.fixture
def subject(analysis_store: AnalysisStore, task_runner: TaskRunner) -> AnalysesManager:
    """Get the Analyses Manager with mocked out dependencies."""
    return AnalysesManager(analysis_store=analysis_store, task_runner=task_runner)


async def test_start_analysis(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    task_runner: TaskRunner,
    subject: AnalysesManager,
) -> None:
    """It should start protocol analysis and return summary with run time parameters."""
    robot_type: RobotType = "OT-3 Standard"
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type=robot_type,
            content_hash="abc123",
        ),
        protocol_key="dummy-data-111",
    )
    bool_parameter = BooleanParameter(
        displayName="Foo", variableName="Bar", default=True, value=False
    )
    pending_analysis = PendingAnalysis(id="analysis-id")
    analyzer = decoy.mock(cls=protocol_analyzer.ProtocolAnalyzer)
    runner = decoy.mock(cls=protocol_runner.JsonRunner)
    decoy.when(
        protocol_analyzer.create_protocol_analyzer(
            analysis_store=analysis_store,
            protocol_resource=protocol_resource,
        )
    ).then_return(analyzer)
    decoy.when(
        analysis_store.add_pending(
            protocol_id="protocol-id",
            analysis_id="analysis-id",
        )
    ).then_return(pending_analysis)
    decoy.when(
        await analyzer.load_runner(run_time_param_values={"baz": True})
    ).then_return(runner)
    decoy.when(runner.run_time_parameters).then_return([bool_parameter])
    analysis_summary_result = await subject.start_analysis(
        analysis_id="analysis-id",
        protocol_resource=protocol_resource,
        run_time_param_values={"baz": True},
    )

    assert analysis_summary_result == AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.PENDING,
        runTimeParameters=[bool_parameter],
    )
    # TODO: verify that task runner is called with analyzer.analyze
