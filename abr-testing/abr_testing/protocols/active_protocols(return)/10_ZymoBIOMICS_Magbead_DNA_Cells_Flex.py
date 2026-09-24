"""Flex ZymoBIOMICS Magbead DNA Extraction: Cells."""
import math
from opentrons import types
from typing import List, Dict
from opentrons import protocol_api
from opentrons.protocol_api import Well, InstrumentContext, LiquidClass
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
Well 1 - 7,500 ul (elution)
Wells 2-12 - 9,800 ul (wash)

Reservoir 3:
Wells 1-2 - 9,800 ul (wash)




"""
whichwash = 0
sample_max = 48
tip1k = 0
drop_count = 0
m1000_tips = 0

# Floor below which a wash trough is abandoned for the next one. Meniscus-relative
# aspiration is resolved against the liquid height *after* the draw and then
# clamped up to the tip's LLD minimum (1.5 mm for a 1000 ul tip), so a trough
# drawn lower than this parks all eight tips in its tapered floor, seals them, and
# trips a pipette overpressure error. Three 350 ul columns leave 1,400 ul, which
# puts the tips ~2.9 mm up -- clear of the taper, which ends at 2 mm.
WASH_TROUGH_DEAD_VOLUME = 1200.0

# transfer_with_liquid_class takes its flow rates from the liquid class rather
# than from InstrumentContext.flow_rate, so supernatant removal needs a liquid
# class of its own to aspirate slowly off the bead pellet.
SUPERNATANT_ASPIRATE_FLOW_RATE = 30.0



def comment_height_of_specific_labware(protocol, labware_name, dict_of_labware_heights):
    """Comment height found of specific labware."""
    total_height = 0.0
    for key in dict_of_labware_heights.keys():
        if key[0] == labware_name:
            height = dict_of_labware_heights[key]
            total_height += height
    protocol.comment(f"Liquid Waste Total Height: {total_height}")


def load_wells_with_custom_liquids(protocol, liquid_vols_and_wells):
    """Load custom liquids into wells."""
    from opentrons.protocol_api import Well

    liquid_colors = [
        "#008000",
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
    i = 0
    volume = 0.0
    for liquid_name, wells_info in liquid_vols_and_wells.items():
        liquid = protocol.define_liquid(
            liquid_name, display_color=liquid_colors[i % len(liquid_colors)]
        )
        for well_info in wells_info:
            if isinstance(well_info["well"], list):
                wells = well_info["well"]
            elif isinstance(well_info["well"], Well):
                wells = [well_info["well"]]
            else:
                wells = []
            if isinstance(well_info["volume"], (float, int)):
                volume = well_info["volume"]
            for well in wells:
                well.load_liquid(liquid, volume)


def find_liquid_height_of_all_wells(protocol, pipette, wells):
    """Find the liquid height of all wells in protocol."""
    dict_of_labware_heights = {}
    pipette.pick_up_tip()
    pip_channels = pipette.active_channels
    for well in wells:
        labware_name = well.parent.name
        total_number_of_wells_in_plate = len(well.parent.wells())
        if (
            pip_channels > 1
            and total_number_of_wells_in_plate > 12
            and well.well_name.startswith("A")
        ):
            height = pipette.measure_liquid_height(well)
            dict_of_labware_heights[labware_name, well] = height
        elif total_number_of_wells_in_plate <= 12:
            height = pipette.measure_liquid_height(well)
            dict_of_labware_heights[labware_name, well] = height
    if pip_channels != pipette.channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()
        pipette.reset_tipracks()
    msg = f"result: {dict_of_labware_heights}"
    protocol.comment(msg=msg)
    comment_height_of_specific_labware(
        protocol, "Liquid Waste", dict_of_labware_heights
    )
    return dict_of_labware_heights


def find_liquid_height_of_loaded_liquids(ctx, liquid_vols_and_wells, pipette):
    """Find Liquid height of loaded liquids."""
    from opentrons.protocol_api import Well

    load_wells_with_custom_liquids(ctx, liquid_vols_and_wells)
    wells = [
        well
        for items in liquid_vols_and_wells.values()
        for entry in items
        if isinstance(entry["well"], (Well, list)) and entry["volume"] != 0.0
        for well in (
            entry["well"] if isinstance(entry["well"], list) else [entry["well"]]
        )
    ]
    if pipette.active_channels == 96:
        wells = [well for well in wells if well.display_name.split(" ")[0] == "A1"]
    # Simulated probing returns sentinel values instead of numeric heights,
    # which makes later liquid-volume cleanup arithmetic invalid.
    if not ctx.is_simulating():
        find_liquid_height_of_all_wells(ctx, pipette, wells)
    return wells


def load_hs_adapter_and_labware(labware_str, heatershaker, labware_name):
    """Load appropriate adapter on heatershaker based off labware type."""
    heatershaker_adapters = {
        "nest_96_wellplate_2ml_deep": "opentrons_96_deep_well_adapter",
        "armadillo_96_wellplate_200ul_pcr_full_skirt": "opentrons_96_pcr_adapter",
        "corning_96_wellplate_360ul_flat": "opentrons_96_flat_bottom_adapter",
    }
    hs_adapter_type = heatershaker_adapters.get(labware_str, "")
    if hs_adapter_type:
        hs_adapter = heatershaker.load_adapter(hs_adapter_type)
        labware_on_hs = hs_adapter.load_labware(labware_str, labware_name)
    else:
        heatershaker.load_labware(labware_str, labware_name)
    return labware_on_hs, hs_adapter


def load_temp_adapter_and_labware(labware_str, temp_mod, labware_name):
    """Load appropriate adapter on temperature module based off labware type."""
    temp_mod_adapters = {
        "nest_96_wellplate_2ml_deep": "opentrons_96_deep_well_temp_mod_adapter",
        "armadillo_96_wellplate_200ul_pcr_full_skirt": "opentrons_96_well_aluminum_block",
        "opentrons_96_wellplate_200ul_pcr_full_skirt": "opentrons_96_well_aluminum_block",
    }
    temp_adapter_type = temp_mod_adapters.get(labware_str, "")
    if temp_adapter_type:
        temp_adapter = temp_mod.load_adapter(temp_adapter_type)
        labware_on_temp_mod = temp_adapter.load_labware(labware_str, labware_name)
    else:
        labware_on_temp_mod = temp_mod.load_labware(labware_str, labware_name)
    return labware_on_temp_mod, temp_adapter


def deactivate_modules(protocol):
    """Deactivate all loaded modules."""
    from opentrons.protocol_api.module_contexts import (
        HeaterShakerContext,
        TemperatureModuleContext,
        MagneticModuleContext,
        ThermocyclerContext,
    )

    modules = protocol.loaded_modules
    if modules:
        for module in modules.values():
            if isinstance(module, HeaterShakerContext):
                module.deactivate_shaker()
                module.deactivate_heater()
            elif isinstance(module, TemperatureModuleContext):
                module.deactivate()
            elif isinstance(module, MagneticModuleContext):
                module.disengage()
            elif isinstance(module, ThermocyclerContext):
                module.deactivate()


def move_labware_from_hs_to_destination(protocol, labware_to_move, hs, new_module):
    """Move labware from heatershaker to magnetic block."""
    hs.open_labware_latch()
    protocol.move_labware(labware_to_move, new_module, use_gripper=True)
    hs.close_labware_latch()


def move_labware_to_hs(protocol, labware_to_move, hs, hs_adapter):
    """Move labware to heatershaker."""
    hs.open_labware_latch()
    protocol.move_labware(labware_to_move, hs_adapter, use_gripper=True)
    hs.close_labware_latch()


def set_hs_speed(protocol, hs, hs_speed, time_min, deactivate):
    """Set heatershaker for a speed and duration."""
    hs.close_labware_latch()
    hs.set_and_wait_for_shake_speed(hs_speed)
    protocol.delay(
        minutes=time_min,
        msg=f"Shake at {hs_speed}  rpm for {time_min} minutes.",
    )
    if deactivate:
        hs.deactivate_shaker()


def clean_up_plates(protocol, pipette, list_of_labware, liquid_waste):
    """Aspirate liquid from labware and dispense into liquid waste."""
    pipette.pick_up_tip()
    pipette.liquid_presence_detection = False
    num_of_active_channels = pipette.active_channels
    for labware in list_of_labware:
        if num_of_active_channels == 8:
            list_of_wells = labware.rows()[0]
        elif num_of_active_channels == 1:
            list_of_wells = labware.wells()
        elif num_of_active_channels == 96:
            list_of_wells = [labware.wells()[0]]
        for well in list_of_wells:
            vol_transfer = well.current_liquid_volume()
            # A multi-channel pipette's volume is per nozzle. Plate wells are
            # distinct, but all active nozzles share one trough in a reservoir.
            if len(well.parent.wells()) <= 12:
                vol_transfer /= num_of_active_channels
            if vol_transfer > 0:
                pipette.transfer(
                    vol_transfer, well, liquid_waste.top(), new_tip="never"
                )
    if pipette.channels != num_of_active_channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()


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
        variable_name="pipette_mount",
        display_name="Pipette Mount",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="left",
    )
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
        description="Z offset for meniscus height. Default is -1.5mm.",
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol Set Up."""

    protocol.capture_image(filename="start_of_run")
    heater_shaker_speed = protocol.params.heater_shaker_speed  # type: ignore[attr-defined]
    mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    protocol.comment("Protocol Version: 04")

    dry_run = False
    res_type = "opentrons_tough_12_reservoir_22ml"
    global m1000_tips
    num_samples = 96
    # 350 rather than 400 so three columns come out of a 9,800 ul trough while
    # still leaving WASH_TROUGH_DEAD_VOLUME behind. At 400 the third column
    # drained the trough to 200 ul and wedged the tips in its tapered floor.
    wash1_vol = wash2_vol = wash3_vol = 350.0
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
    h_s: HeaterShakerContext = protocol.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    labware_name = "Samples"
    sample_plate, h_s_adapter = load_hs_adapter_and_labware(
        deepwell_type, h_s, labware_name
    )
    h_s.close_labware_latch()

    temp: TemperatureModuleContext = protocol.load_module(
        "temperature module gen2", "D3"
    )  # type: ignore[assignment]
    elutionplate, temp_adapter = load_temp_adapter_and_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", temp, "Elution Plate"
    )
    magblock: MagneticBlockContext = protocol.load_module(
        "magneticBlockV1", "C1"
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
    lm = "liquid-meniscus"

    def track_meniscus(
        liquid_class: LiquidClass, aspirate_flow_rate: float | None = None
    ) -> None:
        """Reference aspirates and dispenses to the tracked meniscus."""
        for tip in tip_racks:
            props = liquid_class.get_for(m1000, tip)
            props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
            props.aspirate.aspirate_position.offset.z = meniscus_z
            props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
            props.dispense.dispense_position.offset.z = meniscus_z
            if aspirate_flow_rate is not None:
                props.aspirate.flow_rate_by_volume.set_for_all_volumes(
                    aspirate_flow_rate
                )

    water = protocol.get_liquid_class("water")
    track_meniscus(water)
    slow_water = protocol.get_liquid_class("water")
    track_meniscus(slow_water, aspirate_flow_rate=SUPERNATANT_ASPIRATE_FLOW_RATE)

    def remove_supernatant(vol: float) -> None:
        """Remove supernatant."""
        protocol.comment("-----Removing Supernatant-----")
        num_trans = math.ceil(vol / 980)

        for i, m in enumerate(samples_m):
            tipcheck(m1000)
            loc = m
            for _ in range(num_trans):
                m1000.move_to(m.center())
                # Recomputed per column so that one shallow well cannot shrink
                # the removal volume for every column that follows it.
                vol_per_trans = vol / num_trans
                available = m.current_liquid_volume()
                if vol_per_trans > available:
                    vol_per_trans = max(available - 100, 0.0)  # type: ignore[assignment]
                if vol_per_trans <= 0:
                    continue
                m1000.transfer_with_liquid_class(
                    slow_water,
                    vol_per_trans,
                    loc,
                    waste,
                    new_tip="never",
                    return_tip=True,
                    group_wells=False,
                    trash_location=waste,
                )
                m1000.blow_out(waste)
                m1000.air_gap(20)
            m1000.return_tip()

        # Transfer from Magdeck plate to H-S
        move_labware_to_hs(protocol, sample_plate, h_s, h_s_adapter)

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
            m1000.return_tip()
        set_hs_speed(
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
                    trash_location=waste,
                )
            bead_mixing(well, m1000, vol_per_trans, reps=bead_reps_2)
            m1000.blow_out()
            m1000.air_gap(10)
            m1000.return_tip()

        set_hs_speed(
            protocol, h_s, heater_shaker_speed * 0.9, bind_time_1, True
        )

        # Transfer from H-S plate to Magdeck plate
        move_labware_from_hs_to_destination(
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
                    trash_location=waste,
                )
                m1000.air_gap(20)

        for i in range(num_cols):
            if i != 0:
                tipcheck(m1000)
            bead_mixing(
                samples_m[i], m1000, vol_per_trans, reps=3 if not dry_run else 1
            )
            m1000.return_tip()
        set_hs_speed(protocol, h_s, heater_shaker_speed, bind_time_2, True)

        # Transfer from H-S plate to Magdeck plate
        move_labware_from_hs_to_destination(
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

        num_trans = math.ceil(vol / 980.0)
        vol_per_trans = vol / num_trans
        # Every active nozzle draws vol_per_trans out of the same trough, so a
        # column costs the trough the per-nozzle volume times the channel count.
        vol_per_column = vol_per_trans * m1000.active_channels
        tipcheck(m1000)
        for i, m in enumerate(samples_m):
            for n in range(num_trans):
                while (
                    source[whichwash].current_liquid_volume()
                    < vol_per_column + WASH_TROUGH_DEAD_VOLUME
                ):
                    whichwash += 1
                    if whichwash >= len(source):
                        raise RuntimeError(
                            f"Out of wash buffer at column {i + 1}: the "
                            f"{len(source)} wash troughs cannot supply another "
                            f"{vol_per_column} ul while holding "
                            f"{WASH_TROUGH_DEAD_VOLUME} ul back in each."
                        )
                    protocol.comment(f"new wash source {whichwash}")
                m1000.transfer_with_liquid_class(
                    water,
                    vol_per_trans,
                    source[whichwash],
                    m,
                    new_tip="never",
                    return_tip=True,
                    group_wells=False,
                    trash_location=waste,
                )
        m1000.return_tip()
        set_hs_speed(
            protocol, h_s, heater_shaker_speed * 0.9, wash_time, True
        )

        move_labware_from_hs_to_destination(
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
        m1000.return_tip()
        set_hs_speed(
            protocol, h_s, heater_shaker_speed * 0.9, wash_time, True
        )

        # Transfer back to magnet
        move_labware_from_hs_to_destination(
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
            m1000.transfer_with_liquid_class(
                slow_water,
                vol,
                m,
                e,
                new_tip="never",
                return_tip=True,
                group_wells=False,
                trash_location=waste,
            )
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.return_tip()

        m1000.flow_rate.aspirate = 150

    """
    Here is where you can define the locations of your reagents.
    """
    lysis_ = res1.wells()[0]
    binding_buffer = res1.wells()[1:8]
    bind2_res = res1.wells()[8:12]
    all_washes = res2.wells()[1:] + res3.wells()[:2]
    elution_solution = res2.wells()[0]
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
        # Declared volumes must match the fills in All_Liquid_Set_ups.py and the
        # restore volumes in reverse_10_ZymoBIOMICS_Magbead_DNA_Cells_Flex.py,
        # since meniscus tracking derives every aspirate height from them.
        "Reagents": [{"well": all_washes, "volume": 9800.0}],
    }
    elutionplate.load_empty(elutionplate.wells())
    if probe_height_bool:
        find_liquid_height_of_loaded_liquids(
            protocol, liquid_vols_and_wells, m1000
        )
    else:
        load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)

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
    clean_up_plates(
        protocol,
        m1000,
        [elutionplate, sample_plate, res1, res3, res2],
        waste_reservoir["A1"],
    )
    find_liquid_height_of_all_wells(
        protocol, m1000, [waste_reservoir["A1"]]
    )
    if deactivate_modules_bool:
        deactivate_modules(protocol)
    protocol.capture_image(filename="end_of_run")
