"""Hypothesis strategies for generating PythonProtocolGenerators."""
import typing

from hypothesis import assume
from hypothesis import strategies as st

from test_data_generation.constants import Modules, RowName, AllSlotName
from test_data_generation.datashapes import (
    DeckConfigurationFixtures as DCF,
)
from test_data_generation.deck_configuration.strategy.deck_configuration_strategies import (
    a_deck_configuration_with_invalid_fixture_in_col_2,
    a_deck_configuration_with_staging_areas,
    a_deck_with_a_thermocycler,
    a_deck_with_a_waste_chute,
)
from test_data_generation.python_protocol_generation import ast_helpers as ast_h
from test_data_generation.python_protocol_generation.protocol_configuration import (
    ProtocolConfiguration,
)


@st.composite
def a_protocol_that_loads_invalid_stuff_into_column_2(
    draw: st.DrawFn,
) -> ProtocolConfiguration:
    """Generate a protocol that loads invalid stuff into column 2."""
    deck_config = draw(a_deck_configuration_with_invalid_fixture_in_col_2())

    return ProtocolConfiguration(api_version="2.18", deck_configuration=deck_config)


@st.composite
def a_protocol_that_loads_invalid_stuff_into_a_staging_area(
    draw: st.DrawFn, col_to_add_to: typing.Literal["3", "4"]
) -> ProtocolConfiguration:
    """Generate a deck configuration."""
    deck_config = draw(a_deck_configuration_with_staging_areas())
    rows_with_staging_area = [
        slot.row
        for slot in deck_config.column_by_number("3").slots
        if slot.contents is DCF.STAGING_AREA
    ]
    rows_to_load_on: typing.List[RowName] = rows_with_staging_area[
        draw(st.slices(len(rows_with_staging_area)))
    ]

    # Thermocycler is not allowed either, but you can't specify a thermocycler in any
    # slot other than a1/b1
    modules_not_allowed_on_col_3 = [
        Modules.HEATER_SHAKER_MODULE,
        Modules.TEMPERATURE_MODULE,
    ]
    modules_not_allowed_on_col4 = [
        Modules.MAGNETIC_BLOCK_MODULE,
        Modules.HEATER_SHAKER_MODULE,
        Modules.TEMPERATURE_MODULE,
    ]
    modules_to_choose_from = (
        modules_not_allowed_on_col_3
        if col_to_add_to == "3"
        else modules_not_allowed_on_col4
    )

    assume(len(rows_to_load_on) > 0)

    explicit_load_storage: ast_h.ExplicitLoadStorage = {}

    for row_name in rows_to_load_on:
        slot = typing.cast(AllSlotName, f"{row_name}{col_to_add_to}")
        possible_loads = [
            ast_h.AssignStatement.load_module(
                draw(st.sampled_from(modules_to_choose_from)), slot
            ),
            ast_h.AssignStatement.load_trash_bin(slot),
        ]

        explicit_load_storage[slot] = draw(st.sampled_from(possible_loads))

        if col_to_add_to == "3":
            col_4_slot = typing.cast(AllSlotName, f"{row_name}4")
            explicit_load_storage[col_4_slot] = ast_h.AssignStatement.load_labware(
                var_name=f"well_plate_{row_name}4",
                labware_name="nest_96_wellplate_100ul_pcr_full_skirt",
                labware_location=f"{row_name.upper()}4",
            )

    return ProtocolConfiguration(
        api_version="2.18",
        deck_configuration=deck_config,
        explicit_loads=explicit_load_storage,
    )


@st.composite
def a_protocol_that_loads_invalid_stuff_into_a_staging_area_col_3(
    draw: st.DrawFn,
) -> ProtocolConfiguration:
    """Generate a protocol that loads invalid stuff into staging area column 3."""
    return draw(a_protocol_that_loads_invalid_stuff_into_a_staging_area("3"))


@st.composite
def a_protocol_that_loads_invalid_stuff_into_a_staging_area_col_4(
    draw: st.DrawFn,
) -> ProtocolConfiguration:
    """Generate a protocol that loads invalid stuff into staging area column 4."""
    return draw(a_protocol_that_loads_invalid_stuff_into_a_staging_area("4"))


@st.composite
def a_protocol_that_tries_to_load_something_on_top_of_thermocycler(
    draw: st.DrawFn,
) -> ProtocolConfiguration:
    """Generate a protocol that tries to load something on top of a thermocycler."""
    thermocycler_slot: AllSlotName = draw(st.sampled_from(["a1", "b1"]))

    module_load = ast_h.AssignStatement.load_module(
        module_info=draw(st.sampled_from(Modules.modules())),
        module_location=thermocycler_slot,
    )
    labware_load = ast_h.AssignStatement.load_labware(
        var_name=f"well_plate_{thermocycler_slot}",
        labware_name="nest_96_wellplate_100ul_pcr_full_skirt",
        labware_location=thermocycler_slot,
    )
    trash_bin_load = ast_h.AssignStatement.load_trash_bin(thermocycler_slot)

    explicit_load_storage: ast_h.ExplicitLoadStorage = {
        thermocycler_slot: draw(
            st.sampled_from([module_load, trash_bin_load, labware_load])
        )
    }
    return ProtocolConfiguration(
        api_version="2.18",
        deck_configuration=draw(a_deck_with_a_thermocycler()),
        explicit_loads=explicit_load_storage,
        allow_overlapping_loads=True,
    )


@st.composite
def a_protocol_that_tries_to_load_something_on_top_of_a_waste_chute(
    draw: st.DrawFn,
) -> ProtocolConfiguration:
    """Generate a protocol that tries to load something on top of a waste chute."""
    MODULES_NOT_ALLOWED_ON_WASTE_CHUTE = [
        Modules.HEATER_SHAKER_MODULE,
        Modules.TEMPERATURE_MODULE,
        Modules.MAGNETIC_BLOCK_MODULE,
    ]
    waste_chute_slot: AllSlotName = "d3"
    module_load = ast_h.AssignStatement.load_module(
        module_info=draw(st.sampled_from(MODULES_NOT_ALLOWED_ON_WASTE_CHUTE)),
        module_location=waste_chute_slot,
    )
    labware_load = ast_h.AssignStatement.load_labware(
        var_name=f"well_plate_{waste_chute_slot}",
        labware_name="nest_96_wellplate_100ul_pcr_full_skirt",
        labware_location=waste_chute_slot,
    )
    trash_bin_load = ast_h.AssignStatement.load_trash_bin(waste_chute_slot)

    explicit_load_storage: ast_h.ExplicitLoadStorage = {
        waste_chute_slot: draw(
            st.sampled_from([module_load, trash_bin_load, labware_load])
        )
    }
    return ProtocolConfiguration(
        api_version="2.18",
        deck_configuration=draw(a_deck_with_a_waste_chute()),
        explicit_loads=explicit_load_storage,
        allow_overlapping_loads=True,
    )
