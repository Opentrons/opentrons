"""Thermo MagMax RNA Extraction: Cells Multi-Channel."""
import math
from opentrons import types
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    Well,
    InstrumentContext,
)
from typing import List
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    TemperatureModuleContext,
    AbsorbanceReaderContext,
)

import numpy as np
from typing import Dict

metadata = {
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
    "protocolName": "Thermo MagMax RNA Extraction: Cells Multi-Channel + Plate Reader",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}
"""
Slot A1: Tips 200
Slot A2: Tips 200
Slot A3: Temperature module (gen2) with 96 well PCR block and Armadillo 96 well PCR Plate
** Plate gets 55 ul per well in each well of the entire plate
Slot B1: Tips 200
Slot B2: Tips 200
Slot B3: Nest 1 Well Reservoir
Slot C1: Magblock
Slot C2:
Slot C3:
Slot D1: H-S with Nest 96 Well Deepwell and DW Adapter
Slot D2: Nest 12 well 15 ml Reservoir
Slot D3: Trash

Reservoir 1:
Well 1 - 8120 ul
Well 2 - 8120 ul
Well 3 - 12800 ul
Well 4-12 - 9500 ul

"""

whichwash = 0
tip_pick_up = 0
drop_count = 0
waste_vol = 0
wash_volume_tracker = 0.0


# Start protocol

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


