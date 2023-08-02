"""Test state getters for retrieving geometry views of state."""
import inspect

import pytest
from decoy import Decoy
from typing import cast, List, Tuple, Union, Optional, NamedTuple

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.pipette import pipette_definition
from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import Point, DeckSlotName, MountType

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    LabwareOffsetVector,
    DeckSlotLocation,
    ModuleLocation,
    OnLabwareLocation,
    ModuleOffsetVector,
    LoadedLabware,
    LoadedModule,
    ModuleModel,
    WellLocation,
    WellOrigin,
    DropTipWellLocation,
    DropTipWellOrigin,
    WellOffset,
    Dimensions,
    OverlapOffset,
    DeckType,
    CurrentWell,
    LabwareMovementOffsetData,
)
from opentrons.protocol_engine.state import move_types
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.state.labware import LabwareView
from opentrons.protocol_engine.state.modules import ModuleView
from opentrons.protocol_engine.state.pipettes import PipetteView, StaticPipetteConfig
from opentrons.protocol_engine.state.geometry import GeometryView, _GripperMoveType


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
        config=Config(
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
        ),
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
    decoy.when(module_view.get_connected_model("module-id")).then_return(
        ModuleModel.THERMOCYCLER_MODULE_V2
    )
    decoy.when(
        labware_view.get_module_overlap_offsets(
            "labware-id", ModuleModel.THERMOCYCLER_MODULE_V2
        )
    ).then_return(OverlapOffset(x=1, y=2, z=3))
    decoy.when(module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetVector(x=2, y=3, z=4)
    )

    result = subject.get_labware_parent_position("labware-id")

    assert result == Point(6, 8, 10)


