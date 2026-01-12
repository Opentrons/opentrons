"""Test pipette seal commands."""

from datetime import datetime
from unittest.mock import sentinel

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError
from opentrons_shared_data.labware import load_definition
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    labware_definition_type_adapter,
)

from opentrons.hardware_control import OT3HardwareControlAPI
from opentrons.protocol_engine import (
    DeckPoint,
    PickUpTipWellLocation,
    WellLocation,
    WellOffset,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData
from opentrons.protocol_engine.commands.movement_common import StallOrCollisionError
from opentrons.protocol_engine.commands.seal_pipette_to_tip import (
    SealPipetteToTipImplementation,
    SealPipetteToTipParams,
    SealPipetteToTipResult,
)
from opentrons.protocol_engine.errors import PickUpTipTipNotAttachedError
from opentrons.protocol_engine.execution import (
    GantryMover,
    MovementHandler,
    PipettingHandler,
    TipHandler,
)
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import (
    AspiratedFluid,
    FluidKind,
    LabwareWellId,
    TipGeometry,
)
from opentrons.types import MountType, Point


@pytest.fixture
def evotips_definition() -> LabwareDefinition:
    """A fixturee of the evotips definition."""
    # TODO (chb 2025-01-29): When we migrate all labware to v3 we can clean this up
    return labware_definition_type_adapter.validate_python(
        load_definition("ev_resin_tips_flex_96_labware", 1)
    )


async def test_success(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    tip_handler: TipHandler,
    model_utils: ModelUtils,
    gantry_mover: GantryMover,
    evotips_definition: LabwareDefinition,
    ot3_hardware_api: OT3HardwareControlAPI,
    pipetting: PipettingHandler,
) -> None:
    """A PickUpTip command should have an execution implementation."""
    subject = SealPipetteToTipImplementation(
        state_view=state_view,
        movement=movement,
        tip_handler=tip_handler,
        model_utils=model_utils,
        gantry_mover=gantry_mover,
        hardware_api=ot3_hardware_api,
        pipetting=pipetting,
    )

    decoy.when(state_view.pipettes.get_mount("pipette-id")).then_return(MountType.LEFT)

    decoy.when(
        state_view.geometry.convert_pick_up_tip_well_location(
            well_location=PickUpTipWellLocation(offset=WellOffset(x=1, y=2, z=3))
        )
    ).then_return(WellLocation(offset=WellOffset(x=1, y=2, z=3)))

    decoy.when(state_view.labware.get_definition("labware-id")).then_return(
        evotips_definition
    )
    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
            current_well=None,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
            operation_volume=None,
            offset_pipette_for_reservoir_subwells=False,
        )
    ).then_return(Point(x=111, y=222, z=333))
    decoy.when(
        state_view.geometry.get_nominal_tip_geometry("pipette-id", "labware-id", "A3")
    ).then_return(TipGeometry(length=42, diameter=5, volume=300))

    decoy.when(
        await tip_handler.pick_up_tip(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A3",
        )
    ).then_return(TipGeometry(length=42, diameter=5, volume=300))

    result = await subject.execute(
        SealPipetteToTipParams(
            pipetteId="pipette-id",
            labwareId="labware-id",
            wellName="A3",
            wellLocation=PickUpTipWellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    )

    assert result == SuccessData(
        public=SealPipetteToTipResult(
            tipLength=42,
            tipVolume=300,
            tipDiameter=5,
            position=DeckPoint(x=111, y=222, z=333),
        ),
        state_update=update_types.StateUpdate(
            pipette_tip_state=update_types.PipetteTipStateUpdate(
                pipette_id="pipette-id",
                tip_geometry=TipGeometry(length=42, diameter=5, volume=300),
                tip_source=LabwareWellId(labware_id="labware-id", well_name="A3"),
            ),
            pipette_aspirated_fluid=update_types.PipetteAspiratedFluidUpdate(
                pipette_id="pipette-id",
                fluid=AspiratedFluid(kind=FluidKind.LIQUID, volume=1000),
            ),
            pipette_location=update_types.PipetteLocationUpdate(
                pipette_id="pipette-id",
                new_location=LabwareWellId(labware_id="labware-id", well_name="A3"),
                new_deck_point=DeckPoint(x=111, y=222, z=333),
            ),
        ),
    )


async def test_no_tip_physically_missing_error(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    tip_handler: TipHandler,
    model_utils: ModelUtils,
    gantry_mover: GantryMover,
    ot3_hardware_api: OT3HardwareControlAPI,
    pipetting: PipettingHandler,
    evotips_definition: LabwareDefinition,
) -> None:
    """It should not return a TipPhysicallyMissingError even though evotips do not sit high enough on the pipette to be detected by the tip sensor."""
    subject = SealPipetteToTipImplementation(
        state_view=state_view,
        movement=movement,
        tip_handler=tip_handler,
        model_utils=model_utils,
        gantry_mover=gantry_mover,
        hardware_api=ot3_hardware_api,
        pipetting=pipetting,
    )

    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    error_id = "error-id"
    error_created_at = datetime(1234, 5, 6)

    decoy.when(
        state_view.geometry.convert_pick_up_tip_well_location(
            well_location=PickUpTipWellLocation(offset=WellOffset())
        )
    ).then_return(WellLocation(offset=WellOffset()))

    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(offset=WellOffset()),
            current_well=None,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
            operation_volume=None,
            offset_pipette_for_reservoir_subwells=False,
        )
    ).then_return(Point(x=111, y=222, z=333))
    decoy.when(
        state_view.geometry.get_nominal_tip_geometry(pipette_id, labware_id, well_name)
    ).then_return(TipGeometry(length=42, diameter=5, volume=300))

    decoy.when(
        await tip_handler.pick_up_tip(
            pipette_id=pipette_id, labware_id=labware_id, well_name=well_name
        )
    ).then_raise(PickUpTipTipNotAttachedError(tip_geometry=sentinel.tip_geometry))
    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(error_created_at)
    decoy.when(state_view.labware.get_definition(labware_id)).then_return(
        evotips_definition
    )

    result = await subject.execute(
        SealPipetteToTipParams(
            pipetteId=pipette_id, labwareId=labware_id, wellName=well_name
        )
    )

    assert result == SuccessData(
        public=SealPipetteToTipResult(
            tipLength=42,
            tipVolume=300,
            tipDiameter=5,
            position=DeckPoint(x=111, y=222, z=333),
        ),
        state_update=update_types.StateUpdate(
            pipette_tip_state=update_types.PipetteTipStateUpdate(
                pipette_id="pipette-id",
                tip_geometry=TipGeometry(length=42, diameter=5, volume=300),
                tip_source=LabwareWellId(
                    labware_id="labware-id", well_name="well-name"
                ),
            ),
            pipette_aspirated_fluid=update_types.PipetteAspiratedFluidUpdate(
                pipette_id="pipette-id",
                fluid=AspiratedFluid(kind=FluidKind.LIQUID, volume=1000),
            ),
            pipette_location=update_types.PipetteLocationUpdate(
                pipette_id="pipette-id",
                new_location=LabwareWellId(
                    labware_id="labware-id", well_name="well-name"
                ),
                new_deck_point=DeckPoint(x=111, y=222, z=333),
            ),
        ),
    )


