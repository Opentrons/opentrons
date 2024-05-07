"""This module contains the functions that generate the various load statements of a protocol.

For example, load_module, load_labware, load_waste_chute, etc.
"""

import typing
from test_data_generation.deck_configuration.datashapes import (
    PossibleSlotContents as PSC,
    Slot,
    SlotName,
    RowName,
)
from test_data_generation.python_protocol_generation import ast_helpers as ast_h


def _staging_area(row: RowName) -> ast_h.AssignStatement:
    """Create a staging area in a specified row.

    This is done implicitly by loading a 96-well plate in column 4 of the specified row.
    """
    labware_name = "nest_96_wellplate_100ul_pcr_full_skirt"
    labware_location = f"{row.upper()}4"

    return ast_h.AssignStatement(
        var_name=f"well_plate_{row}4",
        value=ast_h.CallFunction(
            call_on="protocol_context",
            method_name="load_labware",
            args=[labware_name, labware_location],
        ),
    )


def _waste_chute(
    has_staging_area: bool, has_cover: bool
) -> typing.List[ast_h.AssignStatement]:
    """Create a waste chute.

    If has_staging_area is True, a staging area is created in row D.
    """
    entries = [
        ast_h.AssignStatement(
            var_name="waste_chute",
            value=ast_h.CallFunction(
                call_on="protocol_context",
                method_name="load_waste_chute",
                args=[],
            ),
        )
    ]

    # TODO: If has_cover, set USE_96_CHANNEL_PIPETTE to False

    if has_staging_area:
        entries.append(_staging_area("d"))

    return entries


def _magnetic_block_on_staging_area(row: RowName) -> typing.List[ast_h.AssignStatement]:
    """Create a magnetic block on a staging area in a specified row."""
    module_name = "magneticBlockV1"
    module_location = f"{row.upper()}3"

    entries = [
        ast_h.AssignStatement(
            var_name=f"mag_block_{row}3",
            value=ast_h.CallFunction(
                call_on="protocol_context",
                method_name="load_module",
                args=[module_name, module_location],
            ),
        ),
        _staging_area(row),
    ]
    return entries

    # Call module.labware to make sure it is included as part of the analysis


def _trash_bin(slot: SlotName) -> ast_h.AssignStatement:
    """Create a trash bin in a specified slot."""
    location = slot.upper()

    return ast_h.AssignStatement(
        var_name=f"trash_bin_{slot}",
        value=ast_h.CallFunction(
            call_on="protocol_context",
            method_name="load_trash_bin",
            args=[location],
        ),
    )

    # Call trash_bin.top() to make sure it is included as part of the analysis


def _thermocycler_module() -> ast_h.AssignStatement:
    """Create a thermocycler module."""
    module_name = "thermocyclerModuleV2"

    return ast_h.AssignStatement(
        var_name="thermocycler_module",
        value=ast_h.CallFunction(
            call_on="protocol_context",
            method_name="load_module",
            args=[module_name],
        ),
    )

    # Call module.labware to make sure it is included as part of the analysis


def _temperature_module(slot: SlotName) -> ast_h.AssignStatement:
    """Create a temperature module in a specified slot."""
    module_name = "temperatureModuleV2"
    module_location = slot.upper()
    return ast_h.AssignStatement(
        var_name=f"temperature_module_{slot}",
        value=ast_h.CallFunction(
            call_on="protocol_context",
            method_name="load_module",
            args=[module_name, module_location],
        ),
    )

    # Call module.labware to make sure it is included as part of the analysis


def _magnetic_block(slot_name: SlotName) -> ast_h.AssignStatement:
    """Create a magnetic block in a specified slot."""
    module_name = "magneticBlockV1"
    module_location = slot_name.upper()
    return ast_h.AssignStatement(
        var_name=f"mag_block_{slot_name}",
        value=ast_h.CallFunction(
            call_on="protocol_context",
            method_name="load_module",
            args=[module_name, module_location],
        ),
    )
    # Call module.labware to make sure it is included as part of the analysis


def _heater_shaker_module(slot_name: SlotName) -> ast_h.AssignStatement:
    """Create a heater shaker module in a specified slot."""
    module_name = "heaterShakerModuleV1"
    module_location = slot_name.upper()

    return ast_h.AssignStatement(
        var_name=f"heater_shaker_{slot_name}",
        value=ast_h.CallFunction(
            call_on="protocol_context",
            method_name="load_module",
            args=[module_name, module_location],
        ),
    )
    # Call module.labware to make sure it is included as part of the analysis


def _labware_slot(slot_name: SlotName) -> ast_h.AssignStatement:
    """Create a labware slot in a specified slot."""
    labware_name = "nest_96_wellplate_100ul_pcr_full_skirt"
    labware_location = slot_name.upper()

    return ast_h.AssignStatement(
        var_name=f"well_plate_{slot_name}",
        value=ast_h.CallFunction(
            call_on="protocol_context",
            method_name="load_labware",
            args=[labware_name, labware_location],
        ),
    )
    # well_plate_{slot}.is_tiprack


def create_load_statement(
    slot: Slot,
) -> ast_h.AssignStatement | typing.List[ast_h.AssignStatement]:
    """Maps the contents of a slot to the correct assign statement."""
    match slot.contents:
        case PSC.WASTE_CHUTE:
            return _waste_chute(False, True)

        case PSC.WASTE_CHUTE_NO_COVER:
            return _waste_chute(False, False)

        case PSC.STAGING_AREA_WITH_WASTE_CHUTE:
            return _waste_chute(True, True)

        case PSC.STAGING_AREA_WITH_WASTE_CHUTE_NO_COVER:
            return _waste_chute(True, False)

        case PSC.STAGING_AREA_WITH_MAGNETIC_BLOCK:
            return _magnetic_block_on_staging_area(slot.row)

        case PSC.TRASH_BIN:
            return _trash_bin(slot.label)

        case PSC.THERMOCYCLER_MODULE:
            return _thermocycler_module()

        case PSC.TEMPERATURE_MODULE:
            return _temperature_module(slot.label)

        case PSC.MAGNETIC_BLOCK_MODULE:
            return _magnetic_block(slot.label)

        case PSC.HEATER_SHAKER_MODULE:
            return _heater_shaker_module(slot.label)

        case PSC.STAGING_AREA:
            return _staging_area(slot.row)

        case PSC.LABWARE_SLOT:
            return _labware_slot(slot.label)

        case _:
            raise (ValueError(f"Unknown slot contents: {slot.contents}"))


def create_load_statements(
    slots: typing.List[Slot],
) -> typing.List[ast_h.AssignStatement]:
    """Iterates over a list of slots and creates the corresponding load statements."""
    entries: typing.List[ast_h.AssignStatement] = []
    for slot in slots:
        load_statement = create_load_statement(slot)
        if isinstance(load_statement, typing.List):
            entries.extend(load_statement)
        else:
            entries.append(load_statement)
    return entries