def plate_reader_actions(protocol, plate_reader, hellma_plate, hellma_plate_name):
    """Plate reader single and multi wavelength readings."""
    from datetime import datetime

    wavelengths = [450, 650]
    hellma_plate_slot = hellma_plate.parent
    plate_reader.close_lid()
    for wavelength in wavelengths:
        plate_reader.initialize("single", [wavelength], reference_wavelength=wavelength)
        plate_reader.open_lid()
        protocol.move_labware(hellma_plate, plate_reader, use_gripper=True)
        plate_reader.close_lid()
        result = plate_reader.read(str(datetime.now()))
        msg = f"{hellma_plate_name} result: {result}"
        protocol.comment(msg=msg)
        plate_reader.open_lid()
        protocol.move_labware(hellma_plate, hellma_plate_slot, use_gripper=True)
        plate_reader.close_lid()
    plate_reader.initialize("multi", [450, 650])
    plate_reader.open_lid()
    protocol.move_labware(hellma_plate, plate_reader, use_gripper=True)
    plate_reader.close_lid()
    result = plate_reader.read(str(datetime.now()))
    msg = f"{hellma_plate_name} result: {result}"
    protocol.comment(msg=msg)
    plate_reader.open_lid()
    protocol.move_labware(hellma_plate, hellma_plate_slot, use_gripper=True)
    plate_reader.close_lid()


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
            if protocol.is_simulating():
                vol_transfer = well.max_volume
            else:
                vol_transfer = well.current_liquid_volume()  # type: ignore
                pipette.transfer(
                    vol_transfer, well, liquid_waste.top(), new_tip="never"
                )
    if pipette.channels != num_of_active_channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
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
    parameters.add_str(
        variable_name="pipette_mount",
        display_name="Pipette Mount",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="left",
    )
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
    )
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    parameters.add_str(
        variable_name="labware_plate_reader_compatible",
        display_name="Plate Reader Labware",
        default="hellma_reference_plate",
        choices=[
            {
                "display_name": "Corning_96well",
                "value": "corning_96_wellplate_360ul_flat",
            },
            {"display_name": "Hellma Plate", "value": "hellma_reference_plate"},
            {"display_name": "Nest_96well", "value": "nest_96_wellplate_200ul_flat"},
        ],
    )
    parameters.add_bool(
        variable_name="plate_orientation",
        display_name="Hellma Plate Orientation",
        default=True,
        description="If hellma plate is rotated, set to True.",
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
        description="Z offset for meniscus height. Default is -1.5mm.",
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


def run(protocol: ProtocolContext) -> None:
    """Protocol."""

    protocol.capture_image(filename="start_of_run")

    dry_run = False
    inc_lysis = True
    res_type = "opentrons_tough_12_reservoir_22ml"
    num_samples = 96
    wash_vol = 150.0
    lysis_vol = 140.0
    stop_vol = 100.0
    elution_vol = 55.0
    heater_shaker_speed = protocol.params.heater_shaker_speed  # type: ignore[attr-defined]
    dot_bottom = protocol.params.dot_bottom  # type: ignore[attr-defined]
    pipette_mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    plate_type = protocol.params.labware_plate_reader_compatible  # type: ignore [attr-defined]
    plate_orientation = protocol.params.plate_orientation  # type: ignore[attr-defined]
    probe_liquid_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]

    protocol.comment("Protocol Version: 05")
    plate_name_str = "hellma_plate_" + str(plate_orientation)

    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"
    if not dry_run:
        settling_time = 2.0
        lysis_time = 1.0
        drybeads = 2.0  # Number of minutes you want to dry for
        bind_time = wash_time = 5.0
        dnase_time = 10.0
        stop_time = elute_time = 3.0
    else:
        settling_time = 0.25
        lysis_time = 0.25
        drybeads = elute_time = 0.25
        bind_time = wash_time = dnase_time = stop_time = 0.25
    bead_vol = 20.0

    h_s: HeaterShakerContext = protocol.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    sample_plate, h_s_adapter = load_hs_adapter_and_labware(
        deepwell_type, h_s, "Sample Plate"
    )
    h_s.close_labware_latch()
    temp: TemperatureModuleContext = protocol.load_module(
        "temperature module gen2", "D3"
    )  # type: ignore[assignment]
    elutionplate, temp_adapter = load_temp_adapter_and_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", temp, "Elution Plate"
    )
    temp_task = temp.start_set_temperature(4)
    magblock: MagneticBlockContext = protocol.load_module(
        "magneticBlockV1", "C1"
    )  # type: ignore[assignment]
    waste_reservoir = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml", "C3", "Liquid Waste"
    )
    # Plate Reader
    plate_reader: AbsorbanceReaderContext = protocol.load_module(
        "absorbanceReaderV1", "A3"
    )  # type: ignore[assignment]
    hellma_plate = protocol.load_labware(plate_type, "B3")
    waste = waste_reservoir.wells()[0].top()
    res1 = protocol.load_labware(res_type, "D2", "reagent reservoir 1")
    num_cols = math.ceil(num_samples / 8)

    # Load tips and combine all similar boxes
    tips200 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A1", "Tips 1")
    tips201 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A2", "Tips 2")
    tips202 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "B1", "Tips 3")
    tips203 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "B2", "Tips 4")
    tips204 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "C2", "Tips 5")

    tips_sn = tips200.wells()[:num_samples]

    # load P1000M pipette
    m1000 = protocol.load_instrument(
        "flex_8channel_1000",
        pipette_mount,
        tip_racks=[tips200, tips201, tips202, tips203, tips204],
    )

    # Load Liquid Locations in Reservoir
    elution_solution = elutionplate.rows()[0][:num_cols]
    dnase1 = elutionplate.rows()[0][:num_cols]
    lysis_ = res1.wells()[0:2]
    stopreaction = res1.wells()[2]
    wash1 = res1.wells()[3]
    wash2 = res1.wells()[4]
    wash3 = res1.wells()[5]
    wash4 = res1.wells()[6]
    wash5 = res1.wells()[7]
    wash6 = res1.wells()[8]
    wash7 = res1.wells()[9]
    wash8 = res1.wells()[10]
    wash9 = res1.wells()[11]
    all_washes = res1.wells()[3:12]
    """
    Here is where you can define the locations of your reagents.
    """
    samples_m = sample_plate.rows()[0][:num_cols]  # 20ul beads each well
    cells_m = sample_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]
    # Do the same for color mapping
    beads_ = sample_plate.wells()[: (8 * num_cols)]
    elution_samps = elutionplate.wells()[: (8 * num_cols)]
    dnase1_ = elutionplate.wells()[(8 * num_cols) : (16 * num_cols)]

    def tiptrack(pip: InstrumentContext) -> None:
        """Tip Track."""
        global tip_pick_up
        global drop_count
        pip.pick_up_tip()
        tip_pick_up += 1
        drop_count = drop_count + 8
        if drop_count >= 250:
            drop_count = 0
        if tip_pick_up >= 59:
            pip.reset_tipracks()

    def remove_supernatant(vol: float) -> None:
        """Remove Supernatant."""
        protocol.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 30
        num_trans = math.ceil(vol / 180)
        vol_per_trans = vol / num_trans

        for i, m in enumerate(samples_m):
            m1000.pick_up_tip(tips_sn[8 * i])
            loc = m.meniscus(z=meniscus_z, target="end")
            for _ in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, m.top())
                m1000.move_to(m.center())
                m1000.transfer(vol_per_trans, loc, waste, new_tip="never", air_gap=20)
                m1000.blow_out(waste)
                m1000.prepare_to_aspirate()
                m1000.air_gap(20)
            m1000.return_tip()
        m1000.flow_rate.aspirate = 300
        # Move Plate From Magnet to H-S
        move_labware_to_hs(protocol, sample_plate, h_s, h_s_adapter)

    def bead_mixing(
        well: Well, pip: InstrumentContext, mvol: float, reps: int = 8
    ) -> None:
        """Bead Mixing.

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
        aspbot = well.bottom().move(types.Point(x=0, y=0, z=1))
        asptop = well.bottom().move(types.Point(x=2, y=-2, z=1))
        disbot = well.bottom().move(types.Point(x=-2, y=1.5, z=2))
        distop = well.bottom().move(types.Point(x=0, y=0, z=6))

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
                pip.flow_rate.aspirate = 100
                pip.flow_rate.dispense = 75
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
        center = well.top(5)
        asp = well.meniscus(z=meniscus_z, target="end")
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
                pip.flow_rate.aspirate = 100
                pip.flow_rate.dispense = 75
                pip.aspirate(vol, asp)
                pip.dispense(vol, asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300
        if m1000.current_volume > 0.0:
            m1000.dispense(m1000.current_volume, waste)

    def lysis(vol: float, source: List[Well]) -> None:
        """Lysis Steps."""
        protocol.comment("-----Beginning lysis steps-----")
        num_transfers = math.ceil(vol / 190)
        tiptrack(m1000)
        src = source[0]
        for i in range(num_cols):
            tvol = vol / num_transfers
            for t in range(num_transfers):
                m1000.prepare_to_aspirate()
                m1000.aspirate(
                    tvol,
                    location=src.meniscus(z=meniscus_z, target="start"),
                    end_location=src.meniscus(z=meniscus_z, target="end"),
                )
                m1000.dispense(m1000.current_volume, cells_m[i].top(-3))
                if src.current_liquid_volume() < (tvol * 8):
                    protocol.comment("-----Changing to second lysis well.------")
                    src = source[1]
                    protocol.comment(f"new source {src}")

        # mix after adding all reagent to wells with cells
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000)
            for x in range(8 if not dry_run else 1):
                m1000.prepare_to_aspirate()
                m1000.aspirate(
                    tvol * 0.75,
                    location=cells_m[i].meniscus(z=meniscus_z, target="start"),
                    end_location=cells_m[i].meniscus(z=meniscus_z, target="end"),
                )
                m1000.dispense(
                    tvol * 0.75,
                    location=cells_m[i].meniscus(z=8, target="start"),
                    end_location=cells_m[i].meniscus(z=8, target="end"),
                )
                if x == 3:
                    protocol.delay(minutes=0.0167)
                    m1000.blow_out(cells_m[i].meniscus(z=1, target="end"))
            m1000.return_tip()

        set_hs_speed(protocol, h_s, heater_shaker_speed, lysis_time, True)

    def bind() -> None:
        """Bind.

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
                               supernatant to the final clean elutions PCR
                               plate.
        """
        protocol.comment("-----Beginning bind steps-----")
        for i, well in enumerate(samples_m):
            # Transfer cells+lysis/bind to wells with beads
            tiptrack(m1000)
            m1000.prepare_to_aspirate()
            m1000.aspirate(
                120,
                location=cells_m[i].meniscus(z=meniscus_z, target="start"),
                end_location=cells_m[i].meniscus(z=meniscus_z, target="end"),
            )
            m1000.air_gap(10)
            m1000.dispense(m1000.current_volume, well.meniscus(z=8, target="end"))
            # Mix after transfer
            bead_mixing(well, m1000, 130, reps=5 if not dry_run else 1)
            m1000.prepare_to_aspirate()
            m1000.air_gap(10)
            m1000.return_tip()
        set_hs_speed(protocol, h_s, heater_shaker_speed, bind_time, True)

        # Transfer from H-S plate to Magdeck plate
        move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magblock
        )

        for bindi in np.arange(
            settling_time, 0, -0.5
        ):  # Settling time delay with countdown timer
            protocol.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(180)

    def wash(vol: float, source: List[Well]) -> None:
        """Wash Function."""
        global whichwash  # Defines which wash the protocol is on to log on the app
        protocol.comment("-----Now starting Wash #" + str(whichwash) + "-----")
        global wash_volume_tracker
        tiptrack(m1000)
        num_trans = math.ceil(vol / 180)
        vol_per_trans = vol / num_trans
        for i, m in enumerate(samples_m):
            src = source[whichwash]
            for n in range(num_trans):
                m1000.aspirate(vol_per_trans, src)
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume, m.top(-2))
                protocol.delay(seconds=2)
                m1000.blow_out(m.top(-2))
                wash_volume_tracker += vol_per_trans * 8
                if wash_volume_tracker > 9600:
                    whichwash += 1
                    src = source[whichwash]
                    protocol.comment(f"new wash source {whichwash}")
                    wash_volume_tracker = 0.0
            m1000.prepare_to_aspirate()
            m1000.air_gap(10)
        m1000.return_tip()

        # Shake for 5 minutes to mix wash with beads
        set_hs_speed(protocol, h_s, heater_shaker_speed, wash_time, True)

        # Transfer from H-S plate to Magdeck plate
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
        protocol.comment(f"final wash source {whichwash}")

    def dnase(vol: float, source: List[Well]) -> None:
        """Steps for DNAseI."""
        protocol.comment("-----DNAseI Steps Beginning-----")
        num_trans = math.ceil(vol / 180)
        vol_per_trans = vol / num_trans
        tiptrack(m1000)
        for i, m in enumerate(samples_m):
            src = source[i]
            m1000.flow_rate.aspirate = 10
            for n in range(num_trans):
                m1000.aspirate(
                    vol_per_trans,
                    location=src.meniscus(z=meniscus_z, target="start"),
                    end_location=src.meniscus(z=meniscus_z, target="end"),
                )
                m1000.dispense(
                    vol_per_trans,
                    location=m.meniscus(z=meniscus_z, target="start"),
                    end_location=m.meniscus(z=meniscus_z, target="end"),
                )
            m1000.blow_out(m.top(-3))
            m1000.prepare_to_aspirate()
            m1000.air_gap(20)

        m1000.flow_rate.aspirate = 300

        # Is this mixing needed? \/\/\/
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000)
            mixing(samples_m[i], m1000, 45, reps=5 if not dry_run else 1)
            m1000.return_tip()

        # Shake for 10 minutes to mix DNAseI
        set_hs_speed(protocol, h_s, heater_shaker_speed, dnase_time, True)

    def stop_reaction(vol: float, source: Well) -> None:
        """Adding stop solution."""
        protocol.comment("-----Adding Stop Solution-----")
        tiptrack(m1000)
        num_trans = math.ceil(vol / 180)
        vol_per_trans = vol / num_trans
        for i, m in enumerate(samples_m):
            src = source
            for n in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.transfer(vol_per_trans, src, m.top(), air_gap=20, new_tip="never")
            m1000.blow_out(m.top(-3))
            m1000.prepare_to_aspirate()
            m1000.air_gap(20)
        m1000.return_tip()

        # Shake for 3 minutes to mix wash with beads
        set_hs_speed(protocol, h_s, heater_shaker_speed, stop_time, True)

        # Transfer from H-S plate to Magdeck plate
        move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magblock
        )

        for stop in np.arange(settling_time, 0, -0.5):
            protocol.delay(
                minutes=0.5,
                msg="There are " + str(stop) + " minutes left in this incubation.",
            )

        remove_supernatant(vol + 50)

    def elute(vol: float) -> None:
        """Elution."""
        protocol.comment("-----Elution Beginning-----")
        tiptrack(m1000)
        m1000.flow_rate.aspirate = 10
        for i, m in enumerate(samples_m):
            loc = m.top(-2)
            m1000.aspirate(vol, elution_solution[i])
            m1000.air_gap(10)
            m1000.dispense(m1000.current_volume, loc)
            m1000.blow_out(m.top(-3))
            m1000.prepare_to_aspirate()
            m1000.air_gap(10)

        m1000.flow_rate.aspirate = 300

        # Is this mixing needed? \/\/\/
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000)
            for mixes in range(10):
                m1000.aspirate(elution_vol - 10, samples_m[i])
                m1000.dispense(elution_vol - 10, samples_m[i].bottom(10))
                if mixes == 9:
                    m1000.flow_rate.dispense = 20
                    m1000.aspirate(elution_vol - 10, samples_m[i])
                    m1000.dispense(elution_vol - 10, samples_m[i].bottom(10))
                    m1000.flow_rate.dispense = 300
            m1000.dispense(m1000.current_volume, waste)
            m1000.return_tip()

        # Shake for 3 minutes to mix wash with beads
        set_hs_speed(protocol, h_s, heater_shaker_speed, elute_time, True)

        # Transfer from H-S plate to Magdeck plate
        move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magblock
        )

        for elutei in np.arange(settling_time, 0, -0.5):
            protocol.delay(
                minutes=0.5,
                msg="Incubating on MagDeck for " + str(elutei) + " more minutes.",
            )

        protocol.comment("-----Trasnferring Sample to Elution Plate-----")
        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(m1000)
            loc = m.bottom(dot_bottom)
            m1000.transfer(vol, loc, e.bottom(5), air_gap=20, new_tip="never")
            m1000.blow_out(e.top(-2))
            m1000.prepare_to_aspirate()
            m1000.air_gap(20)
            m1000.return_tip()

    # Add liquids to non-reservoir labware
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Beads": [{"well": beads_, "volume": bead_vol}],
        "Sample": [{"well": sample_plate.wells(), "volume": 100.0}],
        "DNAse": [{"well": dnase1_, "volume": 200}],
        "Elution Buffer": [{"well": elution_samps, "volume": elution_vol}],
        "Lysis": [{"well": lysis_, "volume": 8400.0}],
        "Stop": [{"well": stopreaction, "volume": 6400.0}],
        "Wash 1": [{"well": wash1, "volume": 9500.0}],
        "Wash 2": [{"well": wash2, "volume": 9500.0}],
        "Wash 3": [{"well": wash3, "volume": 9500.0}],
        "Wash 4": [{"well": wash4, "volume": 9500.0}],
        "Wash 5": [{"well": wash5, "volume": 9500.0}],
        "Wash 6": [{"well": wash6, "volume": 9500.0}],
        "Wash 7": [{"well": wash7, "volume": 9500.0}],
        "Wash 8": [{"well": wash8, "volume": 9500.0}],
        "Wash 9": [{"well": wash9, "volume": 9500.0}],
    }
    if probe_liquid_height_bool:
        find_liquid_height_of_loaded_liquids(
            protocol, liquid_vols_and_wells, m1000
        )
    else:
        load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)
    # run plate reader
    plate_reader_actions(
        protocol, plate_reader, hellma_plate, plate_name_str
    )

    m1000.flow_rate.aspirate = 50
    m1000.flow_rate.dispense = 150
    m1000.flow_rate.blow_out = 300

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    if inc_lysis:
        lysis(lysis_vol, lysis_)
    bind()
    wash(wash_vol, all_washes)
    wash(wash_vol, all_washes)
    wash(wash_vol, all_washes)
    # dnase1 treatment
    protocol.wait_for_tasks([temp_task])
    dnase(30, dnase1)
    stop_reaction(stop_vol, stopreaction)
    # Resume washes
    wash(wash_vol, all_washes)
    wash(wash_vol, all_washes)
    wash(wash_vol, all_washes)

    for beaddry in np.arange(drybeads, 0, -0.5):
        protocol.delay(
            minutes=0.5,
            msg="There are " + str(beaddry) + " minutes left in the drying step.",
        )
    elute(elution_vol)
    end_list_of_wells_to_probe = [waste_reservoir["A1"]]
    clean_up_plates(
        protocol, m1000, [elutionplate, sample_plate], waste_reservoir["A1"]
    )
    find_liquid_height_of_all_wells(
        protocol, m1000, end_list_of_wells_to_probe
    )
    # Run plate reader
    plate_reader_actions(
        protocol, plate_reader, hellma_plate, plate_name_str
    )
    protocol.capture_image(filename="end_of_run")
    if deactivate_modules_bool:
        deactivate_modules(protocol)
