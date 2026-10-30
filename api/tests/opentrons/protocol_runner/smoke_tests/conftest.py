"""Test fixtures for opentrons.protocol_runner tests.

These fixtures consist of two "matching" JSON and Python protocols,
saved to disk.
"""

import json
import textwrap
from pathlib import Path

import pytest

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.labware import load_definition

from opentrons.protocol_engine import ModuleDefinition


@pytest.fixture(scope="session")
def tempdeck_v2_def() -> ModuleDefinition:
    """Get the definition of a V1 tempdeck."""
    definition = load_shared_data("module/definitions/3/temperatureModuleV2.json")
    return ModuleDefinition.model_validate_json(definition)


@pytest.fixture()
def json_protocol_file(tmp_path: Path) -> Path:
    """Get minimal JSON protocol input "file"."""
    tip_rack_def = load_definition("opentrons_flex_96_tiprack_1000ul", version=1)
    path = tmp_path / "protocol-name.json"

    path.write_text(
        json.dumps(
            {
                "$otSharedSchema": "#/protocol/schemas/6",
                "schemaVersion": 6,
                "metadata": {},
                "robot": {"model": "OT-3 Standard", "deckId": "ot3_standard"},
                "pipettes": {
                    "pipette-id": {"name": "p1000_single_flex"},
                },
                "labware": {
                    "labware-id": {
                        "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
                        "definitionId": "opentrons/opentrons_flex_96_tiprack_1000ul/1",
                    },
                },
                "labwareDefinitions": {
                    "opentrons/opentrons_flex_96_tiprack_1000ul/1": tip_rack_def,
                },
                "commands": [
                    {
                        "id": "command-id-1",
                        "commandType": "loadLabware",
                        "params": {
                            "labwareId": "labware-id",
                            "loadName": "opentrons_flex_96_tiprack_1000ul",
                            "namespace": "opentrons",
                            "version": 1,
                            "location": {"slotName": "A1"},
                        },
                    },
                    {
                        "id": "command-id-2",
                        "commandType": "loadPipette",
                        "params": {
                            "pipetteId": "pipette-id",
                            "pipetteName": "p1000_single_flex",
                            "mount": "left",
                        },
                    },
                    {
                        "id": "command-id-3",
                        "commandType": "pickUpTip",
                        "params": {
                            "pipetteId": "pipette-id",
                            "labwareId": "labware-id",
                            "wellName": "A1",
                        },
                    },
                ],
            }
        )
    )

    return path


@pytest.fixture()
def python_protocol_file(tmp_path: Path) -> Path:
    """Get minimal Python protocol input "file"."""
    path = tmp_path / "protocol-name.py"
    path.write_text(
        textwrap.dedent(
            """
            # my protocol
            metadata = {
                "apiLevel": "2.17",
            }
            requirements = {
                "robotType": "Flex"
            }
            def run(ctx):
                pipette = ctx.load_instrument(
                    instrument_name="flex_1channel_1000",
                    mount="left",
                )
                tip_rack = ctx.load_labware(
                    load_name="opentrons_flex_96_tiprack_1000ul",
                    location="A1",
                )
                temp_module = ctx.load_module(
                    module_name="temperatureModuleV2",
                    location="C1"
                )
                pipette.pick_up_tip(
                    location=tip_rack.wells_by_name()["A1"],
                )
            """
        )
    )

    return path


@pytest.fixture()
def python_protocol_file_with_run_time_params(tmp_path: Path) -> Path:
    """Get minimal Python protocol input "file" with run time parameters."""
    path = tmp_path / "protocol-name.py"
    path.write_text(
        textwrap.dedent(
            """
            # my protocol
            metadata = {
                "apiLevel": "2.18",
            }
            requirements = {
                "robotType": "Flex"
            }
            def add_parameters(params):
                params.add_float(
                    display_name="Aspirate volume",
                    variable_name="aspirate_volume",
                    default=25.5,
                    minimum=10,
                    maximum=50,
                )
                params.add_str(
                    display_name="Mount",
                    variable_name="mount",
                    choices=[
                        {"display_name": "Left Mount", "value": "left"},
                        {"display_name": "Right Mount", "value": "right"},
                    ],
                    default="left",
                )
            def run(ctx):
                pipette = ctx.load_instrument(
                    instrument_name="flex_1channel_1000",
                    mount=ctx.params.mount,
                )
                tip_rack = ctx.load_labware(
                    load_name="opentrons_flex_96_tiprack_1000ul",
                    location="A1",
                )
                reservoir = ctx.load_labware(
                    load_name="nest_1_reservoir_195ml",
                    location="A2",
                )
                pipette.pick_up_tip(
                    location=tip_rack.wells_by_name()["A1"],
                )
                pipette.aspirate(ctx.params.aspirate_volume, reservoir.wells()[0])
            """
        )
    )

    return path
