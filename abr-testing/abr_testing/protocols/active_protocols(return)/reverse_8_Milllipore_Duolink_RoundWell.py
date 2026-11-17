"""Reverse companion for the Duolink PLA combined protocol.

Water-only ABR: mixed waste is recoverable. Restores reagent-reservoir starting
volumes from the shared liquid-waste reservoir for automated rerun.
"""

from opentrons.protocol_api import (
    HeaterShakerContext,
    ParameterContext,
    ProtocolContext,
)

metadata = {
    "protocolName": "Reverse Duolink PLA Safe Reset",
    "author": "Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

TRANSFER_VOLUME = 40
REAGENT_DEAD_VOLUME = 40


def add_parameters(parameters: ParameterContext) -> None:
    """Mirror the original deck and sample-count choices."""
    parameters.add_int(
        variable_name="num_sample",
        display_name="Original Number of Samples",
        default=96,
        minimum=1,
        maximum=96,
    )
    parameters.add_bool(
        variable_name="heat_on_deck",
        display_name="Original Incubation on Deck",
        default=True,
    )
    parameters.add_bool(
        variable_name="use_lid",
        display_name="Original Plate Lid Use",
        default=True,
    )
    parameters.add_bool(
        variable_name="use_temp",
        display_name="Original Temperature Use",
        default=True,
    )


def run(protocol: ProtocolContext) -> None:
    """Restore reagent starting volumes from mixed waste."""
    num_sample = protocol.params.num_sample  # type: ignore[attr-defined]
    num_col_full = num_sample // 8
    num_well_last_col = num_sample % 8

    protocol.load_labware("milliplex_r_96_well_microtiter_plate", "C2", "ASSAY PLATE")
    waste_reservoir = protocol.load_labware(
        "nest_1_reservoir_290ml", "D2", "LIQUID WASTE"
    )
    protocol.load_lid_stack("opentrons_tough_universal_lid", "C4", 1)

    if protocol.params.use_temp:  # type: ignore[attr-defined]
        temp_module = protocol.load_module("temperature module gen2", "C1")
        reagent_plate = temp_module.load_adapter(
            "opentrons_96_deep_well_temp_mod_adapter"
        ).load_labware("nest_96_wellplate_2ml_deep", "Reagent Plate")
    else:
        temp_module = None
        reagent_plate = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", "C1", "Reagent Plate"
        )
    heater_shaker: HeaterShakerContext = protocol.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    heater_shaker.load_adapter("opentrons_universal_flat_adapter_type_b")

    tips_1k = [
        protocol.load_labware(
            "opentrons_flex_96_tiprack_1000ul",
            slot,
            f"1000 uL Tips {index + 1}",
        )
        for index, slot in enumerate(["B3", "B2"])
    ]
    protocol.load_labware("opentrons_flex_96_tiprack_200ul", "B1")
    protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A2")
    protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A1")
    p1k_1 = protocol.load_instrument("flex_1channel_1000", "right", tip_racks=tips_1k)

    reagent_columns = reagent_plate.columns()[:7]
    reagent_info = [
        ("ANTIBODY SOLUTION", "#98FB98"),
        ("BLOCKING SOLUTION", "#FFC300"),
        ("PLA PROBE SOLUTION", "#FF5733"),
        ("LIGATION SOLUTION", "#F39C12"),
        ("AMPLIFICATION SOLUTION", "#52BE80"),
        ("DAPI", "#A569BD"),
        ("ANTI-FADE BUFFER", "#AEB6BF"),
    ]
    consumed_volume_by_row = [
        TRANSFER_VOLUME * (num_col_full + (1 if row < num_well_last_col else 0))
        for row in range(8)
    ]
    for column, (name, color) in zip(reagent_columns, reagent_info):
        liquid = protocol.define_liquid(
            name=name,
            description="Residual dead volume after the forward water run.",
            display_color=color,
        )
        for well in column:
            well.load_liquid(liquid, REAGENT_DEAD_VOLUME)

    total_volume = len(reagent_columns) * sum(consumed_volume_by_row)
    waste_reservoir["A1"].load_liquid(
        protocol.define_liquid(
            "Mixed water waste",
            description="Forward discard output; recoverable for ABR water runs.",
            display_color="#6A5ACD",
        ),
        total_volume,
    )

    protocol.comment("Recovering reagent-reservoir water from mixed liquid waste.")
    p1k_1.pick_up_tip()
    p1k_1.liquid_presence_detection = False
    # Restore in the opposite order from the forward protocol. Dispensing above
    # the liquid avoids carrying mixed waste between reagent wells.
    forward_column_order = [
        reagent_columns[1],
        reagent_columns[0],
        *reagent_columns[2:7],
    ]
    for column in reversed(forward_column_order):
        for well, volume in zip(column, consumed_volume_by_row):
            if volume > 0:
                p1k_1.aspirate(volume, waste_reservoir["A1"].bottom(z=1))
                p1k_1.dispense(volume, well.top(z=-2))
    p1k_1.return_tip()

    if protocol.params.heat_on_deck:  # type: ignore[attr-defined]
        heater_shaker.close_labware_latch()
        heater_shaker.deactivate_shaker()
        heater_shaker.deactivate_heater()

    p1k_1.reset_tipracks()
    protocol.comment("Reset complete. Assay plate and lid unchanged. Rerun original.")