def test_get_labware_parent_position_on_labware(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    ot2_standard_deck_def: DeckDefinitionV3,
    subject: GeometryView,
) -> None:
    """It should return a labware position for labware on a labware on a module."""
    labware_data = LoadedLabware(
        id="labware-id",
        loadName="bcd",
        definitionUri=uri_from_details(namespace="a", load_name="bcd", version=1),
        location=OnLabwareLocation(labwareId="adapter-id"),
        offsetId=None,
    )
    adapter_data = LoadedLabware(
        id="adapter-id",
        loadName="xyz",
        definitionUri=uri_from_details(namespace="w", load_name="xyz", version=1),
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
    decoy.when(labware_view.get_slot_position(DeckSlotName.SLOT_3)).then_return(
        Point(1, 2, 3)
    )
    decoy.when(labware_view.get("adapter-id")).then_return(adapter_data)
    decoy.when(labware_view.get_dimensions("adapter-id")).then_return(
        Dimensions(x=123, y=456, z=5)
    )
    decoy.when(
        labware_view.get_labware_overlap_offsets("labware-id", "xyz")
    ).then_return(OverlapOffset(x=1, y=2, z=2))

    decoy.when(labware_view.get_deck_definition()).then_return(ot2_standard_deck_def)
    decoy.when(
        module_view.get_nominal_module_offset(
            module_id="module-id", deck_type=DeckType.OT2_STANDARD
        )
    ).then_return(LabwareOffsetVector(x=1, y=2, z=3))

    decoy.when(module_view.get_connected_model("module-id")).then_return(
        ModuleModel.MAGNETIC_MODULE_V2
    )
    decoy.when(
        labware_view.get_module_overlap_offsets(
            "adapter-id", ModuleModel.MAGNETIC_MODULE_V2
        )
    ).then_return(OverlapOffset(x=-3, y=-2, z=-1))

    decoy.when(module_view.get_module_calibration_offset("module-id")).then_return(
        ModuleOffsetVector(x=3, y=4, z=5)
    )

    result = subject.get_labware_parent_position("labware-id")

    assert result == Point(9, 12, 15)


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
    decoy.when(module_view.get_connected_model("module-id")).then_return(
        ModuleModel.MAGNETIC_MODULE_V2
    )
    decoy.when(
        labware_view.get_module_overlap_offsets(
            "labware-id", ModuleModel.MAGNETIC_MODULE_V2
        )
    ).then_return(OverlapOffset(x=0, y=0, z=0))

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
    decoy.when(module_view.get_connected_model("module-id")).then_return(
        ModuleModel.MAGNETIC_MODULE_V2
    )
    decoy.when(
        labware_view.get_module_overlap_offsets(
            "labware-id", ModuleModel.MAGNETIC_MODULE_V2
        )
    ).then_return(OverlapOffset(x=0, y=0, z=0))

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

    location = subject.get_checked_tip_drop_location(
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

    location = subject.get_checked_tip_drop_location(
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

    result = subject.get_checked_tip_drop_location(
        pipette_id="pipette-id", labware_id="labware-id", well_location=input_location
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
    assert subject.ensure_location_not_occupied(location=slot_location) == slot_location

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


def test_get_labware_center_on_labware(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    ot2_standard_deck_def: DeckDefinitionV3,
    subject: GeometryView,
) -> None:
    """It should get the center point of a labware on another labware."""
    decoy.when(labware_view.get(labware_id="labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="above-name",
            definitionUri="1234",
            location=OnLabwareLocation(labwareId="below-id"),
        )
    )
    decoy.when(labware_view.get(labware_id="below-id")).then_return(
        LoadedLabware(
            id="below-id",
            loadName="below-name",
            definitionUri="1234",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        )
    )

    decoy.when(labware_view.get_dimensions("labware-id")).then_return(
        Dimensions(x=500, y=5001, z=10)
    )
    decoy.when(labware_view.get_dimensions("below-id")).then_return(
        Dimensions(x=1000, y=1001, z=11)
    )
    decoy.when(
        labware_view.get_labware_overlap_offsets("labware-id", "below-name")
    ).then_return(OverlapOffset(x=0, y=1, z=6))

    decoy.when(labware_view.get_slot_center_position(DeckSlotName.SLOT_4)).then_return(
        Point(x=5, y=9, z=10)
    )

    labware_center = subject.get_labware_center(
        labware_id="labware-id", location=OnLabwareLocation(labwareId="below-id")
    )

    assert labware_center == Point(5, 10, 20)


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
        # Assume the subject's Config is for an OT-3, so use an OT-3 slot name.
        labware_view.get_slot_center_position(slot=DeckSlotName.SLOT_C2)
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


@pytest.mark.parametrize(
    argnames=["slot_name", "expected_column"],
    argvalues=[
        (DeckSlotName.SLOT_3, 3),
        (DeckSlotName.SLOT_5, 2),
        (DeckSlotName.SLOT_7, 1),
        (DeckSlotName.SLOT_A1, 1),
        (DeckSlotName.SLOT_B2, 2),
        (DeckSlotName.SLOT_C3, 3),
    ],
)
def test_get_slot_column(
    subject: GeometryView,
    slot_name: DeckSlotName,
    expected_column: int,
) -> None:
    """It should return the correct column number for the slot."""
    assert subject.get_slot_column(slot_name) == expected_column


class DropTipLocationFinderSpec(NamedTuple):
    """Test data for get_next_tip_drop_location."""

    labware_slot: DeckSlotName
    well_size: float
    pipette_channels: int
    pipette_mount: MountType
    expected_locations: List[DropTipWellLocation]


# TODO (spp, 2023-06-22): need to test more trash-pipette-mount combinations
@pytest.mark.parametrize(
    argnames=DropTipLocationFinderSpec._fields,
    argvalues=[
        DropTipLocationFinderSpec(
            labware_slot=DeckSlotName.FIXED_TRASH,
            well_size=225,
            pipette_channels=1,
            pipette_mount=MountType.LEFT,
            expected_locations=[
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=-22, y=0, z=0)
                ),
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=-75, y=0, z=0)
                ),
            ],
        ),
        DropTipLocationFinderSpec(
            labware_slot=DeckSlotName.SLOT_3,
            well_size=225,
            pipette_channels=8,
            pipette_mount=MountType.RIGHT,
            expected_locations=[
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=75, y=0, z=0)
                ),
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=-75, y=0, z=0)
                ),
            ],
        ),
        DropTipLocationFinderSpec(
            labware_slot=DeckSlotName.SLOT_B3,
            well_size=225,
            pipette_channels=96,
            pipette_mount=MountType.LEFT,
            expected_locations=[
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=32, y=0, z=0)
                ),
                DropTipWellLocation(
                    origin=DropTipWellOrigin.TOP, offset=WellOffset(x=-32, y=0, z=0)
                ),
            ],
        ),
    ],
)
def test_get_next_drop_tip_location(
    decoy: Decoy,
    labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
    labware_slot: DeckSlotName,
    well_size: float,
    pipette_channels: int,
    pipette_mount: MountType,
    expected_locations: List[DropTipWellLocation],
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
) -> None:
    """It should provide the next location to drop tips into within a labware."""
    decoy.when(labware_view.is_fixed_trash(labware_id="abc")).then_return(True)
    decoy.when(
        labware_view.get_well_size(labware_id="abc", well_name="A1")
    ).then_return((well_size, 0, 0))
    decoy.when(mock_pipette_view.get_config("pip-123")).then_return(
        StaticPipetteConfig(
            min_volume=1,
            max_volume=9001,
            channels=pipette_channels,
            model="blah",
            display_name="bleh",
            serial_number="",
            tip_configuration_lookup_table={9001: supported_tip_fixture},
            nominal_tip_overlap={},
            home_position=0,
            nozzle_offset_z=0,
        )
    )
    decoy.when(mock_pipette_view.get_mount("pip-123")).then_return(pipette_mount)
    decoy.when(labware_view.get("abc")).then_return(
        LoadedLabware(
            id="abc",
            loadName="load-name2",
            definitionUri="4567",
            location=DeckSlotLocation(slotName=labware_slot),
        )
    )
    drop_location: List[DropTipWellLocation] = []
    for i in range(4):
        drop_location.append(
            subject.get_next_tip_drop_location(
                labware_id="abc", well_name="A1", pipette_id="pip-123"
            )
        )

    assert drop_location[0] == drop_location[2] == expected_locations[0]
    assert drop_location[1] == drop_location[3] == expected_locations[1]


