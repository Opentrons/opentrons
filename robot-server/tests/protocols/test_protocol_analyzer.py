"""Tests for the ProtocolAnalyzer."""
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
        )
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
            commands=[analysis_command],
            labware=[analysis_labware],
            modules=[],
            pipettes=[analysis_pipette],
            errors=[analysis_error],
            liquids=[],
        ),
    )


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
