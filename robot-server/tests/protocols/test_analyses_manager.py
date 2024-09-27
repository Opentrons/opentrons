"""Tests for the Analyses Manager interface."""
import pytest
from decoy import Decoy, matchers
from datetime import datetime
from pathlib import Path

from opentrons.protocol_engine import ErrorOccurrence
from opentrons.protocol_engine.types import BooleanParameter
from opentrons.protocol_reader import ProtocolSource, JsonProtocolConfig
from opentrons_shared_data.errors import EnumeratedError, ErrorCodes
from opentrons_shared_data.robot.types import RobotType

from robot_server.protocols import protocol_analyzer
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.analyses_manager import (
    AnalysesManager,
    FailedToInitializeAnalyzer,
)
from robot_server.protocols.analysis_models import (
    AnalysisSummary,
    AnalysisStatus,
)
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.service.task_runner import TaskRunner
import robot_server.errors.error_mappers as em


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
def patch_mock_map_unexpected_error(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace map_unexpected_error with a mock."""
    mock_map_unexpected_error = decoy.mock(func=em.map_unexpected_error)
    monkeypatch.setattr(em, "map_unexpected_error", mock_map_unexpected_error)


@pytest.fixture
def subject(analysis_store: AnalysisStore, task_runner: TaskRunner) -> AnalysesManager:
    """Get the Analyses Manager with mocked out dependencies."""
    return AnalysesManager(analysis_store=analysis_store, task_runner=task_runner)


async def test_initialize_analyzer(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    task_runner: TaskRunner,
    subject: AnalysesManager,
) -> None:
    """It should create analyzer and load its orchestrator."""
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
        protocol_kind=ProtocolKind.STANDARD,
    )
    analyzer = decoy.mock(cls=protocol_analyzer.ProtocolAnalyzer)
    decoy.when(
        protocol_analyzer.create_protocol_analyzer(
            analysis_store=analysis_store,
            protocol_resource=protocol_resource,
        )
    ).then_return(analyzer)

    await subject.initialize_analyzer(
        analysis_id="analysis-id",
        protocol_resource=protocol_resource,
        run_time_param_values={"sample_count": 123},
        run_time_param_paths={"my_file": Path("file-path")},
    )
    decoy.verify(
        await analyzer.load_orchestrator(
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={"my_file": Path("file-path")},
        )
    )


async def test_raises_error_and_saves_result_if_initialization_errors(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    task_runner: TaskRunner,
    subject: AnalysesManager,
) -> None:
    """It should save the result to analysis store and re-raise error when analyzer initialization errors out."""
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
        protocol_kind=ProtocolKind.STANDARD,
    )
    raised_exception = Exception("Oh noooo!")
    enumerated_error = EnumeratedError(
        code=ErrorCodes.GENERAL_ERROR,
        message="You got me!!",
    )
    analyzer = decoy.mock(cls=protocol_analyzer.ProtocolAnalyzer)
    decoy.when(
        protocol_analyzer.create_protocol_analyzer(
            analysis_store=analysis_store,
            protocol_resource=protocol_resource,
        )
    ).then_return(analyzer)
    decoy.when(
        await analyzer.load_orchestrator(
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={},
        )
    ).then_raise(raised_exception)
    decoy.when(analyzer.get_verified_run_time_parameters()).then_return([])
    decoy.when(em.map_unexpected_error(error=raised_exception)).then_return(
        enumerated_error
    )
    with pytest.raises(FailedToInitializeAnalyzer):
        await subject.initialize_analyzer(
            analysis_id="analysis-id",
            protocol_resource=protocol_resource,
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={},
        )
    decoy.verify(
        await analysis_store.save_initialization_failed_analysis(
            protocol_id="protocol-id",
            analysis_id="analysis-id",
            robot_type=robot_type,
            run_time_parameters=[],
            errors=[
                ErrorOccurrence.from_failed(
                    id="internal-error",
                    createdAt=matchers.IsA(datetime),
                    error=enumerated_error,
                )
            ],
        )
    )


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
        protocol_kind=ProtocolKind.STANDARD,
    )
    bool_parameter = BooleanParameter(
        displayName="Foo", variableName="Bar", default=True, value=False
    )
    analyzer = decoy.mock(cls=protocol_analyzer.ProtocolAnalyzer)
    decoy.when(analyzer.protocol_resource).then_return(protocol_resource)
    decoy.when(analyzer.get_verified_run_time_parameters()).then_return(
        [bool_parameter]
    )
    analysis_summary_result = await subject.start_analysis(
        analysis_id="analysis-id",
        analyzer=analyzer,
    )

    assert analysis_summary_result == AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.PENDING,
        runTimeParameters=[bool_parameter],
    )
    decoy.verify(
        analysis_store.add_pending(
            protocol_id="protocol-id",
            analysis_id="analysis-id",
            run_time_parameters=[bool_parameter],
        ),
        task_runner.run(
            analyzer.analyze,
            analysis_id="analysis-id",
        ),
    )