def test_get_next_drop_tip_location_in_non_trash_labware(
    decoy: Decoy,
    labware_view: LabwareView,
    mock_pipette_view: PipetteView,
    subject: GeometryView,
) -> None:
    """It should provide the default drop tip location when dropping into a non-fixed-trash labware."""
    decoy.when(labware_view.is_fixed_trash(labware_id="abc")).then_return(False)
    assert subject.get_next_tip_drop_location(
        labware_id="abc", well_name="A1", pipette_id="pip-123"
    ) == DropTipWellLocation(
        origin=DropTipWellOrigin.DEFAULT,
        offset=WellOffset(x=0, y=0, z=0),
    )


def test_get_final_labware_movement_offset_vectors(
    decoy: Decoy,
    module_view: ModuleView,
    labware_view: LabwareView,
    subject: GeometryView,
) -> None:
    """It should provide the final labware movement offset data based on locations."""
    decoy.when(labware_view.get_deck_default_gripper_offsets()).then_return(
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=1, y=2, z=3),
            dropOffset=LabwareOffsetVector(x=3, y=2, z=1),
        )
    )
    decoy.when(module_view.get_default_gripper_offsets("module-id")).then_return(
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=11, y=22, z=33),
            dropOffset=LabwareOffsetVector(x=33, y=22, z=11),
        )
    )

    final_offsets = subject.get_final_labware_movement_offset_vectors(
        from_location=DeckSlotLocation(slotName=DeckSlotName("D2")),
        to_location=ModuleLocation(moduleId="module-id"),
        additional_offset_vector=LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=100, y=200, z=300),
            dropOffset=LabwareOffsetVector(x=400, y=500, z=600),
        ),
    )
    assert final_offsets == LabwareMovementOffsetData(
        pickUpOffset=LabwareOffsetVector(x=101, y=202, z=303),
        dropOffset=LabwareOffsetVector(x=433, y=522, z=611),
    )


def test_ensure_valid_gripper_location(subject: GeometryView) -> None:
    """It should raise error if it's not a valid labware movement location for gripper."""
    slot_location = DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    module_location = ModuleLocation(moduleId="dummy-module")
    on_labware_location = OnLabwareLocation(labwareId="adapter-id")
    off_deck_location = OFF_DECK_LOCATION

    assert subject.ensure_valid_gripper_location(slot_location) == slot_location
    assert subject.ensure_valid_gripper_location(module_location) == module_location
    assert (
        subject.ensure_valid_gripper_location(on_labware_location)
        == on_labware_location
    )

    with pytest.raises(errors.LabwareMovementNotAllowedError):
        subject.ensure_valid_gripper_location(off_deck_location)


