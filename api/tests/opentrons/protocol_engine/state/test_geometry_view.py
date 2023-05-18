"""Test state getters for retrieving geometry views of state."""
import inspect

import pytest
from decoy import Decoy
from typing import cast, List, Tuple, Union, Optional

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import Point, DeckSlotName

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    LabwareOffsetVector,
    DeckSlotLocation,
    ModuleLocation,
    ModuleOffsetVector,
    LoadedLabware,
    LoadedModule,
    WellLocation,
    WellOrigin,
    DropTipWellLocation,
    DropTipWellOrigin,
    WellOffset,
    Dimensions,
    DeckType,
    CurrentWell,
)
from opentrons.protocol_engine.state import move_types
from opentrons.protocol_engine.state.labware import LabwareView
from opentrons.protocol_engine.state.modules import ModuleView
from opentrons.protocol_engine.state.pipettes import PipetteView
from opentrons.protocol_engine.state.geometry import GeometryView


@pytest.fixture
def labware_view(decoy: Decoy) -> LabwareView:
    """Get a mock in the shape of a LabwareView."""
    return decoy.mock(cls=LabwareView)


@pytest.fixture
def module_view(decoy: Decoy) -> ModuleView:
    """Get a mock in the shape of a ModuleView."""
    return decoy.mock(cls=ModuleView)


@pytest.fixture
def mock_pipette_view(decoy: Decoy) -> PipetteView:
    """Get a mock in the shape of a PipetteView."""
    return decoy.mock(cls=PipetteView)


@pytest.fixture(autouse=True)
def patch_mock_move_types(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out move_types.py functions."""
    for name, func in inspect.getmembers(move_types, inspect.isfunction):
        monkeypatch.setattr(move_types, name, decoy.mock(func=func))


@pytest.fixture
def subject(
    labware_view: LabwareView, module_view: ModuleView, mock_pipette_view: PipetteView
) -> GeometryView:
    """Get a GeometryView with its store dependencies mocked out."""
    return GeometryView(
        labware_view=labware_view,
        module_view=module_view,
        pipette_view=mock_pipette_view,
    )


def test_get_labware_parent_position(
    decoy: Decoy,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should return a deck slot position for labware in a deck slot."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="b",
        definitionUri=uri_from_details(namespace="a", load_name="b", version=1),
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId=None,
    )
    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        Point(1, 2, 3)
    )

    result = subject.get_labware_parent_position("labware-id")

    assert result == Point(1, 2, 3)


def test_raise_error_for_off_deck_labware_parent(
    decoy: Decoy,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """Test raise error when fetching parent for labware that's off-deck."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="b",
        definitionUri=uri_from_details(namespace="a", load_name="b", version=1),
        location=OFF_DECK_LOCATION,
        offsetId=None,
    )
    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    with pytest.raises(errors.LabwareNotOnDeckError):
        subject.get_labware_parent_position("labware-id")