async def test_stall_error(
    decoy: Decoy,
    state_view: StateView,
    movement: MovementHandler,
    tip_handler: TipHandler,
    model_utils: ModelUtils,
    gantry_mover: GantryMover,
    ot3_hardware_api: OT3HardwareControlAPI,
    pipetting: PipettingHandler,
    evotips_definition: LabwareDefinition,
) -> None:
    """It should return a TipPhysicallyMissingError if the HW API indicates that."""
    subject = SealPipetteToTipImplementation(
        state_view=state_view,
        movement=movement,
        tip_handler=tip_handler,
        model_utils=model_utils,
        gantry_mover=gantry_mover,
        hardware_api=ot3_hardware_api,
        pipetting=pipetting,
    )

    pipette_id = "pipette-id"
    labware_id = "labware-id"
    well_name = "well-name"
    error_id = "error-id"
    error_created_at = datetime(1234, 5, 6)

    decoy.when(
        state_view.geometry.convert_pick_up_tip_well_location(
            well_location=PickUpTipWellLocation(offset=WellOffset())
        )
    ).then_return(WellLocation(offset=WellOffset()))

    decoy.when(
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(offset=WellOffset()),
            current_well=None,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
            operation_volume=None,
            offset_pipette_for_reservoir_subwells=False,
        )
    ).then_raise(StallOrCollisionDetectedError())

    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(error_created_at)
    decoy.when(state_view.labware.get_definition(labware_id)).then_return(
        evotips_definition
    )

    result = await subject.execute(
        SealPipetteToTipParams(
            pipetteId=pipette_id, labwareId=labware_id, wellName=well_name
        )
    )

    assert result == DefinedErrorData(
        public=StallOrCollisionError.model_construct(
            id=error_id, createdAt=error_created_at, wrappedErrors=[matchers.Anything()]
        ),
        state_update=update_types.StateUpdate(
            pipette_location=update_types.CLEAR,
        ),
    )
