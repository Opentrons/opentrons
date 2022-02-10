"""Integration tests for the JsonFileReader interface."""
import pytest
from decoy import matchers

from opentrons.protocols.models import json_protocol
from opentrons.protocol_reader import (
    ProtocolReader,
    InputFile,
    ProtocolFilesInvalidError,
)
from opentrons.protocol_runner.json_file_reader import JsonFileReader


@pytest.mark.xfail(strict=True, raises=ProtocolFilesInvalidError)
async def test_reads_file(
    protocol_reader: ProtocolReader,
    json_protocol_file: InputFile,
) -> None:
    """It should read a JSON file into a JsonProtocol model."""
    protocol_source = await protocol_reader.read(
        name="test_protocol",
        files=[json_protocol_file],
    )

    subject = JsonFileReader()
    result = subject.read(protocol_source)

    assert result == json_protocol.Model(
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
