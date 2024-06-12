"""Tests for the ProtocolAnalyzer."""
import pytest
from decoy import Decoy
from datetime import datetime
from pathlib import Path

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.parse import PythonParseMode
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
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
    PythonProtocolConfig,
)
import opentrons.util.helpers as datetime_helper

from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_models import ProtocolKind
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


async def test_load_runner(
    decoy: Decoy,
    analysis_store: AnalysisStore,
) -> None:
    """It should load the appropriate runner."""
    robot_type: RobotType = "OT-3 Standard"
    protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/abc.py"),
        config=PythonProtocolConfig(api_version=APIVersion(100, 200)),
        files=[],
        metadata={},
        robot_type=robot_type,
        content_hash="abc123",
    )
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=protocol_source,
        protocol_key="dummy-data-111",
        protocol_kind=ProtocolKind.STANDARD.value,
    )

    subject = ProtocolAnalyzer(
        analysis_store=analysis_store, protocol_resource=protocol_resource
    )

    python_runner = decoy.mock(cls=protocol_runner.PythonAndLegacyRunner)
    decoy.when(
        await protocol_runner.create_simulating_runner(
            robot_type=robot_type,
            protocol_config=PythonProtocolConfig(api_version=APIVersion(100, 200)),
        )
    ).then_return(python_runner)
    runner = await subject.load_runner(run_time_param_values={"rtp_var": 123})
    assert runner == python_runner
    decoy.verify(
        await python_runner.load(
            protocol_source=protocol_source,
            python_parse_mode=PythonParseMode.NORMAL,
            run_time_param_values={"rtp_var": 123},
        ),
        times=1,
    )


async def test_analyze(
    decoy: Decoy,
    analysis_store: AnalysisStore,
) -> None:
    """It should be able to start a protocol analysis and return the analysis summary."""
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
        protocol_kind=ProtocolKind.STANDARD.value,
    )

    analysis_command = pe_commands.WaitForResume(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2022, month=2, day=2),
        params=pe_commands.WaitForResumeParams(message="hello world"),
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

    bool_parameter = pe_types.BooleanParameter(
        displayName="Foo", variableName="Bar", default=True, value=False
    )

    json_runner = decoy.mock(cls=protocol_runner.JsonRunner)
    subject = ProtocolAnalyzer(
        analysis_store=analysis_store, protocol_resource=protocol_resource
    )

    decoy.when(await json_runner.run(deck_configuration=[],)).then_return(
        protocol_runner.RunResult(
            commands=[analysis_command],
            state_summary=StateSummary(
                status=EngineStatus.SUCCEEDED,
                errors=[],
                labware=[analysis_labware],
                pipettes=[analysis_pipette],
                modules=[],
                labwareOffsets=[],
                liquids=[],
            ),
            parameters=[bool_parameter],
        )
    )

    await subject.analyze(
        analysis_id="analysis-id",
        runner=json_runner,
        run_time_parameters=[bool_parameter],
    )
    decoy.verify(
        await analysis_store.update(
            analysis_id="analysis-id",
            robot_type=robot_type,
            run_time_parameters=[bool_parameter],
            commands=[analysis_command],
            labware=[analysis_labware],
            modules=[],
            pipettes=[analysis_pipette],
            errors=[],
            liquids=[],
        )
    )


async def test_analyze_updates_pending_on_error(
    decoy: Decoy,
    analysis_store: AnalysisStore,
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
        protocol_kind=ProtocolKind.STANDARD.value,
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
    subject = ProtocolAnalyzer(
        analysis_store=analysis_store, protocol_resource=protocol_resource
    )

    decoy.when(
        await json_runner.run(
            deck_configuration=[],
        )
    ).then_raise(raised_exception)

    decoy.when(em.map_unexpected_error(error=raised_exception)).then_return(
        enumerated_error
    )

    decoy.when(datetime_helper.utc_now()).then_return(
        datetime(year=2023, month=3, day=3)
    )

    await subject.analyze(
        runner=json_runner,
        analysis_id="analysis-id",
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
