"""Test load labware commands."""

import inspect
from typing import Optional
from unittest.mock import sentinel

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.load_labware import (
    LoadLabwareImplementation,
    LoadLabwareParams,
    LoadLabwareResult,
)
from opentrons.protocol_engine.errors import (
    LabwareIsNotAllowedInLocationError,
    LocationIsOccupiedError,
)
from opentrons.protocol_engine.execution import EquipmentHandler, LoadedLabwareData
from opentrons.protocol_engine.resources import labware_validation
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.update_types import (
    AddressableAreaUsedUpdate,
    LoadedLabwareUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.types import (
    AddressableAreaLocation,
    DeckSlotLocation,
    LoadableLabwareLocation,
    OnAddressableAreaLocationSequenceComponent,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
)
from opentrons.protocol_engine.types.location import (
    ModuleLocation,
    OnCutoutFixtureLocationSequenceComponent,
    OnModuleLocationSequenceComponent,
)
from opentrons.types import DeckSlotName


@pytest.fixture(autouse=True)
def patch_mock_labware_validation(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out labware_validations.py functions."""
    for name, func in inspect.getmembers(labware_validation, inspect.isfunction):
        monkeypatch.setattr(labware_validation, name, decoy.mock(func=func))
    decoy.when(
        labware_validation.validate_definition_is_deck_slot_compatible(
            matchers.Anything()
        )
    ).then_return(True)


@pytest.mark.parametrize("display_name", ["My custom display name", None])
@pytest.mark.parametrize(
    ("location", "expected_addressable_area_name"),
    [
        (DeckSlotLocation(slotName=DeckSlotName.SLOT_3), "3"),
        (AddressableAreaLocation(addressableAreaName="3"), "3"),
    ],
)
async def test_load_labware_on_slot_or_addressable_area(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
    display_name: Optional[str],
    location: LoadableLabwareLocation,
    expected_addressable_area_name: str,
) -> None:
    """A LoadLabware command should have an execution implementation."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    data = LoadLabwareParams(
        location=location,
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        displayName=display_name,
    )
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            sentinel.validated_empty_location
        )
    ).then_return(
        [
            OnAddressableAreaLocationSequenceComponent(
                addressableAreaName=expected_addressable_area_name,
            )
        ]
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return((well_plate_def, "opentrons-test/some-load-name/1"))

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(location, None, well_plate_def)
    ).then_return(sentinel.validated_empty_location)

    decoy.when(
        await equipment._load_labware_from_def_and_uri(
            well_plate_def,
            "opentrons-test/some-load-name/1",
            sentinel.validated_empty_location,
            None,
            None,
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="labware-id",
            definition=well_plate_def,
            offsetId=None,
        )
    )

    decoy.when(
        labware_validation.validate_definition_is_labware(well_plate_def)
    ).then_return(True)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=LoadLabwareResult(
            labwareId="labware-id",
            definition=well_plate_def,
            offsetId=None,
            locationSequence=[
                OnAddressableAreaLocationSequenceComponent(
                    addressableAreaName=expected_addressable_area_name,
                )
            ],
        ),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id="labware-id",
                definition=well_plate_def,
                offset_id=None,
                new_location=sentinel.validated_empty_location,
                display_name=display_name,
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name=expected_addressable_area_name
            ),
        ),
    )


async def test_load_labware_raises_if_not_deck_slot_compatible(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A LoadLabware command should raise if labware cannot load onto a deck slot."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    data = LoadLabwareParams(
        location=AddressableAreaLocation(addressableAreaName="D2"),
        loadName="millipore_96_wellplate_300ul_hts_filter",
        namespace="opentrons",
        version=1,
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="millipore_96_wellplate_300ul_hts_filter",
            namespace="opentrons",
            version=1,
        )
    ).then_return(
        (well_plate_def, "opentrons/millipore_96_wellplate_300ul_hts_filter/1")
    )

    decoy.when(
        labware_validation.validate_definition_is_deck_slot_compatible(well_plate_def)
    ).then_return(False)

    with pytest.raises(LabwareIsNotAllowedInLocationError):
        await subject.execute(data)


async def test_load_labware_raises_location_not_allowed(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A LoadLabware command should raise if the flex trash definition is not in a valid slot."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    data = LoadLabwareParams(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A2),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        displayName="My custom display name",
    )

    decoy.when(labware_validation.is_flex_trash("some-load-name")).then_return(True)

    with pytest.raises(LabwareIsNotAllowedInLocationError):
        await subject.execute(data)


