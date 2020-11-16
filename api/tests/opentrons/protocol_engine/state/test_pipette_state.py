"""Tests for equipment state in the protocol_engine state store."""
import pytest
from datetime import datetime
from typing import cast, Dict, Optional

from opentrons.types import MountType, Mount as HwMount
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_engine import command_models as cmd, errors, StateStore


CompletedLoadLabware = cmd.CompletedCommand[
    cmd.LoadPipetteRequest,
    cmd.LoadPipetteResult
]


@pytest.fixture
def load_pipette_command(now: datetime) -> CompletedLoadLabware:
    """Get a completed load pipette command."""
    return cmd.CompletedCommand(
        request=cmd.LoadPipetteRequest(
            pipetteName="p300_single",
            mount=MountType.LEFT,
        ),
        result=cmd.LoadPipetteResult(pipetteId='pipette-id'),
        created_at=now,
        started_at=now,
        completed_at=now,
    )


def test_initial_pipette_data_by_id(store: StateStore) -> None:
    """get_pipette_data_by_id should raise if ID doesn't exist."""
    with pytest.raises(errors.PipetteDoesNotExistError):
        store.pipettes.get_pipette_data_by_id("asdfghjkl")


def test_initial_pipette_data_by_mount(store: StateStore) -> None:
    """get_pipette_data_by_id should return None if ID doesn't exist."""
    assert store.pipettes.get_pipette_data_by_mount(MountType.LEFT) is None
    assert store.pipettes.get_pipette_data_by_mount(MountType.RIGHT) is None


def test_handles_load_pipette(
    load_pipette_command: CompletedLoadLabware,
    store: StateStore,
) -> None:
    """It should add the pipette data to the state."""
    store.handle_command(load_pipette_command, command_id="unique-id")

    data_by_id = store.pipettes.get_pipette_data_by_id(
        load_pipette_command.result.pipetteId
    )
    data_by_mount = store.pipettes.get_pipette_data_by_mount(
        load_pipette_command.request.mount
    )

    assert data_by_id.mount == load_pipette_command.request.mount
    assert data_by_id.pipette_name == load_pipette_command.request.pipetteName
    assert data_by_id == data_by_mount


def test_get_hardware_pipette(
    load_pipette_command: CompletedLoadLabware,
    store: StateStore,
) -> None:
    """It maps a pipette ID to a config given the HC's attached pipettes."""
    pipette_config = cast(PipetteDict, {"name": "p300_single"})
    attached_pipettes: Dict[HwMount, Optional[PipetteDict]] = {
        HwMount.LEFT: pipette_config,
        HwMount.RIGHT: None,
    }

    load_pipette_command.request.mount = MountType.LEFT
    load_pipette_command.result.pipetteId = "left-id"
    store.handle_command(load_pipette_command, command_id="load-left")

    load_pipette_command.request.mount = MountType.RIGHT
    load_pipette_command.result.pipetteId = "right-id"
    store.handle_command(load_pipette_command, command_id="load-right")

    hw_pipette = store.pipettes.get_hardware_pipette(
        pipette_id="left-id",
        attached_pipettes=attached_pipettes,
    )

    assert hw_pipette.mount == HwMount.LEFT
    assert hw_pipette.config == {"name": "p300_single"}

    with pytest.raises(errors.PipetteNotAttachedError):
        store.pipettes.get_hardware_pipette(
            pipette_id="right-id",
            attached_pipettes=attached_pipettes,
        )


def test_get_hardware_pipette_raises_with_name_mismatch(
    load_pipette_command: CompletedLoadLabware,
    store: StateStore,
) -> None:
    """It maps a pipette ID to a config given the HC's attached pipettes."""
    pipette_config = cast(PipetteDict, {"name": "p300_single_gen2"})
    attached_pipettes: Dict[HwMount, Optional[PipetteDict]] = {
        HwMount.LEFT: pipette_config,
        HwMount.RIGHT: None,
    }

    store.handle_command(load_pipette_command, command_id="load-left")

    with pytest.raises(errors.PipetteNotAttachedError):
        store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=attached_pipettes,
        )
