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
)

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
    """Protoco Set up."""
    heater_shaker_speed = ctx.params.heater_shaker_speed  # type: ignore[attr-defined]
    mount_pos = ctx.params.mount_pos  # type: ignore[attr-defined]
    dot_bottom = ctx.params.dot_bottom  # type: ignore[attr-defined]
    trash_chute = False  # If this is true, trash chute is loaded in D3, otherwise trash bin is loaded there
    USE_GRIPPER = True
    dry_run = False
    TIP_TRASH = (
        False  # True = Used tips go in Trash, False = Used tips go back into rack
    )
    mount = mount_pos
    res_type = "nest_12_reservoir_15ml"
    temp_mod = True

    num_samples = 8
    wash1_vol = 500
    wash2_vol = wash3_vol = 900
    lysis_vol = 200
    sample_vol = 10  # Sample should be pelleted tissue/bacteria/cells
    bind_vol = 600
    bind2_vol = 500
    elution_vol = 75

    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"

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
    if trash_chute:
        ctx.load_waste_chute()
    else:
        ctx.load_trash_bin("A3")
    hs_string = "heaterShakerModuleV1"
    h_s: HeaterShakerContext = ctx.load_module(hs_string, "D1")  # type: ignore[assignment]
    h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
    sample_plate = h_s_adapter.load_labware(deepwell_type, "Samples")
    h_s.close_labware_latch()

    if temp_mod:
        temp: TemperatureModuleContext = ctx.load_module(
            "temperature module gen2", "D3"
        )  # type: ignore[assignment]
        temp_block = temp.load_adapter("opentrons_96_well_aluminum_block")
        elutionplate = temp_block.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate"
        )
    else:
        elutionplate = ctx.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt", "A3", "Elution Plate"
        )

    magblock = ctx.load_module("magneticBlockV1", "C1")
    waste = (
        ctx.load_labware("nest_1_reservoir_195ml", "B3", "Liquid Waste")
        .wells()[0]
        .top()
    )
    res1 = ctx.load_labware(res_type, "D2", "reagent reservoir 1")
    res2 = ctx.load_labware(res_type, "C2", "reagent reservoir 2")
    num_cols = math.ceil(num_samples / 8)

    # Load tips and combine all similar boxes
    tips1000 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", "Tips 1")
    tips1001 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", "Tips 2")
    tips1002 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B1", "Tips 3")
    tips = [*tips1000.wells()[num_samples:96], *tips1001.wells(), *tips1002.wells()]
    tips_sn = tips1000.wells()[:num_samples]
    # load instruments
    m1000 = ctx.load_instrument("flex_8channel_1000", mount)

    """
    Here is where you can define the locations of your reagents.
    """
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

    colors = [
        "#008000",
        "#008000",
        "#A52A2A",
        "#A52A2A",
        "#00FFFF",
        "#0000FF",
        "#800080",
        "#ADD8E6",
        "#FF0000",
        "#FFFF00",
        "#FF00FF",
        "#00008B",
        "#7FFFD4",
        "#FFC0CB",
        "#FFA500",
        "#00FF00",
        "#C0C0C0",
    ]

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

    # Defining liquids per sample well
    samples = ctx.define_liquid(
        name="Samples", description="Samples", display_color="#C0C0C0"
    )
    for i in samps:
        i.load_liquid(liquid=samples, volume=0)

    delete = len(colors) - len(liquids)

    if delete >= 1:
        for i_del in range(delete):
            colors.pop(-1)

    # Defining liquids per reservoir well
    def liquids_(liq_type: str, location: Union[Well, List[Well]], color, vol: float):
        sampnum = 8 * (math.ceil(num_samples / 8))
        """
        Takes an individual liquid at a time and adds the color to the well
        in the description.
        """
        # Volume Calculation
        if liq_type == "PK":
            extra_samples = math.ceil(1500 / lysis_vol)

        elif liq_type == "Beads":
            extra_samples = math.ceil(1500 / bind_vol)

        else:
            extra_samples = math.ceil(1500 / vol)

        # Defining and assigning liquids to wells
        if isinstance(location, list):
            limit = sample_max / len(location)  # Calculates samples/ res well
            iterations = math.ceil(sampnum / limit)
            left = sampnum - limit
            while left > limit:
                left = left - limit
            if left > 0:
                last_iteration_samp_num = left
            elif left < 0:
                last_iteration_samp_num = sampnum
            else:
                last_iteration_samp_num = limit

            samples_per_well = []

            for i in range(iterations):
                # append the left over on the last iteration
                if i == (iterations - 1):
                    samples_per_well.append(last_iteration_samp_num)
                else:
                    samples_per_well.append(limit)

            liq = ctx.define_liquid(
                name=str(liq_type), description=str(liq_type), display_color=color
            )
            for sample, well in zip(
                samples_per_well, location[: len(samples_per_well)]
            ):
                v = vol * (sample + extra_samples)
                well.load_liquid(liquid=liq, volume=v)
        else:
            v = vol * (sampnum + extra_samples)
            liq = ctx.define_liquid(
                name=str(liq_type), description=str(liq_type), display_color=color
            )
            location.load_liquid(liquid=liq, volume=v)

    for x, (ll, l, c, v) in enumerate(zip(liquids, locations, colors, vols)):
        liquids_(ll, l, c, v)

    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300

    def tiptrack(pip, tipbox):
        global tip1k
        global drop_count
        if tipbox == tips:
            m1000.pick_up_tip(tipbox[int(tip1k)])
            tip1k = tip1k + 8

        drop_count = drop_count + 8
        if drop_count >= 150:
            drop_count = 0
            ctx.pause("Please empty the waste bin of all the tips before continuing.")

    def blink():
        for i in range(3):
            ctx.set_rail_lights(True)
            ctx.delay(minutes=0.01666667)
            ctx.set_rail_lights(False)
            ctx.delay(minutes=0.01666667)

    def remove_supernatant(vol):
        ctx.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 30
        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        def _waste_track(vol):
            global waste_vol
            waste_vol = waste_vol + (vol * 8)
            if waste_vol >= 185000:
                m1000.home()
                blink()
                ctx.pause("Please empty liquid waste before resuming.")
                waste_vol = 0

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
            m1000.drop_tip(tips_sn[8 * i]) if TIP_TRASH == True else m1000.return_tip()
        m1000.flow_rate.aspirate = 300

        # Transfer from Magdeck plate to H-S
        h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s_adapter, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

    def bead_mixing(well, pip, mvol, reps=8):
        """
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
        dispensing at the bottom
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

    def mixing(well, pip, mvol, reps=8):
        """
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
        dispensing at the bottom
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

    def lysis(vol, source):
        ctx.comment("-----Beginning Lysis Steps-----")
        ctx.pause(msg="\n Hello \n - step 1 \n - step 2")
        num_transfers = math.ceil(vol / 980)
        tiptrack(m1000, tips)
        for i in range(num_cols):
            src = source
            tvol = vol / num_transfers
            # Mix Shield and PK before transferring first time
            if i == 0:
                for x in range(3 if not dry_run else 1):
                    m1000.aspirate(vol, src.bottom(1))
                    m1000.dispense(vol, src.bottom(8))
            # Transfer Shield and PK
            for t in range(num_transfers):
                m1000.require_liquid_presence(src)
                m1000.aspirate(tvol, src.bottom(1))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume, samples_m[i].top())

        # Mix shield and pk with samples
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000, tips)
            mixing(samples_m[i], m1000, tvol, reps=5 if not dry_run else 1)
            m1000.drop_tip() if TIP_TRASH == True else m1000.return_tip()

        h_s.set_and_wait_for_shake_speed(heater_shaker_speed)
        speed_val = heater_shaker_speed
        ctx.delay(
            minutes=lysis_incubation if not dry_run else 0.25,
            msg="Shake at " + str(speed_val) + " rpm for 30 minutes.",
        )
        h_s.deactivate_shaker()

    def bind(vol1, vol2):
        """
        `bind` will perform magnetic bead binding on each sample in the
        deepwell plate. Each channel of binding beads will be mixed before
        transfer, and the samples will be mixed with the binding beads after
        the transfer. The magnetic deck activates after the addition to all
        samples, and the supernatant is removed after bead bining.
        :param vol (float): The amount of volume to aspirate from the elution
                            buffer source and dispense to each well containing
                            beads.
        :param park (boolean): Whether to save sample-corresponding tips
                               between adding elution buffer and transferring
                               supernatant to the final clean elutions PCR
                               plate.
        """
        ctx.comment("-----Beginning Binding Steps-----")
        for i, well in enumerate(samples_m):
            tiptrack(m1000, tips)
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
            m1000.drop_tip() if TIP_TRASH == True else m1000.return_tip()

        h_s.set_and_wait_for_shake_speed(heater_shaker_speed * 0.9)
        speed_val = heater_shaker_speed * 0.9
        ctx.delay(
            minutes=10 if not dry_run else 0.25,
            msg="Shake at " + str(speed_val) + " rpm for 10 minutes.",
        )
        h_s.deactivate_shaker()

        # Transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

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
        tiptrack(m1000, tips)
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
                tiptrack(m1000, tips)
            bead_mixing(
                samples_m[i], m1000, vol_per_trans, reps=3 if not dry_run else 1
            )
            m1000.drop_tip() if TIP_TRASH == True else m1000.return_tip()

        h_s.set_and_wait_for_shake_speed(heater_shaker_speed)
        speed_val = heater_shaker_speed
        ctx.delay(
            minutes=1 if not dry_run else 0.25,
            msg="Shake at " + str(speed_val) + " rpm for 1 minutes.",
        )
        h_s.deactivate_shaker()

        # Transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        for bindi in np.arange(
            settling_time + 1, 0, -0.5
        ):  # Settling time delay with countdown timer
            ctx.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(vol2 + 25)

    def wash(vol, source):

        global whichwash  # Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
            const = 6 // len(source)
        if source == wash2:
            whichwash = 2
            const = 6 // len(source)
            height = 1
        if source == wash3:
            whichwash = 3
            const = 6 // len(source)
            height = 1

        ctx.comment("-----Wash #" + str(whichwash) + " is starting now------")

        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        tiptrack(m1000, tips)
        for i, m in enumerate(samples_m):
            if source == wash1:
                if i == 0 or i == 3:
                    height = 10
                else:
                    height = 1
            src = source[i // const]
            for n in range(num_trans):
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
        m1000.drop_tip() if TIP_TRASH == True else m1000.return_tip()

        h_s.set_and_wait_for_shake_speed(heater_shaker_speed * 0.9)
        ctx.delay(minutes=5 if not dry_run else 0.25)
        h_s.deactivate_shaker()

        h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        for washi in np.arange(
            settling_time, 0, -0.5
        ):  # settling time timer for washes
            ctx.delay(
                minutes=0.5,
                msg="There are "
                + str(washi)
                + " minutes left in wash "
                + str(whichwash)
                + " incubation.",
            )

        remove_supernatant(vol)

    def elute(vol):
        tiptrack(m1000, tips)
        for i, m in enumerate(samples_m):
            m1000.require_liquid_presence(elution_solution)
            m1000.aspirate(vol, elution_solution)
            m1000.air_gap(20)
            m1000.dispense(m1000.current_volume, m.top(-3))
        m1000.drop_tip() if TIP_TRASH == True else m1000.return_tip()

        h_s.set_and_wait_for_shake_speed(heater_shaker_speed)
        speed_val = heater_shaker_speed
        ctx.delay(
            minutes=5 if not dry_run else 0.25,
            msg="Shake at " + str(speed_val) + " rpm for 5 minutes.",
        )
        h_s.deactivate_shaker()

        # Transfer back to magnet
        h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        for elutei in np.arange(settling_time, 0, -0.5):
            ctx.delay(
                minutes=0.5,
                msg="Incubating on MagDeck for " + str(elutei) + " more minutes.",
            )

        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(m1000, tips)
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 25
            m1000.transfer(
                vol, m.bottom(dot_bottom), e.bottom(5), air_gap=20, new_tip="never"
            )
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.drop_tip() if TIP_TRASH == True else m1000.return_tip()

        m1000.flow_rate.aspirate = 150

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
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