def test_get_labware_parent_position_on_module(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    ot2_standard_deck_def: DeckDefinitionV3,
    subject: GeometryView,
) -> None:
    """It should return a module position for labware on a module."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="b",
        definitionUri=uri_from_details(namespace="a", load_name="b", version=1),
        location=ModuleLocation(moduleId="module-id"),
        offsetId=None,
    )

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        Point(1, 2, 3)
    )
    decoy.when(labware_view.get_deck_definition()).then_return(ot2_standard_deck_def)
    decoy.when(
        module_view.get_nominal_module_offset(
            module_id="module-id", deck_type=DeckType.OT2_STANDARD
        )
    ).then_return(LabwareOffsetVector(x=4, y=5, z=6))
    decoy.when(module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetVector(x=0, y=0, z=0)
    )

    result = subject.get_labware_parent_position("labware-id")

    assert result == Point(5, 7, 9)


def test_get_labware_origin_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should return a deck slot position with the labware's offset as its origin."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId=None,
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
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get the absolute location of a labware's highest Z point."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId="offset-id",
    )
    slot_pos = Point(1, 2, 3)
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        slot_pos
    )

    highest_z = subject.get_labware_highest_z("labware-id")

    assert highest_z == (well_plate_def.dimensions.zDimension + 3 + 3)


def test_get_module_labware_highest_z(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    module_view: ModuleView,
    ot2_standard_deck_def: DeckDefinitionV3,
    subject: GeometryView,
) -> None:
    """It should get the absolute location of a labware's highest Z point."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=ModuleLocation(moduleId="module-id"),
        offsetId="offset-id",
    )
    slot_pos = Point(1, 2, 3)
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        slot_pos
    )
    decoy.when(module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    )
    decoy.when(labware_view.get_deck_definition()).then_return(ot2_standard_deck_def)
    decoy.when(
        module_view.get_nominal_module_offset(
            module_id="module-id", deck_type=DeckType.OT2_STANDARD
        )
    ).then_return(LabwareOffsetVector(x=4, y=5, z=6))
    decoy.when(module_view.get_height_over_labware("module-id")).then_return(0.5)
    decoy.when(module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetVector(x=0, y=0, z=0)
    )

    highest_z = subject.get_labware_highest_z("labware-id")

    assert highest_z == (well_plate_def.dimensions.zDimension + 3 + 3 + 6 + 0.5)


