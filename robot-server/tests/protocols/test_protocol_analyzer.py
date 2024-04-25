"""Tests for the ProtocolAnalyzer."""
from dataclasses import replace
from typing import Iterator
import pytest
from decoy import Decoy
from datetime import datetime
from pathlib import Path

from opentrons_shared_data.robot.dev_types import RobotType
from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import (
    StateSummary,
    EngineStatus,
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
)
import opentrons.protocol_runner as protocol_runner
from opentrons.protocol_reader import ProtocolSource, JsonProtocolConfig
import opentrons.util.helpers as datetime_helper

from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.protocols.protocol_analyzer import ProtocolAnalyzer
import robot_server.errors.error_mappers as em

from opentrons_shared_data.errors import EnumeratedError, ErrorCodes

from opentrons_shared_data.performance.dev_types import (
    RobotContextState,
)
from opentrons.util.performance_helpers import _get_robot_context_tracker

# Enable tracking for the RobotContextTracker
# This must come before the import of the analyze CLI
context_tracker = _get_robot_context_tracker()

# Ignore the type error for the next line, as we're setting a private attribute for testing purposes
context_tracker._should_track = True  # type: ignore[attr-defined]


@pytest.fixture
def override_data_store(tmp_path: Path) -> Iterator[None]:
    """Override the data store metadata for the RobotContextTracker."""
    old_store = context_tracker._store  # type: ignore[attr-defined]
    old_metadata = old_store.metadata
    new_metadata = replace(old_metadata, storage_dir=tmp_path)
    context_tracker._store = old_store.__class__(metadata=new_metadata)  # type: ignore[attr-defined]
    context_tracker._store.setup()  # type: ignore[attr-defined]
    yield
    context_tracker._store = old_store  # type: ignore[attr-defined]


@pytest.fixture
def monkeypatch_set_store_each_to_true(monkeypatch: pytest.MonkeyPatch) -> None:
    """Override the STORE_EACH flag for the RobotContextTracker."""
    context_tracker._store_each = True  # type: ignore[attr-defined]


def verify_metrics_store_file(file_path: Path, expected_length: int) -> None:
    """Verify that the metrics store file contains the expected number of lines."""
    with open(file_path, "r") as f:
        stored_data = f.readlines()
        stored_data = [line.strip() for line in stored_data if line.strip()]
        assert len(stored_data) == expected_length
        for line in stored_data:
            state_id, start_time, duration = line.strip().split(",")
            assert state_id.isdigit()
            assert state_id == str(RobotContextState.ANALYZING_PROTOCOL.state_id)
            assert start_time.isdigit()
            assert duration.isdigit()


