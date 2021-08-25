"""Tests for the AnalysisStore interface."""
import pytest
from datetime import datetime
from typing import List, NamedTuple, Sequence, cast

from opentrons.types import MountType, DeckSlotName
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands as pe_commands, types as pe_types

from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.analysis_models import (
    AnalysisStatus,
    AnalysisPipette,
    AnalysisLabware,
    PendingAnalysis,
    CompletedAnalysis,
)


def test_get_pending() -> None:
    """It should return a PendingAnalysis if no analysis saved."""
    subject = AnalysisStore()
    result = subject.get("protocol-id")

    assert result == PendingAnalysis()


def test_add_failed_analysis() -> None:
    """It should be able to add a failed analysis to the store."""
    subject = AnalysisStore()
    error = RuntimeError("oh no!")

    subject.add("protocol-id", commands=[], errors=[error])

    result = subject.get("protocol-id")

    assert result == CompletedAnalysis(
        status=AnalysisStatus.FAILED,
        errors=["oh no!"],
        labware=[],
        pipettes=[],
        commands=[],
    )


class CommandAnalysisSpec(NamedTuple):
    """Spec data for command parsing tests."""

    commands: Sequence[pe_commands.Command]
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
                    calibration=(1, 2, 3),
                ),
            )
        ],
        expected_labware=[
            AnalysisLabware(
                id="labware-id",
                loadName="load-name",
                namespace="namespace",
                version=42,
                definitionUri="namespace/load-name/42",
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
        expected_labware=[],
        expected_pipettes=[
            AnalysisPipette(
                id="pipette-id",
                loadName=pe_types.PipetteName.P300_SINGLE,
                mount=MountType.LEFT,
            )
        ],
    ),
]


@pytest.mark.parametrize(CommandAnalysisSpec._fields, command_analysis_specs)
def test_add_parses_labware_commands(
    commands: Sequence[pe_commands.Command],
    expected_labware: List[AnalysisLabware],
    expected_pipettes: List[AnalysisPipette],
) -> None:
    """It should be able to parse the commands list for analysis results."""
    subject = AnalysisStore()

    subject.add("protocol-id", commands=commands, errors=[])
    result = subject.get("protocol-id")

    assert result == CompletedAnalysis(
        status=AnalysisStatus.SUCCEEDED,
        errors=[],
        commands=list(commands),
        labware=expected_labware,
        pipettes=expected_pipettes,
    )
