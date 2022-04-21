"""Tests for the AnalysisStore interface."""
import pytest
from datetime import datetime
from pathlib import Path
from typing import Generator, List, NamedTuple

from sqlalchemy.engine import Engine as SQLEngine

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
)

from robot_server.persistence import open_db_no_cleanup, add_tables_to_db
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.analysis_models import (
    AnalysisResult,
    PendingAnalysis,
    CompletedAnalysis,
)


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


def test_get_empty(subject: AnalysisStore) -> None:
    """It should return an empty list if no analysis saved."""
    result = subject.get_by_protocol("protocol-id")
    summaries_result = subject.get_summaries_by_protocol("protocol-id")

    assert result == []
    assert summaries_result == []


def test_add_pending(subject: AnalysisStore) -> None:
    """It should add a pending analysis to the store."""
    expected_pending_analysis = PendingAnalysis(id="analysis-id")

    result = subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")

    assert result == expected_pending_analysis
    assert subject.get_by_protocol("protocol-id") == [expected_pending_analysis]
    assert subject.get_summaries_by_protocol("protocol-id") == [
        expected_pending_analysis
    ]


def test_add_analysis_equipment(subject: AnalysisStore) -> None:
    """It should add labware and pipettes to the stored analysis."""
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
    commands: List[pe_commands.Command],
    errors: List[pe_errors.ErrorOccurrence],
    expected_result: AnalysisResult,
) -> None:
    """It should be able to parse the commands list for analysis results."""
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
