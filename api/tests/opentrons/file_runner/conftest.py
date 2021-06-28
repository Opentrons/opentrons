"""Test fixtures for opentrons.file_runner tests."""
import pytest
import json
import textwrap
from pathlib import Path
from opentrons.protocols.models import JsonProtocol


@pytest.fixture
def json_protocol(json_protocol_dict: dict) -> JsonProtocol:
    """Get a parsed JSON protocol model fixture."""
    return JsonProtocol.parse_obj(json_protocol_dict)


@pytest.fixture
def json_protocol_dict(minimal_labware_def: dict) -> dict:
    """Get a JSON protocol dictionary fixture."""
    return {
        "schemaVersion": 3,
        "metadata": {},
        "robot": {"model": "OT-2 Standard"},
        "pipettes": {"leftPipetteId": {"mount": "left", "name": "p300_single"}},
        "labware": {
            "trashId": {
                "slot": "12",
                "displayName": "Trash",
                "definitionId": "opentrons/opentrons_1_trash_1100ml_fixed/1",
            },
            "tiprack1Id": {
                "slot": "1",
                "displayName": "Opentrons 96 Tip Rack 300 µL",
                "definitionId": "opentrons/opentrons_96_tiprack_300ul/1",
            },
            "wellplate1Id": {
                "slot": "10",
                "displayName": "Corning 96 Well Plate 360 µL Flat",
                "definitionId": "opentrons/corning_96_wellplate_360ul_flat/1",
            },
        },
        "labwareDefinitions": {
            "opentrons/opentrons_1_trash_1100ml_fixed/1": minimal_labware_def,
            "opentrons/opentrons_96_tiprack_300ul/1": minimal_labware_def,
            "opentrons/corning_96_wellplate_360ul_flat/1": minimal_labware_def,
        },
        "commands": [
            {
                "command": "pickUpTip",
                "params": {
                    "pipette": "leftPipetteId",
                    "labware": "tiprack1Id",
                    "well": "A1",
                },
            },
            {
                "command": "aspirate",
                "params": {
                    "pipette": "leftPipetteId",
                    "volume": 51,
                    "labware": "wellplate1Id",
                    "well": "B1",
                    "offsetFromBottomMm": 10,
                    "flowRate": 10,
                },
            },
            {
                "command": "dispense",
                "params": {
                    "pipette": "leftPipetteId",
                    "volume": 50,
                    "labware": "wellplate1Id",
                    "well": "H1",
                    "offsetFromBottomMm": 1,
                    "flowRate": 50,
                },
            },
        ],
    }


@pytest.fixture
def json_protocol_file(
    tmp_path: Path,
    json_protocol_dict: dict,
) -> Path:
    """Get an on-disk, minimal JSON protocol fixture."""
    file_path = tmp_path / "protocol-name.json"

    file_path.write_text(json.dumps(json_protocol_dict), encoding="utf-8")

    return file_path


@pytest.fixture
def python_protocol_file(tmp_path: Path) -> Path:
    """Get an on-disk, minimal Python protocol fixture."""
    file_path = tmp_path / "protocol-name.py"

    file_path.write_text(
        textwrap.dedent(
            """
            # my protocol
            metadata = {
                "apiVersion": 3.0
            }
            def run(ctx):
                pass
            """
        ),
        encoding="utf-8",
    )

    return file_path
