"""Tests for the AnalysisStore interface."""
import pytest
from datetime import datetime
from pathlib import Path
from typing import Generator, List, NamedTuple

import pytest
from sqlalchemy.engine import Engine as SQLEngine

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
)
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
)

from robot_server.persistence import open_db_no_cleanup, add_tables_to_db
from robot_server.protocols.analysis_models import (
    AnalysisResult,
    AnalysisStatus,
    AnalysisSummary,
    PendingAnalysis,
    CompletedAnalysis,
)
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
)


@pytest.fixture(autouse=True)
def set_logs(caplog):
    caplog.set_level("DEBUG", logger="sqlalchemy")


@pytest.fixture
def sql_engine(tmp_path: Path) -> Generator[SQLEngine, None, None]:
    """Return a set-up database to back the store."""
    db_file_path = tmp_path / "test.db"
    sql_engine = open_db_no_cleanup(db_file_path=db_file_path)
    try:
        add_tables_to_db(sql_engine)
        yield sql_engine
    finally:
        sql_engine.dispose()


@pytest.fixture
def subject(sql_engine: SQLEngine) -> AnalysisStore:
    return AnalysisStore(sql_engine=sql_engine)


def make_dummy_protocol_resource(protocol_id: str) -> ProtocolResource:
    return ProtocolResource(
        protocol_id=protocol_id,
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            labware_definitions=[],
        ),
        protocol_key=None,
    )


@pytest.fixture
def protocol_store(sql_engine: SQLEngine) -> ProtocolStore:
    """Get a ProtocolStore test subject."""
    return ProtocolStore.create_empty(sql_engine=sql_engine)


def test_protocol_not_found(subject: AnalysisStore) -> None:
    with pytest.raises(ProtocolNotFoundError):
        subject.add_pending(
            protocol_id="nonexistent-protocol-id",
            analysis_id="analysis-id-does-not-matter",
        )
    with pytest.raises(ProtocolNotFoundError):
        subject.get_summaries_by_protocol(protocol_id="nonexistent-protocol-id")
    with pytest.raises(ProtocolNotFoundError):
        subject.get_by_protocol(protocol_id="nonexistent-protocol-id")


def test_get_empty(subject: AnalysisStore, protocol_store: ProtocolStore) -> None:
    """It should return an empty list if no analysis saved."""
    protocol_store.insert(make_dummy_protocol_resource("protocol-id"))

    result = subject.get_by_protocol("protocol-id")
    summaries_result = subject.get_summaries_by_protocol("protocol-id")

    assert result == []
    assert summaries_result == []


def test_add_pending(subject: AnalysisStore, protocol_store: ProtocolStore) -> None:
    """It should add a pending analysis to the store."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))

    expected_analysis = PendingAnalysis(id="analysis-id")
    expected_summary = AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.PENDING,
    )

    result = subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")

    assert result == expected_summary
    assert subject.get_by_protocol("protocol-id") == [expected_analysis]
    assert subject.get_summaries_by_protocol("protocol-id") == [expected_summary]


def test_add_analysis_equipment(
    subject: AnalysisStore, protocol_store: ProtocolStore
) -> None:
    """It should add labware and pipettes to the stored analysis."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))

    labware = pe_types.LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=pe_types.DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId=None,
    )

    pipette = pe_types.LoadedPipette(
        id="pipette-id",
        pipetteName=pe_types.PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    subject.update(
        analysis_id="analysis-id",
        labware=[labware],
        pipettes=[pipette],
        commands=[],
        errors=[],
    )

    result = subject.get_by_protocol("protocol-id")

    assert result == [
        CompletedAnalysis(
            id="analysis-id",
            result=AnalysisResult.OK,
            labware=[labware],
            pipettes=[pipette],
            commands=[],
            errors=[],
        )
    ]


class CommandAnalysisSpec(NamedTuple):
    """Spec data for command parsing tests."""

    commands: List[pe_commands.Command]
    errors: List[pe_errors.ErrorOccurrence]
    expected_result: AnalysisResult


command_analysis_specs: List[CommandAnalysisSpec] = [
    CommandAnalysisSpec(
        commands=[
            pe_commands.Pause(
                id="pause-1",
                key="command-key",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=datetime(year=2021, month=1, day=1),
                params=pe_commands.PauseParams(message="hello world"),
                result=pe_commands.PauseResult(),
            )
        ],
        errors=[],
        expected_result=AnalysisResult.OK,
    ),
    CommandAnalysisSpec(
        commands=[],
        errors=[
            pe_errors.ErrorOccurrence(
                id="error-id",
                createdAt=datetime(year=2021, month=1, day=1),
                errorType="BadError",
                detail="oh no",
            )
        ],
        expected_result=AnalysisResult.NOT_OK,
    ),
]


@pytest.mark.parametrize(CommandAnalysisSpec._fields, command_analysis_specs)
def test_add_parses_labware_commands(
    subject: AnalysisStore,
    protocol_store: ProtocolStore,
    commands: List[pe_commands.Command],
    errors: List[pe_errors.ErrorOccurrence],
    expected_result: AnalysisResult,
) -> None:
    """It should be able to parse the commands list for analysis results."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))
    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    subject.update(
        analysis_id="analysis-id",
        commands=commands,
        errors=errors,
        labware=[],
        pipettes=[],
    )
    res = subject.get_by_protocol("protocol-id")[0].result  # type: ignore[union-attr]

    assert res == expected_result