def test_get_all_labware_highest_z_no_equipment(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should return 0 if no loaded equipment."""
    decoy.when(module_view.get_all()).then_return([])
    decoy.when(labware_view.get_all()).then_return([])

    result = subject.get_all_labware_highest_z()

    assert result == 0


def test_get_all_labware_highest_z(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    reservoir_def: LabwareDefinition,
    falcon_tuberack_def: LabwareDefinition,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should get the highest Z amongst all labware."""
    plate = LoadedLabware(
        id="plate-id",
        loadName="plate-load-name",
        definitionUri="plate-definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId="plate-offset-id",
    )
    off_deck_lw = LoadedLabware(
        id="off-deck-plate-id",
        loadName="off-deck-plate-load-name",
        definitionUri="off-deck-plate-definition-uri",
        location=OFF_DECK_LOCATION,
        offsetId="plate-offset-id",
    )
    reservoir = LoadedLabware(
        id="reservoir-id",
        loadName="reservoir-load-name",
        definitionUri="reservoir-definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="reservoir-offset-id",
    )

    plate_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    off_deck_lw_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    reservoir_offset = LabwareOffsetVector(x=1, y=-2, z=3)

    decoy.when(module_view.get_all()).then_return([])

    decoy.when(labware_view.get_all()).then_return([plate, off_deck_lw, reservoir])
    decoy.when(labware_view.get("plate-id")).then_return(plate)
    decoy.when(labware_view.get("off-deck-plate-id")).then_return(off_deck_lw)
    decoy.when(labware_view.get("reservoir-id")).then_return(reservoir)

    decoy.when(labware_view.get_definition("plate-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_definition("off-deck-plate-id")).then_return(
        falcon_tuberack_def  # Something tall.
    )
    decoy.when(labware_view.get_definition("reservoir-id")).then_return(reservoir_def)

    decoy.when(labware_view.get_labware_offset_vector("plate-id")).then_return(
        plate_offset
    )
    decoy.when(labware_view.get_labware_offset_vector("off-deck-plate-id")).then_return(
        off_deck_lw_offset
    )
    decoy.when(labware_view.get_labware_offset_vector("reservoir-id")).then_return(
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

    # Should exclude the off-deck plate.
    assert all_z == max(plate_z, reservoir_z)


def test_get_all_labware_highest_z_with_modules(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should get the highest Z including modules."""
    module_1 = LoadedModule.construct(id="module-id-1")  # type: ignore[call-arg]
    module_2 = LoadedModule.construct(id="module-id-2")  # type: ignore[call-arg]

    decoy.when(labware_view.get_all()).then_return([])
    decoy.when(module_view.get_all()).then_return([module_1, module_2])
    decoy.when(module_view.get_overall_height("module-id-1")).then_return(42.0)
    decoy.when(module_view.get_overall_height("module-id-2")).then_return(1337.0)

    result = subject.get_all_labware_highest_z()

    assert result == 1337.0


@pytest.mark.parametrize(
    ["location", "min_z_height", "expected_min_z"],
    [
        (None, None, 0),
        (None, 1337, 1337),
        (CurrentWell("other-pipette-id", "labware-id", "well-name"), None, 0),
        (CurrentWell("pipette-id", "other-labware-id", "well-name"), None, 0),
        (CurrentWell("pipette-id", "labware-id", "well-name"), None, 20.22),
        (CurrentWell("pipette-id", "labware-id", "well-name"), 1.23, 20.22),
        (CurrentWell("pipette-id", "labware-id", "well-name"), 1337, 1337),
    ],
)
def test_get_min_travel_z(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    module_view: ModuleView,
    location: Optional[CurrentWell],
    min_z_height: Optional[float],
    expected_min_z: float,
    subject: GeometryView,
) -> None:
    """It should find the minimum travel z."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        offsetId="offset-id",
    )

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
        LabwareOffsetVector(x=0, y=0, z=3)
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        Point(0, 0, 3)
    )

    decoy.when(module_view.get_all()).then_return([])
    decoy.when(labware_view.get_all()).then_return([])

    min_travel_z = subject.get_min_travel_z(
        "pipette-id", "labware-id", location, min_z_height
    )

    assert min_travel_z == expected_min_z


def test_get_labware_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should return the slot position plus calibrated offset."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="reservoir-offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
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
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
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


def test_get_well_height(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the well height."""
    well_def = well_plate_def.wells["B2"]
    decoy.when(labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    assert subject.get_well_height("labware-id", "B2") == 10.67


def test_get_module_labware_well_position(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    module_view: ModuleView,
    ot2_standard_deck_def: DeckDefinitionV3,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well top in a labware on module."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=ModuleLocation(moduleId="module-id"),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_4)).then_return(
        slot_pos
    )
    decoy.when(labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )
    decoy.when(module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_4)
    )
    decoy.when(labware_view.get_deck_definition()).then_return(ot2_standard_deck_def)
    decoy.when(
        module_view.get_nominal_module_offset(
            module_id="module-id", deck_type=DeckType.OT2_STANDARD
        )
    ).then_return(LabwareOffsetVector(x=4, y=5, z=6))
    decoy.when(module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetVector(x=0, y=0, z=0)
    )

    result = subject.get_well_position("labware-id", "B2")
    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 4,
        y=slot_pos[1] - 2 + well_def.y + 5,
        z=slot_pos[2] + 3 + well_def.z + well_def.depth + 6,
    )


def test_get_well_position_with_top_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well top in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
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
        well_location=WellLocation(
            origin=WellOrigin.TOP,
            offset=WellOffset(x=1, y=2, z=3),
        ),
    )

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 1,
        y=slot_pos[1] - 2 + well_def.y + 2,
        z=slot_pos[2] + 3 + well_def.z + well_def.depth + 3,
    )


def test_get_well_position_with_bottom_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well bottom in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
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
        well_location=WellLocation(
            origin=WellOrigin.BOTTOM,
            offset=WellOffset(x=3, y=2, z=1),
        ),
    )

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 3,
        y=slot_pos[1] - 2 + well_def.y + 2,
        z=slot_pos[2] + 3 + well_def.z + 1,
    )


def test_get_well_position_with_center_offset(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should be able to get the position of a well center in a labware."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
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
        well_location=WellLocation(
            origin=WellOrigin.CENTER,
            offset=WellOffset(x=2, y=3, z=4),
        ),
    )

    assert result == Point(
        x=slot_pos[0] + 1 + well_def.x + 2,
        y=slot_pos[1] - 2 + well_def.y + 3,
        z=slot_pos[2] + 3 + well_def.z + 4 + well_def.depth / 2.0,
    )


def test_get_relative_well_location(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get the relative location of a well given an absolute position."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="definition-uri",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offsetId="offset-id",
    )
    calibration_offset = LabwareOffsetVector(x=1, y=-2, z=3)
    slot_pos = Point(4, 5, 6)
    well_def = well_plate_def.wells["B2"]

    decoy.when(labware_view.get("labware-id")).then_return(labware_data)
    decoy.when(labware_view.get_definition("labware-id")).then_return(well_plate_def)
    decoy.when(labware_view.get_labware_offset_vector("labware-id")).then_return(
        calibration_offset
    )
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_4)).then_return(
        slot_pos
    )
    decoy.when(labware_view.get_well_definition("labware-id", "B2")).then_return(
        well_def
    )

    result = subject.get_relative_well_location(
        labware_id="labware-id",
        well_name="B2",
        absolute_point=Point(
            x=slot_pos[0] + 1 + well_def.x + 7,
            y=slot_pos[1] - 2 + well_def.y + 8,
            z=slot_pos[2] + 3 + well_def.z + well_def.depth + 9,
        ),
    )

    assert result == WellLocation(
        origin=WellOrigin.TOP,
        offset=WellOffset.construct(
            x=cast(float, pytest.approx(7)),
            y=cast(float, pytest.approx(8)),
            z=cast(float, pytest.approx(9)),
        ),
    )


def test_get_nominal_effective_tip_length(
    decoy: Decoy,
    labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """It should get the effective tip length from a labware ID and pipette config."""
    decoy.when(labware_view.get_definition_uri("tip-rack-id")).then_return(
        LabwareUri("opentrons/opentrons_96_tiprack_300ul/1")
    )

    decoy.when(
        mock_pipette_view.get_nominal_tip_overlap(
            pipette_id="pipette-id",
            labware_uri=LabwareUri("opentrons/opentrons_96_tiprack_300ul/1"),
        )
    ).then_return(10)

    decoy.when(
        labware_view.get_tip_length(labware_id="tip-rack-id", overlap=10)
    ).then_return(100)

    result = subject.get_nominal_effective_tip_length(
        labware_id="tip-rack-id",
        pipette_id="pipette-id",
    )

    assert result == 100


def test_get_nominal_tip_geometry(
    decoy: Decoy,
    tip_rack_def: LabwareDefinition,
    labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """It should get a "well's" tip geometry."""
    well_def = tip_rack_def.wells["B2"]

    decoy.when(labware_view.get_definition_uri("tip-rack-id")).then_return(
        LabwareUri("opentrons/opentrons_96_tiprack_300ul/1")
    )

    decoy.when(labware_view.get_well_definition("tip-rack-id", "B2")).then_return(
        well_def
    )

    decoy.when(
        mock_pipette_view.get_nominal_tip_overlap(
            pipette_id="pipette-id",
            labware_uri="opentrons/opentrons_96_tiprack_300ul/1",
        )
    ).then_return(10)

    decoy.when(
        labware_view.get_tip_length(labware_id="tip-rack-id", overlap=10)
    ).then_return(100)

    result = subject.get_nominal_tip_geometry(
        pipette_id="pipette-id",
        labware_id="tip-rack-id",
        well_name="B2",
    )

    assert result.length == 100
    assert result.diameter == well_def.diameter
    assert result.volume == well_def.totalLiquidVolume


def test_get_nominal_tip_geometry_raises(
    decoy: Decoy,
    tip_rack_def: LabwareDefinition,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should raise LabwareIsNotTipRackError if well is not circular."""
    well_def = tip_rack_def.wells["B2"]
    well_def.shape = "rectangular"

    decoy.when(labware_view.get_well_definition("tip-rack-id", "B2")).then_return(
        well_def
    )

    with pytest.raises(errors.LabwareIsNotTipRackError):
        subject.get_nominal_tip_geometry(
            labware_id="tip-rack-id", well_name="B2", pipette_id="pipette-id"
        )


def test_get_tip_drop_location(
    decoy: Decoy,
    labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """It should get relative drop tip location for a pipette/labware combo."""
    decoy.when(mock_pipette_view.get_return_tip_scale("pipette-id")).then_return(0.5)

    decoy.when(
        labware_view.get_tip_drop_z_offset(
            labware_id="tip-rack-id", length_scale=0.5, additional_offset=3
        )
    ).then_return(1337)

    location = subject.get_tip_drop_location(
        pipette_id="pipette-id",
        labware_id="tip-rack-id",
        well_location=DropTipWellLocation(
            origin=DropTipWellOrigin.DEFAULT,
            offset=WellOffset(x=1, y=2, z=3),
        ),
    )

    assert location == WellLocation(offset=WellOffset(x=1, y=2, z=1337))


def test_get_tip_drop_location_with_trash(
    decoy: Decoy,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should get relative drop tip location for a the fixed trash."""
    decoy.when(
        labware_view.get_has_quirk(labware_id="labware-id", quirk="fixedTrash")
    ).then_return(True)

    location = subject.get_tip_drop_location(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_location=DropTipWellLocation(
            origin=DropTipWellOrigin.DEFAULT,
            offset=WellOffset(x=1, y=2, z=3),
        ),
    )

    assert location == WellLocation(
        origin=WellOrigin.TOP,
        offset=WellOffset(x=1, y=2, z=3),
    )


def test_get_tip_drop_explicit_location(subject: GeometryView) -> None:
    """It should pass the location through if origin is not WellOrigin.DROP_TIP."""
    input_location = DropTipWellLocation(
        origin=DropTipWellOrigin.TOP,
        offset=WellOffset(x=1, y=2, z=3),
    )

    result = subject.get_tip_drop_location(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_location=input_location,
    )

    assert result == WellLocation(
        origin=WellOrigin.TOP,
        offset=WellOffset(x=1, y=2, z=3),
    )


def test_get_ancestor_slot_name(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should get name of ancestor slot of labware."""
    decoy.when(labware_view.get("labware-1")).then_return(
        LoadedLabware(
            id="labware-1",
            loadName="load-name",
            definitionUri="1234",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        )
    )
    assert subject.get_ancestor_slot_name("labware-1") == DeckSlotName.SLOT_4

    decoy.when(labware_view.get("labware-2")).then_return(
        LoadedLabware(
            id="labware-2",
            loadName="load-name",
            definitionUri="4567",
            location=ModuleLocation(moduleId="4321"),
        )
    )
    decoy.when(module_view.get_location("4321")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    assert subject.get_ancestor_slot_name("labware-2") == DeckSlotName.SLOT_1


def test_ensure_location_not_occupied_raises(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should raise error when labware is present in given location."""
    slot_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_4)
    # Shouldn't raise if neither labware nor module in location
    assert subject.ensure_location_not_occupied(slot_location) == slot_location

    # Raise if labware in location
    decoy.when(labware_view.raise_if_labware_in_location(slot_location)).then_raise(
        errors.LocationIsOccupiedError("Woops!")
    )
    with pytest.raises(errors.LocationIsOccupiedError):
        subject.ensure_location_not_occupied(location=slot_location)

    # Raise if module in location
    module_location = ModuleLocation(moduleId="module-id")
    decoy.when(labware_view.raise_if_labware_in_location(module_location)).then_return(
        None
    )
    decoy.when(module_view.raise_if_module_in_location(module_location)).then_raise(
        errors.LocationIsOccupiedError("Woops again!")
    )
    with pytest.raises(errors.LocationIsOccupiedError):
        subject.ensure_location_not_occupied(location=module_location)

    # Shouldn't raise for off-deck labware
    assert (
        subject.ensure_location_not_occupied(location=OFF_DECK_LOCATION)
        == OFF_DECK_LOCATION
    )


@pytest.mark.parametrize(
    argnames=["location", "expected_center_point"],
    argvalues=[
        (DeckSlotLocation(slotName=DeckSlotName.SLOT_1), Point(101.0, 102.0, 119.5)),
        (ModuleLocation(moduleId="module-id"), Point(111.0, 122.0, 149.5)),
    ],
)
def test_get_labware_center(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    ot2_standard_deck_def: DeckDefinitionV3,
    subject: GeometryView,
    location: Union[DeckSlotLocation, ModuleLocation],
    expected_center_point: Point,
) -> None:
    """It should get the center point of the labware at the specified location."""
    decoy.when(labware_view.get_dimensions(labware_id="labware-id")).then_return(
        Dimensions(x=11, y=22, z=33)
    )

    if isinstance(location, ModuleLocation):
        decoy.when(labware_view.get_deck_definition()).then_return(
            ot2_standard_deck_def
        )
        decoy.when(
            module_view.get_module_offset(
                module_id="module-id", deck_type=DeckType.OT2_STANDARD
            )
        ).then_return(LabwareOffsetVector(x=10, y=20, z=30))

        decoy.when(module_view.get_location("module-id")).then_return(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
        )

    decoy.when(labware_view.get_slot_center_position(DeckSlotName.SLOT_1)).then_return(
        Point(x=101, y=102, z=103)
    )
    labware_center = subject.get_labware_center(
        labware_id="labware-id", location=location
    )

    assert labware_center == expected_center_point


@pytest.mark.parametrize(
    argnames=["location", "should_dodge", "expected_waypoints"],
    argvalues=[
        (None, True, []),
        (CurrentWell("pipette-id", "from-labware-id", "well-name"), False, []),
        (CurrentWell("pipette-id", "from-labware-id", "well-name"), True, [(11, 22)]),
    ],
)
def test_get_extra_waypoints(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    location: Optional[CurrentWell],
    should_dodge: bool,
    expected_waypoints: List[Tuple[float, float]],
    subject: GeometryView,
) -> None:
    """It should return extra waypoints if thermocycler should be dodged."""
    decoy.when(labware_view.get("from-labware-id")).then_return(
        LoadedLabware(
            id="labware1",
            loadName="load-name1",
            definitionUri="1234",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        )
    )
    decoy.when(labware_view.get("to-labware-id")).then_return(
        LoadedLabware(
            id="labware2",
            loadName="load-name2",
            definitionUri="4567",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
        )
    )

    decoy.when(
        module_view.should_dodge_thermocycler(
            from_slot=DeckSlotName.SLOT_1, to_slot=DeckSlotName.SLOT_2
        )
    ).then_return(should_dodge)
    decoy.when(
        labware_view.get_slot_center_position(slot=DeckSlotName.SLOT_5)
    ).then_return(Point(x=11, y=22, z=33))

    extra_waypoints = subject.get_extra_waypoints("to-labware-id", location)

    assert extra_waypoints == expected_waypoints


def test_get_slot_item(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should get items in certain slots."""
    allowed_labware_ids = {"foo", "bar"}
    allowed_module_ids = {"fizz", "buzz"}
    labware = LoadedLabware.construct(id="cool-labware")  # type: ignore[call-arg]
    module = LoadedModule.construct(id="cool-module")  # type: ignore[call-arg]

    decoy.when(
        labware_view.get_by_slot(DeckSlotName.SLOT_1, allowed_labware_ids)
    ).then_return(None)
    decoy.when(
        labware_view.get_by_slot(DeckSlotName.SLOT_2, allowed_labware_ids)
    ).then_return(labware)
    decoy.when(
        labware_view.get_by_slot(DeckSlotName.SLOT_3, allowed_labware_ids)
    ).then_return(None)

    decoy.when(
        module_view.get_by_slot(DeckSlotName.SLOT_1, allowed_module_ids)
    ).then_return(None)
    decoy.when(
        module_view.get_by_slot(DeckSlotName.SLOT_2, allowed_module_ids)
    ).then_return(None)
    decoy.when(
        module_view.get_by_slot(DeckSlotName.SLOT_3, allowed_module_ids)
    ).then_return(module)

    assert (
        subject.get_slot_item(
            DeckSlotName.SLOT_1, allowed_labware_ids, allowed_module_ids
        )
        is None
    )
    assert (
        subject.get_slot_item(
            DeckSlotName.SLOT_2, allowed_labware_ids, allowed_module_ids
        )
        == labware
    )
    assert (
        subject.get_slot_item(
            DeckSlotName.SLOT_3, allowed_labware_ids, allowed_module_ids
        )
        == module
    )
