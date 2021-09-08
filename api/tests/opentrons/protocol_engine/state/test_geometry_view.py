"""Test state getters for retrieving geometry views of state."""
import pytest
from decoy import Decoy
from typing import cast

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocols.models import LabwareDefinition
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.types import Point, DeckSlotName

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import (
    CalibrationOffset,
    DeckSlotLocation,
    LoadedLabware,
    WellLocation,
    WellOrigin,
)
from opentrons.protocol_engine.state.labware import LabwareView
from opentrons.protocol_engine.state.geometry import GeometryView


@pytest.fixture
def subject(labware_view: LabwareView) -> GeometryView:
    """Get a GeometryView with its store dependencies mocked out."""
    return GeometryView(labware_view=labware_view)


def test_get_labware_parent_position(
    decoy: Decoy,
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should return a deck slot position for labware in a deck slot."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="b",
        definitionUri=uri_from_details(namespace="a", load_name="b", version=1),
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
    )
    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        Point(1, 2, 3)
    )

    result = subject.get_labware_parent_position("labware-id")

    assert result == Point(1, 2, 3)


def test_get_labware_origin_position(
    decoy: Decoy,
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should return a deck slot position with the labware's offset as its origin."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="defintion-uri",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
    )

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        Point(1, 2, 3)
    )

    expected_parent = Point(1, 2, 3)
    expected_offset = Point(
        x=well_plate_def.cornerOffsetFromSlot.x,
        y=well_plate_def.cornerOffsetFromSlot.y,
        z=well_plate_def.cornerOffsetFromSlot.z,
    )
    expected_point = expected_parent + expected_offset

    result = subject.get_labware_origin_position("labware-id")

    assert result == expected_point


def test_get_labware_highest_z(
    decoy: Decoy,
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get the absolute location of a labware's highest Z point."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
    )
    slot_pos = Point(1, 2, 3)
    calibration_offset = CalibrationOffset(x=1, y=-2, z=3)

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_calibration_offset("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        slot_pos
    )

    highest_z = subject.get_labware_highest_z("labware-id")

    assert highest_z == (well_plate_def.dimensions.zDimension + 3 + 3)


