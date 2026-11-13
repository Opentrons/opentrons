"""Tests for the Analyses Manager interface."""

import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine import ErrorOccurrence
from opentrons.protocol_engine.types import BooleanParameter
from opentrons.protocol_reader import JsonProtocolConfig, ProtocolSource
from opentrons_shared_data.errors import EnumeratedError, ErrorCodes
from opentrons_shared_data.robot.types import RobotType

import robot_server.errors.error_mappers as em
from robot_server.protocols import protocol_analyzer
from robot_server.protocols.analyses_manager import (
    AnalysesManager,
    FailedToInitializeAnalyzer,
)
from robot_server.protocols.analysis_models import (
    AnalysisStatus,
    AnalysisSummary,
)
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.runs.run_process_pyro_provider import RunProcessPyroProvider
from robot_server.service.task_runner import TaskRunner


@pytest.fixture
def analysis_store(decoy: Decoy) -> AnalysisStore:
    """Get a mocked out AnalysisStore interface."""
    return decoy.mock(cls=AnalysisStore)


@pytest.fixture
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mocked out TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def run_process_pyro_provider(decoy: Decoy) -> RunProcessPyroProvider:
    """Get a mocket out RunProcessPyroProvider."""
    return decoy.mock(cls=RunProcessPyroProvider)


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
def subject(
    analysis_store: AnalysisStore,
    task_runner: TaskRunner,
    run_process_pyro_provider: RunProcessPyroProvider,
) -> AnalysesManager:
    """Get the Analyses Manager with mocked out dependencies."""
    return AnalysesManager(
        analysis_store=analysis_store,
        task_runner=task_runner,
        run_process_pyro_provider=run_process_pyro_provider,
    )


def _protocol_resource(protocol_id: str = "protocol-id") -> ProtocolResource:
    return ProtocolResource(
        protocol_id=protocol_id,
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-3 Standard",
            content_hash="abc123",
        ),
        protocol_key="dummy-data-111",
        protocol_kind=ProtocolKind.STANDARD,
    )


class _QueuedAnalyzer:
    """Analyzer stub that records load/analyze order and can hold the queue lock."""

    def __init__(
        self,
        protocol_resource: ProtocolResource,
        events: List[str],
        name: str,
        started: Optional[asyncio.Event] = None,
        gate: Optional[asyncio.Event] = None,
        done: Optional[asyncio.Event] = None,
    ) -> None:
        self.protocol_resource = protocol_resource
        self._events = events
        self._name = name
        self._started = started
        self._gate = gate
        self._done = done

    async def load_orchestrator(
        self,
        run_time_param_values: object,
        run_time_param_paths: object,
    ) -> None:
        self._events.append(f"load-{self._name}")

    async def analyze(self, analysis_id: str) -> None:
        self._events.append(f"analyze-{self._name}-start")
        if self._started is not None:
            self._started.set()
        if self._gate is not None:
            await self._gate.wait()
        self._events.append(f"analyze-{self._name}-end")
        if self._done is not None:
            self._done.set()

    async def get_verified_run_time_parameters(self) -> List[object]:
        return []


async def test_initialize_analyzer(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    task_runner: TaskRunner,
    run_process_pyro_provider: RunProcessPyroProvider,
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
            run_process_pyro_provider=run_process_pyro_provider,
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
    run_process_pyro_provider: RunProcessPyroProvider,
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
            run_process_pyro_provider=run_process_pyro_provider,
        )
    ).then_return(analyzer)
    decoy.when(
        await analyzer.load_orchestrator(  # type: ignore[func-returns-value]
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={},
        )
    ).then_raise(raised_exception)
    decoy.when(await analyzer.get_verified_run_time_parameters()).then_return([])
    decoy.when(em.map_unexpected_error(error=raised_exception)).then_return(
        enumerated_error
    )
    decoy.when(analysis_store.get_summaries_by_protocol("protocol-id")).then_return([])
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
        ),
        await analyzer.clean_up(),
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
    decoy.when(await analyzer.get_verified_run_time_parameters()).then_return(
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


async def test_enqueue_analysis_adds_pending_and_schedules_job(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    task_runner: TaskRunner,
    subject: AnalysesManager,
) -> None:
    """It should record pending immediately and schedule the queued analysis job."""
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-3 Standard",
            content_hash="abc123",
        ),
        protocol_key="dummy-data-111",
        protocol_kind=ProtocolKind.STANDARD,
    )

    result = await subject.enqueue_analysis(
        analysis_id="analysis-id",
        protocol_resource=protocol_resource,
        run_time_param_values={"sample_count": 123},
        run_time_param_paths={},
    )

    assert result == AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.PENDING,
        runTimeParameters=[],
    )
    decoy.verify(
        analysis_store.add_pending(
            protocol_id="protocol-id",
            analysis_id="analysis-id",
            run_time_parameters=[],
        ),
        task_runner.run(
            subject._run_analysis_job,
            analysis_id="analysis-id",
            protocol_resource=protocol_resource,
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={},
        ),
    )


