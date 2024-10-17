"""Immunoprecipitation by Dynabeads 96-wells (Reagents in 15 mL tubes)."""
from opentrons import protocol_api
from opentrons.protocol_api import Well
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    TemperatureModuleContext,
    MagneticBlockContext,
)
from typing import List, Union
from abr_testing.protocols import shared_vars_and_funcs

metadata = {
    "protocolName": "Immunoprecipitation by Dynabeads - 96-wells (Reagents in 15 mL tubes)",
    "author": "Boren Lin, Opentrons",
    "description": "Automates immunoprecipitation to isolate a protein of interest from liquid samples by using protein A– or G–coupled magnetic beads.",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.20",
}


########################
def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Defines parameters."""
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
    )
    parameters.add_float(
        variable_name="dot_bottom",
        display_name=".bottom",
        description="Lowest value pipette will go to.",
        default=0.5,
        choices=[
            {"display_name": "0.0", "value": 0.0},
            {"display_name": "0.1", "value": 0.1},
            {"display_name": "0.2", "value": 0.2},
            {"display_name": "0.3", "value": 0.3},
            {"display_name": "0.4", "value": 0.4},
            {"display_name": "0.5", "value": 0.5},
            {"display_name": "0.6", "value": 0.6},
            {"display_name": "0.7", "value": 0.7},
            {"display_name": "0.8", "value": 0.8},
            {"display_name": "0.9", "value": 0.9},
            {"display_name": "1.0", "value": 1.0},
        ],
    )


NUM_COL = 12

MAG_DELAY_MIN = 1

BEADS_VOL = 50
AB_VOL = 50
SAMPLE_VOL = 200
WASH_TIMES = 3
WASH_VOL = 200
ELUTION_VOL = 50

WASTE_VOL_MAX = 275000

READY_FOR_SDSPAGE = 0
# YES: 1; NO: 0

USE_GRIPPER = True

waste_vol_chk = 0.0
waste_vol = 0.0

TIP_TRASH = False  # True = Used tips go in Trash, False = Used tips go back into rack

#########################


def run(ctx: protocol_api.ProtocolContext) -> None:
    """Run Protocol."""
    heater_shaker_speed = ctx.params.heater_shaker_speed  # type: ignore[attr-defined]
    ASP_HEIGHT = ctx.params.dot_bottom  # type: ignore[attr-defined]
    MIX_SPEEND = heater_shaker_speed
    MIX_SEC = 10
    # if on deck:
    INCUBATION_SPEEND = heater_shaker_speed * 0.5
    INCUBATION_MIN = 60
    # load labware

    sample_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", "B2", "samples")
    wash_res = ctx.load_labware("nest_12_reservoir_15ml", "B1", "wash")
    reagent_res = ctx.load_labware(
        "opentrons_15_tuberack_nest_15ml_conical", "C3", "reagents"
    )
    waste_res = ctx.load_labware("nest_1_reservoir_290ml", "D2", "waste")

    tips = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B3")
    tips_sample = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "A2", "sample tips"
    )
    tips_sample_loc = tips_sample.wells()[:95]
    if READY_FOR_SDSPAGE == 0:
        tips_elu = ctx.load_labware(
            "opentrons_flex_96_tiprack_1000ul", "A1", "elution tips"
        )
        tips_elu_loc = tips_elu.wells()[:95]
    tips_reused = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "C2", "reused tips"
    )
    tips_reused_loc = tips_reused.wells()[:95]
    p1000 = ctx.load_instrument("flex_8channel_1000", "right", tip_racks=[tips])
    p1000_single = ctx.load_instrument("flex_1channel_1000", "left", tip_racks=[tips])
    h_s_string = "heaterShakerModuleV1"
    h_s: HeaterShakerContext = ctx.load_module(h_s_string, "D1")  # type: ignore[assignment]
    h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
    working_plate = h_s_adapter.load_labware(
        "nest_96_wellplate_2ml_deep", "working plate"
    )

    if READY_FOR_SDSPAGE == 0:
        temp_mod_str = "Temperature Module Gen2"
        temp: TemperatureModuleContext = ctx.load_module(temp_mod_str, "D3")  # type: ignore[assignment]
        temp_adaptor = temp.load_adapter("opentrons_96_deep_well_temp_mod_adapter")
        final_plate = temp_adaptor.load_labware(
            "nest_96_wellplate_2ml_deep", "final plate"
        )

    mag: MagneticBlockContext = ctx.load_module("magneticBlockV1", "C1")  # type: ignore[assignment]

    # liquids
    samples = sample_plate.rows()[0][:NUM_COL]  # 1
    beads = reagent_res.wells()[0]  # 2
    ab = reagent_res.wells()[1]  # 3
    elu = reagent_res.wells()[2]  # 4
    wash = wash_res.rows()[0][:NUM_COL]  # 5
    waste = waste_res.wells()[0]
    working_cols = working_plate.rows()[0][:NUM_COL]  # 6
    working_wells = working_plate.wells()[: NUM_COL * 8]  # 6
    if READY_FOR_SDSPAGE == 0:
        final_cols = final_plate.rows()[0][:NUM_COL]

    def transfer_plate_to_plate(
        vol1: float, start: List[Well], end: List[Well], liquid: float
    ) -> None:
        """Transfer from plate to plate."""
        for i in range(NUM_COL):
            if liquid == 1:
                p1000.pick_up_tip(tips_sample_loc[i * 8])
            else:
                p1000.pick_up_tip(tips_elu_loc[i * 8])
            start_loc = start[i]
            end_loc = end[i]
            p1000.aspirate(vol1, start_loc.bottom(z=ASP_HEIGHT), rate=2)
            p1000.air_gap(10)
            p1000.dispense(vol1 + 10, end_loc.bottom(z=15), rate=2)
            p1000.blow_out()
            p1000.touch_tip()
            p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()

    def transfer_well_to_plate(
        vol2: float,
        start: Union[Well, List[Well]],
        end: List[Well],
        liquid: int,
        drop_height: int = -20,
    ) -> None:
        """Transfer from well to plate."""

        pipette = p1000 if isinstance(start, list) and liquid == 5 else p1000_single
        pipette.pick_up_tip()

        if isinstance(start, list):  # Handling multiple wells
            for j in range(NUM_COL):
                start_loc, end_loc = start[j], end[j]
                pipette.require_liquid_presence(start_loc)
                pipette.aspirate(vol2, start_loc.bottom(z=ASP_HEIGHT), rate=2)
                pipette.air_gap(10)
                pipette.dispense(vol2 + 10, end_loc.top(z=drop_height), rate=2)
                pipette.blow_out()
        else:  # Handling a single well
            vol = vol2 * 8
            start_loc = start

            for height_factor in [5, 20]:
                pipette.mix(
                    5,
                    vol * 0.75,
                    start_loc.bottom(z=ASP_HEIGHT * height_factor),
                    rate=2,
                )

            for j in range(NUM_COL):
                end_loc_gap = end[j * 8]
                if liquid == 2:
                    pipette.mix(
                        2, vol * 0.75, start_loc.bottom(z=ASP_HEIGHT * 5), rate=2
                    )

                pipette.require_liquid_presence(start_loc)
                pipette.aspirate(vol, start_loc.bottom(z=ASP_HEIGHT * 5), rate=2)
                pipette.air_gap(10)
                pipette.dispense(10, end_loc_gap.top(z=-5))

                for jj in range(8):
                    pipette.dispense(vol2, end[j * 8 + jj].bottom(z=10), rate=0.75)

                pipette.touch_tip()

            pipette.blow_out()
            # Handle tip return or drop
            pipette.return_tip() if not TIP_TRASH else pipette.drop_tip()

    def discard(vol3: float, start: List[Well]) -> None:
        """Get rid of liquid waste."""
        global waste_vol
        global waste_vol_chk
        if waste_vol_chk >= WASTE_VOL_MAX:
            ctx.pause("Empty Liquid Waste")
            waste_vol_chk = 0
        waste_vol = 0
        for k in range(NUM_COL):
            p1000.pick_up_tip(tips_reused_loc[k * 8])
            start_loc = start[k]
            end_loc = waste
            p1000.aspirate(vol3, start_loc.bottom(z=ASP_HEIGHT), rate=0.3)
            p1000.air_gap(10)
            p1000.dispense(vol3 + 10, end_loc.top(z=-5), rate=2)
            p1000.blow_out()
            p1000.return_tip()
        waste_vol = vol3 * float(NUM_COL) * 8.0
        waste_vol_chk = waste_vol_chk + waste_vol

    # protocol

    # Add beads, samples and antibody solution
    h_s.close_labware_latch()

    transfer_well_to_plate(BEADS_VOL, beads, working_wells, 2)

    shared_vars_and_funcs.from_hs_to_mag(ctx, working_plate, h_s, mag)
    ctx.delay(minutes=MAG_DELAY_MIN)
    discard(BEADS_VOL * 1.1, working_cols)

    shared_vars_and_funcs.from_mag_to_hs(ctx, working_plate, h_s_adapter, h_s)

    transfer_plate_to_plate(SAMPLE_VOL, samples, working_cols, 1)
    transfer_well_to_plate(AB_VOL, ab, working_wells, 3)

    # MIX
    shared_vars_and_funcs.h_s_speed_and_delay(ctx, h_s, MIX_SPEEND / 60, MIX_SEC, False)

    # INCUBATE
    shared_vars_and_funcs.h_s_speed_and_delay(
        ctx, h_s, INCUBATION_SPEEND, INCUBATION_MIN, True
    )

    shared_vars_and_funcs.from_hs_to_mag(ctx, working_plate, h_s, mag)

    ctx.delay(minutes=MAG_DELAY_MIN)
    vol_total = SAMPLE_VOL + AB_VOL
    discard(vol_total * 1.1, working_cols)

    # Wash
    for _ in range(WASH_TIMES):
        # Move Working Plate to the Shaker
        shared_vars_and_funcs.from_mag_to_hs(ctx, working_plate, h_s_adapter, h_s)

        transfer_well_to_plate(WASH_VOL, wash, working_cols, 5)
        # Mix
        shared_vars_and_funcs.h_s_speed_and_delay(
            ctx, h_s, MIX_SPEEND, MIX_SEC / 60, True
        )

        # Move the Working Plate to the Magnet
        shared_vars_and_funcs.from_hs_to_mag(ctx, working_plate, h_s, mag)
        ctx.delay(minutes=MAG_DELAY_MIN)
        discard(WASH_VOL * 1.1, working_cols)

    # Elution
    # Move Working Plate to the Shaker
    shared_vars_and_funcs.from_mag_to_hs(ctx, working_plate, h_s_adapter, h_s)

    transfer_well_to_plate(ELUTION_VOL, elu, working_wells, 4)
    if READY_FOR_SDSPAGE == 1:
        ctx.pause("Seal the Working Plate")
        h_s.set_and_wait_for_temperature(70)
        shared_vars_and_funcs.h_s_speed_and_delay(
            ctx, h_s, MIX_SPEEND, MIX_SEC / 60, True
        )
        ctx.delay(minutes=10)
        h_s.deactivate_heater()
        h_s.open_labware_latch()
        ctx.pause("Protocol Complete")

    elif READY_FOR_SDSPAGE == 0:
        shared_vars_and_funcs.h_s_speed_and_delay(
            ctx, h_s, MIX_SPEEND, MIX_SEC / 60, True
        )
        ctx.delay(minutes=2)

        temp.set_temperature(4)
        # Move the Working Plate to the Magnet
        shared_vars_and_funcs.from_hs_to_mag(ctx, working_plate, h_s, mag)
        ctx.delay(minutes=MAG_DELAY_MIN)
        transfer_plate_to_plate(ELUTION_VOL * 1.1, working_cols, final_cols, 6)
        # ctx.pause('Protocol Complete')
        temp.deactivate()
