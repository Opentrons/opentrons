"""Tests for equipment state in the protocol_engine state store."""
from opentrons.types import Mount


def test_initial_labware_data(store):
    """get_labware_data_by_id should return None if ID doesn't exist."""
    assert store.state.get_labware_data_by_id("asdfghjkl") is None


def test_initial_pipette_data_by_id(store):
    """get_pipette_data_by_id should return None if ID doesn't exist."""
    assert store.state.get_pipette_data_by_id("asdfghjkl") is None


def test_initial_pipette_data_by_mount(store):
    """get_pipette_data_by_id should return None if ID doesn't exist."""
    assert store.state.get_pipette_data_by_mount(Mount.LEFT) is None
    assert store.state.get_pipette_data_by_mount(Mount.RIGHT) is None


def test_handles_load_labware(store, completed_load_labware_command):
    """It should add the labware data to the state"""
    req = completed_load_labware_command.request
    res = completed_load_labware_command.result

    store.handle_command(completed_load_labware_command)
    data = store.state.get_labware_data_by_id(res.labwareId)

    assert data.location == req.location
    assert data.definition == res.definition
    assert data.calibration == res.calibration


def test_handles_load_pipette(store, completed_load_pipette_command):
    """It should add the pipette data to the state"""
    req = completed_load_pipette_command.request
    res = completed_load_pipette_command.result

    store.handle_command(completed_load_pipette_command)
    data_by_id = store.state.get_pipette_data_by_id(res.pipetteId)
    data_by_mount = store.state.get_pipette_data_by_mount(req.mount)

    assert data_by_id.mount == req.mount
    assert data_by_id.pipette_name == req.pipetteName
    assert data_by_id == data_by_mount
