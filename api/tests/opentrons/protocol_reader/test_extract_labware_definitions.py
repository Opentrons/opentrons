from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Set

import pytest

from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.protocols.api_support.types import APIVersion
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

    @classmethod
    def from_full_definition(cls, full_definition: LabwareDefinition) -> LabwareSummary:
        return cls(
            load_name=full_definition.parameters.loadName,
            display_name=full_definition.metadata.displayName,
        )


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


def get_standard_labware_path(load_name: str) -> Path:
    return (
        get_shared_data_root() / "labware" / "definitions" / "2" / load_name / "1.json"
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
async def test_extraction_from_json_protocol(
    json_protocol: JsonProtocolFixture,
) -> None:
    """Test extraction of labware definitions from JSON protocols of various versions.

    Since `config` is a `JsonProtocolConfig`, it should interpret the `main_file` as a
    JSON protocol and extract all definitions from it.
    """
    protocol_source = ProtocolSource(
        directory=None,
        main_file=json_protocol.path,
        files=[ProtocolSourceFile(path=json_protocol.path, role=ProtocolFileRole.MAIN)],
        metadata={},
        config=JsonProtocolConfig(schema_version=json_protocol.schema_version),
    )
    result = await extract_labware_definitions(protocol_source)
    summarized_result = {LabwareSummary.from_full_definition(l) for l in result}
    assert summarized_result == json_protocol.expected_labware


async def test_extraction_from_python_protocol() -> None:
    """Test extraction of labware definitions from Python protocols.

    Since `config` is a `PythonProtocolConfig`, it should ignore the `main_file` as
    an opaque Python source, and parse other files as labware definitions.
    """
    labware_file_paths = {
        get_standard_labware_path(load_name="corning_96_wellplate_360ul_flat"),
        get_standard_labware_path(
            load_name="opentrons_24_tuberack_generic_2ml_screwcap"
        ),
    }

    expected_labware = {
        LabwareSummary(
            load_name="corning_96_wellplate_360ul_flat",
            display_name="Corning 96 Well Plate 360 µL Flat",
        ),
        LabwareSummary(
            load_name="opentrons_24_tuberack_generic_2ml_screwcap",
            display_name="Opentrons 24 Tube Rack with Generic 2 mL Screwcap",
        ),
    }

    protocol_source = ProtocolSource(
        directory=None,
        main_file=Path("/this/file/does/not/exist/and/should/not/matter"),
        files=[
            ProtocolSourceFile(path=labware_file_path, role=ProtocolFileRole.LABWARE)
            for labware_file_path in labware_file_paths
        ],
        metadata={},
        config=PythonProtocolConfig(api_version=APIVersion(9001, 314159265358979)),
    )

    result = await extract_labware_definitions(protocol_source)
    summarized_result = {LabwareSummary.from_full_definition(l) for l in result}
    assert summarized_result == expected_labware


# TO DO BEFORE MERGE:
#
# - Test that if there is a JSON file, standalone files are ignored
