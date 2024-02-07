"""Unit tests for the deck_conflict module."""

import pytest
from typing import ContextManager, Any, NamedTuple, List
from decoy import Decoy
from contextlib import nullcontext as does_not_raise
from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.hardware_control.nozzle_manager import NozzleConfigurationType
from opentrons.motion_planning import deck_conflict as wrapped_deck_conflict
from opentrons.protocol_api._trash_bin import TrashBin
from opentrons.protocol_api._waste_chute import WasteChute
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.core.engine import deck_conflict
from opentrons.protocol_engine import (
    Config,
    DeckSlotLocation,
    ModuleModel,
    StateView,
)
from opentrons.protocol_engine.errors import LabwareNotLoadedOnModuleError
from opentrons.types import DeckSlotName, Point

from opentrons.protocol_engine.types import (
    DeckType,
    LoadedLabware,
    LoadedModule,
    WellLocation,
    WellOrigin,
    WellOffset,
    TipGeometry,
    OnDeckLabwareLocation,
    OnLabwareLocation,
    Dimensions,
)


@pytest.fixture(autouse=True)
def use_mock_wrapped_deck_conflict(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace the check() function that our subject should wrap with a mock."""
    mock_check = decoy.mock(func=wrapped_deck_conflict.check)
    monkeypatch.setattr(wrapped_deck_conflict, "check", mock_check)


@pytest.fixture
def mock_state_view(
    decoy: Decoy,
    robot_type: RobotType,
    deck_type: DeckType,
) -> StateView:
    """Return a mock in the shape of a StateView."""
    mock_state_view = decoy.mock(cls=StateView)
    config = Config(robot_type=robot_type, deck_type=deck_type)
    decoy.when(mock_state_view.config).then_return(config)
    return mock_state_view


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-2 Standard", DeckType.OT2_STANDARD),
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
def test_maps_labware_on_deck(decoy: Decoy, mock_state_view: StateView) -> None:
    """It should correcly map a labware that's loaded directly into a deck slot."""
    decoy.when(
        mock_state_view.labware.get_location(labware_id="labware-id")
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_5))

    decoy.when(
        mock_state_view.labware.get_load_name(labware_id="labware-id")
    ).then_return("labware_load_name")
    decoy.when(
        mock_state_view.geometry.get_labware_highest_z(labware_id="labware-id")
    ).then_return(3.14159)
    decoy.when(
        mock_state_view.labware.get_definition_uri(labware_id="labware-id")
    ).then_return(LabwareUri("test/labware_load_name/123"))
    decoy.when(
        mock_state_view.labware.is_fixed_trash(labware_id="labware-id")
    ).then_return(True)

    # Test both ways that the subject's caller can provide a labware:
    # by new_labware_id, and by existing_labware_ids.
    # We reuse the same ID for test convenience; in the real world, they'd be different.
    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=["labware-id"],
        existing_module_ids=[],
        existing_disposal_locations=[],
        new_labware_id="labware-id",
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={
                DeckSlotName.SLOT_5: wrapped_deck_conflict.Labware(
                    name_for_errors="labware_load_name",
                    highest_z=3.14159,
                    uri=LabwareUri("test/labware_load_name/123"),
                    is_fixed_trash=True,
                )
            },
            new_item=wrapped_deck_conflict.Labware(
                name_for_errors="labware_load_name",
                highest_z=3.14159,
                uri=LabwareUri("test/labware_load_name/123"),
                is_fixed_trash=True,
            ),
            new_location=DeckSlotName.SLOT_5,
            robot_type=mock_state_view.config.robot_type,
        )
    )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-2 Standard", DeckType.OT2_STANDARD),
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
def test_maps_module_without_labware(decoy: Decoy, mock_state_view: StateView) -> None:
    """It should correctly map a module with no labware loaded atop it."""
    decoy.when(mock_state_view.labware.get_id_by_module("module-id")).then_raise(
        LabwareNotLoadedOnModuleError()
    )
    decoy.when(mock_state_view.modules.get_overall_height("module-id")).then_return(
        3.14159
    )

    decoy.when(mock_state_view.modules.get_connected_model("module-id")).then_return(
        ModuleModel.HEATER_SHAKER_MODULE_V1
    )
    decoy.when(mock_state_view.modules.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_5)
    )

    # Test both ways that the subject's caller can provide a module:
    # by new_module_id, and by existing_module_ids.
    # We reuse the same ID for test convenience; in the real world, they'd be different.
    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=[],
        existing_module_ids=["module-id"],
        existing_disposal_locations=[],
        new_module_id="module-id",
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={
                DeckSlotName.SLOT_5: wrapped_deck_conflict.HeaterShakerModule(
                    name_for_errors="heaterShakerModuleV1",
                    highest_z_including_labware=3.14159,
                )
            },
            new_item=wrapped_deck_conflict.HeaterShakerModule(
                name_for_errors="heaterShakerModuleV1",
                highest_z_including_labware=3.14159,
            ),
            new_location=DeckSlotName.SLOT_5,
            robot_type=mock_state_view.config.robot_type,
        )
    )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-2 Standard", DeckType.OT2_STANDARD),
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
def test_maps_module_with_labware(decoy: Decoy, mock_state_view: StateView) -> None:
    """It should correctly map a module with a labware loaded atop it.

    The highest_z should include both the labware and the module.
    """
    decoy.when(mock_state_view.labware.get_id_by_module("module-id")).then_return(
        "labware-id"
    )
    decoy.when(
        mock_state_view.geometry.get_labware_highest_z("labware-id")
    ).then_return(3.14159)

    decoy.when(mock_state_view.modules.get_connected_model("module-id")).then_return(
        ModuleModel.HEATER_SHAKER_MODULE_V1
    )
    decoy.when(mock_state_view.modules.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_5)
    )

    # Test both ways that the subject's caller can provide a module:
    # by new_module_id, and by existing_module_ids.
    # We reuse the same ID for test convenience; in the real world, they'd be different.
    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=[],
        existing_module_ids=["module-id"],
        existing_disposal_locations=[],
        new_module_id="module-id",
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={
                DeckSlotName.SLOT_5: wrapped_deck_conflict.HeaterShakerModule(
                    name_for_errors="heaterShakerModuleV1",
                    highest_z_including_labware=3.14159,
                )
            },
            new_item=wrapped_deck_conflict.HeaterShakerModule(
                name_for_errors="heaterShakerModuleV1",
                highest_z_including_labware=3.14159,
            ),
            new_location=DeckSlotName.SLOT_5,
            robot_type=mock_state_view.config.robot_type,
        )
    )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-2 Standard", DeckType.OT2_STANDARD),
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
@pytest.mark.parametrize("module_model", ModuleModel)
def test_maps_different_module_models(
    decoy: Decoy, mock_state_view: StateView, module_model: ModuleModel
) -> None:
    """It should correctly map all possible kinds of hardware module."""

    def get_expected_mapping_result() -> wrapped_deck_conflict.DeckItem:
        expected_name_for_errors = module_model.value
        if module_model is ModuleModel.HEATER_SHAKER_MODULE_V1:
            return wrapped_deck_conflict.HeaterShakerModule(
                name_for_errors=expected_name_for_errors,
                highest_z_including_labware=3.14159,
            )
        elif module_model is ModuleModel.MAGNETIC_BLOCK_V1:
            return wrapped_deck_conflict.MagneticBlockModule(
                name_for_errors=expected_name_for_errors,
                highest_z_including_labware=3.14159,
            )
        elif (
            module_model is ModuleModel.THERMOCYCLER_MODULE_V1
            or module_model is ModuleModel.THERMOCYCLER_MODULE_V2
        ):
            return wrapped_deck_conflict.ThermocyclerModule(
                name_for_errors=expected_name_for_errors,
                highest_z_including_labware=3.14159,
                is_semi_configuration=False,
            )
        else:
            return wrapped_deck_conflict.OtherModule(
                name_for_errors=expected_name_for_errors,
                highest_z_including_labware=3.14159,
            )
        # There is deliberately no catch-all `else` block here.
        # If a new value is added to ModuleModel, it should cause an error here and
        # force us to think about how it should be mapped.

    decoy.when(mock_state_view.modules.get_connected_model("module-id")).then_return(
        module_model
    )

    decoy.when(mock_state_view.labware.get_id_by_module("module-id")).then_raise(
        LabwareNotLoadedOnModuleError()
    )
    decoy.when(mock_state_view.modules.get_overall_height("module-id")).then_return(
        3.14159
    )
    decoy.when(mock_state_view.modules.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_5)
    )

    expected_mapping_result = get_expected_mapping_result()

    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=[],
        existing_module_ids=[],
        existing_disposal_locations=[],
        new_module_id="module-id",
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={},
            new_item=expected_mapping_result,
            new_location=DeckSlotName.SLOT_5,
            robot_type=mock_state_view.config.robot_type,
        )
    )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-2 Standard", DeckType.OT2_STANDARD),
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
def test_maps_trash_bins(decoy: Decoy, mock_state_view: StateView) -> None:
    """It should correctly map disposal locations."""
    mock_trash_lw = decoy.mock(cls=Labware)

    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=[],
        existing_module_ids=[],
        existing_disposal_locations=[
            TrashBin(location=DeckSlotName.SLOT_B1, addressable_area_name="blah"),
            WasteChute(),
            mock_trash_lw,
        ],
        new_trash_bin=TrashBin(
            location=DeckSlotName.SLOT_A1, addressable_area_name="blah"
        ),
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={
                DeckSlotName.SLOT_B1: wrapped_deck_conflict.TrashBin(
                    name_for_errors="trash bin",
                )
            },
            new_item=wrapped_deck_conflict.TrashBin(
                name_for_errors="trash bin",
            ),
            new_location=DeckSlotName.SLOT_A1,
            robot_type=mock_state_view.config.robot_type,
        )
    )


