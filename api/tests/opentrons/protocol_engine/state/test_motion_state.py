"""Tests for equipment state in the protocol_engine state store."""
import pytest
from datetime import datetime

from opentrons.protocol_engine import commands, DeckLocation, WellLocation
from opentrons.protocol_engine.state.labware import LabwareStore
from opentrons.protocol_engine.state.pipettes import PipetteStore
from opentrons.protocol_engine.state.geometry import GeometryStore
from opentrons.protocol_engine.state.motion import MotionStore


@pytest.fixture
def motion_store(
    mock_labware_store: LabwareStore,
    mock_pipette_store: PipetteStore,
    mock_geometry_store: GeometryStore,
) -> MotionStore:
    """Get a motion store with its dependencies mocked out."""
    return MotionStore(
        labware_store=mock_labware_store,
        pipette_store=mock_pipette_store,
        geometry_store=mock_geometry_store,
    )


def test_initial_location(motion_store: MotionStore) -> None:
    """get_current_location should return None initially."""
    assert motion_store.state.get_current_deck_location() is None


@pytest.mark.parametrize("req,res", [
    (
        commands.MoveToWellRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="B4",
        ),
        commands.MoveToWellResult()
    ),
    (
        commands.PickUpTipRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="B4",
        ),
        commands.PickUpTipResult()
    ),
    (
        commands.DropTipRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="B4",
        ),
        commands.DropTipResult()
    ),
    (
        commands.AspirateRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="B4",
            wellLocation=WellLocation(),
            volume=42,
        ),
        commands.AspirateResult(volume=42)
    ),
    (
        commands.DispenseRequest(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="B4",
            wellLocation=WellLocation(),
            volume=42,
        ),
        commands.DispenseResult(volume=42)
    ),
])
def test_handles_move_to_well_result(
    motion_store: MotionStore,
    now: datetime,
    req: commands.CommandRequestType,
    res: commands.CommandResultType,
) -> None:
    """A pipetting command should update the current location."""
    cmd: commands.CompletedCommandType = \
        commands.CompletedCommand(  # type: ignore[assignment]
            created_at=now,
            started_at=now,
            completed_at=now,
            request=req,
            result=res
        )

    motion_store.handle_completed_command(cmd)

    assert motion_store.state.get_current_deck_location() == DeckLocation(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B4"
    )
