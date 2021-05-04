"""Tests for equipment state in the protocol_engine state store."""
import pytest
from datetime import datetime
from typing import cast, Dict, Optional

from opentrons.types import MountType, Mount as HwMount
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_engine import commands as cmd, errors, StateStore
from opentrons.protocol_engine.types import PipetteName, WellLocation


CompletedLoadLabware = cmd.CompletedCommand[
    cmd.LoadPipetteRequest, cmd.LoadPipetteResult
]

CompletedAspirate = cmd.CompletedCommand[cmd.AspirateRequest, cmd.AspirateResult]

CompletedDispense = cmd.CompletedCommand[cmd.DispenseRequest, cmd.DispenseResult]


@pytest.fixture
def load_pipette_command(now: datetime) -> CompletedLoadLabware:
    """Get a completed load pipette command."""
    return cmd.CompletedCommand(
        request=cmd.LoadPipetteRequest(
            pipetteName=PipetteName.P300_SINGLE,
            mount=MountType.LEFT,
        ),
        result=cmd.LoadPipetteResult(pipetteId="pipette-id"),
        created_at=now,
        started_at=now,
        completed_at=now,
    )


@pytest.fixture
def aspirate_command(now: datetime) -> CompletedAspirate:
    """Get a completed aspirate command."""
    return cmd.CompletedCommand(
        request=cmd.AspirateRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="C2",
            wellLocation=WellLocation(),
            volume=50,
        ),
        result=cmd.AspirateResult(volume=50),
        created_at=now,
        started_at=now,
        completed_at=now,
    )


@pytest.fixture
def dispense_command(now: datetime) -> CompletedDispense:
    """Get a completed aspirate command."""
    return cmd.CompletedCommand(
        request=cmd.DispenseRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="C2",
            wellLocation=WellLocation(),
            volume=25,
        ),
        result=cmd.DispenseResult(volume=25),
        created_at=now,
        started_at=now,
        completed_at=now,
    )


@pytest.fixture
def loaded_store(
    store: StateStore,
    load_pipette_command: CompletedLoadLabware,
) -> StateStore:
    """Get a state store with a pipette pre-loaded."""
    store.handle_command(load_pipette_command, command_id="unique-id")
    return store


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


def test_initial_pipette_volume_data_by_id(loaded_store: StateStore) -> None:
    """get_aspirated_volume should return 0 for a new pipette."""
    volume = loaded_store.pipettes.get_aspirated_volume("pipette-id")
    assert volume == 0


def test_pipette_volume_adds_aspirate(
    loaded_store: StateStore,
    aspirate_command: CompletedAspirate,
) -> None:
    """get_aspirated_volume should return volume after an aspirate."""
    loaded_store.handle_command(aspirate_command, "aspirate-command-1")
    volume = loaded_store.pipettes.get_aspirated_volume("pipette-id")
    assert volume == 50

    loaded_store.handle_command(aspirate_command, "aspirate-command-2")
    volume = loaded_store.pipettes.get_aspirated_volume("pipette-id")
    assert volume == 100


def test_pipette_volume_subtracts_dispense(
    loaded_store: StateStore,
    aspirate_command: CompletedAspirate,
    dispense_command: CompletedDispense,
) -> None:
    """get_aspirated_volume should return volume after a dispense."""
    loaded_store.handle_command(aspirate_command, "aspirate-command-1")
    volume = loaded_store.pipettes.get_aspirated_volume("pipette-id")
    assert volume == 50

    loaded_store.handle_command(dispense_command, "dispense-command-1")
    volume = loaded_store.pipettes.get_aspirated_volume("pipette-id")
    assert volume == 25

    loaded_store.handle_command(dispense_command, "dispense-command-2")
    volume = loaded_store.pipettes.get_aspirated_volume("pipette-id")
    assert volume == 0

    loaded_store.handle_command(dispense_command, "dispense-command-3")
    volume = loaded_store.pipettes.get_aspirated_volume("pipette-id")
    assert volume == 0


def test_pipette_volume_raises_if_bad_id(store: StateStore) -> None:
    """get_aspirated_volume should return 0 for a new pipette."""
    with pytest.raises(errors.PipetteDoesNotExistError):
        store.pipettes.get_aspirated_volume("not-a-pipette-id")


def test_pipette_is_ready_to_aspirate_if_has_volume(
    loaded_store: StateStore,
    aspirate_command: CompletedAspirate,
) -> None:
    """Pipettes should be ready to aspirate if its already got volume."""
    pipette_config = cast(PipetteDict, {"ready_to_aspirate": False})

    loaded_store.handle_command(aspirate_command, "aspirate-command-1")
    is_ready = loaded_store.pipettes.get_is_ready_to_aspirate(
        pipette_id="pipette-id", pipette_config=pipette_config
    )

    assert is_ready is True


def test_pipette_is_ready_to_aspirate_if_no_volume_and_hc_says_ready(
    loaded_store: StateStore,
) -> None:
    """Pipettes should be ready to aspirate if HC says it is."""
    pipette_config = cast(PipetteDict, {"ready_to_aspirate": True})

    is_ready = loaded_store.pipettes.get_is_ready_to_aspirate(
        pipette_id="pipette-id", pipette_config=pipette_config
    )

    assert is_ready is True


def test_pipette_not_ready_to_aspirate_if_no_volume_and_hc_says_not_ready(
    loaded_store: StateStore,
) -> None:
    """Pipettes should be ready to aspirate if HC says it is."""
    pipette_config = cast(PipetteDict, {"ready_to_aspirate": False})

    is_ready = loaded_store.pipettes.get_is_ready_to_aspirate(
        pipette_id="pipette-id", pipette_config=pipette_config
    )

    assert is_ready is False
