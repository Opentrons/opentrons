"""Integration tests for the JsonFileReader interface."""
from decoy import matchers
from pathlib import Path

from opentrons.protocol_runner.protocol_file import (
    ProtocolFile,
    ProtocolFileType,
    EngineExecution,
)
from opentrons.protocol_runner.json_file_reader import JsonFileReader
from opentrons.protocols.models import json_protocol


def test_reads_file(json_protocol_file: Path) -> None:
    """It should read a JSON file into a JsonProtocol model."""
    protocol = ProtocolFile(
        protocol_type=ProtocolFileType.JSON,
        execution_method=EngineExecution(),
        files=[json_protocol_file],
    )

    subject = JsonFileReader()
    result = subject.read(protocol)

    assert result == json_protocol.Model.construct(
        schemaVersion=3,
        metadata=json_protocol.Metadata(),
        robot=json_protocol.Robot(model="OT-2 Standard"),
        pipettes={
            "pipette-id": json_protocol.Pipettes(mount="left", name="p300_single"),
        },
        labware={
            "labware-id": json_protocol.Labware(
                slot="1",
                displayName="Opentrons 96 Tip Rack 300 µL",
                definitionId="opentrons/opentrons_96_tiprack_300ul/1",
            ),
        },
        labwareDefinitions={
            "opentrons/opentrons_96_tiprack_300ul/1": matchers.IsA(dict),
        },
        commands=[
            json_protocol.PickUpDropTipCommand(
                command="pickUpTip",
                params=json_protocol.PipetteAccessParams(
                    pipette="pipette-id",
                    labware="labware-id",
                    well="A1",
                ),
            )
        ],
    )