@pytest.fixture(autouse=True)
def patch_mock_map_unexpected_error(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace map_unexpected_error with a mock."""
    mock_map_unexpected_error = decoy.mock(func=em.map_unexpected_error)
    monkeypatch.setattr(em, "map_unexpected_error", mock_map_unexpected_error)


@pytest.fixture(autouse=True)
def patch_mock_get_utc_datetime(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace utc_now with a mock."""
    mock_get_utc_datetime = decoy.mock(func=datetime_helper.utc_now)
    monkeypatch.setattr(datetime_helper, "utc_now", mock_get_utc_datetime)


@pytest.fixture(autouse=True)
def patch_mock_create_simulating_runner(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace protocol_runner.check() with a mock."""
    mock = decoy.mock(func=protocol_runner.create_simulating_runner)
    monkeypatch.setattr(protocol_runner, "create_simulating_runner", mock)


@pytest.fixture
def analysis_store(decoy: Decoy) -> AnalysisStore:
    """Get a mocked out AnalysisStore."""
    return decoy.mock(cls=AnalysisStore)


@pytest.fixture
def subject(
    analysis_store: AnalysisStore,
) -> ProtocolAnalyzer:
    """Get a ProtocolAnalyzer test subject."""
    return ProtocolAnalyzer(
        analysis_store=analysis_store,
    )


@pytest.mark.usefixtures("override_data_store", "monkeypatch_set_store_each_to_true")
async def test_analyze(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    subject: ProtocolAnalyzer,
) -> None:
    """It should be able to analyze a protocol."""
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

    analysis_command = pe_commands.WaitForResume(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2022, month=2, day=2),
        params=pe_commands.WaitForResumeParams(message="hello world"),
    )

    analysis_error = pe_errors.ErrorOccurrence(
        id="error-id",
        createdAt=datetime(year=2023, month=3, day=3),
        errorType="BadError",
        detail="oh no",
    )

    analysis_labware = pe_types.LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=pe_types.DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId=None,
    )

    analysis_pipette = pe_types.LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    analysis_parameter = pe_types.BooleanParameter(
        displayName="Display Name",
        variableName="variable_name",
        type="bool",
        value=False,
        default=True,
    )

    json_runner = decoy.mock(cls=protocol_runner.JsonRunner)

    decoy.when(
        await protocol_runner.create_simulating_runner(
            robot_type=robot_type,
            protocol_config=JsonProtocolConfig(schema_version=123),
        )
    ).then_return(json_runner)

    decoy.when(
        await json_runner.run(
            deck_configuration=[],
            protocol_source=protocol_resource.source,
            run_time_param_values=None,
        )
    ).then_return(
        protocol_runner.RunResult(
            commands=[analysis_command],
            state_summary=StateSummary(
                status=EngineStatus.SUCCEEDED,
                errors=[analysis_error],
                labware=[analysis_labware],
                pipettes=[analysis_pipette],
                # TODO(mc, 2022-02-14): evaluate usage of modules in the analysis resp.
                modules=[],
                labwareOffsets=[],
                liquids=[],
            ),
            parameters=[analysis_parameter],
        )
    )

    store = context_tracker._store  # type: ignore[attr-defined]

    verify_metrics_store_file(store.metadata.data_file_location, 0)

    await subject.analyze(
        protocol_resource=protocol_resource,
        analysis_id="analysis-id",
        run_time_param_values=None,
    )

    verify_metrics_store_file(store.metadata.data_file_location, 1)

    decoy.verify(
        await analysis_store.update(
            analysis_id="analysis-id",
            robot_type=robot_type,
            run_time_parameters=[analysis_parameter],
            commands=[analysis_command],
            labware=[analysis_labware],
            modules=[],
            pipettes=[analysis_pipette],
            errors=[analysis_error],
            liquids=[],
        ),
    )

    await subject.analyze(
        protocol_resource=protocol_resource,
        analysis_id="analysis-id",
        run_time_param_values=None,
    )

    verify_metrics_store_file(store.metadata.data_file_location, 2)


async def test_analyze_updates_pending_on_error(
    decoy: Decoy,
    analysis_store: AnalysisStore,
    subject: ProtocolAnalyzer,
) -> None:
    """It should update pending analysis with an internal error."""
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

    raised_exception = Exception("You got me!!")

    error_occurrence = pe_errors.ErrorOccurrence.construct(
        id="internal-error",
        createdAt=datetime(year=2023, month=3, day=3),
        errorType="EnumeratedError",
        detail="You got me!!",
    )

    enumerated_error = EnumeratedError(
        code=ErrorCodes.GENERAL_ERROR,
        message="You got me!!",
    )

    json_runner = decoy.mock(cls=protocol_runner.JsonRunner)

    decoy.when(
        await protocol_runner.create_simulating_runner(
            robot_type=robot_type,
            protocol_config=JsonProtocolConfig(schema_version=123),
        )
    ).then_return(json_runner)

    decoy.when(
        await json_runner.run(
            deck_configuration=[],
            protocol_source=protocol_resource.source,
            run_time_param_values=None,
        )
    ).then_raise(raised_exception)

    decoy.when(em.map_unexpected_error(error=raised_exception)).then_return(
        enumerated_error
    )

    decoy.when(datetime_helper.utc_now()).then_return(
        datetime(year=2023, month=3, day=3)
    )

    await subject.analyze(
        protocol_resource=protocol_resource,
        analysis_id="analysis-id",
        run_time_param_values=None,
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
            errors=[error_occurrence],
            liquids=[],
        ),
    )