def test_get_all_labware_highest_z(
    decoy: Decoy,
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get the highest Z amongst all labware."""
    plate = LoadedLabware(
        id="plate-id",
        loadName="plate-load-name",
        definitionUri="plate-definition-uri",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
    )
    reservoir = LoadedLabware(
        id="reservoir-id",
        loadName="reservoir-load-name",
        definitionUri="reservoir-definition-uri",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_4),
    )

    plate_offset = CalibrationOffset(x=1, y=-2, z=3)
    reservoir_offset = CalibrationOffset(x=1, y=-2, z=3)

    decoy.when(labware_view.get_all()).then_return([plate, reservoir])
    decoy.when(labware_view.get("plate-id")).then_return(plate)
    decoy.when(labware_view.get("reservoir-id")).then_return(reservoir)

    decoy.when(labware_view.get_definition("plate-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_definition("reservoir-id")).then_return(reservoir_def)

    decoy.when(labware_view.get_calibration_offset("plate-id")).then_return(
        plate_offset
    )
    decoy.when(labware_view.get_calibration_offset("reservoir-id")).then_return(
        reservoir_offset
    )

    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        Point(1, 2, 3)
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_4)).then_return(
        Point(4, 5, 6)
    )

    plate_z = subject.get_labware_highest_z("plate-id")
    reservoir_z = subject.get_labware_highest_z("reservoir-id")
    all_z = subject.get_all_labware_highest_z()

    assert all_z == max(plate_z, reservoir_z)


def test_get_labware_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should return the slot position plus calibrated offset."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_4),
    )
    calibration_offset = CalibrationOffset(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_calibration_offset("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_4)).then_return(
        slot_pos
    )

    position = subject.get_labware_position(labware_id="labware-id")

    assert position == Point(
        x=slot_pos[0] + well_plate_def.cornerOffsetFromSlot.x + 1,
        y=slot_pos[1] + well_plate_def.cornerOffsetFromSlot.y - 2,
        z=slot_pos[2] + well_plate_def.cornerOffsetFromSlot.z + 3,
    )


def test_get_well_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_4),
    )
    calibration_offset = CalibrationOffset(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_calibration_offset("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_4)).then_return(
        slot_pos
    )
    decoy.when(labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result = subject.get_well_position("labware-id", "B2")

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x,
        y=slot_pos[1] - 2 + well_def.y,
        z=slot_pos[2] + 3 + well_def.z + well_def.depth,
    )


def test_get_well_position_with_top_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_4),
    )
    calibration_offset = CalibrationOffset(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_calibration_offset("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_4)).then_return(
        slot_pos
    )
    decoy.when(labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=WellLocation(origin=WellOrigin.TOP, offset=(1, 2, 3)),
    )

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 1,
        y=slot_pos[1] - 2 + well_def.y + 2,
        z=slot_pos[2] + 3 + well_def.z + well_def.depth + 3,
    )


def test_get_well_position_with_bottom_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    standard_deck_def: DeckDefinitionV2,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well bottom in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_4),
    )
    calibration_offset = CalibrationOffset(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_calibration_offset("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_4)).then_return(
        slot_pos
    )
    decoy.when(labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result = subject.get_well_position(
        labware_id="labware-id",
        well_name="B2",
        well_location=WellLocation(origin=WellOrigin.BOTTOM, offset=(3, 2, 1)),
    )

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 3,
        y=slot_pos[1] - 2 + well_def.y + 2,
        z=slot_pos[2] + 3 + well_def.z + 1,
    )


def test_get_effective_tip_length(
    decoy: Decoy,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get the effective tip length from a labware ID and pipette config."""
    pipette_config: PipetteDict = cast(
        PipetteDict,
        {
            "tip_overlap": {
                "default": 10,
                "opentrons/opentrons_96_tiprack_300ul/1": 20,
            }
        },
    )

    decoy.when(labware_view.get_tip_length("tip-rack-id")).then_return(50)

    decoy.when(labware_view.get_definition_uri("tip-rack-id")).then_return(
        "opentrons/opentrons_96_tiprack_300ul/1"
    )

    length_eff = subject.get_effective_tip_length(
        labware_id="tip-rack-id",
        pipette_config=pipette_config,
    )

    assert length_eff == 30

    decoy.when(labware_view.get_definition_uri("tip-rack-id")).then_return(
        "opentrons/something_else/1"
    )

    default_length_eff = subject.get_effective_tip_length(
        labware_id="tip-rack-id",
        pipette_config=pipette_config,
    )

    assert default_length_eff == 40


def test_get_tip_geometry(
    decoy: Decoy,
    tip_rack_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get a "well's" tip geometry."""
    pipette_config: PipetteDict = cast(PipetteDict, {"tip_overlap": {"default": 10}})
    well_def = tip_rack_def.wells["B2"]

    decoy.when(labware_view.get_tip_length("tip-rack-id")).then_return(50)

    decoy.when(labware_view.get_definition_uri("tip-rack-id")).then_return("")

    decoy.when(labware_view.get_well_definition("tip-rack-id", "B2")).then_return(
        well_def
    )

    tip_geometry = subject.get_tip_geometry(
        labware_id="tip-rack-id",
        well_name="B2",
        pipette_config=pipette_config,
    )

    assert tip_geometry.effective_length == 40
    assert tip_geometry.diameter == well_def.diameter  # type: ignore[misc]
    assert tip_geometry.volume == well_def.totalLiquidVolume


def test_get_tip_geometry_raises(
    decoy: Decoy,
    tip_rack_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should raise LabwareIsNotTipRackError if well is not circular."""
    pipette_config: PipetteDict = cast(PipetteDict, {"tip_overlap": {"default": 10}})
    well_def = tip_rack_def.wells["B2"]
    well_def.shape = "rectangular"

    with pytest.raises(errors.LabwareIsNotTipRackError):
        decoy.when(labware_view.get_tip_length("tip-rack-id")).then_return(0)

        decoy.when(labware_view.get_well_definition("tip-rack-id", "B2")).then_return(
            well_def
        )

        subject.get_tip_geometry(
            labware_id="tip-rack-id", well_name="B2", pipette_config=pipette_config
        )


def test_get_tip_drop_location(
    decoy: Decoy,
    tip_rack_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get relative drop tip location for a pipette/labware combo."""
    pipette_config: PipetteDict = cast(PipetteDict, {"return_tip_height": 0.7})

    decoy.when(labware_view.get_tip_length("tip-rack-id")).then_return(50)

    location = subject.get_tip_drop_location(
        labware_id="tip-rack-id", pipette_config=pipette_config
    )

    assert location == WellLocation(
        origin=WellOrigin.TOP,
        offset=(0, 0, -0.7 * 50),
    )


def test_get_tip_drop_location_with_trash(
    decoy: Decoy,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get relative drop tip location for a the fixed trash."""
    pipette_config: PipetteDict = cast(PipetteDict, {"return_tip_height": 0.7})

    decoy.when(
        labware_view.get_has_quirk(labware_id="labware-id", quirk="fixedTrash")
    ).then_return(True)

    location = subject.get_tip_drop_location(
        labware_id="labware-id",
        pipette_config=pipette_config,
    )

    assert location == WellLocation(origin=WellOrigin.TOP, offset=(0, 0, 0))
