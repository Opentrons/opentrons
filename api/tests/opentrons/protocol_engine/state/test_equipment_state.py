"""Tests for equipment state in the protocol_engine state store."""
import pytest
from datetime import datetime, timezone

from opentrons.types import Point
from opentrons.protocol_engine import command_models as commands

from opentrons.protocol_engine.state.equipment_state import (
    EquipmentState,
    LabwareState
)

@pytest.fixture
def store():
    return EquipmentState()


@pytest.fixture
def now():
    return datetime.now(tz=timezone.utc)


def test_handles_load_labware(store, now):
    """It should add the labware data to the store"""
    uid = "command-id"
    res = commands.LoadLabwareResponse(
        labwareId="unique-id",
        definition={"mockDefinition": True},
        calibration=Point(1, 2, 3)
    )

    store.handle_command_result(uid, now, res)

    assert store.labware_by_id["unique-id"] == LabwareState(
        labwareId="unique-id",
        definition={"mockDefinition": True},
        calibration=Point(1, 2, 3)
    )