async def test_enqueue_analysis_serializes_jobs_under_lock(
    analysis_store: AnalysisStore,
    run_process_pyro_provider: RunProcessPyroProvider,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The second job should not initialize until the first job's analyze finishes."""
    events: List[str] = []
    first_started = asyncio.Event()
    first_release = asyncio.Event()
    second_done = asyncio.Event()

    protocol_a = ProtocolResource(
        protocol_id="protocol-a",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/a.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-3 Standard",
            content_hash="aaa",
        ),
        protocol_key="dummy-data-a",
        protocol_kind=ProtocolKind.STANDARD,
    )
    protocol_b = ProtocolResource(
        protocol_id="protocol-b",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/b.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-3 Standard",
            content_hash="bbb",
        ),
        protocol_key="dummy-data-b",
        protocol_kind=ProtocolKind.STANDARD,
    )

    analyzers = {
        "protocol-a": _QueuedAnalyzer(
            protocol_resource=protocol_a,
            events=events,
            name="a",
            started=first_started,
            gate=first_release,
        ),
        "protocol-b": _QueuedAnalyzer(
            protocol_resource=protocol_b,
            events=events,
            name="b",
            done=second_done,
        ),
    }

    def _create(
        analysis_store: AnalysisStore,
        protocol_resource: ProtocolResource,
        run_process_pyro_provider: RunProcessPyroProvider,
    ) -> protocol_analyzer.ProtocolAnalyzer:
        return analyzers[protocol_resource.protocol_id]  # type: ignore[return-value]

    monkeypatch.setattr(protocol_analyzer, "create_protocol_analyzer", _create)

    subject = AnalysesManager(
        analysis_store=analysis_store,
        task_runner=TaskRunner(),
        run_process_pyro_provider=run_process_pyro_provider,
    )

    await subject.enqueue_analysis(
        analysis_id="analysis-a",
        protocol_resource=protocol_a,
        run_time_param_values={},
        run_time_param_paths={},
    )
    await subject.enqueue_analysis(
        analysis_id="analysis-b",
        protocol_resource=protocol_b,
        run_time_param_values={},
        run_time_param_paths={},
    )

    await first_started.wait()
    for _ in range(10):
        await asyncio.sleep(0)
    assert events == ["load-a", "analyze-a-start"]

    first_release.set()
    await second_done.wait()
    assert events == [
        "load-a",
        "analyze-a-start",
        "analyze-a-end",
        "load-b",
        "analyze-b-start",
        "analyze-b-end",
    ]


async def test_initialize_analyzer_promotes_pending_on_failure(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    run_process_pyro_provider: RunProcessPyroProvider,
    subject: AnalysesManager,
) -> None:
    """Init failure after add_pending should promote pending instead of leaving it stuck."""
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
            run_process_pyro_provider=run_process_pyro_provider,
        )
    ).then_return(analyzer)
    decoy.when(
        await analyzer.load_orchestrator(  # type: ignore[func-returns-value]
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={},
        )
    ).then_raise(raised_exception)
    decoy.when(await analyzer.get_verified_run_time_parameters()).then_return([])
    decoy.when(em.map_unexpected_error(error=raised_exception)).then_return(
        enumerated_error
    )
    decoy.when(analysis_store.get_summaries_by_protocol("protocol-id")).then_return(
        [
            AnalysisSummary(
                id="analysis-id",
                status=AnalysisStatus.PENDING,
                runTimeParameters=[],
            )
        ]
    )

    with pytest.raises(FailedToInitializeAnalyzer):
        await subject.initialize_analyzer(
            analysis_id="analysis-id",
            protocol_resource=protocol_resource,
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={},
        )

    decoy.verify(
        await analysis_store.update(
            analysis_id="analysis-id",
            robot_type=robot_type,
            run_time_parameters=[],
            commands=[],
            labware=[],
            modules=[],
            pipettes=[],
            errors=[
                ErrorOccurrence.from_failed(
                    id="internal-error",
                    createdAt=matchers.IsA(datetime),
                    error=enumerated_error,
                )
            ],
            liquids=[],
            liquidClasses=[],
            command_annotations=[],
            labware_offsets=[],
        ),
        await analyzer.clean_up(),
    )
    decoy.verify(
        await analysis_store.save_initialization_failed_analysis(
            protocol_id=matchers.Anything(),
            analysis_id=matchers.Anything(),
            robot_type=matchers.Anything(),
            run_time_parameters=matchers.Anything(),
            errors=matchers.Anything(),
        ),
        times=0,
    )


