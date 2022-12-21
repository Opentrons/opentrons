from dataclasses import dataclass
from pathlib import Path
from typing import List, Set

import pytest

from opentrons_shared_data import get_shared_data_root

from opentrons.protocol_reader import (
    extract_labware_definitions,
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolFileRole,
    JsonProtocolConfig,
    PythonProtocolConfig,
)


@dataclass(frozen=True)
class LabwareSummary:
    load_name: str
    display_name: str


@dataclass(frozen=True)
class JsonProtocolFixture:
    schema_version: int
    file_name: str
    expected_labware: Set[LabwareSummary]

    @property
    def path(self) -> Path:
        return (
            get_shared_data_root()
            / "protocol"
            / "fixtures"
            / str(self.schema_version)
            / self.file_name
        )


json_protocol_fixtures = [
    JsonProtocolFixture(
        schema_version=3,
        file_name="simple.json",
        expected_labware={
            LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
    JsonProtocolFixture(
        schema_version=4,
        file_name="simpleV4.json",
        expected_labware={
            LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
    JsonProtocolFixture(
        schema_version=5,
        file_name="simpleV5.json",
        expected_labware={
            LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
    JsonProtocolFixture(
        schema_version=6,
        file_name="simpleV6.json",
        expected_labware={
            LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
    JsonProtocolFixture(
        schema_version=7,
        file_name="simpleV7.json",
        expected_labware={
            LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
]


@pytest.mark.parametrize("json_protocol", json_protocol_fixtures)
async def test_extraction(json_protocol: JsonProtocolFixture) -> None:
    protocol_source = ProtocolSource(
        directory=None,
        main_file=json_protocol.path,
        files=[ProtocolSourceFile(path=json_protocol.path, role=ProtocolFileRole.MAIN)],
        metadata={},
        config=JsonProtocolConfig(schema_version=json_protocol.schema_version),
    )
    result = await extract_labware_definitions(protocol_source)
    summarized_result = {
        LabwareSummary(
            load_name=l.parameters.loadName, display_name=l.metadata.displayName
        )
        for l in result
    }
    assert summarized_result == json_protocol.expected_labware


# TO DO BEFORE MERGE:
#
# - Test that extract_labware_definition() can pull multiple defs from standalone files
# - Test that if there is a JSON file, standalone files are ignored
