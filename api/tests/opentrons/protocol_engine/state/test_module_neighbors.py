"""Tests for vacuum-module neighbor lookup used by gripper jaw limits."""

from typing import cast

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.commands.move_labware import _has_vacuum_neighbor
from opentrons.protocol_engine.errors import LabwareNotOnDeckError
from opentrons.protocol_engine.resources import deck_configuration_provider
from opentrons.protocol_engine.state.addressable_areas import AddressableAreaView
from opentrons.protocol_engine.state.geometry import GeometryView
from opentrons.protocol_engine.state.modules import (
    HardwareModule,
    ModuleState,
    ModuleView,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    AddressableAreaLocation,
    DeckSlotLocation,
    DeckType,
    LabwareLocation,
    ModuleDefinition,
)
from opentrons.types import DeckSlotName


class _NeighborState:
    """The slices of StateView that the neighbor lookup reads."""

    def __init__(
        self,
        modules: ModuleView,
        geometry: GeometryView,
        addressable_areas: AddressableAreaView,
    ) -> None:
        self.modules = modules
        self.geometry = geometry
        self.addressable_areas = addressable_areas


def _view_with_module_on_a3(definition: ModuleDefinition) -> ModuleView:
    module_id = "module-id"
    cutout_id = deck_configuration_provider.get_cutout_id_by_deck_slot_name(
        DeckSlotName.SLOT_A3
    )
    return ModuleView(
        state=ModuleState(
            load_location_by_module_id={module_id: cutout_id},
            additional_slots_occupied_by_module_id={},
            requested_model_by_id={module_id: definition.model},
            hardware_by_module_id={
                module_id: HardwareModule(serial_number=None, definition=definition)
            },
            substate_by_module_id={},
            module_offset_by_serial={},
            deck_type=DeckType.OT3_STANDARD,
            deck_fixed_labware=[],
        )
    )


def _location_for_area(area: str) -> DeckSlotLocation | AddressableAreaLocation:
    try:
        return DeckSlotLocation(slotName=DeckSlotName.from_primitive(area))
    except ValueError:
        return AddressableAreaLocation(addressableAreaName=area)


def _state_for(
    decoy: Decoy, modules: ModuleView, parent: str | Exception
) -> tuple[LabwareLocation, StateView]:
    geometry = decoy.mock(cls=GeometryView)
    addressable_areas = decoy.mock(cls=AddressableAreaView)
    decoy.when(
        addressable_areas.get_potential_addressable_area_base_slot(matchers.Anything())
    ).then_do(
        lambda area_name: {
            "A4": DeckSlotName.SLOT_A3,
            "B4": DeckSlotName.SLOT_B3,
            "C4": DeckSlotName.SLOT_C3,
            "D4": DeckSlotName.SLOT_D3,
        }.get(area_name)
    )
    location: LabwareLocation
    if isinstance(parent, Exception):
        location = OFF_DECK_LOCATION
        decoy.when(geometry.get_parent_from_location(location)).then_raise(parent)
    else:
        location = _location_for_area(parent)
        decoy.when(geometry.get_parent_from_location(location)).then_return(parent)
    state = _NeighborState(modules, geometry, addressable_areas)
    return location, cast(StateView, state)


@pytest.mark.parametrize(
    ("area", "expected"),
    [
        ("B3", True),  # A3 is directly north of B3
        ("B4", True),  # A4 is north of B4; the dock's base slot is A3
        ("B2", False),  # A3 is the corner of B2, not north or south
        ("A2", False),  # A3 is east of A2, and only north/south count
        ("A3", False),  # the module's own slot is not a neighbor
        ("A4", False),  # the dock's north/south neighbor is B4
        ("C4", False),
        ("D1", False),
    ],
)
def test_vacuum_module_on_a3_north_south(
    decoy: Decoy,
    vacuum_module_v1_def: ModuleDefinition,
    area: str,
    expected: bool,
) -> None:
    """A vacuum module is found on north/south slots, including staging."""
    modules = _view_with_module_on_a3(vacuum_module_v1_def)
    location, state = _state_for(decoy, modules, area)

    assert _has_vacuum_neighbor(location, state) is expected


def test_non_vacuum_module_does_not_count(
    decoy: Decoy, heater_shaker_v1_def: ModuleDefinition
) -> None:
    """A heater-shaker directly north does not narrow the jaws."""
    modules = _view_with_module_on_a3(heater_shaker_v1_def)
    location, state = _state_for(decoy, modules, "B3")

    assert _has_vacuum_neighbor(location, state) is False


def test_off_deck_location_has_no_vacuum_neighbor(
    decoy: Decoy, vacuum_module_v1_def: ModuleDefinition
) -> None:
    """Locations that are not on a deck slot have no vacuum neighbor."""
    modules = _view_with_module_on_a3(vacuum_module_v1_def)
    location, state = _state_for(decoy, modules, LabwareNotOnDeckError())

    assert _has_vacuum_neighbor(location, state) is False