async def test_initialize_analyzer_promotes_pending_when_rtp_lookup_fails(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    run_process_pyro_provider: RunProcessPyroProvider,
    subject: AnalysesManager,
) -> None:
    """Init failure before a coordinator exists must still promote pending."""
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
    raised_exception = RuntimeError("Can't resolve pyro proxy")
    enumerated_error = EnumeratedError(
        code=ErrorCodes.GENERAL_ERROR,
        message="Can't resolve pyro proxy",
    )
    analyzer = decoy.mock(cls=protocol_analyzer.ProtocolAnalyzer)
    decoy.when(
        protocol_analyzer.create_protocol_analyzer(
            analysis_store=analysis_store,
            protocol_resource=protocol_resource,
            run_process_pyro_provider=run_process_pyro_provider,
        )
    ).then_return(analyzer)
    decoy.when(
        await analyzer.load_orchestrator(  # type: ignore[func-returns-value]
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={},
        )
    ).then_raise(raised_exception)
    decoy.when(await analyzer.get_verified_run_time_parameters()).then_raise(
        AssertionError()
    )
    decoy.when(em.map_unexpected_error(error=raised_exception)).then_return(
        enumerated_error
    )
    decoy.when(analysis_store.get_summaries_by_protocol("protocol-id")).then_return(
        [
            AnalysisSummary(
                id="analysis-id",
                status=AnalysisStatus.PENDING,
                runTimeParameters=[],
            )
        ]
    )

    with pytest.raises(FailedToInitializeAnalyzer):
        await subject.initialize_analyzer(
            analysis_id="analysis-id",
            protocol_resource=protocol_resource,
            run_time_param_values={"sample_count": 123},
            run_time_param_paths={},
        )

    decoy.verify(
        await analysis_store.update(
            analysis_id="analysis-id",
            robot_type=robot_type,
            run_time_parameters=[],
            commands=[],
            labware=[],
            modules=[],
            pipettes=[],
            errors=[
                ErrorOccurrence.from_failed(
                    id="internal-error",
                    createdAt=matchers.IsA(datetime),
                    error=enumerated_error,
                )
            ],
            liquids=[],
            liquidClasses=[],
            command_annotations=[],
            labware_offsets=[],
        ),
        await analyzer.clean_up(),
    )


async def test_start_analysis_if_rtps_differ_skips_when_rtps_match(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    run_process_pyro_provider: RunProcessPyroProvider,
) -> None:
    """Matching RTPs should clean up the analyzer and not record a new pending analysis."""
    protocol_resource = _protocol_resource()
    last_summary = AnalysisSummary(id="old-analysis", status=AnalysisStatus.COMPLETED)
    analyzer = decoy.mock(cls=protocol_analyzer.ProtocolAnalyzer)
    decoy.when(
        protocol_analyzer.create_protocol_analyzer(
            analysis_store=analysis_store,
            protocol_resource=protocol_resource,
            run_process_pyro_provider=run_process_pyro_provider,
        )
    ).then_return(analyzer)
    decoy.when(await analyzer.get_verified_run_time_parameters()).then_return([])
    decoy.when(
        await analysis_store.matching_rtp_values_in_analysis(
            last_analysis_summary=last_summary,
            new_parameters=[],
        )
    ).then_return(True)

    subject = AnalysesManager(
        analysis_store=analysis_store,
        task_runner=TaskRunner(),
        run_process_pyro_provider=run_process_pyro_provider,
    )
    result = await subject.start_analysis_if_rtps_differ(
        analysis_id="analysis-id",
        protocol_resource=protocol_resource,
        run_time_param_values={},
        run_time_param_paths={},
        last_analysis_summary=last_summary,
    )

    assert result is None
    decoy.verify(await analyzer.clean_up())
    decoy.verify(
        analysis_store.add_pending(
            protocol_id=matchers.Anything(),
            analysis_id=matchers.Anything(),
            run_time_parameters=matchers.Anything(),
        ),
        times=0,
    )


async def test_start_analysis_if_rtps_differ_starts_when_rtps_differ(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    run_process_pyro_provider: RunProcessPyroProvider,
) -> None:
    """Mismatched RTPs should record pending under the lock and analyze."""
    protocol_resource = _protocol_resource()
    last_summary = AnalysisSummary(id="old-analysis", status=AnalysisStatus.COMPLETED)
    analyzer = decoy.mock(cls=protocol_analyzer.ProtocolAnalyzer)
    decoy.when(
        protocol_analyzer.create_protocol_analyzer(
            analysis_store=analysis_store,
            protocol_resource=protocol_resource,
            run_process_pyro_provider=run_process_pyro_provider,
        )
    ).then_return(analyzer)
    decoy.when(await analyzer.get_verified_run_time_parameters()).then_return([])
    decoy.when(
        await analysis_store.matching_rtp_values_in_analysis(
            last_analysis_summary=last_summary,
            new_parameters=[],
        )
    ).then_return(False)

    subject = AnalysesManager(
        analysis_store=analysis_store,
        task_runner=TaskRunner(),
        run_process_pyro_provider=run_process_pyro_provider,
    )
    result = await subject.start_analysis_if_rtps_differ(
        analysis_id="analysis-id",
        protocol_resource=protocol_resource,
        run_time_param_values={},
        run_time_param_paths={},
        last_analysis_summary=last_summary,
    )

    assert result == AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.PENDING,
        runTimeParameters=[],
    )
    decoy.verify(
        analysis_store.add_pending(
            protocol_id="protocol-id",
            analysis_id="analysis-id",
            run_time_parameters=[],
        ),
        await analyzer.analyze(analysis_id="analysis-id"),
    )
