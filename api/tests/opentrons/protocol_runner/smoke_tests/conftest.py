"""Test fixtures for opentrons.protocol_runner tests.

These fixtures consist of two "matching" JSON and Python protocols,
saved to disk.
"""
import pytest
import io
import json
import textwrap
from pathlib import Path

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.labware import load_definition
from opentrons.protocol_reader import ProtocolReader, InputFile
from opentrons.protocol_engine import ModuleDefinition


@pytest.fixture
def protocol_reader(tmp_path: Path) -> ProtocolReader:
    """Get a ProtocolReader configured to write to a temporary directory."""
    return ProtocolReader(directory=tmp_path)


@pytest.fixture(scope="session")
def tempdeck_v1_def() -> ModuleDefinition:
    """Get the definition of a V1 tempdeck."""
    definition = load_shared_data("module/definitions/2/temperatureModuleV1.json")
    return ModuleDefinition.parse_raw(definition)


# TODO(mc, 2021-09-13): update to schema v6
@pytest.fixture
def json_protocol_file() -> InputFile:
    """Get minimal JSON protocol input "file"."""
    tip_rack_def = load_definition("opentrons_96_tiprack_300ul", version=1)
    filename = "protocol-name.json"
    contents = io.BytesIO(
        json.dumps(
            {
                "schemaVersion": 6,
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
        ).encode()
    )

    return InputFile(filename=filename, file=contents)


@pytest.fixture
def python_protocol_file() -> InputFile:
    """Get minimal Python protocol input "file"."""
    filename = "protocol-name.py"
    contents = io.BytesIO(
        textwrap.dedent(
            """
            # my protocol
            metadata = {
                "apiLevel": "3.0",
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
                temp_module = ctx.load_module(
                    module_name="temperature module",
                    location="3"
                )
                pipette.pick_up_tip(
                    location=tip_rack.wells_by_name()["A1"],
                )
            """
        ).encode()
    )

    return InputFile(filename=filename, file=contents)


@pytest.fixture
def legacy_python_protocol_file() -> InputFile:
    """Get an on-disk, minimal Python protocol fixture."""
    filename = "protocol-name.py"
    contents = io.BytesIO(
        textwrap.dedent(
            """
            # my protocol
            metadata = {
                "apiLevel": "2.11",
            }
            def run(ctx):
                pipette = ctx.load_instrument(
                    instrument_name="p300_single",
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
        ).encode()
    )

    return InputFile(filename=filename, file=contents)


@pytest.fixture
def legacy_json_protocol_file() -> InputFile:
    """Get an on-disk, minimal JSON protocol fixture."""
    tip_rack_def = load_definition("opentrons_96_tiprack_300ul", version=1)
    filename = "protocol-name.json"
    contents = io.BytesIO(
        json.dumps(
            {
                "$otSharedSchema": "#/protocol/schemas/5",
                "schemaVersion": 5,
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
                "modules": {},
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
        ).encode()
    )

    return InputFile(filename=filename, file=contents)
