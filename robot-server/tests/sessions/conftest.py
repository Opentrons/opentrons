"""Common test fixtures for sessions route tests."""
import pytest
import json
from pathlib import Path
from decoy import Decoy

from robot_server.protocols import ProtocolStore
from robot_server.sessions.session_view import SessionView
from robot_server.sessions.session_store import SessionStore
from robot_server.sessions.engine_store import EngineStore


@pytest.fixture
def protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a mock ProtocolStore interface."""
    return decoy.create_decoy(spec=ProtocolStore)


@pytest.fixture
def session_store(decoy: Decoy) -> SessionStore:
    """Get a mock SessionStore interface."""
    return decoy.create_decoy(spec=SessionStore)


@pytest.fixture
def session_view(decoy: Decoy) -> SessionView:
    """Get a mock SessionView interface."""
    return decoy.create_decoy(spec=SessionView)


@pytest.fixture
def engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore interface."""
    return decoy.create_decoy(spec=EngineStore)


@pytest.fixture
def json_protocol_file(
    tmp_path: Path,
    minimal_labware_def: dict,
) -> Path:
    """Get an on-disk, minimal JSON protocol fixture."""
    file_path = tmp_path / "protocol-name.json"

    file_path.write_text(
        json.dumps(
            {
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
        ),
        encoding="utf-8",
    )

    return file_path
