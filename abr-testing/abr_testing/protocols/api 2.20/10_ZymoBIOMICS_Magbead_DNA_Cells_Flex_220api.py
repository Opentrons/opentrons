"""Flex ZymoBIOMICS Magbead DNA Extraction: Cells."""
import math
from opentrons import types
from typing import List, Union
from opentrons import protocol_api
from opentrons.protocol_api import Well
import numpy as np
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    TemperatureModuleContext,
    MagneticBlockContext,
)

from abr_testing.protocols import shared_vars_and_funcs

metadata = {
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
    "protocolName": "Flex ZymoBIOMICS Magbead DNA Extraction: Cells",
}

requirements = {"robotType": "OT-3", "apiLevel": "2.20"}
"""
Slot A1: Tips 1000
Slot A2: Tips 1000
Slot A3: Temperature module (gen2) with 96 well PCR block and Armadillo 96 well PCR Plate
Slot B1: Tips 1000
Slot B3: Nest 1 Well Reservoir
Slot C1: Magblock
Slot C2: Nest 12 well 15 ml Reservoir
Slot D1: H-S with Nest 96 Well Deepwell and DW Adapter
Slot D2: Nest 12 well 15 ml Reservoir
Slot D3: Trash

Reservoir 1:
Well 1 - 12,320 ul
Wells 2-4 - 11,875 ul
Wells 5-6 - 13,500 ul
Wells 7-8 - 13,500 ul
Well 12 - 5,200 ul

Reservoir 2:
Wells 1-12 - 9,000 ul

"""
whichwash = 1
sample_max = 48
tip1k = 0
tip200 = 0
drop_count = 0


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Define parameters."""
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
    )
    parameters.add_str(
        variable_name="mount_pos",
        display_name="Mount Position",
        description="What mount to use",
        choices=[
            {"display_name": "Left Mount", "value": "left"},
            {"display_name": "Right Mount", "value": "right"},
        ],
        default="left",
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


def run(ctx: protocol_api.ProtocolContext) -> None:
    """Protocol Set up."""
    heater_shaker_speed = ctx.params.heater_shaker_speed  # type: ignore[attr-defined]
    mount = ctx.params.mount_pos  # type: ignore[attr-defined]
    dot_bottom = ctx.params.dot_bottom  # type: ignore[attr-defined]
    dry_run = False
    TIP_TRASH = False
    num_samples = 8
    wash1_vol = 500
    wash2_vol = wash3_vol = 900
    lysis_vol = 200
    sample_vol = 10  # Sample should be pelleted tissue/bacteria/cells
    bind_vol = 600
    bind2_vol = 500
    elution_vol = 75

    # Protocol Parameters

    if not dry_run:
        settling_time = 2.0
        lysis_incubation = 30.0
    else:
        settling_time = 0.25
        lysis_incubation = 0.25
    PK_vol = 20.0
    bead_vol = 25.0
    starting_vol = lysis_vol + sample_vol
    binding_buffer_vol = bind_vol + bead_vol
    ctx.load_trash_bin("A3")
    hs_string = "heaterShakerModuleV1"
    h_s: HeaterShakerContext = ctx.load_module(hs_string, "D1")  # type: ignore[assignment]
    h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
    sample_plate = h_s_adapter.load_labware("nest_96_wellplate_2ml_deep", "Samples")
    h_s.close_labware_latch()
    temp: TemperatureModuleContext = ctx.load_module(
        "temperature module gen2", "D3"
    )  # type: ignore[assignment]
    temp_block = temp.load_adapter("opentrons_96_pcr_adapter")
    elutionplate = temp_block.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "Elution Plate"
    )
    magblock: MagneticBlockContext = ctx.load_module("magneticBlockV1", "C1")  # type: ignore[assignment]
    waste = (
        ctx.load_labware("nest_1_reservoir_195ml", "B3", "Liquid Waste")
        .wells()[0]
        .top()
    )
    num_cols = math.ceil(num_samples / 8)
    labware_dict = {
        "A1": {"type": "opentrons_flex_96_tiprack_1000ul", "description": "Tips 1"},
        "A2": {"type": "opentrons_flex_96_tiprack_1000ul", "description": "Tips 2"},
        "B1": {"type": "opentrons_flex_96_tiprack_1000ul", "description": "Tips 3"},
        "C2": {"type": "nest_12_reservoir_15ml", "description": "reagent reservoir 2"},
        "D2": {"type": "nest_12_reservoir_15ml", "description": "reagent reservoir 1"},
    }
    labware_on_deck = shared_vars_and_funcs.load_labware_in_deck_slot(ctx, labware_dict)
    res1 = labware_on_deck[3]
    res2 = labware_on_deck[4]
    # Load tips and combine all similar boxes
    tips1000 = labware_on_deck[0]
    tips1001 = labware_on_deck[0]
    tips1002 = labware_on_deck[0]

    tips = [*tips1000.wells()[num_samples:96], *tips1001.wells(), *tips1002.wells()]
    tips_sn = tips1000.wells()[:num_samples]
    # load instruments
    m1000 = ctx.load_instrument("flex_8channel_1000", mount)
    # Reagents
    lysis_ = res1.wells()[0]
    binding_buffer = res1.wells()[1:4]
    bind2_res = res1.wells()[4:6]
    wash1 = res1.wells()[6:8]
    elution_solution = res1.wells()[-1]
    wash2 = res2.wells()[:6]
    wash3 = res2.wells()[6:]

    samples_m = sample_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]
    # Redefine per well for liquid definitions
    samps = sample_plate.wells()[: (8 * num_cols)]

    locations: List[Union[List[Well], Well]] = [
        lysis_,
        lysis_,
        binding_buffer,
        binding_buffer,
        bind2_res,
        wash1,
        wash2,
        wash3,
        elution_solution,
    ]
    vols = [
        lysis_vol,
        PK_vol,
        bead_vol,
        bind_vol,
        bind2_vol,
        wash1_vol,
        wash2_vol,
        wash3_vol,
        elution_vol,
    ]
    liquids = [
        "Lysis",
        "PK",
        "Beads",
        "Binding",
        "Binding 2",
        "Wash 1",
        "Wash 2",
        "Wash 3",
        "Final Elution",
    ]
    colors_for_protocol = shared_vars_and_funcs.colors
    # Defining liquids per sample well
    samples = ctx.define_liquid(
        name="Samples", description="Samples", display_color="#C0C0C0"
    )
    for i in samps:
        i.load_liquid(liquid=samples, volume=0)

    delete = len(colors_for_protocol) - len(liquids)

    if delete >= 1:
        for i_del in range(delete):
            colors_for_protocol.pop(-1)

    def calculate_extra_samples(
        vol: float, lysis_vol: float, bind_vol: float, liq_type: str
    ) -> int:
        """Calculate the number of extra samples required based on liquid type."""
        reference_vol = {"PK": lysis_vol, "Beads": bind_vol}.get(liq_type, vol)
        return math.ceil(1500 / reference_vol)

    def distribute_samples_across_wells(
        sampnum: int, locations: List, sample_max: int
    ) -> List[int]:
        """Distribute samples across multiple wells evenly."""
        limit = sample_max // len(locations)  # Max samples per well
        iterations = math.ceil(sampnum / limit)
        remaining_samples = sampnum % limit

        samples_per_well = [limit] * (iterations - 1)  # Fill full wells
        samples_per_well.append(remaining_samples or limit)  # Handle last well
        return samples_per_well

    def load_liquid(
        liq_type: str, location: Union[Well, List[Well]], color: str, vol: float
    ) -> None:
        """Assign liquid to wells with appropriate volume."""
        sampnum = 8 * math.ceil(num_samples / 8)  # Round up to nearest multiple of 8
        extra_samples = calculate_extra_samples(vol, lysis_vol, bind_vol, liq_type)

        liq = ctx.define_liquid(
            name=liq_type, description=liq_type, display_color=color
        )

        if isinstance(location, list):
            samples_per_well = distribute_samples_across_wells(
                sampnum, location, sample_max
            )
            for sample, well in zip(samples_per_well, location):
                well.load_liquid(liquid=liq, volume=vol * (sample + extra_samples))
        else:
            location.load_liquid(liquid=liq, volume=vol * (sampnum + extra_samples))

    # Call the function for each liquid and its corresponding parameters
    for ll, loc, col, vol in zip(liquids, locations, colors_for_protocol, vols):
        load_liquid(ll, loc, col, vol)

    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300

    def tiptrack(tipbox: List[Well]) -> None:
        """Tracks number of tips used."""
        global tip1k
        global drop_count
        if tipbox == tips:
            m1000.pick_up_tip(tipbox[int(tip1k)])
            tip1k = tip1k + 8

        drop_count = drop_count + 8
        if drop_count >= 150:
            drop_count = 0
            ctx.pause("Please empty the trash bin of all the tips before continuing.")

    def remove_supernatant(vol: float) -> None:
        """Removes Supernatant."""
        ctx.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 30
        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        for i, m in enumerate(samples_m):
            m1000.pick_up_tip(tips_sn[8 * i])
            loc = m.bottom(dot_bottom)
            for _ in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, m.top())
                m1000.move_to(m.center())
                m1000.transfer(vol_per_trans, loc, waste, new_tip="never", air_gap=20)
                m1000.blow_out(waste)
                m1000.air_gap(20)
            m1000.drop_tip(tips_sn[8 * i]) if TIP_TRASH else m1000.return_tip()
        m1000.flow_rate.aspirate = 300

        # Transfer from Magdeck plate to H-S
        shared_vars_and_funcs.from_mag_to_hs(ctx, sample_plate, h_s_adapter, h_s)

    def bead_mixing(
        well: Well, pip: protocol_api.InstrumentContext, mvol: float, reps: int = 8
    ) -> None:
        """Bead Mixing Step.

        'mixing' will mix liquid that contains beads. This will be done by
        aspirating from the bottom of the well and dispensing from the top as to
        mix the beads with the other liquids as much as possible. Aspiration and
        dispensing will also be reversed for a short to to ensure maximal mixing.
        Note~
        During each mix rep, there are 2 cycles of aspirating from bottom,
        dispensing at the top and 2 cycles of aspirating from middle,
        dispensing at the bottom.
        """
        center = well.top().move(types.Point(x=0, y=0, z=5))
        aspbot = well.bottom().move(types.Point(x=0, y=2, z=1))
        asptop = well.bottom().move(types.Point(x=0, y=-2, z=2))
        disbot = well.bottom().move(types.Point(x=0, y=2, z=3))
        distop = well.top().move(types.Point(x=0, y=1, z=-5))

        if mvol > 1000:
            mvol = 1000

        vol = mvol * 0.9

        pip.flow_rate.aspirate = 500
        pip.flow_rate.dispense = 500

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol, aspbot)
            pip.dispense(vol, distop)
            pip.aspirate(vol, asptop)
            pip.dispense(vol, disbot)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 100
                pip.aspirate(vol, aspbot)
                pip.dispense(vol, aspbot)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def mixing(
        well: Well, pip: protocol_api.InstrumentContext, mvol: float, reps: int = 8
    ) -> None:
        """
        Mixing Step.

        'mixing' will mix liquid that contains beads. This will be done by
        aspirating from the bottom of the well and dispensing from the top as to
        mix the beads with the other liquids as much as possible. Aspiration and
        dispensing will also be reversed for a short to to ensure maximal mixing.
        param well: The current well that the mixing will occur in.
        param pip: The pipet that is currently attached/ being used.
        param mvol: The volume that is transferred before the mixing steps.
        param reps: The number of mix repetitions that should occur. Note~
        During each mix rep, there are 2 cycles of aspirating from bottom,
        dispensing at the top and 2 cycles of aspirating from middle,
        dispensing at the bottom.
        """
        center = well.top(5)
        asp = well.bottom(1)
        disp = well.top(-8)

        if mvol > 1000:
            mvol = 1000

        vol = mvol * 0.9

        pip.flow_rate.aspirate = 500
        pip.flow_rate.dispense = 500

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol, asp)
            pip.dispense(vol, disp)
            pip.aspirate(vol, asp)
            pip.dispense(vol, disp)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 100
                pip.aspirate(vol, asp)
                pip.dispense(vol, asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def lysis(vol: float, source: Well) -> None:
        """Begins Lysis Steps."""
        ctx.comment("-----Beginning Lysis Steps-----")
        num_transfers = math.ceil(vol / 980)
        tiptrack(tips)
        # First Step: Mix Shield and PK
        for x in range(3 if not dry_run else 1):
            src = source
            m1000.aspirate(vol, src.bottom(1))
            m1000.dispense(vol, src.bottom(8))

        # Transfer Shield and PK
        num_cols_omitting_first = list(range(num_cols))[1:]
        for i in num_cols_omitting_first:
            tvol = vol / num_transfers
            for t in range(num_transfers):
                m1000.require_liquid_presence(src)
                m1000.aspirate(tvol, src.bottom(1))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume, samples_m[i].top())

        # Mix shield and pk with samples
        for i in range(num_cols):
            if i != 0:
                tiptrack(tips)
            mixing(samples_m[i], m1000, tvol, reps=5 if not dry_run else 1)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        time = lysis_incubation if not dry_run else 0.25
        shared_vars_and_funcs.h_s_speed_and_delay(
            ctx, h_s, heater_shaker_speed, time, True
        )

    def bind(vol1: float, vol2: float) -> None:
        """
        Binding Step.

        `bind` will perform magnetic bead binding on each sample in the
        deepwell plate. Each channel of binding beads will be mixed before
        transfer, and the samples will be mixed with the binding beads after
        the transfer. The magnetic deck activates after the addition to all
        samples, and the supernatant is removed after bead binding.
        :param vol (float): The amount of volume to aspirate from the elution
        buffer source and dispense to each well containing
        beads.
        :param park (boolean): Whether to save sample-corresponding tips
        between adding elution buffer and transferring
        supernatant to the final clean elutions PCR plate.
        """
        ctx.comment("-----Beginning Binding Steps-----")
        for i, well in enumerate(samples_m):
            tiptrack(tips)
            num_trans = math.ceil(vol1 / 980)
            vol_per_trans = vol1 / num_trans
            source = binding_buffer[i // 2]
            if i == 0:
                reps = 5
            else:
                reps = 2
            bead_mixing(source, m1000, vol_per_trans, reps=reps if not dry_run else 1)
            # Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.require_liquid_presence(source)
                m1000.transfer(
                    vol_per_trans, source, well.top(), air_gap=20, new_tip="never"
                )
                m1000.air_gap(20)
            bead_mixing(well, m1000, vol_per_trans, reps=8 if not dry_run else 1)
            m1000.blow_out()
            m1000.air_gap(10)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        hs_time = 10 if not dry_run else 0.25
        shared_vars_and_funcs.h_s_speed_and_delay(ctx, h_s, heater_shaker_speed * 0.9, hs_time, True)

        # Transfer from H-S plate to Magdeck plate
        shared_vars_and_funcs.from_hs_to_mag(ctx, sample_plate, h_s, magblock)

        for bindi in np.arange(
            settling_time + 1, 0, -0.5
        ):  # Settling time delay with countdown timer
            ctx.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(vol1 + starting_vol)

        ctx.comment("-----Beginning Bind #2 Steps-----")
        tiptrack(tips)
        for i, well in enumerate(samples_m):
            num_trans = math.ceil(vol2 / 980)
            vol_per_trans = vol2 / num_trans
            source = bind2_res[i // 3]
            if i == 0 or i == 3:
                height = 10
            else:
                height = 1
            # Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.transfer(
                    vol_per_trans,
                    source.bottom(height),
                    well.top(),
                    air_gap=20,
                    new_tip="never",
                )
                m1000.air_gap(20)

        for i in range(num_cols):
            if i != 0:
                tiptrack(tips)
            bead_mixing(
                samples_m[i], m1000, vol_per_trans, reps=3 if not dry_run else 1
            )
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        time = 1 if not dry_run else 0.25
        shared_vars_and_funcs.h_s_speed_and_delay(
            ctx, h_s, heater_shaker_speed, time, True
        )

        # Transfer from H-S plate to Magdeck plate
        shared_vars_and_funcs.from_hs_to_mag(ctx, sample_plate, h_s, magblock)

        for bindi in np.arange(
            settling_time + 1, 0, -0.5
        ):  # Settling time delay with countdown timer
            ctx.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(vol2 + 25)

    def wash(vol: float, source: List[Well]) -> None:
        """Washing step."""
        global whichwash  # Track current wash step

        # Map wash source to whichwash, const, and height (if applicable)
        wash_map = {
            wash1: (1, 6 // len(wash1), lambda i: 10 if i in (0, 3) else 1),
            wash2: (2, 6 // len(wash2), lambda _: 1),
            wash3: (3, 6 // len(wash3), lambda _: 1),
        }

        # Get the appropriate values from the map
        whichwash, const, height_func = wash_map[source]
        ctx.comment(f"-----Wash #{whichwash} is starting now------")

        # Calculate the number of transfers and volume per transfer
        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        tiptrack(tips)  # Track tips for the operation

        # Transfer wash liquid
        for i, m in enumerate(samples_m):
            height = height_func(i)
            src = source[i // const]
            for _ in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.require_liquid_presence(src)
                m1000.transfer(
                    vol_per_trans,
                    src.bottom(height),
                    m.top(),
                    air_gap=20,
                    new_tip="never",
                )

        # Handle tip disposal
        m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        # Set heater shaker speed and delay
        time = 5 if not dry_run else 0.25
        shared_vars_and_funcs.h_s_speed_and_delay(
            ctx, h_s, heater_shaker_speed, time, True
        )

        # Move samples from heater-shaker to magblock
        shared_vars_and_funcs.from_hs_to_mag(ctx, sample_plate, h_s, magblock)

        # Settling time countdown
        for washi in np.arange(settling_time, 0, -0.5):
            ctx.delay(
                minutes=0.5,
                msg=f"There are {washi} minutes left in wash {whichwash} incubation.",
            )

        # Remove supernatant after wash
        remove_supernatant(vol)

    def elute(vol: float) -> None:
        """Elution Function."""
        tiptrack(tips)
        for i, m in enumerate(samples_m):
            m1000.require_liquid_presence(elution_solution)
            m1000.aspirate(vol, elution_solution)
            m1000.air_gap(20)
            m1000.dispense(m1000.current_volume, m.top(-3))
        m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        time = 5 if not dry_run else 0.25
        shared_vars_and_funcs.h_s_speed_and_delay(
            ctx, h_s, heater_shaker_speed, time, True
        )

        # Transfer back to magnet
        shared_vars_and_funcs.from_hs_to_mag(ctx, sample_plate, h_s, magblock)

        for elutei in np.arange(settling_time, 0, -0.5):
            ctx.delay(
                minutes=0.5,
                msg="Incubating on MagDeck for " + str(elutei) + " more minutes.",
            )

        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(tips)
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 25
            m1000.transfer(
                vol, m.bottom(dot_bottom), e.bottom(5), air_gap=20, new_tip="never"
            )
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        m1000.flow_rate.aspirate = 150

    lysis(lysis_vol, lysis_)
    bind(binding_buffer_vol, bind2_vol)
    wash(wash1_vol, wash1)
    wash(wash2_vol, wash2)
    wash(wash3_vol, wash3)
    h_s.set_and_wait_for_temperature(55)
    if not dry_run:
        drybeads = 9.0  # Number of minutes you want to dry for
    else:
        drybeads = 0.5
    for beaddry in np.arange(drybeads, 0, -0.5):
        ctx.delay(
            minutes=0.5,
            msg="There are " + str(beaddry) + " minutes left in the drying step.",
        )
    elute(elution_vol)
    h_s.deactivate_heater()
