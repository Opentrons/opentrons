"""Tests for the AnalysisStore interface."""
import pytest
from datetime import datetime
from typing import List, NamedTuple, Sequence, cast

from opentrons.types import MountType, DeckSlotName
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands as pe_commands, types as pe_types

from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.analysis_models import (
    AnalysisResult,
    AnalysisPipette,
    AnalysisLabware,
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
    subject.update(analysis_id="analysis-id", commands=[], errors=[error])

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


class CommandAnalysisSpec(NamedTuple):
    """Spec data for command parsing tests."""

    commands: Sequence[pe_commands.Command]
    expected_result: AnalysisResult
    expected_labware: List[AnalysisLabware]
    expected_pipettes: List[AnalysisPipette]


command_analysis_specs: List[CommandAnalysisSpec] = [
    CommandAnalysisSpec(
        commands=[
            pe_commands.LoadLabware(
                id="load-labware-1",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=datetime(year=2021, month=1, day=1),
                data=pe_commands.LoadLabwareData(
                    location=pe_types.DeckSlotLocation(slot=DeckSlotName.SLOT_1),
                    loadName="load-name",
                    namespace="namespace",
                    version=42,
                ),
                result=pe_commands.LoadLabwareResult.construct(
                    labwareId="labware-id",
                    definition=cast(LabwareDefinition, {}),
                    calibration=pe_types.CalibrationOffset(x=1, y=2, z=3),
                ),
            )
        ],
        expected_result=AnalysisResult.OK,
        expected_labware=[
            AnalysisLabware(
                id="labware-id",
                loadName="load-name",
                definitionUri="namespace/load-name/42",
                location=pe_types.DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            )
        ],
        expected_pipettes=[],
    ),
    CommandAnalysisSpec(
        commands=[
            pe_commands.LoadPipette(
                id="load-pipette-1",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=datetime(year=2021, month=1, day=1),
                data=pe_commands.LoadPipetteData(
                    pipetteName=pe_types.PipetteName.P300_SINGLE,
                    mount=MountType.LEFT,
                ),
                result=pe_commands.LoadPipetteResult(pipetteId="pipette-id"),
            )
        ],
        expected_result=AnalysisResult.OK,
        expected_labware=[],
        expected_pipettes=[
            AnalysisPipette(
                id="pipette-id",
                pipetteName=pe_types.PipetteName.P300_SINGLE,
                mount=MountType.LEFT,
            )
        ],
    ),
    CommandAnalysisSpec(
        commands=[
            pe_commands.LoadLabware(
                id="load-labware-1",
                status=pe_commands.CommandStatus.FAILED,
                createdAt=datetime(year=2021, month=1, day=1),
                data=pe_commands.LoadLabwareData(
                    location=pe_types.DeckSlotLocation(slot=DeckSlotName.SLOT_1),
                    loadName="load-name",
                    namespace="namespace",
                    version=42,
                ),
                error="Oh no!",
            )
        ],
        expected_result=AnalysisResult.NOT_OK,
        expected_labware=[],
        expected_pipettes=[],
    ),
]


@pytest.mark.parametrize(CommandAnalysisSpec._fields, command_analysis_specs)
def test_add_parses_labware_commands(
    commands: Sequence[pe_commands.Command],
    expected_result: AnalysisResult,
    expected_labware: List[AnalysisLabware],
    expected_pipettes: List[AnalysisPipette],
) -> None:
    """It should be able to parse the commands list for analysis results."""
    subject = AnalysisStore()

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    subject.update(analysis_id="analysis-id", commands=commands, errors=[])
    result = subject.get_by_protocol("protocol-id")

    assert result == [
        CompletedAnalysis(
            id="analysis-id",
            result=expected_result,
            labware=expected_labware,
            pipettes=expected_pipettes,
            commands=list(commands),
            errors=[],
        )
    ]