async def test_load_labware_on_labware(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A LoadLabware command should raise if the definition is not validated as a labware."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    data = LoadLabwareParams(
        location=OnLabwareLocation(labwareId="other-labware-id"),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        displayName="My custom display name",
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return((well_plate_def, "opentrons-test/some-load-name/1"))

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            OnLabwareLocation(labwareId="other-labware-id"), None, well_plate_def
        )
    ).then_return(OnLabwareLocation(labwareId="another-labware-id"))

    decoy.when(
        await equipment._load_labware_from_def_and_uri(
            well_plate_def,
            "opentrons-test/some-load-name/1",
            OnLabwareLocation(labwareId="another-labware-id"),
            None,
            None,
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="labware-id",
            definition=well_plate_def,
            offsetId="labware-offset-id",
        )
    )
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            OnLabwareLocation(labwareId="another-labware-id")
        )
    ).then_return(
        [
            OnLabwareLocationSequenceComponent(
                labwareId="other-labware-id", lidId=None
            ),
            OnAddressableAreaLocationSequenceComponent(addressableAreaName="A3"),
        ]
    )

    decoy.when(
        labware_validation.validate_definition_is_labware(well_plate_def)
    ).then_return(True)

    result = await subject.execute(data)
    assert result == SuccessData(
        public=LoadLabwareResult(
            labwareId="labware-id",
            definition=well_plate_def,
            offsetId="labware-offset-id",
            locationSequence=[
                OnLabwareLocationSequenceComponent(
                    labwareId="other-labware-id", lidId=None
                ),
                OnAddressableAreaLocationSequenceComponent(addressableAreaName="A3"),
            ],
        ),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id="labware-id",
                definition=well_plate_def,
                offset_id="labware-offset-id",
                new_location=OnLabwareLocation(labwareId="another-labware-id"),
                display_name="My custom display name",
            )
        ),
    )

    decoy.verify(
        state_view.labware.raise_if_labware_cannot_be_stacked(
            well_plate_def, "another-labware-id"
        )
    )


async def test_load_labware_raises_if_location_occupied(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A LoadLabware command should have an execution implementation."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    data = LoadLabwareParams(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        displayName="My custom display name",
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return((well_plate_def, "opentrons-test/some-load-name/1"))

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_3), None, well_plate_def
        )
    ).then_raise(LocationIsOccupiedError("Get your own spot!"))

    with pytest.raises(LocationIsOccupiedError):
        await subject.execute(data)


@pytest.mark.parametrize("display_name", ["My custom collar", None])
async def test_load_labware_on_vacuum_module_dock(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
    display_name: Optional[str],
) -> None:
    """Loading a labware (collar) onto a vacuum module dock should work via ModuleFixtureLocation."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    dock_location = AddressableAreaLocation(addressableAreaName="vacuumModuleV1DockA4")

    data = LoadLabwareParams(
        location=dock_location,
        loadName="millipore_vacuum_manifold_collar_tall",
        namespace="opentrons-test",
        version=1,
        displayName=display_name,
    )

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(dock_location)
    ).then_return(
        [
            OnAddressableAreaLocationSequenceComponent(
                addressableAreaName="vacuumModuleV1DockA4"
            ),
            OnModuleLocationSequenceComponent(moduleId="module-id"),
            OnCutoutFixtureLocationSequenceComponent(
                cutoutId="cutoutA4", possibleCutoutFixtureIds=["vacuumModuleV1"]
            ),
        ]
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="millipore_vacuum_manifold_collar_tall",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return(
        (well_plate_def, "opentrons-test/millipore_vacuum_manifold_collar_tall/1")
    )

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            dock_location, None, well_plate_def
        )
    ).then_return(dock_location)

    decoy.when(
        await equipment._load_labware_from_def_and_uri(
            well_plate_def,
            "opentrons-test/millipore_vacuum_manifold_collar_tall/1",
            dock_location,
            None,
            None,
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="labware-id",
            definition=well_plate_def,
            offsetId=None,
        )
    )

    decoy.when(
        labware_validation.validate_definition_is_labware(well_plate_def)
    ).then_return(True)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=LoadLabwareResult(
            labwareId="labware-id",
            definition=well_plate_def,
            offsetId=None,
            locationSequence=[
                OnAddressableAreaLocationSequenceComponent(
                    addressableAreaName="vacuumModuleV1DockA4"
                ),
                OnModuleLocationSequenceComponent(moduleId="module-id"),
                OnCutoutFixtureLocationSequenceComponent(
                    cutoutId="cutoutA4", possibleCutoutFixtureIds=["vacuumModuleV1"]
                ),
            ],
        ),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id="labware-id",
                definition=well_plate_def,
                offset_id=None,
                new_location=dock_location,
                display_name=display_name,
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name="vacuumModuleV1DockA4"
            ),
        ),
    )


async def test_load_second_collar_on_first_collar_raises(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """Stacking two collars (adapter on adapter) on the vacuum dock is not allowed."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    data = LoadLabwareParams(
        location=OnLabwareLocation(labwareId="first-collar-id"),
        loadName="millipore_vacuum_manifold_collar_tall",
        namespace="opentrons-test",
        version=1,
        displayName=None,
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="millipore_vacuum_manifold_collar_tall",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return(
        (well_plate_def, "opentrons-test/millipore_vacuum_manifold_collar_tall/1")
    )

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            OnLabwareLocation(labwareId="first-collar-id"), None, well_plate_def
        )
    ).then_raise(
        LabwareIsNotAllowedInLocationError(
            "Cannot stack two collars on the vacuum module dock"
        )
    )

    with pytest.raises(LabwareIsNotAllowedInLocationError):
        await subject.execute(data)


