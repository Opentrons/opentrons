"""Tests for the ProtocolAnalyzer."""
import pytest
from decoy import Decoy
from datetime import datetime
from pathlib import Path

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
)
from opentrons.protocol_runner import ProtocolRunner, ProtocolRunData
from opentrons.protocol_reader import ProtocolSource, JsonProtocolConfig

from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.protocols.protocol_analyzer import ProtocolAnalyzer


@pytest.fixture
def protocol_runner(decoy: Decoy) -> ProtocolRunner:
    """Get a mocked out ProtocolRunner."""
    return decoy.mock(cls=ProtocolRunner)


@pytest.fixture
def analysis_store(decoy: Decoy) -> AnalysisStore:
    """Get a mocked out AnalysisStore."""
    return decoy.mock(cls=AnalysisStore)


@pytest.fixture
def subject(
    protocol_runner: ProtocolRunner,
    analysis_store: AnalysisStore,
) -> ProtocolAnalyzer:
    """Get a ProtocolAnalyzer test subject."""
    return ProtocolAnalyzer(
        protocol_runner=protocol_runner,
        analysis_store=analysis_store,
    )


async def test_analyze(
    decoy: Decoy,
    protocol_runner: ProtocolRunner,
    analysis_store: AnalysisStore,
    subject: ProtocolAnalyzer,
) -> None:
    """It should be able to analyze a protocol."""
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            labware_definitions=[],
        ),
    )

    analysis_command = pe_commands.Pause(
        id="command-id",
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2022, month=2, day=2),
        params=pe_commands.PauseParams(message="hello world"),
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
        pipetteName=pe_types.PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    decoy.when(await protocol_runner.run(protocol_resource.source)).then_return(
        ProtocolRunData(
            commands=[analysis_command],
            errors=[analysis_error],
            labware=[analysis_labware],
            pipettes=[analysis_pipette],
        )
    )

    await subject.analyze(
        protocol_resource=protocol_resource,
        analysis_id="analysis-id",
    )

    decoy.verify(
        analysis_store.update(
            analysis_id="analysis-id",
            commands=[analysis_command],
            labware=[analysis_labware],
            pipettes=[analysis_pipette],
            errors=[analysis_error],
        ),
    )
