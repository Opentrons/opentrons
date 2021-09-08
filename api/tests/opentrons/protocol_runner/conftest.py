"""Test fixtures for opentrons.protocol_runner tests.

These fixtures consist of two "matching" JSON and Python protocols,
saved to disk.
"""
import pytest
import json
import textwrap
from pathlib import Path

from opentrons_shared_data.labware import load_definition


@pytest.fixture
def json_protocol_file(tmp_path: Path) -> Path:
    """Get an on-disk, minimal JSON protocol fixture."""
    tip_rack_def = load_definition("opentrons_96_tiprack_300ul", version=1)
    file_path = tmp_path / "protocol-name.json"

    file_path.write_text(
        json.dumps(
            {
                "schemaVersion": 3,
                "metadata": {},
                "robot": {"model": "OT-2 Standard"},
                "pipettes": {
                    "pipette-id": {"mount": "left", "name": "p300_single"},
                },
                "labware": {
                    "labware-id": {
                        "slot": "1",
                        "displayName": "Opentrons 96 Tip Rack 300 µL",
                        "definitionId": "opentrons/opentrons_96_tiprack_300ul/1",
                    },
                },
                "labwareDefinitions": {
                    "opentrons/opentrons_96_tiprack_300ul/1": tip_rack_def,
                },
                "commands": [
                    {
                        "command": "pickUpTip",
                        "params": {
                            "pipette": "pipette-id",
                            "labware": "labware-id",
                            "well": "A1",
                        },
                    },
                ],
            }
        ),
        encoding="utf-8",
    )

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
                "apiVersion": "3.0",
            }
            def run(ctx):
                pipette = ctx.load_pipette(
                    pipette_name="p300_single",
                    mount="left",
                )
                tip_rack = ctx.load_labware(
                    load_name="opentrons_96_tiprack_300ul",
                    location="1",
                )
                pipette.pick_up_tip(
                    location=tip_rack.wells_by_name()["A1"],
                )
            """
        ),
        encoding="utf-8",
    )

    return file_path
