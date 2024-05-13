"""Test pick up tip commands."""
from decoy import Decoy

from opentrons.types import MountType, Point

from opentrons.protocol_engine import WellLocation, WellOffset, DeckPoint
from opentrons.protocol_engine.execution import MovementHandler, TipHandler
from opentrons.protocol_engine.resources.model_utils import ModelUtils
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.types import TipGeometry

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.pick_up_tip import (
    PickUpTipParams,
    PickUpTipResult,
    PickUpTipImplementation,
)


async def test_pick_up_tip_implementation(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    tip_handler: TipHandler,
    model_utils: ModelUtils,
) -> None:
    """A PickUpTip command should have an execution implementation."""
    subject = PickUpTipImplementation(
        state_view=state_view,
        movement=movement,
        tip_handler=tip_handler,
        model_utils=model_utils,
    )

    decoy.when(state_view.pipettes.get_mount("pipette-id")).then_return(MountType.LEFT)

    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    ).then_return(Point(x=111, y=222, z=333))

    decoy.when(
        await tip_handler.pick_up_tip(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A3",
        )
    ).then_return(TipGeometry(length=42, diameter=5, volume=300))

    result = await subject.execute(
        PickUpTipParams(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="A3",
            wellLocation=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    )

    assert result == SuccessData(
        public=PickUpTipResult(
            tipLength=42,
            tipVolume=300,
            tipDiameter=5,
            position=DeckPoint(x=111, y=222, z=333),
        ),
        private=None,
    )
