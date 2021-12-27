"""Tests for pipette state changes in the protocol_engine state store."""
import pytest
from datetime import datetime

from opentrons.types import MountType
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.types import PipetteName, LoadedPipette
from opentrons.protocol_engine.actions import UpdateCommandAction
from opentrons.protocol_engine.state.pipettes import (
    PipetteStore,
    PipetteState,
    CurrentWell,
)

from .command_fixtures import (
    create_load_pipette_command,
    create_aspirate_command,
    create_dispense_command,
    create_pick_up_tip_command,
    create_drop_tip_command,
    create_move_to_well_command,
)


@pytest.fixture
def subject() -> PipetteStore:
    """Get a PipetteStore test subject for all subsequent tests."""
    return PipetteStore()


def test_sets_initial_state(subject: PipetteStore) -> None:
    """It should initialize its state object properly."""
    result = subject.state

    assert result == PipetteState(
        pipettes_by_id={},
        aspirated_volume_by_id={},
        current_well=None,
        has_tip_by_id={},
    )


def test_handles_load_pipette(subject: PipetteStore) -> None:
    """It should add the pipette data to the state."""
    command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.handle_action(UpdateCommandAction(command=command))

    result = subject.state

    assert result.pipettes_by_id["pipette-id"] == LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )
    assert result.aspirated_volume_by_id["pipette-id"] == 0


def test_pipette_volume_adds_aspirate(subject: PipetteStore) -> None:
    """It should add volume to pipette after an aspirate."""
    load_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )
    aspirate_command = create_aspirate_command(
        pipette_id="pipette-id",
        volume=42,
    )

    subject.handle_action(UpdateCommandAction(command=load_command))
    subject.handle_action(UpdateCommandAction(command=aspirate_command))

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 42

    subject.handle_action(UpdateCommandAction(command=aspirate_command))

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 84


def test_pipette_volume_subtracts_dispense(subject: PipetteStore) -> None:
    """It should subtract volume from pipette after a dispense."""
    load_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )
    aspirate_command = create_aspirate_command(
        pipette_id="pipette-id",
        volume=42,
    )
    dispense_command = create_dispense_command(
        pipette_id="pipette-id",
        volume=21,
    )

    subject.handle_action(UpdateCommandAction(command=load_command))
    subject.handle_action(UpdateCommandAction(command=aspirate_command))
    subject.handle_action(UpdateCommandAction(command=dispense_command))

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 21

    subject.handle_action(UpdateCommandAction(command=dispense_command))

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 0

    subject.handle_action(UpdateCommandAction(command=dispense_command))

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 0


@pytest.mark.parametrize(
    ("command", "expected_location"),
    (
        (
            create_aspirate_command(
                pipette_id="aspirate-pipette-id",
                labware_id="aspirate-labware-id",
                well_name="aspirate-well-name",
                volume=1337,
            ),
            CurrentWell(
                pipette_id="aspirate-pipette-id",
                labware_id="aspirate-labware-id",
                well_name="aspirate-well-name",
            ),
        ),
        (
            create_dispense_command(
                pipette_id="dispense-pipette-id",
                labware_id="dispense-labware-id",
                well_name="dispense-well-name",
                volume=1337,
            ),
            CurrentWell(
                pipette_id="dispense-pipette-id",
                labware_id="dispense-labware-id",
                well_name="dispense-well-name",
            ),
        ),
        (
            create_pick_up_tip_command(
                pipette_id="pick-up-tip-pipette-id",
                labware_id="pick-up-tip-labware-id",
                well_name="pick-up-tip-well-name",
            ),
            CurrentWell(
                pipette_id="pick-up-tip-pipette-id",
                labware_id="pick-up-tip-labware-id",
                well_name="pick-up-tip-well-name",
            ),
        ),
        (
            create_drop_tip_command(
                pipette_id="drop-tip-pipette-id",
                labware_id="drop-tip-labware-id",
                well_name="drop-tip-well-name",
            ),
            CurrentWell(
                pipette_id="drop-tip-pipette-id",
                labware_id="drop-tip-labware-id",
                well_name="drop-tip-well-name",
            ),
        ),
        (
            create_move_to_well_command(
                pipette_id="move-to-well-pipette-id",
                labware_id="move-to-well-labware-id",
                well_name="move-to-well-well-name",
            ),
            CurrentWell(
                pipette_id="move-to-well-pipette-id",
                labware_id="move-to-well-labware-id",
                well_name="move-to-well-well-name",
            ),
        ),
    ),
)
def test_movement_commands_update_current_well(
    command: cmd.Command,
    expected_location: CurrentWell,
    subject: PipetteStore,
) -> None:
    """It should save the last used pipette, labware, and well for movement commands."""
    load_pipette_command = create_load_pipette_command(
        pipette_id=command.params.pipetteId,  # type: ignore[arg-type, union-attr]
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.handle_action(UpdateCommandAction(command=load_pipette_command))
    subject.handle_action(UpdateCommandAction(command=command))

    assert subject.state.current_well == expected_location


def test_home_clears_current_well(subject: PipetteStore) -> None:
    """It clear the last accessed well with a home command."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )
    move_command = create_move_to_well_command(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="well-name",
    )
    home_command = cmd.Home(
        id="command-id-2",
        key="command-key-2",
        status=cmd.CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2021, month=1, day=1),
        params=cmd.HomeParams(),
        result=cmd.HomeResult(),
    )

    subject.handle_action(UpdateCommandAction(command=load_pipette_command))
    subject.handle_action(UpdateCommandAction(command=move_command))
    subject.handle_action(UpdateCommandAction(command=home_command))

    assert subject.state.current_well is None


def test_tip_commands_update_has_tip(subject: PipetteStore) -> None:
    """It should update has_tip after a successful pickUpTip command."""
    pipette_id = "pipette-id"
    load_pipette_command = create_load_pipette_command(
        pipette_id=pipette_id,
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    pick_up_tip_command = create_pick_up_tip_command(
        pipette_id=pipette_id,
        labware_id="pick-up-tip-labware-id",
        well_name="pick-up-tip-well-name",
    )

    drop_tip_command = create_drop_tip_command(
        pipette_id=pipette_id,
        labware_id="drop-tip-labware-id",
        well_name="drop-tip-well-name",
    )
    subject.handle_action(UpdateCommandAction(command=load_pipette_command))
    subject.handle_action(UpdateCommandAction(command=pick_up_tip_command))

    assert subject.state.attached_tip_labware_by_id[
               pipette_id] == "pick-up-tip-labware-id"

    subject.handle_action(UpdateCommandAction(command=drop_tip_command))

    assert subject.state.attached_tip_labware_by_id[pipette_id] is None
