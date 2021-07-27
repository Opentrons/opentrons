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
from opentrons.protocol_engine.types import DeckSlotLocation, WellLocation, WellOrigin
from opentrons.protocol_engine.state.labware import LabwareView, LabwareData
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
    labware_data = LabwareData(
        uri=uri_from_details(namespace="a", load_name="b", version=1),
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3),
    )
    decoy.when(labware_view.get_labware_data_by_id("labware-id")).then_return(
        labware_data
    )
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
    uri = uri_from_details(
        namespace=well_plate_def.namespace,
        load_name=well_plate_def.parameters.loadName,
        version=well_plate_def.version,
    )
    labware_data = LabwareData(
        uri=uri,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3),
    )

    decoy.when(labware_view.get_labware_data_by_id("labware-id")).then_return(
        labware_data
    )

    decoy.when(labware_view.get_definition_by_uri(uri)).then_return(well_plate_def)

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
    uri = uri_from_details(
        namespace=well_plate_def.namespace,
        load_name=well_plate_def.parameters.loadName,
        version=well_plate_def.version,
    )
    labware_data = LabwareData(
        uri=uri,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3),
    )

    decoy.when(labware_view.get_labware_data_by_id("labware-id")).then_return(
        labware_data
    )

    decoy.when(labware_view.get_definition_by_uri(uri)).then_return(well_plate_def)

    slot_pos = Point(1, 2, 3)

    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        slot_pos
    )

    highest_z = subject.get_labware_highest_z("labware-id")

    assert highest_z == (well_plate_def.dimensions.zDimension + slot_pos[2] + 3)


def test_get_all_labware_highest_z(
    decoy: Decoy,
    standard_deck_def: DeckDefinitionV2,
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get the highest Z amongst all labware."""
    plate_data = LabwareData(
        uri=uri_from_details(
            namespace=well_plate_def.namespace,
            load_name=well_plate_def.parameters.loadName,
            version=well_plate_def.version,
        ),
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3),
    )
    reservoir_data = LabwareData(
        uri=uri_from_details(
            namespace=reservoir_def.namespace,
            load_name=reservoir_def.parameters.loadName,
            version=reservoir_def.version,
        ),
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_4),
        calibration=(1, -2, 3),
    )

    decoy.when(labware_view.get_labware_data_by_id("plate-id")).then_return(plate_data)

    decoy.when(labware_view.get_labware_data_by_id("reservoir-id")).then_return(
        reservoir_data
    )

    decoy.when(labware_view.get_definition_by_uri(plate_data.uri)).then_return(
        well_plate_def
    )

    decoy.when(labware_view.get_definition_by_uri(reservoir_data.uri)).then_return(
        reservoir_def
    )

    decoy.when(labware_view.get_all_labware()).then_return(
        [
            ("plate-id", plate_data),
            ("reservoir-id", reservoir_data),
        ]
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
    labware_data = LabwareData(
        uri=uri_from_details(
            namespace=well_plate_def.namespace,
            load_name=well_plate_def.parameters.loadName,
            version=well_plate_def.version,
        ),
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_4),
        calibration=(1, -2, 3),
    )
    slot_pos = Point(4, 5, 6)

    decoy.when(labware_view.get_labware_data_by_id("abc")).then_return(labware_data)

    decoy.when(labware_view.get_definition_by_uri(labware_data.uri)).then_return(
        well_plate_def
    )

    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_4)).then_return(
        slot_pos
    )

    position = subject.get_labware_position(labware_id="abc")

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
    labware_data = LabwareData(
        uri=uri_from_details(
            namespace=well_plate_def.namespace,
            load_name=well_plate_def.parameters.loadName,
            version=well_plate_def.version,
        ),
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3),
    )
    well_def = well_plate_def.wells["B2"]
    slot_pos = Point(4, 5, 6)

    decoy.when(labware_view.get_definition_by_uri(labware_data.uri)).then_return(
        well_plate_def
    )

    decoy.when(labware_view.get_labware_data_by_id("plate-id")).then_return(
        labware_data
    )

    decoy.when(labware_view.get_well_definition("plate-id", "B2")).then_return(well_def)

    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        slot_pos
    )

    point = subject.get_well_position("plate-id", "B2")

    assert point == Point(
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
    labware_data = LabwareData(
        uri=uri_from_details(
            namespace=well_plate_def.namespace,
            load_name=well_plate_def.parameters.loadName,
            version=well_plate_def.version,
        ),
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3),
    )
    well_def = well_plate_def.wells["B2"]
    slot_pos = Point(4, 5, 6)

    decoy.when(labware_view.get_definition_by_uri(labware_data.uri)).then_return(
        well_plate_def
    )

    decoy.when(labware_view.get_labware_data_by_id("plate-id")).then_return(
        labware_data
    )

    decoy.when(labware_view.get_well_definition("plate-id", "B2")).then_return(well_def)

    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        slot_pos
    )

    point = subject.get_well_position(
        "plate-id", "B2", WellLocation(origin=WellOrigin.TOP, offset=(1, 2, 3))
    )

    assert point == Point(
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
    """It should be able to get the position of a well top in a labware."""
    labware_data = LabwareData(
        uri=uri_from_details(
            namespace=well_plate_def.namespace,
            load_name=well_plate_def.parameters.loadName,
            version=well_plate_def.version,
        ),
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1, -2, 3),
    )
    well_def = well_plate_def.wells["B2"]
    slot_pos = Point(4, 5, 6)

    decoy.when(labware_view.get_definition_by_uri(labware_data.uri)).then_return(
        well_plate_def
    )

    decoy.when(labware_view.get_labware_data_by_id("plate-id")).then_return(
        labware_data
    )

    decoy.when(labware_view.get_well_definition("plate-id", "B2")).then_return(well_def)

    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        slot_pos
    )

    point = subject.get_well_position(
        "plate-id", "B2", WellLocation(origin=WellOrigin.BOTTOM, offset=(3, 2, 1))
    )

    assert point == Point(
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
        labware_view.get_labware_has_quirk(labware_id="labware-id", quirk="fixedTrash")
    ).then_return(True)

    location = subject.get_tip_drop_location(
        labware_id="labware-id",
        pipette_config=pipette_config,
    )

    assert location == WellLocation(origin=WellOrigin.TOP, offset=(0, 0, 0))
