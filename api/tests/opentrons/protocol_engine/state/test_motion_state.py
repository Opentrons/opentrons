"""Tests for equipment state in the protocol_engine state store."""
import pytest
from datetime import datetime
from opentrons.protocol_engine import StateStore, commands as cmd
from opentrons.protocol_engine.state import LocationData


def test_initial_location(store: StateStore) -> None:
    """get_current_location should return None initially."""
    assert store.motion.get_current_location_data() is None


@pytest.mark.parametrize("req,res", [
    (
        cmd.MoveToWellRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="B4"
        ),
        cmd.MoveToWellResult()
    ),
    (
        cmd.PickUpTipRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="B4"
        ),
        cmd.PickUpTipResult()
    ),
    (
        cmd.DropTipRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="B4"
        ),
        cmd.DropTipResult()
    ),
])
def test_handles_move_to_well_result(
    store: StateStore,
    now: datetime,
    req: cmd.CommandRequestType,
    res: cmd.CommandResultType,
) -> None:
    """A pipetting command should update the current location."""
    command: cmd.CompletedCommandType = \
        cmd.CompletedCommand(  # type: ignore[assignment]
            created_at=now,
            started_at=now,
            completed_at=now,
            request=req,
            result=res
        )

    store.handle_command(command, "command-id")
    assert store.motion.get_current_location_data() == LocationData(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B4"
    )
