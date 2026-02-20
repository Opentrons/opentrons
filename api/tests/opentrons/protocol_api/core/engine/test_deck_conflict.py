"""Unit tests for the deck_conflict module."""

from contextlib import nullcontext as does_not_raise
from typing import Any, ContextManager, List, Literal, NamedTuple, Tuple, cast

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.labware.types import LabwareUri
from opentrons_shared_data.robot.types import RobotType

from ... import versions_at_or_above, versions_below
from opentrons.hardware_control import CriticalPoint
from opentrons.motion_planning import adjacent_slots_getters
from opentrons.motion_planning import deck_conflict as wrapped_deck_conflict
from opentrons.motion_planning.adjacent_slots_getters import _MixedTypeSlots
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.core.engine import deck_conflict, pipette_movement_conflict
from opentrons.protocol_api.disposal_locations import (
    _TRASH_BIN_CUTOUT_FIXTURE,
    TrashBin,
    WasteChute,
)
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_engine import (
    Config,
    DeckSlotLocation,
    ModuleModel,
    StateView,
)
from opentrons.protocol_engine.clients import SyncClient
from opentrons.protocol_engine.errors import LabwareNotLoadedOnModuleError
from opentrons.protocol_engine.state.geometry import _AbsoluteRobotExtents
from opentrons.protocol_engine.state.pipettes import PipetteBoundingBoxOffsets
from opentrons.protocol_engine.types import (
    DeckType,
    Dimensions,
    DropTipWellLocation,
    LoadedLabware,
    LoadedModule,
    OnDeckLabwareLocation,
    OnLabwareLocation,
    StagingSlotLocation,
    WellLocation,
    WellOffset,
    WellOrigin,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.types import (
    DeckSlotName,
    MountType,
    NozzleConfigurationType,
    Point,
    StagingSlotName,
)


@pytest.fixture(autouse=True)
def patch_slot_getters(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out adjacent_slots_getters functions."""
    mock_get_surrounding_slots = decoy.mock(
        func=adjacent_slots_getters.get_surrounding_slots
    )
    mock_get_surrounding_staging_slots = decoy.mock(
        func=adjacent_slots_getters.get_surrounding_staging_slots
    )
    monkeypatch.setattr(
        adjacent_slots_getters, "get_surrounding_slots", mock_get_surrounding_slots
    )
    monkeypatch.setattr(
        adjacent_slots_getters,
        "get_surrounding_staging_slots",
        mock_get_surrounding_staging_slots,
    )


@pytest.fixture(autouse=True)
def use_mock_wrapped_deck_conflict(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace the check() function that our subject should wrap with a mock."""
    mock_check = decoy.mock(func=wrapped_deck_conflict.check)
    monkeypatch.setattr(wrapped_deck_conflict, "check", mock_check)


@pytest.fixture
def api_version() -> APIVersion:
    """Get mocked api_version."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def mock_sync_client(decoy: Decoy) -> SyncClient:
    """Return a mock in the shape of a SyncClient."""
    return decoy.mock(cls=SyncClient)


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
        elif module_model is ModuleModel.FLEX_STACKER_MODULE_V1:
            return wrapped_deck_conflict.FlexStackerModule(
                name_for_errors=expected_name_for_errors,
                highest_z_including_labware=3.14159,
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
def test_maps_trash_bins(
    decoy: Decoy,
    mock_state_view: StateView,
    api_version: APIVersion,
    mock_sync_client: SyncClient,
) -> None:
    """It should correctly map disposal locations."""
    mock_trash_lw = decoy.mock(cls=Labware)

    decoy.when(
        mock_sync_client.state.addressable_areas.get_fixture_height(
            _TRASH_BIN_CUTOUT_FIXTURE
        )
    ).then_return(1.23)

    deck_conflict.check(
        engine_state=mock_state_view,
        existing_labware_ids=[],
        existing_module_ids=[],
        existing_disposal_locations=[
            TrashBin(
                location=DeckSlotName.SLOT_B1,
                addressable_area_name="blah",
                engine_client=mock_sync_client,
                api_version=api_version,
            ),
            WasteChute(engine_client=mock_sync_client, api_version=api_version),
            mock_trash_lw,
        ],
        new_trash_bin=TrashBin(
            location=DeckSlotName.SLOT_A1,
            addressable_area_name="blah",
            engine_client=mock_sync_client,
            api_version=api_version,
        ),
    )
    decoy.verify(
        wrapped_deck_conflict.check(
            existing_items={
                DeckSlotName.SLOT_B1: wrapped_deck_conflict.TrashBin(
                    name_for_errors="trash bin", highest_z=1.23
                )
            },
            new_item=wrapped_deck_conflict.TrashBin(
                name_for_errors="trash bin", highest_z=1.23
            ),
            new_location=DeckSlotName.SLOT_A1,
            robot_type=mock_state_view.config.robot_type,
        )
    )


def _modules_non_stacker() -> list[ModuleModel]:
    return [m for m in ModuleModel if not ModuleModel.is_flex_stacker(m)]


_lw_index = 0
_mod_index = 0


def _provide_item_in_state(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_sync_client: SyncClient,
    item_type: Literal["labware", "trash-bin"] | ModuleModel,
) -> tuple[str | None, str | None, TrashBin | None]:
    global _lw_index, _mod_index
    if item_type == "labware":
        labware_id = f"labware-id-{_lw_index}"
        _lw_index += 1
        decoy.when(
            mock_state_view.labware.get_location(labware_id=labware_id)
        ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_5))
        decoy.when(
            mock_state_view.labware.get_load_name(labware_id=labware_id)
        ).then_return("labware_load_name")
        decoy.when(
            mock_state_view.geometry.get_labware_highest_z(labware_id=labware_id)
        ).then_return(3.14159)
        decoy.when(
            mock_state_view.labware.get_definition_uri(labware_id=labware_id)
        ).then_return(LabwareUri("test/labware_load_name/123"))
        decoy.when(
            mock_state_view.labware.is_fixed_trash(labware_id=labware_id)
        ).then_return(False)
        return (labware_id, None, None)
    elif item_type == "trash-bin":
        decoy.when(
            mock_sync_client.state.addressable_areas.get_fixture_height(
                _TRASH_BIN_CUTOUT_FIXTURE
            )
        ).then_return(1.23)
        return (
            None,
            None,
            TrashBin(
                location=DeckSlotName.SLOT_5,
                addressable_area_name="blah",
                engine_client=mock_sync_client,
                api_version=APIVersion(2, 23),
            ),
        )
    else:
        module_id = f"module-id-{_mod_index}"
        _mod_index += 1
        decoy.when(mock_state_view.modules.get_connected_model(module_id)).then_return(
            # this type ignore makes up for a narrowing failure - mypy thinks item_type can
            # still be one of the literals
            item_type  # type: ignore[arg-type]
        )
        decoy.when(mock_state_view.modules.get_location(module_id)).then_return(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_5)
        )
        return (None, module_id, None)


def occupancy_check_state_setup(
    decoy: Decoy,
    mock_state_view: StateView,
    request: pytest.FixtureRequest,
    mock_sync_client: SyncClient,
) -> dict[str, Any]:
    """Set up the current state in the engine occupancy check."""
    kind = cast(Literal["labware", "trash-bin"] | ModuleModel, request.param)
    labware_id, module_id, trash_bin = _provide_item_in_state(
        decoy, mock_state_view, mock_sync_client, kind
    )

    return {
        "existing_labware_ids": [labware_id] if labware_id is not None else [],
        "existing_module_ids": [module_id] if module_id is not None else [],
        "existing_disposal_locations": [trash_bin] if trash_bin is not None else [],
    }


@pytest.fixture
def occupancy_check_state_setup1(
    decoy: Decoy,
    mock_state_view: StateView,
    request: pytest.FixtureRequest,
    mock_sync_client: SyncClient,
) -> dict[str, Any]:
    """First preconfigured item in the occupancy check."""
    return occupancy_check_state_setup(
        decoy, mock_state_view, request, mock_sync_client
    )


@pytest.fixture
def occupancy_check_state_setup2(
    decoy: Decoy,
    mock_state_view: StateView,
    request: pytest.FixtureRequest,
    mock_sync_client: SyncClient,
) -> dict[str, Any]:
    """Second preconfigured item in the occupancy check."""
    return occupancy_check_state_setup(
        decoy, mock_state_view, request, mock_sync_client
    )


@pytest.fixture
def occupancy_check_new_item(
    decoy: Decoy,
    mock_state_view: StateView,
    request: pytest.FixtureRequest,
    mock_sync_client: SyncClient,
) -> dict[str, Any]:
    """Set up the engine for the new-item side for the occupancy check."""
    kind = cast(Literal["labware", "trash-bin"] | ModuleModel, request.param)
    labware_id, module_id, trash_bin = _provide_item_in_state(
        decoy, mock_state_view, mock_sync_client, kind
    )
    return {
        "new_labware_id": labware_id,
        "new_module_id": module_id,
        "new_trash_bin": trash_bin,
    }


@pytest.mark.parametrize(
    "occupancy_check_state_setup1",
    ["labware", "trash-bin"] + _modules_non_stacker(),  # type: ignore[operator]
    indirect=True,
)
@pytest.mark.parametrize(
    "occupancy_check_state_setup2",
    ["labware", "trash-bin"] + _modules_non_stacker(),  # type: ignore[operator]
    indirect=True,
)
@pytest.mark.parametrize(
    "occupancy_check_new_item",
    ["labware"],
    indirect=True,
)
@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-2 Standard", DeckType.OT2_STANDARD),
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
def test_maps_default_single_occupancy(
    decoy: Decoy,
    mock_state_view: StateView,
    occupancy_check_state_setup1: dict[str, Any],
    occupancy_check_state_setup2: dict[str, Any],
    occupancy_check_new_item: dict[str, Any],
) -> None:
    """It should correctly prevent double occupancy when a stacker is not involved."""
    setup = {**occupancy_check_state_setup1}
    for k, v in occupancy_check_state_setup2.items():
        setup[k].extend(v)
    with pytest.raises(
        wrapped_deck_conflict.DeckConflictError, match="cannot both be loaded in"
    ):
        deck_conflict.check(
            engine_state=mock_state_view,
            **setup,
            **occupancy_check_new_item,
        )


@pytest.mark.parametrize(
    "occupancy_check_state_setup1",
    [m for m in ModuleModel if ModuleModel.is_flex_stacker(m)],
    indirect=True,
)
@pytest.mark.parametrize(
    "occupancy_check_state_setup2",
    ["labware"] + [m for m in ModuleModel if ModuleModel.is_magnetic_block(m)],
    indirect=True,
)
@pytest.mark.parametrize(
    "occupancy_check_new_item",
    ["labware"],
    indirect=True,
)
@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
def test_maps_allows_stacker_labware_double_occupancy(
    decoy: Decoy,
    mock_state_view: StateView,
    occupancy_check_state_setup1: dict[str, Any],
    occupancy_check_state_setup2: dict[str, Any],
    occupancy_check_new_item: dict[str, Any],
) -> None:
    """It should correctly allow double occupancy for a stacker and labware or mag block."""
    decoy.when(
        wrapped_deck_conflict.check(
            existing_items=matchers.Anything(),
            new_item=matchers.Anything(),
            new_location=matchers.Anything(),
            robot_type=matchers.Anything(),
        )
    ).then_return(True)
    setup_a = {k: [i for i in v] for k, v in occupancy_check_state_setup1.items()}
    for k, v in occupancy_check_state_setup2.items():
        setup_a[k].extend(v)
    deck_conflict.check(  # type: ignore[call-overload]
        engine_state=mock_state_view,
        **setup_a,
        **occupancy_check_new_item,
    )
    setup_b = {k: [i for i in v] for k, v in occupancy_check_state_setup2.items()}
    for k, v in occupancy_check_state_setup1.items():
        setup_b[k].extend(v)
    deck_conflict.check(  # type: ignore[call-overload]
        engine_state=mock_state_view,
        **setup_b,
        **occupancy_check_new_item,
    )


@pytest.mark.parametrize(
    "occupancy_check_state_setup1",
    [m for m in ModuleModel if ModuleModel.is_flex_stacker(m)],
    indirect=True,
)
@pytest.mark.parametrize(
    "occupancy_check_state_setup2",
    ["trash-bin"] + [m for m in ModuleModel if not ModuleModel.is_magnetic_block(m)],
    indirect=True,
)
@pytest.mark.parametrize(
    "occupancy_check_new_item",
    ["labware"],
    indirect=True,
)
@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
def test_maps_prevents_stacker_non_labware_double_occupancy(
    decoy: Decoy,
    mock_state_view: StateView,
    occupancy_check_state_setup1: dict[str, Any],
    occupancy_check_state_setup2: dict[str, Any],
    occupancy_check_new_item: dict[str, Any],
) -> None:
    """It should correctly allow double occupancy for a stacker and labware or mag block."""
    setup = {**occupancy_check_state_setup1}
    for k, v in occupancy_check_state_setup2.items():
        setup[k].extend(v)
    with pytest.raises(
        wrapped_deck_conflict.DeckConflictError, match="cannot both be loaded in"
    ):
        deck_conflict.check(
            engine_state=mock_state_view,
            **setup,
            **occupancy_check_new_item,
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
    ["pipette_bounds", "expected_raise", "y_value"],
    [
        (  # nozzles above highest Z
            (
                Point(x=50, y=150, z=60),
                Point(x=150, y=50, z=60),
                Point(x=150, y=150, z=60),
                Point(x=50, y=50, z=60),
            ),
            does_not_raise(),
            0,
        ),
        # X, Y, Z collisions
        (
            (
                Point(x=50, y=150, z=40),
                Point(x=150, y=50, z=40),
                Point(x=150, y=150, z=40),
                Point(x=50, y=50, z=40),
            ),
            pytest.raises(
                pipette_movement_conflict.PartialTipMovementNotAllowedError,
                match="collision with items in deck slot D1",
            ),
            0,
        ),
        (
            (
                Point(x=101, y=150, z=40),
                Point(x=150, y=50, z=40),
                Point(x=150, y=150, z=40),
                Point(x=101, y=50, z=40),
            ),
            pytest.raises(
                pipette_movement_conflict.PartialTipMovementNotAllowedError,
                match="collision with items in deck slot D2",
            ),
            0,
        ),
        (  # Collision with staging slot
            (
                Point(x=150, y=150, z=40),
                Point(x=250, y=101, z=40),
                Point(x=150, y=101, z=40),
                Point(x=250, y=150, z=40),
            ),
            pytest.raises(
                pipette_movement_conflict.PartialTipMovementNotAllowedError,
                match="will result in collision with items in staging slot C4.",
            ),
            170,
        ),
        (
            (
                Point(x=150, y=250, z=40),
                Point(x=250, y=201, z=40),
                Point(x=150, y=201, z=40),
                Point(x=250, y=250, z=40),
            ),
            pytest.raises(
                pipette_movement_conflict.PartialTipMovementNotAllowedError,
                match="result in collision with items on flexStackerModuleV1 mounted in B3.",
            ),
            170,
        ),
    ],
)
def test_deck_conflict_raises_for_bad_pipette_move(
    decoy: Decoy,
    mock_state_view: StateView,
    api_version: APIVersion,
    pipette_bounds: Tuple[Point, Point, Point, Point],
    expected_raise: ContextManager[Any],
    y_value: float,
) -> None:
    """It should raise errors when moving to locations with restrictions for partial pipette movement.

    Test premise:
    - we are using a pipette configured for COLUMN nozzle layout with primary nozzle A12
    - there are labware of height 50mm in C1, D1 & D2
    - we are checking for conflicts when moving to a labware in C2.
      For each test case, we are moving to a different point in the destination labware,
      with the same pipette and tip
    - we are checking for conflicts when moving to a point that would collide with a
      flex stacker in column 4 at position B4 but nothing in the ancestor slot of B3

    Note: this test does not stub out the slot overlap checker function
          in order to preserve readability of the test. That means the test does
          actual slot overlap checks.
    """
    destination_well_point = Point(x=123, y=y_value, z=123)
    decoy.when(
        mock_state_view.pipettes.get_is_partially_configured("pipette-id")
    ).then_return(True)
    decoy.when(mock_state_view.pipettes.get_mount("pipette-id")).then_return(
        MountType.LEFT
    )
    decoy.when(mock_state_view.geometry.absolute_deck_extents).then_return(
        _AbsoluteRobotExtents(
            front_left={
                MountType.LEFT: Point(13.5, -60.5, 0.0),
                MountType.RIGHT: Point(-40.5, -60.5, 0.0),
            },
            back_right={
                MountType.LEFT: Point(463.7, 433.3, 0.0),
                MountType.RIGHT: Point(517.7, 433.3),
            },
            deck_extents=Point(477.2, 493.8, 0.0),
            padding_rear=-181.21,
            padding_front=55.8,
            padding_left_side=31.88,
            padding_right_side=-80.32,
        )
    )
    decoy.when(
        mock_state_view.pipettes.get_pipette_bounding_box("pipette-id")
    ).then_return(
        # 96 chan outer bounds
        PipetteBoundingBoxOffsets(
            back_left_corner=Point(-36.0, -25.5, -259.15),
            front_right_corner=Point(63.0, -88.5, -259.15),
            front_left_corner=Point(-36.0, -88.5, -259.15),
            back_right_corner=Point(63.0, -25.5, -259.15),
        )
    )
    decoy.when(
        mock_state_view.pipettes.get_is_partially_configured("pipette-id")
    ).then_return(True)
    decoy.when(mock_state_view.pipettes.get_primary_nozzle("pipette-id")).then_return(
        "A12"
    )
    decoy.when(
        mock_state_view.geometry.get_ancestor_slot_name("destination-labware-id")
    ).then_return(DeckSlotName.SLOT_C2)

    decoy.when(
        mock_state_view.geometry.get_well_position(
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
            pipette_id="pipette-id",
        )
    ).then_return(destination_well_point)
    decoy.when(
        mock_state_view.motion.get_critical_point_for_wells_in_labware(
            "destination-labware-id"
        )
    ).then_return(None)
    decoy.when(
        mock_state_view.pipettes.get_pipette_bounds_at_specified_move_to_position(
            pipette_id="pipette-id",
            destination_position=destination_well_point,
            critical_point=None,
        )
    ).then_return(pipette_bounds)

    stacker = LoadedModule(
        id="fake-stacker-id",
        model=ModuleModel.FLEX_STACKER_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_B3),
        serialNumber="serial-number",
    )
    decoy.when(mock_state_view.modules.get_by_slot(DeckSlotName.SLOT_B3)).then_return(
        stacker
    )
    decoy.when(mock_state_view.modules.get_by_slot(DeckSlotName.SLOT_C2)).then_return(
        None
    )
    decoy.when(mock_state_view.modules.is_column_4_module(stacker.model)).then_return(
        True
    )
    decoy.when(
        mock_state_view.modules.ensure_and_convert_module_fixture_location(
            DeckSlotName.SLOT_B3, stacker.model
        )
    ).then_return("flexStackerModuleV1B4")

    decoy.when(
        adjacent_slots_getters.get_surrounding_slots(5, robot_type="OT-3 Standard")
    ).then_return(
        _MixedTypeSlots(
            regular_slots=[
                DeckSlotName.SLOT_D1,
                DeckSlotName.SLOT_D2,
                DeckSlotName.SLOT_C1,
                DeckSlotName.SLOT_B3,
            ],
            staging_slots=[StagingSlotName.SLOT_C4],
        )
    )
    decoy.when(
        adjacent_slots_getters.get_surrounding_staging_slots(DeckSlotName.SLOT_C2)
    ).then_return([StagingSlotName.SLOT_C4])

    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="C1", do_compatibility_check=False
        )
    ).then_return(Point(0, 100, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="D1", do_compatibility_check=False
        )
    ).then_return(Point(0, 0, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="D2", do_compatibility_check=False
        )
    ).then_return(Point(100, 0, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="C4", do_compatibility_check=False
        )
    ).then_return(Point(200, 100, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_bounding_box(
            addressable_area_name="C4", do_compatibility_check=False
        )
    ).then_return(Dimensions(90, 90, 0))
    decoy.when(
        mock_state_view.geometry.get_highest_z_in_slot(
            StagingSlotLocation(slotName=StagingSlotName.SLOT_C4)
        )
    ).then_return(50)
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="B3", do_compatibility_check=False
        )
    ).then_return(Point(150, 200, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_bounding_box(
            addressable_area_name="B3", do_compatibility_check=False
        )
    ).then_return(Dimensions(90, 90, 0))

    # Ensure slot B3 is empty so we can test the stacker
    decoy.when(
        mock_state_view.geometry.get_highest_z_in_slot(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_B3)
        )
    ).then_return(0)

    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="flexStackerModuleV1B4", do_compatibility_check=False
        )
    ).then_return(Point(200, 200, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_bounding_box(
            addressable_area_name="flexStackerModuleV1B4", do_compatibility_check=False
        )
    ).then_return(Dimensions(90, 90, 0))

    decoy.when(
        mock_state_view.geometry.get_highest_z_of_column_4_module(stacker)
    ).then_return(50)
    for slot_name in [DeckSlotName.SLOT_C1, DeckSlotName.SLOT_D1, DeckSlotName.SLOT_D2]:
        decoy.when(
            mock_state_view.geometry.get_highest_z_in_slot(
                DeckSlotLocation(slotName=slot_name)
            )
        ).then_return(50)
        decoy.when(
            mock_state_view.addressable_areas.get_addressable_area_bounding_box(
                addressable_area_name=slot_name.id, do_compatibility_check=False
            )
        ).then_return(Dimensions(90, 90, 0))

    with expected_raise:
        pipette_movement_conflict.check_safe_for_pipette_movement(
            engine_state=mock_state_view,
            pipette_id="pipette-id",
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
            version=api_version,
        )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [("OT-3 Standard", DeckType.OT3_STANDARD)],
)
def test_deck_conflict_raises_for_collision_with_tc_lid(
    decoy: Decoy,
    mock_state_view: StateView,
    api_version: APIVersion,
) -> None:
    """It should raise an error if pipette might collide with thermocycler lid on the Flex."""
    destination_well_point = Point(x=123, y=123, z=123)
    pipette_bounds_at_destination = (
        Point(x=50, y=350, z=204.5),
        Point(x=150, y=429, z=204.5),
        Point(x=150, y=400, z=204.5),
        Point(x=50, y=300, z=204.5),
    )

    decoy.when(
        mock_state_view.pipettes.get_is_partially_configured("pipette-id")
    ).then_return(True)
    decoy.when(mock_state_view.pipettes.get_primary_nozzle("pipette-id")).then_return(
        "A12"
    )
    decoy.when(
        mock_state_view.geometry.get_ancestor_slot_name("destination-labware-id")
    ).then_return(DeckSlotName.SLOT_C2)

    decoy.when(
        mock_state_view.geometry.get_well_position(
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
            pipette_id="pipette-id",
        )
    ).then_return(destination_well_point)

    decoy.when(
        mock_state_view.motion.get_critical_point_for_wells_in_labware(
            "destination-labware-id"
        )
    ).then_return(CriticalPoint.Y_CENTER)
    decoy.when(
        mock_state_view.pipettes.get_pipette_bounds_at_specified_move_to_position(
            pipette_id="pipette-id",
            destination_position=destination_well_point,
            critical_point=CriticalPoint.Y_CENTER,
        )
    ).then_return(pipette_bounds_at_destination)
    decoy.when(mock_state_view.pipettes.get_mount("pipette-id")).then_return(
        MountType.LEFT
    )
    decoy.when(
        mock_state_view.pipettes.get_pipette_bounding_box("pipette-id")
    ).then_return(
        # 96 chan outer bounds
        PipetteBoundingBoxOffsets(
            back_left_corner=Point(-67.0, -3.5, -259.15),
            front_right_corner=Point(94.0, -113.0, -259.15),
            front_left_corner=Point(-67.0, -113.0, -259.15),
            back_right_corner=Point(94.0, -3.5, -259.15),
        )
    )
    decoy.when(mock_state_view.geometry.absolute_deck_extents).then_return(
        _AbsoluteRobotExtents(
            front_left={
                MountType.LEFT: Point(13.5, 60.5, 0.0),
                MountType.RIGHT: Point(-40.5, 60.5, 0.0),
            },
            back_right={
                MountType.LEFT: Point(463.7, 433.3, 0.0),
                MountType.RIGHT: Point(517.7, 433.3),
            },
            deck_extents=Point(477.2, 493.8, 0.0),
            padding_rear=-181.21,
            padding_front=55.8,
            padding_left_side=31.88,
            padding_right_side=-80.32,
        )
    )

    decoy.when(
        adjacent_slots_getters.get_surrounding_slots(5, robot_type="OT-3 Standard")
    ).then_return(
        _MixedTypeSlots(
            regular_slots=[
                DeckSlotName.SLOT_A1,
                DeckSlotName.SLOT_B1,
            ],
            staging_slots=[StagingSlotName.SLOT_C4],
        )
    )
    decoy.when(mock_state_view.modules.is_flex_deck_with_thermocycler()).then_return(
        True
    )
    with pytest.raises(
        pipette_movement_conflict.PartialTipMovementNotAllowedError,
        match="Requested motion with the A12 nozzle partial configuration is outside of robot bounds for the pipette.",
    ):
        pipette_movement_conflict.check_safe_for_pipette_movement(
            engine_state=mock_state_view,
            pipette_id="pipette-id",
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
            version=api_version,
        )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [("OT-3 Standard", DeckType.OT3_STANDARD)],
)
@pytest.mark.parametrize(
    ["destination_well_point", "expected_raise"],
    [
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
def test_deck_conflict_raises_for_out_of_bounds_96_channel_move(
    decoy: Decoy,
    mock_state_view: StateView,
    destination_well_point: Point,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise errors when moving to locations out of robot's bounds for partial tip 96-channel movement.

    Test premise:
    - we are using a pipette configured for COLUMN nozzle layout with primary nozzle A12
    """
    decoy.when(mock_state_view.pipettes.get_channels("pipette-id")).then_return(96)
    decoy.when(
        mock_state_view.labware.get_display_name("destination-labware-id")
    ).then_return("destination-labware")
    decoy.when(
        mock_state_view.pipettes.get_nozzle_layout_type("pipette-id")
    ).then_return(NozzleConfigurationType.COLUMN)
    decoy.when(
        mock_state_view.pipettes.get_is_partially_configured("pipette-id")
    ).then_return(True)
    decoy.when(mock_state_view.pipettes.get_primary_nozzle("pipette-id")).then_return(
        "A12"
    )
    decoy.when(
        mock_state_view.geometry.get_ancestor_slot_name("destination-labware-id")
    ).then_return(DeckSlotName.SLOT_C2)

    decoy.when(
        mock_state_view.geometry.get_well_position(
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
            pipette_id="pipette-id",
        )
    ).then_return(destination_well_point)


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
            pipette_movement_conflict.UnsuitableTiprackForPipetteMotion,
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
            pipette_movement_conflict.UnsuitableTiprackForPipetteMotion,
            match="A cool tiprack must be on an Opentrons Flex 96 Tip Rack Adapter",
        ),
    ),
    PipetteMovementSpec(
        tiprack_parent=OnLabwareLocation(labwareId="adapter-id"),
        tiprack_dim=Dimensions(x=0, y=0, z=50),
        is_on_flex_adapter=True,
        is_partial_config=True,
        expected_raise=pytest.raises(
            pipette_movement_conflict.PartialTipMovementNotAllowedError,
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
    decoy.when(
        mock_state_view.labware.get_dimensions(labware_id="adapter-id")
    ).then_return(Dimensions(x=0, y=0, z=100))
    decoy.when(mock_state_view.labware.get_display_name("labware-id")).then_return(
        "A cool tiprack"
    )
    decoy.when(
        mock_state_view.pipettes.get_is_partially_configured("pipette-id")
    ).then_return(is_partial_config)
    decoy.when(mock_state_view.labware.get_location("labware-id")).then_return(
        tiprack_parent
    )
    decoy.when(
        mock_state_view.labware.get_dimensions(labware_id="labware-id")
    ).then_return(tiprack_dim)
    decoy.when(
        mock_state_view.labware.get_has_quirk(
            labware_id="adapter-id", quirk="tiprackAdapterFor96Channel"
        )
    ).then_return(is_on_flex_adapter)

    with expected_raise:
        pipette_movement_conflict.check_safe_for_tip_pickup_and_return(
            engine_state=mock_state_view,
            pipette_id="pipette-id",
            labware_id="labware-id",
        )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
@pytest.mark.parametrize("api_version", versions_at_or_above(APIVersion(2, 28)))
def test_check_safe_for_pipette_movement_partial_tip_version_gate_above(
    decoy: Decoy,
    mock_state_view: StateView,
    api_version: APIVersion,
) -> None:
    """It should pass when location is a well and API version is at or over 2.28."""
    decoy.when(
        mock_state_view.pipettes.get_is_partially_configured("pipette-id")
    ).then_return(True)

    decoy.when(
        mock_state_view.geometry.get_checked_tip_drop_location(
            pipette_id="pipette-id",
            labware_id="destination-labware-id",
            well_location=DropTipWellLocation(),
            api_version_allows_partial_return_tip=True,
        )
    ).then_return(WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)))

    decoy.when(
        mock_state_view.geometry.get_well_position(
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
            pipette_id="pipette-id",
        )
    ).then_return(Point(x=123, y=123, z=123))

    decoy.when(mock_state_view.pipettes.get_primary_nozzle("pipette-id")).then_return(
        "A12"
    )
    decoy.when(
        mock_state_view.motion.get_critical_point_for_wells_in_labware(
            "destination-labware-id"
        )
    ).then_return(None)
    decoy.when(
        mock_state_view.pipettes.get_pipette_bounds_at_specified_move_to_position(
            pipette_id="pipette-id",
            destination_position=Point(x=123, y=123, z=123),
            critical_point=None,
        )
    ).then_return(
        (
            Point(x=50, y=150, z=60),
            Point(x=150, y=50, z=60),
            Point(x=150, y=150, z=60),
            Point(x=50, y=50, z=60),
        )
    )
    decoy.when(mock_state_view.geometry.absolute_deck_extents).then_return(
        _AbsoluteRobotExtents(
            front_left={
                MountType.LEFT: Point(13.5, -60.5, 0.0),
                MountType.RIGHT: Point(-40.5, -60.5, 0.0),
            },
            back_right={
                MountType.LEFT: Point(463.7, 433.3, 0.0),
                MountType.RIGHT: Point(517.7, 433.3),
            },
            deck_extents=Point(477.2, 493.8, 0.0),
            padding_rear=-181.21,
            padding_front=55.8,
            padding_left_side=31.88,
            padding_right_side=-80.32,
        )
    )
    decoy.when(
        mock_state_view.geometry.get_ancestor_slot_name("destination-labware-id")
    ).then_return(DeckSlotName.SLOT_C2)
    decoy.when(
        adjacent_slots_getters.get_surrounding_slots(5, robot_type="OT-3 Standard")
    ).then_return(
        _MixedTypeSlots(
            regular_slots=[
                DeckSlotName.SLOT_D1,
                DeckSlotName.SLOT_D2,
                DeckSlotName.SLOT_C1,
                DeckSlotName.SLOT_B3,
            ],
            staging_slots=[StagingSlotName.SLOT_C4],
        )
    )
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="C1", do_compatibility_check=False
        )
    ).then_return(Point(0, 100, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="D1", do_compatibility_check=False
        )
    ).then_return(Point(0, 0, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="D2", do_compatibility_check=False
        )
    ).then_return(Point(100, 0, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="C4", do_compatibility_check=False
        )
    ).then_return(Point(200, 100, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_bounding_box(
            addressable_area_name="C4", do_compatibility_check=False
        )
    ).then_return(Dimensions(90, 90, 0))
    decoy.when(
        mock_state_view.geometry.get_highest_z_in_slot(
            StagingSlotLocation(slotName=StagingSlotName.SLOT_C4)
        )
    ).then_return(50)
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="B3", do_compatibility_check=False
        )
    ).then_return(Point(150, 200, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_bounding_box(
            addressable_area_name="B3", do_compatibility_check=False
        )
    ).then_return(Dimensions(90, 90, 0))
    for slot_name in [DeckSlotName.SLOT_C1, DeckSlotName.SLOT_D1, DeckSlotName.SLOT_D2]:
        decoy.when(
            mock_state_view.geometry.get_highest_z_in_slot(
                DeckSlotLocation(slotName=slot_name)
            )
        ).then_return(50)
        decoy.when(
            mock_state_view.addressable_areas.get_addressable_area_bounding_box(
                addressable_area_name=slot_name.id, do_compatibility_check=False
            )
        ).then_return(Dimensions(90, 90, 0))

    pipette_movement_conflict.check_safe_for_pipette_movement(
        engine_state=mock_state_view,
        pipette_id="pipette-id",
        labware_id="destination-labware-id",
        well_name="A2",
        well_location=DropTipWellLocation(),
        version=api_version,
    )


@pytest.mark.parametrize(
    ("robot_type", "deck_type"),
    [
        ("OT-3 Standard", DeckType.OT3_STANDARD),
    ],
)
@pytest.mark.parametrize(
    "api_version", versions_below(APIVersion(2, 28), flex_only=True)
)
def test_check_safe_for_pipette_movement_partial_tip_version_gate_below(
    decoy: Decoy,
    mock_state_view: StateView,
    api_version: APIVersion,
) -> None:
    """It should pass when location is a well and API version is below 2.28."""
    decoy.when(
        mock_state_view.pipettes.get_is_partially_configured("pipette-id")
    ).then_return(True)

    decoy.when(
        mock_state_view.geometry.get_checked_tip_drop_location(
            pipette_id="pipette-id",
            labware_id="destination-labware-id",
            well_location=DropTipWellLocation(),
            api_version_allows_partial_return_tip=False,
        )
    ).then_return(WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)))

    decoy.when(
        mock_state_view.geometry.get_well_position(
            labware_id="destination-labware-id",
            well_name="A2",
            well_location=WellLocation(origin=WellOrigin.TOP, offset=WellOffset(z=10)),
            pipette_id="pipette-id",
        )
    ).then_return(Point(x=123, y=123, z=123))

    decoy.when(mock_state_view.pipettes.get_primary_nozzle("pipette-id")).then_return(
        "A12"
    )
    decoy.when(
        mock_state_view.motion.get_critical_point_for_wells_in_labware(
            "destination-labware-id"
        )
    ).then_return(None)
    decoy.when(
        mock_state_view.pipettes.get_pipette_bounds_at_specified_move_to_position(
            pipette_id="pipette-id",
            destination_position=Point(x=123, y=123, z=123),
            critical_point=None,
        )
    ).then_return(
        (
            Point(x=50, y=150, z=60),
            Point(x=150, y=50, z=60),
            Point(x=150, y=150, z=60),
            Point(x=50, y=50, z=60),
        )
    )
    decoy.when(mock_state_view.geometry.absolute_deck_extents).then_return(
        _AbsoluteRobotExtents(
            front_left={
                MountType.LEFT: Point(13.5, -60.5, 0.0),
                MountType.RIGHT: Point(-40.5, -60.5, 0.0),
            },
            back_right={
                MountType.LEFT: Point(463.7, 433.3, 0.0),
                MountType.RIGHT: Point(517.7, 433.3),
            },
            deck_extents=Point(477.2, 493.8, 0.0),
            padding_rear=-181.21,
            padding_front=55.8,
            padding_left_side=31.88,
            padding_right_side=-80.32,
        )
    )
    decoy.when(
        mock_state_view.geometry.get_ancestor_slot_name("destination-labware-id")
    ).then_return(DeckSlotName.SLOT_C2)
    decoy.when(
        adjacent_slots_getters.get_surrounding_slots(5, robot_type="OT-3 Standard")
    ).then_return(
        _MixedTypeSlots(
            regular_slots=[
                DeckSlotName.SLOT_D1,
                DeckSlotName.SLOT_D2,
                DeckSlotName.SLOT_C1,
                DeckSlotName.SLOT_B3,
            ],
            staging_slots=[StagingSlotName.SLOT_C4],
        )
    )
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="C1", do_compatibility_check=False
        )
    ).then_return(Point(0, 100, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="D1", do_compatibility_check=False
        )
    ).then_return(Point(0, 0, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="D2", do_compatibility_check=False
        )
    ).then_return(Point(100, 0, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="C4", do_compatibility_check=False
        )
    ).then_return(Point(200, 100, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_bounding_box(
            addressable_area_name="C4", do_compatibility_check=False
        )
    ).then_return(Dimensions(90, 90, 0))
    decoy.when(
        mock_state_view.geometry.get_highest_z_in_slot(
            StagingSlotLocation(slotName=StagingSlotName.SLOT_C4)
        )
    ).then_return(50)
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_position(
            addressable_area_name="B3", do_compatibility_check=False
        )
    ).then_return(Point(150, 200, 0))
    decoy.when(
        mock_state_view.addressable_areas.get_addressable_area_bounding_box(
            addressable_area_name="B3", do_compatibility_check=False
        )
    ).then_return(Dimensions(90, 90, 0))
    for slot_name in [DeckSlotName.SLOT_C1, DeckSlotName.SLOT_D1, DeckSlotName.SLOT_D2]:
        decoy.when(
            mock_state_view.geometry.get_highest_z_in_slot(
                DeckSlotLocation(slotName=slot_name)
            )
        ).then_return(50)
        decoy.when(
            mock_state_view.addressable_areas.get_addressable_area_bounding_box(
                addressable_area_name=slot_name.id, do_compatibility_check=False
            )
        ).then_return(Dimensions(90, 90, 0))

    pipette_movement_conflict.check_safe_for_pipette_movement(
        engine_state=mock_state_view,
        pipette_id="pipette-id",
        labware_id="destination-labware-id",
        well_name="A2",
        well_location=DropTipWellLocation(),
        version=api_version,
    )
