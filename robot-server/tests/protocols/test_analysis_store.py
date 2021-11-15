"""Tests for the AnalysisStore interface."""
import pytest
from datetime import datetime
from typing import List, NamedTuple, Sequence

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import commands as pe_commands, types as pe_types

from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.analysis_models import (
    AnalysisResult,
    PendingAnalysis,
    CompletedAnalysis,
)


def test_get_empty() -> None:
    """It should return an empty list if no analysis saved."""
    subject = AnalysisStore()
    result = subject.get_by_protocol("protocol-id")

    assert result == []


def test_add_pending() -> None:
    """It should add a pending analysis to the store."""
    subject = AnalysisStore()
    result = subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")

    assert result == [PendingAnalysis(id="analysis-id")]


def test_add_errored_analysis() -> None:
    """It should be able to add a failed analysis to the store."""
    subject = AnalysisStore()
    error = RuntimeError("oh no!")

    result = subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    subject.update(
        analysis_id="analysis-id",
        commands=[],
        labware=[],
        pipettes=[],
        errors=[error],
    )

    result = subject.get_by_protocol("protocol-id")

    assert result == [
        CompletedAnalysis(
            id="analysis-id",
            result=AnalysisResult.ERROR,
            errors=["oh no!"],
            labware=[],
            pipettes=[],
            commands=[],
        )
    ]


def test_add_analysis_equipment() -> None:
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

    subject = AnalysisStore()
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

    commands: Sequence[pe_commands.Command]
    expected_result: AnalysisResult


command_analysis_specs: List[CommandAnalysisSpec] = [
    CommandAnalysisSpec(
        commands=[
            pe_commands.Pause(
                id="pause-1",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=datetime(year=2021, month=1, day=1),
                params=pe_commands.PauseParams(message="hello world"),
                result=pe_commands.PauseResult(),
            )
        ],
        expected_result=AnalysisResult.OK,
    ),
    CommandAnalysisSpec(
        commands=[
            pe_commands.Pause(
                id="pause-1",
                status=pe_commands.CommandStatus.FAILED,
                createdAt=datetime(year=2021, month=1, day=1),
                params=pe_commands.PauseParams(message="hello world"),
                error="Oh no!",
            )
        ],
        expected_result=AnalysisResult.NOT_OK,
    ),
]


@pytest.mark.parametrize(CommandAnalysisSpec._fields, command_analysis_specs)
def test_add_parses_labware_commands(
    commands: Sequence[pe_commands.Command],
    expected_result: AnalysisResult,
) -> None:
    """It should be able to parse the commands list for analysis results."""
    subject = AnalysisStore()

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    subject.update(
        analysis_id="analysis-id",
        commands=commands,
        labware=[],
        pipettes=[],
        errors=[],
    )
    res = subject.get_by_protocol("protocol-id")[0].result  # type: ignore[union-attr]

    assert res == expected_result
