"""Tests for equipment state in the protocol_engine state store."""
import pytest
from opentrons.types import MountType
from opentrons.protocol_engine import command_models as cmd, errors


def test_initial_pipette_data_by_id(store):
    """get_pipette_data_by_id should raise if ID doesn't exist."""
    with pytest.raises(errors.PipetteDoesNotExistError):
        store.pipettes.get_pipette_data_by_id("asdfghjkl")


def test_initial_pipette_data_by_mount(store):
    """get_pipette_data_by_id should return None if ID doesn't exist."""
    assert store.pipettes.get_pipette_data_by_mount(MountType.LEFT) is None
    assert store.pipettes.get_pipette_data_by_mount(MountType.RIGHT) is None


def test_handles_load_pipette(store, now):
    """It should add the pipette data to the state"""
    command = cmd.CompletedCommand(
        request=cmd.LoadPipetteRequest(
            pipetteName="p300_single",
            mount=MountType.LEFT,
        ),
        result=cmd.LoadPipetteResult(pipetteId='unique-id'),
        created_at=now,
        started_at=now,
        completed_at=now,
    )

    store.handle_command(command, uid="unique-id")
    data_by_id = store.pipettes.get_pipette_data_by_id(
        command.result.pipetteId
    )
    data_by_mount = store.pipettes.get_pipette_data_by_mount(
        command.request.mount
    )

    assert data_by_id.mount == command.request.mount
    assert data_by_id.pipette_name == command.request.pipetteName
    assert data_by_id == data_by_mount
