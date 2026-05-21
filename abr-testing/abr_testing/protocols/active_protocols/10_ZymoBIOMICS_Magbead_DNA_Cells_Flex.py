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
from abr_testing.protocols.helpers import run_helpers, background_helpers


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
    run_helpers.create_hs_speed_parameter(parameters)
    run_helpers.create_single_pipette_mount_parameter(parameters)
    run_helpers.create_deactivate_modules_parameter(parameters)
    run_helpers.create_meniscus_z_parameter(parameters)
    run_helpers.create_probe_liquid_height_parameter(parameters)
    run_helpers.create_error_capture_duration_duration(parameters)


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol Set Up."""
    if not protocol.is_simulating():
        background_helpers.launch_background_tasks()

    protocol.capture_image(filename="start_of_run")
    length = protocol.params.error_capture_duration  # type: ignore[attr-defined]
    heater_shaker_speed = protocol.params.heater_shaker_speed  # type: ignore[attr-defined]
    mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    run_helpers.comment_protocol_version(protocol, "04")
    if not protocol.is_simulating():
        slack_bot = run_helpers.set_up_slack()
        slack_bot.send_run_started_message(metadata["protocolName"])

    dry_run = False
    TIP_TRASH = (
        False  # True = Used tips go i n Trash, False = Used tips go back into rack
    )
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
            m1000_tips == 0
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
    h_s: HeaterShakerContext = protocol.load_module(
        run_helpers.hs_str, "D1"
    )  # type: ignore[assignment]
    labware_name = "Samples"
    sample_plate, h_s_adapter = run_helpers.load_hs_adapter_and_labware(
        deepwell_type, h_s, labware_name
    )
    h_s.close_labware_latch()

    temp: TemperatureModuleContext = protocol.load_module(
        run_helpers.temp_str, "D3"
    )  # type: ignore[assignment]
    elutionplate, temp_adapter = run_helpers.load_temp_adapter_and_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", temp, "Elution Plate"
    )
    magblock: MagneticBlockContext = protocol.load_module(
        run_helpers.mag_str, "C1"
    )  # type: ignore[assignment]
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
    # load instruments
    tip_racks = [tips1000, tips1001, tips1002]

    m1000 = protocol.load_instrument("flex_8channel_1000", mount, tip_racks=tip_racks)
    water = protocol.get_liquid_class("water")
    lm = "liquid-meniscus"
    for tip in tip_racks:
        props = water.get_for(m1000, tip)
        props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
        props.aspirate.aspirate_position.offset.z = meniscus_z
        props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
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
                    vol_per_trans = m.current_liquid_volume() - 100  # type: ignore
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

        # Transfer from Magdeck plate to H-S
        run_helpers.move_labware_to_hs(protocol, sample_plate, h_s, h_s_adapter)

    def bead_mixing(
        well: Well, pip: InstrumentContext, mvol: float, reps: int = 8
    ) -> None:
        """Mixing.

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

    def mixing(well: Well, pip: InstrumentContext, mvol: float, reps: int = 8) -> None:
        """Mixing.

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
        run_helpers.set_hs_speed(
            protocol, h_s, heater_shaker_speed, lysis_incubation, True
        )

    def bind(vol1: float, vol2: float) -> None:
        """Binding.

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

        run_helpers.set_hs_speed(
            protocol, h_s, heater_shaker_speed * 0.9, bind_time_1, True
        )

        # Transfer from H-S plate to Magdeck plate
        run_helpers.move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magblock
        )

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
        run_helpers.set_hs_speed(protocol, h_s, heater_shaker_speed, bind_time_2, True)

        # Transfer from H-S plate to Magdeck plate
        run_helpers.move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magblock
        )

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
        global whichwash  # Defines which wash the protocol is on to log on the app
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
                    vol_per_trans = src.current_liquid_volume()  # type: ignore[assignment]

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
        run_helpers.set_hs_speed(
            protocol, h_s, heater_shaker_speed * 0.9, wash_time, True
        )

        run_helpers.move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magblock
        )

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
        run_helpers.set_hs_speed(
            protocol, h_s, heater_shaker_speed * 0.9, wash_time, True
        )

        # Transfer back to magnet
        run_helpers.move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magblock
        )

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
    Here is where you can define the locations of your reagents.
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
    # Redefine per well for liquid definitions
    samps = sample_plate.wells()[: (8 * num_cols)]
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Lysis and PK": [{"well": lysis_, "volume": 12320.0}],
        "Beads and Binding": [{"well": binding_buffer, "volume": 11875.0}],
        "Binding 2": [{"well": bind2_res, "volume": 13500.0}],
        "Final Elution": [{"well": elution_solution, "volume": 7500.0}],
        "Samples": [{"well": samps, "volume": 0.0}],
        "Reagents": [{"well": all_washes, "volume": 9800.0}],
    }
    try:
        elutionplate.load_empty(elutionplate.wells())
        if probe_height_bool:
            run_helpers.find_liquid_height_of_loaded_liquids(
                protocol, liquid_vols_and_wells, m1000
            )
        else:
            run_helpers.load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)

        m1000.flow_rate.aspirate = 300
        m1000.flow_rate.dispense = 300
        m1000.flow_rate.blow_out = 300

        """
        Here is where you can call the methods defined above to fit your specific
        protocol. The normal sequence is:
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
        run_helpers.clean_up_plates(
            protocol,
            m1000,
            [elutionplate, sample_plate, res1, res3, res2],
            waste_reservoir["A1"],
        )
        run_helpers.find_liquid_height_of_all_wells(
            protocol, m1000, [waste_reservoir["A1"]]
        )
        if deactivate_modules_bool:
            run_helpers.deactivate_modules(protocol)
        protocol.capture_image(filename="end_of_run")
        if not protocol.is_simulating():
            run_helpers.send_slack_message_with_image(
                slack_bot, metadata["protocolName"]
            )
    except Exception as e:
        if not protocol.is_simulating():
            run_helpers.send_slack_error_message_with_attachments(
                slack_bot, metadata["protocolName"], str(e), length
            )
        raise (e)
