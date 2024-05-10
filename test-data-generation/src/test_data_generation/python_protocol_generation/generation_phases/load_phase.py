"""This module contains the functions that generate the various load statements of a protocol.

For example, load_module, load_labware, load_waste_chute, etc.
"""

import typing

from test_data_generation.constants import (
    DeckConfigurationSlotName,
    Modules,
    RowName,
)
from test_data_generation.datashapes import (
    PipetteConfiguration,
    Slot,
)
from test_data_generation.datashapes import (
    DeckConfigurationFixtures as DCF,
)
from test_data_generation.python_protocol_generation import ast_helpers as ast_h


def _staging_area(row: RowName) -> typing.List[ast_h.AssignStatement]:
    """Create a staging area in a specified row.

    This is done implicitly by loading a 96-well plate in column 4 of the specified row.
    """
    return [
        ast_h.AssignStatement.load_labware(
            var_name=f"well_plate_{row}4",
            labware_name="nest_96_wellplate_100ul_pcr_full_skirt",
            labware_location=f"{row.upper()}4",
        )
    ]


def _waste_chute(has_staging_area: bool) -> typing.List[ast_h.AssignStatement]:
    """Create a waste chute.

    If has_staging_area is True, a staging area is created in row D.
    """
    entries = [ast_h.AssignStatement.load_waste_chute()]

    if has_staging_area:
        entries.extend(_staging_area("d"))

    return entries


def _magnetic_block_on_staging_area(row: RowName) -> typing.List[ast_h.AssignStatement]:
    """Create a magnetic block on a staging area in a specified row."""
    slot = typing.cast(DeckConfigurationSlotName, f"{row}3")
    entries = _staging_area(row)
    entries.extend(_magnetic_block(slot))
    return entries


def _trash_bin(slot: DeckConfigurationSlotName) -> typing.List[ast_h.AssignStatement]:
    """Create a trash bin in a specified slot."""
    return [ast_h.AssignStatement.load_trash_bin(slot)]


def _thermocycler_module() -> typing.List[ast_h.AssignStatement]:
    """Create a thermocycler module."""
    return [
        ast_h.AssignStatement.load_module(
            module_info=Modules.THERMOCYCLER_MODULE,
            module_location=None,
        )
    ]


def _temperature_module(
    slot: DeckConfigurationSlotName,
) -> typing.List[ast_h.AssignStatement]:
    """Create a temperature module in a specified slot."""
    return [
        ast_h.AssignStatement.load_module(
            module_info=Modules.TEMPERATURE_MODULE,
            module_location=slot,
        )
    ]


def _magnetic_block(
    slot: DeckConfigurationSlotName,
) -> typing.List[ast_h.AssignStatement]:
    """Create a magnetic block in a specified slot."""
    return [
        ast_h.AssignStatement.load_module(
            module_info=Modules.MAGNETIC_BLOCK_MODULE, module_location=slot
        )
    ]


def _heater_shaker_module(
    slot: DeckConfigurationSlotName,
) -> typing.List[ast_h.AssignStatement]:
    """Create a heater shaker module in a specified slot."""
    return [
        ast_h.AssignStatement.load_module(
            module_info=Modules.HEATER_SHAKER_MODULE, module_location=slot
        )
    ]


def _labware_slot(
    slot: DeckConfigurationSlotName,
) -> typing.List[ast_h.AssignStatement]:
    """Create a labware slot in a specified slot."""
    return [
        ast_h.AssignStatement.load_labware(
            var_name=f"well_plate_{slot}",
            labware_name="nest_96_wellplate_100ul_pcr_full_skirt",
            labware_location=slot,
        )
    ]


def create_deck_configuration_satisfying_load_statement(
    slot: Slot,
) -> typing.List[ast_h.AssignStatement]:
    """Maps the contents of a slot to the correct assign statement."""
    if slot.contents == DCF.THERMOCYCLER_MODULE and slot.label == "b1":
        return []

    match slot.contents:
        case DCF.WASTE_CHUTE | DCF.WASTE_CHUTE_NO_COVER:
            return _waste_chute(False)

        case (
            DCF.STAGING_AREA_WITH_WASTE_CHUTE
            | DCF.STAGING_AREA_WITH_WASTE_CHUTE_NO_COVER
        ):
            return _waste_chute(True)

        case DCF.STAGING_AREA_WITH_MAGNETIC_BLOCK:
            return _magnetic_block_on_staging_area(slot.row)

        case DCF.TRASH_BIN:
            return _trash_bin(slot.label)

        case DCF.THERMOCYCLER_MODULE:
            return _thermocycler_module()

        case DCF.TEMPERATURE_MODULE:
            return _temperature_module(slot.label)

        case DCF.MAGNETIC_BLOCK_MODULE:
            return _magnetic_block(slot.label)

        case DCF.HEATER_SHAKER_MODULE:
            return _heater_shaker_module(slot.label)

        case DCF.STAGING_AREA:
            return _staging_area(slot.row)

        case DCF.LABWARE_SLOT:
            return _labware_slot(slot.label)

        case _:
            raise (ValueError(f"Unknown slot contents: {slot.contents}"))


def create_deck_slot_load_statements(
    slots: typing.List[Slot],
) -> typing.List[ast_h.AssignStatement]:
    """Iterates over a list of slots and creates the corresponding load statements."""
    entries: typing.List[ast_h.AssignStatement] = []
    for slot in slots:
        if slot.contents == PSC.THERMOCYCLER_MODULE and slot.label == "b1":
            continue

        load_statement = create_deck_slot_load_statement(slot)
        if isinstance(load_statement, typing.List):
            entries.extend(load_statement)
        else:
            entries.append(load_statement)
    return entries


def create_pipette_load_statements(
    pipette_config: PipetteConfiguration,
) -> typing.List[ast_h.AssignStatement]:
    """Create the load statements for a pipette configuration."""
    entries: typing.List[ast_h.AssignStatement] = []
    if pipette_config.left is not None:
        entries.append(
            ast_h.AssignStatement(
                var_name="left_pipette",
                value=ast_h.CallFunction(
                    call_on=PROTOCOL_CONTEXT_VAR_NAME,
                    what_to_call=ProtocolContextMethods.LOAD_INSTRUMENT,
                    args=[pipette_config.left.value, "left"],
                ),
            )
        )
    if pipette_config.right is not None:
        entries.append(
            ast_h.AssignStatement(
                var_name="right_pipette",
                value=ast_h.CallFunction(
                    call_on=PROTOCOL_CONTEXT_VAR_NAME,
                    what_to_call=ProtocolContextMethods.LOAD_INSTRUMENT,
                    args=[pipette_config.right.value, "right"],
                ),
            )
        )

    return entries