plate = LoadedLabware(
    id="plate-id",
    loadName="plate-load-name",
    location=DeckSlotLocation(slotName=DeckSlotName.SLOT_C1),
    definitionUri="some-plate-uri",
    offsetId=None,
    displayName="Fancy Plate Name",
)

module = LoadedModule(
    id="module-id",
    model=ModuleModel.TEMPERATURE_MODULE_V1,
    location=DeckSlotLocation(slotName=DeckSlotName.SLOT_C1),
    serialNumber="serial-number",
)


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [("OT-3 Standard", DeckType.OT3_STANDARD)],
)
@pytest.mark.parametrize(
    ["destination_well_point", "expected_raise"],
    [
        (Point(x=100, y=100, z=60), does_not_raise()),
        # Z-collisions
        (
            Point(x=100, y=100, z=10),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="collision with items in deck slot",
            ),
        ),
        (
            Point(x=100, y=100, z=20),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="collision with items in deck slot",
            ),
        ),
        # Out-of-bounds error
        (
            Point(x=-12, y=100, z=60),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="outside of robot bounds",
            ),
        ),
        (
            Point(x=593, y=100, z=60),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="outside of robot bounds",
            ),
        ),
        (
            Point(x=100, y=1, z=60),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="outside of robot bounds",
            ),
        ),
        (
            Point(x=100, y=507, z=60),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="outside of robot bounds",
            ),
        ),
    ],
)
def test_deck_conflict_raises_for_bad_partial_96_channel_move(
    decoy: Decoy,
    mock_state_view: StateView,
    destination_well_point: Point,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise errors when moving to locations with restrictions for partial tip 96-channel movement.

    Test premise:
    - we are using a pipette configured for COLUMN nozzle layout with primary nozzle A12
    - there's a labware of height 50mm in C1
    - we are checking for conflicts when moving to a labware in C2.
      For each test case, we are moving to a different point in the destination labware,
      with the same pipette and tip (tip length is 10mm)
    """
    decoy.when(mock_state_view.pipettes.get_channels("pipette-id")).then_return(96)
    decoy.when(
        mock_state_view.pipettes.get_nozzle_layout_type("pipette-id")
    ).then_return(NozzleConfigurationType.COLUMN)
    decoy.when(mock_state_view.pipettes.get_primary_nozzle("pipette-id")).then_return(
        "A12"
    )
    decoy.when(
        mock_state_view.geometry.get_ancestor_slot_name("destination-labware-id")
    ).then_return(DeckSlotName.SLOT_C2)
    decoy.when(
        mock_state_view.geometry.get_highest_z_in_slot(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_C1)
        )
    ).then_return(50)
    decoy.when(
        mock_state_view.geometry.get_well_position(
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
        )
    ).then_return(destination_well_point)
    decoy.when(mock_state_view.pipettes.get_attached_tip("pipette-id")).then_return(
        TipGeometry(length=10, diameter=100, volume=0)
    )

    with expected_raise:
        deck_conflict.check_safe_for_pipette_movement(
            engine_state=mock_state_view,
            pipette_id="pipette-id",
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
        )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [("OT-3 Standard", DeckType.OT3_STANDARD)],
)
@pytest.mark.parametrize(
    ["destination_well_point", "expected_raise"],
    [
        (
            Point(x=100, y=100, z=10),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="Moving to destination-labware in slot D2 with pipette column A1 nozzle configuration will result in collision with items in deck slot D3.",
            ),
        ),
    ],
)
def test_deck_conflict_raises_for_bad_partial_96_channel_move_with_fixtures(
    decoy: Decoy,
    mock_state_view: StateView,
    destination_well_point: Point,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise an error when moving to locations adjacent to fixtures with restrictions for partial tip 96-channel movement.

    Test premise:
    - we are using a pipette configured for COLUMN nozzle layout with primary nozzle A1
    - there's a waste chute with in D3
    - we are checking for conflicts when moving to column A12 of a labware in D2.
    """
    decoy.when(mock_state_view.pipettes.get_channels("pipette-id")).then_return(96)
    decoy.when(
        mock_state_view.labware.get_display_name("destination-labware-id")
    ).then_return("destination-labware")
    decoy.when(
        mock_state_view.pipettes.get_nozzle_layout_type("pipette-id")
    ).then_return(NozzleConfigurationType.COLUMN)
    decoy.when(mock_state_view.pipettes.get_primary_nozzle("pipette-id")).then_return(
        "A1"
    )
    decoy.when(
        mock_state_view.geometry.get_well_position(
            labware_id="destination-labware-id",
            well_name="A12",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
        )
    ).then_return(destination_well_point)
    decoy.when(
        mock_state_view.geometry.get_ancestor_slot_name("destination-labware-id")
    ).then_return(DeckSlotName.SLOT_D2)
    decoy.when(
        mock_state_view.addressable_areas.get_fixture_height(
            "wasteChuteRightAdapterNoCover"
        )
    ).then_return(124.5)
    decoy.when(
        mock_state_view.geometry.get_highest_z_in_slot(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_D3)
        )
    ).then_return(
        mock_state_view.addressable_areas.get_fixture_height(
            "wasteChuteRightAdapterNoCover"
        )
    )
    decoy.when(mock_state_view.pipettes.get_attached_tip("pipette-id")).then_return(
        TipGeometry(length=10, diameter=100, volume=0)
    )

    with expected_raise:
        deck_conflict.check_safe_for_pipette_movement(
            engine_state=mock_state_view,
            pipette_id="pipette-id",
            labware_id="destination-labware-id",
            well_name="A12",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
        )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [("OT-3 Standard", DeckType.OT3_STANDARD)],
)
@pytest.mark.parametrize(
    ["destination_well_point", "expected_raise"],
    [
        (Point(x=100, y=100, z=60), does_not_raise()),
        # Z-collisions
        (
            Point(x=100, y=100, z=10),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="collision with items in deck slot",
            ),
        ),
        (
            Point(x=100, y=100, z=20),
            pytest.raises(
                deck_conflict.PartialTipMovementNotAllowedError,
                match="collision with items in deck slot",
            ),
        ),
    ],
)
def test_deck_conflict_raises_for_bad_partial_8_channel_move(
    decoy: Decoy,
    mock_state_view: StateView,
    destination_well_point: Point,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise errors when moving to locations with restrictions for partial tip 8-channel movement.

    Test premise:
    - we are using a pipette configured for SINGLE nozzle layout with primary nozzle H1
    - there's a labware of height 50mm in B2
    - we are checking for conflicts when moving to a labware in C2.
      For each test case, we are moving to a different point in the destination labware,
      with the same pipette and tip (tip length is 10mm)
    """
    decoy.when(mock_state_view.pipettes.get_channels("pipette-id")).then_return(8)
    decoy.when(
        mock_state_view.pipettes.get_nozzle_layout_type("pipette-id")
    ).then_return(NozzleConfigurationType.SINGLE)
    decoy.when(mock_state_view.pipettes.get_primary_nozzle("pipette-id")).then_return(
        "H1"
    )
    decoy.when(
        mock_state_view.geometry.get_ancestor_slot_name("destination-labware-id")
    ).then_return(DeckSlotName.SLOT_C2)
    decoy.when(
        mock_state_view.geometry.get_highest_z_in_slot(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_B2)
        )
    ).then_return(50)
    decoy.when(
        mock_state_view.geometry.get_well_position(
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
        )
    ).then_return(destination_well_point)
    decoy.when(mock_state_view.pipettes.get_attached_tip("pipette-id")).then_return(
        TipGeometry(length=10, diameter=100, volume=0)
    )

    with expected_raise:
        deck_conflict.check_safe_for_pipette_movement(
            engine_state=mock_state_view,
            pipette_id="pipette-id",
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
        )


class PipetteMovementSpec(NamedTuple):
    """Spec data to test deck_conflict.check_safe_for_tip_pickup_and_return ."""

    tiprack_parent: OnDeckLabwareLocation
    tiprack_dim: Dimensions
    is_on_flex_adapter: bool
    is_partial_config: bool
    expected_raise: ContextManager[Any]


pipette_movement_specs: List[PipetteMovementSpec] = [
    PipetteMovementSpec(
        tiprack_parent=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        tiprack_dim=Dimensions(x=0, y=0, z=50),
        is_on_flex_adapter=False,
        is_partial_config=False,
        expected_raise=pytest.raises(
            deck_conflict.UnsuitableTiprackForPipetteMotion,
            match="A cool tiprack must be on an Opentrons Flex 96 Tip Rack Adapter",
        ),
    ),
    PipetteMovementSpec(
        tiprack_parent=OnLabwareLocation(labwareId="adapter-id"),
        tiprack_dim=Dimensions(x=0, y=0, z=50),
        is_on_flex_adapter=True,
        is_partial_config=False,
        expected_raise=does_not_raise(),
    ),
    PipetteMovementSpec(
        tiprack_parent=OnLabwareLocation(labwareId="adapter-id"),
        tiprack_dim=Dimensions(x=0, y=0, z=50),
        is_on_flex_adapter=False,
        is_partial_config=False,
        expected_raise=pytest.raises(
            deck_conflict.UnsuitableTiprackForPipetteMotion,
            match="A cool tiprack must be on an Opentrons Flex 96 Tip Rack Adapter",
        ),
    ),
    PipetteMovementSpec(
        tiprack_parent=OnLabwareLocation(labwareId="adapter-id"),
        tiprack_dim=Dimensions(x=0, y=0, z=50),
        is_on_flex_adapter=True,
        is_partial_config=True,
        expected_raise=pytest.raises(
            deck_conflict.PartialTipMovementNotAllowedError,
            match="A cool tiprack cannot be on an adapter taller than the tip rack",
        ),
    ),
    PipetteMovementSpec(
        tiprack_parent=OnLabwareLocation(labwareId="adapter-id"),
        tiprack_dim=Dimensions(x=0, y=0, z=101),
        is_on_flex_adapter=True,
        is_partial_config=True,
        expected_raise=does_not_raise(),
    ),
    PipetteMovementSpec(
        tiprack_parent=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        tiprack_dim=Dimensions(x=0, y=0, z=50),
        is_on_flex_adapter=True,  # will be ignored
        is_partial_config=True,
        expected_raise=does_not_raise(),
    ),
]


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [("OT-3 Standard", DeckType.OT3_STANDARD)],
)
@pytest.mark.parametrize(
    argnames=PipetteMovementSpec._fields,
    argvalues=pipette_movement_specs,
)
def test_valid_96_pipette_movement_for_tiprack_and_adapter(
    decoy: Decoy,
    mock_state_view: StateView,
    tiprack_parent: OnDeckLabwareLocation,
    tiprack_dim: Dimensions,
    is_on_flex_adapter: bool,
    is_partial_config: bool,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise appropriate error for unsuitable tiprack parent when moving 96 channel to it."""
    decoy.when(mock_state_view.pipettes.get_channels("pipette-id")).then_return(96)
    decoy.when(mock_state_view.labware.get_dimensions("adapter-id")).then_return(
        Dimensions(x=0, y=0, z=100)
    )
    decoy.when(mock_state_view.labware.get_display_name("labware-id")).then_return(
        "A cool tiprack"
    )
    decoy.when(
        mock_state_view.pipettes.get_is_partially_configured("pipette-id")
    ).then_return(is_partial_config)
    decoy.when(mock_state_view.labware.get_location("labware-id")).then_return(
        tiprack_parent
    )
    decoy.when(mock_state_view.labware.get_dimensions("labware-id")).then_return(
        tiprack_dim
    )
    decoy.when(
        mock_state_view.labware.get_has_quirk(
            labware_id="adapter-id", quirk="tiprackAdapterFor96Channel"
        )
    ).then_return(is_on_flex_adapter)

    with expected_raise:
        deck_conflict.check_safe_for_tip_pickup_and_return(
            engine_state=mock_state_view,
            pipette_id="pipette-id",
            labware_id="labware-id",
        )
