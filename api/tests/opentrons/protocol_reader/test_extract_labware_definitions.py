"""Tests for extract_labware_definitions()."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Set

import pytest

from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.protocol_reader import (
    JsonProtocolConfig,
    ProtocolFileRole,
    ProtocolSource,
    ProtocolSourceFile,
    PythonProtocolConfig,
    extract_labware_definitions,
)
from opentrons.protocols.api_support.types import APIVersion


@dataclass(frozen=True)
class _LabwareSummary:
    """Brief information to uniquely identify a labware definition."""

    load_name: str
    display_name: str

    @classmethod
    def from_full_definition(
        cls, full_definition: LabwareDefinition
    ) -> _LabwareSummary:
        return cls(
            load_name=full_definition.parameters.loadName,
            display_name=full_definition.metadata.displayName,
        )


@dataclass(frozen=True)
class _JsonProtocolFixture:
    """Information about a JSON protocol fixture in shared-data."""

    schema_version: int
    file_name: str
    expected_labware: Set[_LabwareSummary]

    @property
    def path(self) -> Path:
        return (
            get_shared_data_root()
            / "protocol"
            / "fixtures"
            / str(self.schema_version)
            / self.file_name
        )


def _get_standard_labware_path(load_name: str) -> Path:
    return (
        get_shared_data_root() / "labware" / "definitions" / "2" / load_name / "1.json"
    )


json_protocol_fixtures = [
    _JsonProtocolFixture(
        schema_version=3,
        file_name="simple.json",
        expected_labware={
            _LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            _LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            _LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
    _JsonProtocolFixture(
        schema_version=4,
        file_name="simpleV4.json",
        expected_labware={
            _LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            _LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            _LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
    _JsonProtocolFixture(
        schema_version=5,
        file_name="simpleV5.json",
        expected_labware={
            _LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            _LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            _LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
    _JsonProtocolFixture(
        schema_version=6,
        file_name="simpleV6.json",
        expected_labware={
            _LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            _LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            _LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
    _JsonProtocolFixture(
        schema_version=7,
        file_name="simpleV7.json",
        expected_labware={
            _LabwareSummary(
                load_name="opentrons_1_trash_1100ml_fixed",
                display_name="Opentrons Fixed Trash",
            ),
            _LabwareSummary(
                load_name="opentrons_96_tiprack_10ul",
                display_name="Opentrons 96 Tip Rack 10 µL",
            ),
            _LabwareSummary(
                load_name="foo_8_plate_33ul",
                display_name="Foo 8 Well Plate 33uL",
            ),
        },
    ),
]


@pytest.mark.parametrize("json_protocol", json_protocol_fixtures)
async def test_extraction_from_json_protocol(
    json_protocol: _JsonProtocolFixture,
) -> None:
    """Test extraction of labware definitions from JSON protocols of various versions.

    Since `config` is a `JsonProtocolConfig`, it should interpret the `main_file` as a
    JSON protocol and extract all definitions from it.
    """
    protocol_source = ProtocolSource(
        files=[ProtocolSourceFile(path=json_protocol.path, role=ProtocolFileRole.MAIN)],
        config=JsonProtocolConfig(schema_version=json_protocol.schema_version),
        # The subject should ignore these attributes:
        directory=None,
        main_file=json_protocol.path,
        metadata={},
        robot_type="OT-2 Standard",
        content_hash="abc123",
    )
    result = await extract_labware_definitions(protocol_source)
    summarized_result = {
        _LabwareSummary.from_full_definition(labware) for labware in result
    }
    assert summarized_result == json_protocol.expected_labware


async def test_extraction_from_json_protocol_ignores_separate_labware_files() -> None:
    """Test extraction from a JSON protocol that also includes separate labware files.

    The separate labware files should be ignored. Only the ones from the main protocol
    file should be returned.
    """
    json_protocol = json_protocol_fixtures[0]

    extra_labware_load_names = {
        "corning_96_wellplate_360ul_flat",
        "opentrons_24_tuberack_generic_2ml_screwcap",
    }

    main_file = ProtocolSourceFile(path=json_protocol.path, role=ProtocolFileRole.MAIN)
    extra_labware_files = [
        ProtocolSourceFile(
            path=_get_standard_labware_path(load_name=load_name),
            role=ProtocolFileRole.LABWARE,
        )
        for load_name in extra_labware_load_names
    ]
    protocol_source = ProtocolSource(
        files=[main_file] + extra_labware_files,
        config=JsonProtocolConfig(schema_version=json_protocol.schema_version),
        # The subject should ignore these attributes:
        directory=None,
        main_file=json_protocol.path,
        robot_type="OT-2 Standard",
        metadata={},
        content_hash="abc123",
    )

    result = await extract_labware_definitions(protocol_source)
    summarized_result = {
        _LabwareSummary.from_full_definition(labware) for labware in result
    }

    # It should include the definitions from the main file:
    assert summarized_result == json_protocol.expected_labware
    # It should not include any definitions from the separate files:
    assert extra_labware_load_names.isdisjoint(
        {labware.load_name for labware in summarized_result}
    )


async def test_extraction_from_python_protocol() -> None:
    """Test extraction of labware definitions from Python protocols.

    Since `config` is a `PythonProtocolConfig`, it should ignore the `main_file` as
    an opaque Python source, and parse other files as labware definitions.
    """
    labware_file_paths = {
        _get_standard_labware_path(load_name="corning_96_wellplate_360ul_flat"),
        _get_standard_labware_path(
            load_name="opentrons_24_tuberack_generic_2ml_screwcap"
        ),
    }

    expected_labware = {
        _LabwareSummary(
            load_name="corning_96_wellplate_360ul_flat",
            display_name="Corning 96 Well Plate 360 µL Flat",
        ),
        _LabwareSummary(
            load_name="opentrons_24_tuberack_generic_2ml_screwcap",
            display_name="Opentrons 24 Tube Rack with Generic 2 mL Screwcap",
        ),
    }

    protocol_source = ProtocolSource(
        files=[
            ProtocolSourceFile(path=labware_file_path, role=ProtocolFileRole.LABWARE)
            for labware_file_path in labware_file_paths
        ],
        config=PythonProtocolConfig(api_version=APIVersion(9001, 314159265358979)),
        # The subject should ignore these attributes:
        directory=None,
        main_file=Path("/this/file/does/not/exist/and/should/not/matter"),
        robot_type="OT-2 Standard",
        metadata={},
        content_hash="abc123",
    )

    result = await extract_labware_definitions(protocol_source)
    summarized_result = {
        _LabwareSummary.from_full_definition(labware) for labware in result
    }
    assert summarized_result == expected_labware
