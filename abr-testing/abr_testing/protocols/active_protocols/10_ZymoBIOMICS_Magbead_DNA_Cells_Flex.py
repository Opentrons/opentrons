"""Flex ZymoBIOMICS Magbead DNA Extraction: Cells."""
import math
from opentrons import types
from typing import List, Dict
from opentrons import protocol_api
from opentrons.protocol_api import Well, InstrumentContext
import numpy as np
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    TemperatureModuleContext,
    MagneticBlockContext,
)

metadata = {
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
    "protocolName": "Flex ZymoBIOMICS Magbead DNA Extraction: Cells",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

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

whichwash = 0
wash_volume_tracker = 0.0
sample_max = 48
tip1k = 0
drop_count = 0
m1000_tips = 0


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Define parameters."""
    pass


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol Set Up."""

    protocol.capture_image(filename="start_of_run")
    
    # Standardized run variables to replace former custom parameters
    heater_shaker_speed = 2000
    mount = "left"
    deactivate_modules_bool = True
    meniscus_z = -0.5
    dry_run = False
    TIP_TRASH = False  # True = Used tips go in Trash, False = Used tips go back into rack

    res_type = "opentrons_tough_12_reservoir_22ml"
    global m1000_tips
    num_samples = 96
    wash1_vol = wash2_vol = wash3_vol = 400.0
    lysis_vol = 90.0
    sample_vol = 10.0  # Sample should be pelleted tissue/bacteria/cells
    bind_vol = 600.0
    bind2_vol = 500.0
    elution_vol = 75.0

    def tipcheck(m1000: InstrumentContext) -> None:
        """Tip tracking function."""
        global m1000_tips
        if m1000_tips >= 3 * 96:
            m1000.reset_tipracks()
            m1000_tips = 0
        m1000.pick_up_tip()
        m1000_tips += 8

    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"

    if not dry_run:
        settling_time = 2.0
        lysis_incubation = 30.0
        bind_time_1 = 10.0
        bind_time_2 = 1.0
        wash_time = 5.0
        drybeads = 9.0
        lysis_rep_1 = 3
        lysis_rep_2 = 5
        bead_reps_2 = 8
    else:
        settling_time = 0.25
        lysis_incubation = 0.25
        bind_time_1 = bind_time_2 = wash_time = 0.25
        drybeads = 0.5
        lysis_rep_1 = lysis_rep_2 = bead_reps_2 = 1

    bead_vol = 25.0
    starting_vol = lysis_vol + sample_vol
    binding_buffer_vol = bind_vol + bead_vol
    protocol.load_trash_bin("A3")

    # Native Module & Labware Loading
    h_s: HeaterShakerContext = protocol.load_module(
        "heaterShakerModuleV1", "D1"
    )
    h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
    sample_plate = h_s_adapter.load_labware(deepwell_type, "Samples")
    h_s.close_labware_latch()

    temp: TemperatureModuleContext = protocol.load_module(
        "temperature module gen2", "D3"
    )
    temp_adapter = temp.load_adapter("opentrons_96_well_aluminum_block")
    elutionplate = temp_adapter.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate"
    )
    
    magblock: MagneticBlockContext = protocol.load_module(
        "magneticBlockV1", "C1"
    )
    
    waste_reservoir = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml", "B3", "Liquid Waste"
    )
    waste = waste_reservoir.wells()[0]
    waste_reservoir.load_empty(waste_reservoir.wells())
    res1 = protocol.load_labware(res_type, "D2", "reagent reservoir 1")
    res2 = protocol.load_labware(res_type, "C2", "reagent reservoir 2")
    res3 = protocol.load_labware(res_type, "B2", "reagent reservoir 3")
    num_cols = math.ceil(num_samples / 8)

    # Load tips and combine all similar boxes
    tips1000 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", "Tips 1")
    tips1001 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", "Tips 2")
    tips1002 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B1", "Tips 3")
    tips_sn = tips1000.wells()[:num_samples]
    tip_racks = [tips1000, tips1001, tips1002]

    m1000 = protocol.load_instrument("flex_8channel_1000", mount, tip_racks=tip_racks)
    water = protocol.get_liquid_class("water")
    lm = "liquid-meniscus"
    for tip in tip_racks:
        props = water.get_for(m1000, tip)
        props.aspirate.aspirate_position.position_reference = lm
        props.aspirate.aspirate_position.offset.z = meniscus_z
        props.dispense.dispense_position.position_reference = lm
        props.dispense.dispense_position.offset.z = meniscus_z

    def remove_supernatant(vol: float) -> None:
        """Remove supernatant."""
        protocol.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 30
        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        for i, m in enumerate(samples_m):
            tipcheck(m1000)
            loc = m
            for _ in range(num_trans):
                m1000.move_to(m.center())
                if vol_per_trans > m.current_liquid_volume():
                    vol_per_trans = m.current_liquid_volume() - 100
                m1000.transfer_with_liquid_class(
                    water,
                    vol_per_trans,
                    loc,
                    waste,
                    new_tip="never",
                    return_tip=True,
                    group_wells=False,
                )
                m1000.blow_out(waste)
                m1000.air_gap(20)
            m1000.drop_tip(tips_sn[8 * i]) if TIP_TRASH else m1000.return_tip()
        m1000.flow_rate.aspirate = 300

        # Native transfer from Magdeck plate to H-S
        h_s.open_labware_latch()
        protocol.move_labware(sample_plate, h_s_adapter, use_gripper=True)
        h_s.close_labware_latch()

    def bead_mixing(
        well: Well, pip: InstrumentContext, mvol: float, reps: int = 8
    ) -> None:
        """Mixing liquid that contains beads."""
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

    def mixing(well: Well, pip: InstrumentContext, mvol: float, reps: int = 8) -> None:
        """Standard mixing."""
        protocol.capture_image(filename="mixing")
        center = well.top(5)
        asp = well.bottom(z=1)
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
        """Lysis."""
        protocol.comment("-----Beginning Lysis Steps-----")
        protocol.capture_image(filename="lysis")
        num_transfers = math.ceil(vol / 980)
        tipcheck(m1000)
        total_lysis_aspirated = 0.0
        for i in range(num_cols):
            src = source
            tvol = vol / num_transfers
            # Mix Shield and PK before transferring first time
            if i == 0:
                for x in range(lysis_rep_1):
                    m1000.aspirate(vol, src.bottom(1))
                    m1000.dispense(vol, src.bottom(8))
            # Transfer Shield and PK
            for t in range(num_transfers):
                m1000.aspirate(tvol, src.bottom(1))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume, samples_m[i].top())
                total_lysis_aspirated += tvol * 8
        # Mix shield and pk with samples
        for i in range(num_cols):
            if i != 0:
                tipcheck(m1000)
            mixing(samples_m[i], m1000, tvol, reps=lysis_rep_2)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()
            
        # Native set H-S speed and shake
        h_s.close_labware_latch()
        h_s.set_and_wait_for_shake_speed(heater_shaker_speed)
        protocol.delay(minutes=lysis_incubation, msg=f"Shake at {heater_shaker_speed} rpm for {lysis_incubation} minutes.")
        h_s.deactivate_shaker()

    def bind(vol1: float, vol2: float) -> None:
        """Binding."""
        protocol.comment("-----Beginning Binding Steps-----")
        protocol.capture_image(filename="binding_steps")

        for i, well in enumerate(samples_m):
            tipcheck(m1000)
            num_trans = math.ceil(vol1 / 980)
            vol_per_trans = vol1 / num_trans
            source = binding_buffer[i // 2]
            if i == 0:
                reps = 5
            else:
                reps = 2
            bead_mixing(source, m1000, vol_per_trans, reps=reps if not dry_run else 1)
            m1000.return_tip()
            tipcheck(m1000)
            # Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.transfer_with_liquid_class(
                    water,
                    vol_per_trans,
                    source,
                    well,
                    new_tip="never",
                    return_tip=True,
                    group_wells=False,
                )
            bead_mixing(well, m1000, vol_per_trans, reps=bead_reps_2)
            m1000.blow_out()
            m1000.air_gap(10)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        # Native set H-S speed and shake
        h_s.close_labware_latch()
        h_s.set_and_wait_for_shake_speed(int(heater_shaker_speed * 0.9))
        protocol.delay(minutes=bind_time_1, msg=f"Shake at {int(heater_shaker_speed * 0.9)} rpm for {bind_time_1} minutes.")
        h_s.deactivate_shaker()

        # Native transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        protocol.move_labware(sample_plate, magblock, use_gripper=True)
        h_s.close_labware_latch()

        for bindi in np.arange(
            settling_time + 1, 0, -0.5
        ):  # Settling time delay with countdown timer
            protocol.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(vol1 + starting_vol)

        protocol.comment("-----Beginning Bind #2 Steps-----")
        tipcheck(m1000)
        for i, well in enumerate(samples_m):
            num_trans = math.ceil(vol2 / 980)
            vol_per_trans = vol2 / num_trans
            source = bind2_res[i // 3]
            # Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.transfer_with_liquid_class(
                    water,
                    vol_per_trans,
                    source,
                    well,
                    new_tip="never",
                    return_tip=True,
                    group_wells=False,
                )
                m1000.air_gap(20)

        for i in range(num_cols):
            if i != 0:
                tipcheck(m1000)
            bead_mixing(
                samples_m[i], m1000, vol_per_trans, reps=3 if not dry_run else 1
            )
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()
            
        # Native set H-S speed and shake
        h_s.close_labware_latch()
        h_s.set_and_wait_for_shake_speed(heater_shaker_speed)
        protocol.delay(minutes=bind_time_2, msg=f"Shake at {heater_shaker_speed} rpm for {bind_time_2} minutes.")
        h_s.deactivate_shaker()

        # Native transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        protocol.move_labware(sample_plate, magblock, use_gripper=True)
        h_s.close_labware_latch()

        for bindi in np.arange(
            settling_time + 1, 0, -0.5
        ):  # Settling time delay with countdown timer
            protocol.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(vol2 + 25)

    def wash(vol: float, source: List[Well]) -> None:
        """Wash Steps."""
        global whichwash
        protocol.comment("-----Now starting Wash #" + str(whichwash) + "-----")
        protocol.capture_image(filename="wash_step")

        global wash_volume_tracker

        num_trans = math.ceil(vol / 980.0)
        vol_per_trans = vol / num_trans
        tipcheck(m1000)
        for i, m in enumerate(samples_m):
            src = source[whichwash]
            for n in range(num_trans):
                if vol_per_trans > src.current_liquid_volume():
                    vol_per_trans = src.current_liquid_volume()

                m1000.transfer_with_liquid_class(
                    water,
                    vol_per_trans,
                    src,
                    m,
                    new_tip="never",
                    return_tip=True,
                    group_wells=False,
                )
                wash_volume_tracker += vol_per_trans * 8
                if wash_volume_tracker >= 9600:
                    whichwash += 1
                    src = source[whichwash]
                    protocol.comment(f"new wash source {whichwash}")
                    wash_volume_tracker = 0.0
        m1000.drop_tip() if TIP_TRASH else m1000.return_tip()
        
        # Native set H-S speed and shake
        h_s.close_labware_latch()
        h_s.set_and_wait_for_shake_speed(int(heater_shaker_speed * 0.9))
        protocol.delay(minutes=wash_time, msg=f"Shake at {int(heater_shaker_speed * 0.9)} rpm for {wash_time} minutes.")
        h_s.deactivate_shaker()

        # Native transfer to Magdeck
        h_s.open_labware_latch()
        protocol.move_labware(sample_plate, magblock, use_gripper=True)
        h_s.close_labware_latch()

        for washi in np.arange(
            settling_time, 0, -0.5
        ):  # settling time timer for washes
            protocol.delay(
                minutes=0.5,
                msg="There are "
                + str(washi)
                + " minutes left in wash "
                + str(whichwash)
                + " incubation.",
            )

        remove_supernatant(vol)

    def elute(vol: float) -> None:
        protocol.capture_image(filename="elute_step")
        tipcheck(m1000)
        total_elution_vol = 0.0
        for i, m in enumerate(samples_m):
            m1000.aspirate(vol, elution_solution)
            m1000.air_gap(20)
            m1000.dispense(m1000.current_volume, m.top(-3))
            total_elution_vol += vol * 8
        m1000.drop_tip() if TIP_TRASH else m1000.return_tip()
        
        # Native set H-S speed and shake
        h_s.close_labware_latch()
        h_s.set_and_wait_for_shake_speed(int(heater_shaker_speed * 0.9))
        protocol.delay(minutes=wash_time, msg=f"Shake at {int(heater_shaker_speed * 0.9)} rpm for {wash_time} minutes.")
        h_s.deactivate_shaker()

        # Native transfer back to magnet
        h_s.open_labware_latch()
        protocol.move_labware(sample_plate, magblock, use_gripper=True)
        h_s.close_labware_latch()

        for elutei in np.arange(settling_time, 0, -0.5):
            protocol.delay(
                minutes=0.5,
                msg="Incubating on MagDeck for " + str(elutei) + " more minutes.",
            )
        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tipcheck(m1000)
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 25
            m1000.transfer_with_liquid_class(
                water, vol, m, e, new_tip="never", return_tip=True, group_wells=False
            )
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        m1000.flow_rate.aspirate = 150

    """
    Define the locations of reagents and load native protocol liquids
    """
    lysis_ = res1.wells()[0]
    binding_buffer = res1.wells()[1:8]
    bind2_res = res1.wells()[8:12]
    all_washes = res2.wells()[1:]
    elution_solution = res2.wells()[0]
    all_washes.extend(res3.wells()[:2])
    res3.load_empty(res3.wells()[2:])
    samples_m = sample_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]
    samps = sample_plate.wells()[: (8 * num_cols)]
    
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Lysis and PK": [{"well": lysis_, "volume": 12320.0}],
        "Beads and Binding": [{"well": binding_buffer, "volume": 11875.0}],
        "Binding 2": [{"well": bind2_res, "volume": 13500.0}],
        "Final Elution": [{"well": elution_solution, "volume": 7500.0}],
        "Samples": [{"well": samps, "volume": 0.0}],
        "Reagents": [{"well": all_washes, "volume": 9800.0}],
    }
    
    elutionplate.load_empty(elutionplate.wells())

    # Native implementation for mapping and loading custom liquids to the deck 
    liquid_colors = ["#008000", "#A52A2A", "#00FFFF", "#0000FF", "#800080", "#ADD8E6", "#FF0000"]
    color_index = 0
    for liquid_name, wells_info in liquid_vols_and_wells.items():
        liquid = protocol.define_liquid(
            liquid_name, display_color=liquid_colors[color_index % len(liquid_colors)]
        )
        color_index += 1
        for well_info in wells_info:
            target_wells = well_info["well"]
            target_volume = well_info["volume"]
            if isinstance(target_wells, list):
                for w in target_wells:
                    w.load_liquid(liquid, target_volume)
            else:
                target_wells.load_liquid(liquid, target_volume)

    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300

    """
    Protocol execution sequence
    """
    lysis(lysis_vol, lysis_)
    bind(binding_buffer_vol, bind2_vol)
    wash(wash1_vol, all_washes)
    wash(wash2_vol, all_washes)
    wash(wash3_vol, all_washes)
    h_s.set_target_temperature(55)
    for beaddry in np.arange(drybeads, 0, -0.5):
        protocol.delay(
            minutes=0.5,
            msg="There are " + str(beaddry) + " minutes left in the drying step.",
        )
    elute(elution_vol)
    h_s.deactivate_heater()

    if deactivate_modules_bool:
        h_s.deactivate_heater()
        h_s.deactivate_shaker()
        temp.deactivate()
        
    protocol.capture_image(filename="end_of_run")