async def test_load_labware_on_vacuum_dock_raises_if_incompatible(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """It should raise when trying to load an incompatible labware on the vacuum dock."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    dock_location = AddressableAreaLocation(addressableAreaName="vacuumModuleV1DockA4")

    data = LoadLabwareParams(
        location=dock_location,
        loadName="invitroven_filter_plate",
        namespace="opentrons",
        version=1,
        displayName=None,
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="invitroven_filter_plate",
            namespace="opentrons",
            version=1,
        )
    ).then_return((well_plate_def, "opentrons-test/invitroven_filter_plate/1"))

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            dock_location, None, well_plate_def
        )
    ).then_raise(
        LabwareIsNotAllowedInLocationError(
            "This labware is not allowed on the vacuum module dock"
        )
    )

    decoy.when(
        await equipment._load_labware_from_def_and_uri(
            well_plate_def,
            "opentrons-test/invitroven_filter_plate/1",
            dock_location,
            None,
            None,
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="filter-id", definition=well_plate_def, offsetId=None
        )
    )

    with pytest.raises(LabwareIsNotAllowedInLocationError):
        await subject.execute(data)


async def test_load_filter_plate_on_collar_which_is_on_vacuum_dock(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """Loading a labware (filter plate) on top of a collar that is on the vacuum dock."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    collar_location = OnLabwareLocation(labwareId="collar-id")

    data = LoadLabwareParams(
        location=collar_location,
        loadName="invitroven_filter_plate",
        namespace="opentrons-test",
        version=1,
        displayName=None,
    )

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(collar_location)
    ).then_return(
        [
            OnLabwareLocationSequenceComponent(labwareId="collar-id", lidId=None),
            OnAddressableAreaLocationSequenceComponent(
                addressableAreaName="vacuumModuleV1DockA4"
            ),
            OnModuleLocationSequenceComponent(moduleId="module-id"),
            OnCutoutFixtureLocationSequenceComponent(
                cutoutId="cutoutA4", possibleCutoutFixtureIds=["vacuumModuleV1"]
            ),
        ]
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="invitroven_filter_plate",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return((well_plate_def, "opentrons-test/invitroven_filter_plate/1"))

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            collar_location, None, well_plate_def
        )
    ).then_return(OnLabwareLocation(labwareId="collar-id"))

    decoy.when(
        await equipment._load_labware_from_def_and_uri(
            well_plate_def,
            "opentrons-test/invitroven_filter_plate/1",
            OnLabwareLocation(labwareId="collar-id"),
            None,
            None,
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="filter-id", definition=well_plate_def, offsetId=None
        )
    )

    decoy.when(
        labware_validation.validate_definition_is_labware(well_plate_def)
    ).then_return(True)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=LoadLabwareResult(
            labwareId="filter-id",
            definition=well_plate_def,
            offsetId=None,
            locationSequence=[
                OnLabwareLocationSequenceComponent(labwareId="collar-id", lidId=None),
                OnAddressableAreaLocationSequenceComponent(
                    addressableAreaName="vacuumModuleV1DockA4"
                ),
                OnModuleLocationSequenceComponent(moduleId="module-id"),
                OnCutoutFixtureLocationSequenceComponent(
                    cutoutId="cutoutA4", possibleCutoutFixtureIds=["vacuumModuleV1"]
                ),
            ],
        ),
        state_update=StateUpdate(
            loaded_labware=LoadedLabwareUpdate(
                labware_id="filter-id",
                definition=well_plate_def,
                offset_id=None,
                new_location=OnLabwareLocation(labwareId="collar-id"),
                display_name=None,
            )
        ),
    )