def test_get_total_nominal_gripper_offset(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """It should calculate the correct gripper offsets given the location and move type.."""
    decoy.when(labware_view.get_deck_default_gripper_offsets()).then_return(
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=1, y=2, z=3),
            dropOffset=LabwareOffsetVector(x=3, y=2, z=1),
        )
    )

    decoy.when(module_view.get_default_gripper_offsets("module-id")).then_return(
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=11, y=22, z=33),
            dropOffset=LabwareOffsetVector(x=33, y=22, z=11),
        )
    )

    # Case 1: labware on deck
    result1 = subject.get_total_nominal_gripper_offset_for_move_type(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        move_type=_GripperMoveType.PICK_UP_LABWARE,
    )
    assert result1 == LabwareOffsetVector(x=1, y=2, z=3)

    # Case 2: labware on module
    result2 = subject.get_total_nominal_gripper_offset_for_move_type(
        location=ModuleLocation(moduleId="module-id"),
        move_type=_GripperMoveType.DROP_LABWARE,
    )
    assert result2 == LabwareOffsetVector(x=33, y=22, z=11)


def test_get_stacked_labware_total_nominal_offset_slot_specific(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """Get nominal offset for stacked labware."""
    # Case: labware on adapter on module, adapter has slot-specific offsets
    decoy.when(module_view.get_default_gripper_offsets("module-id")).then_return(
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=11, y=22, z=33),
            dropOffset=LabwareOffsetVector(x=33, y=22, z=11),
        )
    )
    decoy.when(module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_C1)
    )
    decoy.when(
        labware_view.get_labware_gripper_offsets(
            labware_id="adapter-id", slot_name=DeckSlotName.SLOT_C1
        )
    ).then_return(
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=100, y=200, z=300),
            dropOffset=LabwareOffsetVector(x=300, y=200, z=100),
        )
    )
    decoy.when(labware_view.get_parent_location("adapter-id")).then_return(
        ModuleLocation(moduleId="module-id")
    )
    result1 = subject.get_total_nominal_gripper_offset_for_move_type(
        location=OnLabwareLocation(labwareId="adapter-id"),
        move_type=_GripperMoveType.PICK_UP_LABWARE,
    )
    assert result1 == LabwareOffsetVector(x=111, y=222, z=333)

    result2 = subject.get_total_nominal_gripper_offset_for_move_type(
        location=OnLabwareLocation(labwareId="adapter-id"),
        move_type=_GripperMoveType.DROP_LABWARE,
    )
    assert result2 == LabwareOffsetVector(x=333, y=222, z=111)


def test_get_stacked_labware_total_nominal_offset_default(
    decoy: Decoy,
    labware_view: LabwareView,
    module_view: ModuleView,
    subject: GeometryView,
) -> None:
    """Get nominal offset for stacked labware."""
    # Case: labware on adapter on module, adapter has only default offsets
    decoy.when(module_view.get_default_gripper_offsets("module-id")).then_return(
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=11, y=22, z=33),
            dropOffset=LabwareOffsetVector(x=33, y=22, z=11),
        )
    )
    decoy.when(module_view.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_4)
    )
    decoy.when(
        labware_view.get_labware_gripper_offsets(
            labware_id="adapter-id", slot_name=DeckSlotName.SLOT_C1
        )
    ).then_return(None)
    decoy.when(
        labware_view.get_labware_gripper_offsets(
            labware_id="adapter-id", slot_name=None
        )
    ).then_return(
        LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=100, y=200, z=300),
            dropOffset=LabwareOffsetVector(x=300, y=200, z=100),
        )
    )
    decoy.when(labware_view.get_parent_location("adapter-id")).then_return(
        ModuleLocation(moduleId="module-id")
    )
    result1 = subject.get_total_nominal_gripper_offset_for_move_type(
        location=OnLabwareLocation(labwareId="adapter-id"),
        move_type=_GripperMoveType.PICK_UP_LABWARE,
    )
    assert result1 == LabwareOffsetVector(x=111, y=222, z=333)

    result2 = subject.get_total_nominal_gripper_offset_for_move_type(
        location=OnLabwareLocation(labwareId="adapter-id"),
        move_type=_GripperMoveType.DROP_LABWARE,
    )
    assert result2 == LabwareOffsetVector(x=333, y=222, z=111)