async def test_load_black_plate_contained_inside_collar_on_same_vacuum_module(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """Both the collar and the black plate are loaded directly on the vacuum module.

    The plate is physically contained inside the collar's containedSpace.
    Both share the same parent (the vacuum module).
    """
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    module_location = ModuleLocation(moduleId="module-id")

    data = LoadLabwareParams(
        location=module_location,
        loadName="corning_96_wellplate_360ul_flat",
        namespace="opentrons",
        version=1,
        displayName=None,
    )

    # Expected location sequence for the plate (on module, contained by collar)
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(module_location)
    ).then_return(
        [
            OnModuleLocationSequenceComponent(moduleId="module-id"),
            OnCutoutFixtureLocationSequenceComponent(
                cutoutId="cutoutA4", possibleCutoutFixtureIds=["vacuumModuleV1"]
            ),
        ]
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="corning_96_wellplate_360ul_flat",
            namespace="opentrons",
            version=1,
        )
    ).then_return((well_plate_def, "opentrons/corning_96_wellplate_360ul_flat/1"))

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            module_location, None, well_plate_def
        )
    ).then_return(module_location)

    decoy.when(
        await equipment._load_labware_from_def_and_uri(
            well_plate_def,
            "opentrons/corning_96_wellplate_360ul_flat/1",
            module_location,
            None,
            None,
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="plate-id", definition=well_plate_def, offsetId=None
        )
    )

    decoy.when(
        labware_validation.validate_definition_is_labware(well_plate_def)
    ).then_return(True)

    result = await subject.execute(data)

    assert result.public.labwareId == "plate-id"
    assert result.public.locationSequence is not None
    assert isinstance(
        result.public.locationSequence[0], OnModuleLocationSequenceComponent
    )
    assert result.public.locationSequence[0].moduleId == "module-id"


async def test_load_filter_plate_contained_inside_collar_on_vacuum_module(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """Loading a labware contained inside a collar that is loaded directly on the vacuum module."""
    subject = LoadLabwareImplementation(equipment=equipment, state_view=state_view)

    # The plate is loaded on the collar
    collar_location = OnLabwareLocation(labwareId="collar-id")

    data = LoadLabwareParams(
        location=collar_location,
        loadName="invitroven_filter_plate",
        namespace="opentrons-test",
        version=1,
        displayName=None,
    )

    # Expected location sequence: plate -> collar -> module -> cutout
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(collar_location)
    ).then_return(
        [
            OnLabwareLocationSequenceComponent(labwareId="collar-id", lidId=None),
            OnModuleLocationSequenceComponent(moduleId="module-id"),
            OnCutoutFixtureLocationSequenceComponent(
                cutoutId="cutoutA4", possibleCutoutFixtureIds=["vacuumModuleV1"]
            ),
        ]
    )

    decoy.when(
        await equipment.load_definition_for_details(
            load_name="invitroven_filter_plate",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return((well_plate_def, "opentrons-test/invitroven_filter_plate/1"))

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            collar_location, None, well_plate_def
        )
    ).then_return(collar_location)

    decoy.when(
        await equipment._load_labware_from_def_and_uri(
            well_plate_def,
            "opentrons-test/invitroven_filter_plate/1",
            collar_location,
            None,
            None,
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="filter-id", definition=well_plate_def, offsetId=None
        )
    )

    decoy.when(
        labware_validation.validate_definition_is_labware(well_plate_def)
    ).then_return(True)

    result = await subject.execute(data)

    assert result.public.labwareId == "filter-id"

    # Verify containment chain: plate is on collar, both share vacuum module as parent
    sequence = result.public.locationSequence
    assert sequence is not None
    assert isinstance(sequence[0], OnLabwareLocationSequenceComponent)
    assert sequence[0].labwareId == "collar-id"  # plate is on collar
    assert isinstance(sequence[1], OnModuleLocationSequenceComponent)
    assert sequence[1].moduleId == "module-id"  # collar and plate are on module
    assert isinstance(sequence[2], OnCutoutFixtureLocationSequenceComponent)
    assert sequence[2].cutoutId == "cutoutA4"  # module on cutout
