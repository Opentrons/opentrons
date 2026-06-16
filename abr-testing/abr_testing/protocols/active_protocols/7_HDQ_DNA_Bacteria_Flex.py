"""Omega HDQ DNA Extraction: Bacteria - Tissue Protocol."""
import math
from opentrons import types
from opentrons.protocol_api import (
    ProtocolContext,
    Well,
    ParameterContext,
    InstrumentContext,
    Labware
)
import numpy as np
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    ThermocyclerContext,
    TemperatureModuleContext,
    MagneticModuleContext,
    AbsorbanceReaderContext,
)
from typing import List, Union, Dict, Tuple


metadata = {
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
    "protocolName": "Omega HDQ DNA Extraction: Bacteria- Tissue Protocol",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}
"""
Slot A1: Tips 1000
Slot A2: Tips 1000
Slot A3: Temperature module (gen2) with 96 well PCR block and Armadillo 96 well PCR Plate
Slot B1: Tips 1000
Slot B2:
Slot B3: Nest 1 Well Reservoir
Slot C1: Magblock
Slot C2:
Slot C3:
Slot D1: H-S with Nest 96 Well Deep well and DW Adapter
Slot D2: Nest 12 well 15 ml Reservoir
Slot D3: Trash

Reservoir 1:
Wells 1-2 - 9,900 ul
Well 3 - 14,310 ul
Wells 4-12 - 11,400 ul
"""

whichwash = 1
sample_max = 48
tip1k = 0
drop_count = 0
waste_vol = 0


def add_parameters(parameters: ParameterContext) -> None:
    """Define Parameters."""
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

# FUNCTIONS FOR COMMON MODULE SEQUENCES
def deactivate_modules(protocol: ProtocolContext) -> None:
    """Deactivate all loaded modules."""
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


def plate_reader_actions(
    protocol: ProtocolContext,
    plate_reader: AbsorbanceReaderContext,
    hellma_plate: Labware,
    hellma_plate_name: str,
) -> None:
    """Plate reader single and multi wavelength readings."""
    wavelengths = [450, 650]
    # Single Wavelength Readings
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
    # Multi Wavelength
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
def load_temp_adapter_and_labware(
    labware_str: str, temp_mod: TemperatureModuleContext, labware_name: str
) -> Tuple[Labware, Labware]:
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


def move_labware_from_hs_to_destination(
    protocol: ProtocolContext,
    labware_to_move: Labware,
    hs: HeaterShakerContext,
    new_module: Union[MagneticBlockContext, ThermocyclerContext],
) -> None:
    """Move labware from heatershaker to magnetic block."""
    hs.open_labware_latch()
    protocol.move_labware(labware_to_move, new_module, use_gripper=True)
    hs.close_labware_latch()


def move_labware_to_hs(
    protocol: ProtocolContext,
    labware_to_move: Labware,
    hs: HeaterShakerContext,
    hs_adapter: Union[Labware, HeaterShakerContext],
) -> None:
    """Move labware to heatershaker."""
    hs.open_labware_latch()
    protocol.move_labware(labware_to_move, hs_adapter, use_gripper=True)
    hs.close_labware_latch()


def set_hs_speed(
    protocol: ProtocolContext,
    hs: HeaterShakerContext,
    hs_speed: int,
    time_min: float,
    deactivate: bool,
) -> None:
    """Set heatershaker for a speed and duration."""
    hs.close_labware_latch()
    hs.set_and_wait_for_shake_speed(hs_speed)
    protocol.delay(
        minutes=time_min,
        msg=f"Shake at {hs_speed}  rpm for {time_min} minutes.",
    )
    if deactivate:
        hs.deactivate_shaker()


def use_disposable_lid_with_tc(
    protocol: ProtocolContext,
    lid_stack: Labware,
    plate_in_thermocycler: Labware,
    thermocycler: ThermocyclerContext,
) -> None:
    """Use disposable lid with thermocycler."""
    thermocycler.open_lid()
    protocol.move_lid(lid_stack, plate_in_thermocycler, use_gripper=True)
    thermocycler.close_lid()


# FUNCTIONS FOR COMMON PIPETTE COMMAND SEQUENCES


def clean_up_plates(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    list_of_labware: List[Labware],
    liquid_waste: Well,
) -> None:
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


def load_wells_with_custom_liquids(
    protocol: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
) -> None:
    """Load custom liquids into wells."""
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
        # Define the liquid with a color
        liquid = protocol.define_liquid(
            liquid_name, display_color=liquid_colors[i % len(liquid_colors)]
        )
        # Load liquid into each specified well or list of wells
        for well_info in wells_info:
            if isinstance(well_info["well"], list):
                wells = well_info["well"]
            elif isinstance(well_info["well"], Well):
                wells = [well_info["well"]]
            else:
                wells = []
            if isinstance(well_info["volume"], (float, int)):
                volume = well_info["volume"]
            # Load liquid into each well
            for well in wells:
                well.load_liquid(liquid, volume)

def comment_height_of_specific_labware(
    protocol: ProtocolContext, labware_name: str, dict_of_labware_heights: Dict
) -> None:
    """Comment height found of specific labware."""
    total_height = 0.0
    for key in dict_of_labware_heights.keys():
        if key[0] == labware_name:
            height = dict_of_labware_heights[key]
            total_height += height
    protocol.comment(f"Liquid Waste Total Height: {total_height}")


def find_liquid_height_of_all_wells(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    wells: List[Well],
) -> Dict:
    """Find the liquid height of all wells in protocol."""
    dict_of_labware_heights = {}
    pipette.pick_up_tip()
    pip_channels = pipette.active_channels
    for well in wells:
        labware_name = well.parent.name
        total_number_of_wells_in_plate = len(well.parent.wells())
        # if pip_channels is > 1 and total_wells > 12 - only probe 1st row.
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


def find_liquid_height_of_loaded_liquids(
    ctx: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
    pipette: InstrumentContext,
) -> List[Well]:
    """Find Liquid height of loaded liquids."""
    load_wells_with_custom_liquids(ctx, liquid_vols_and_wells)
    # Get flattened list of wells.
    wells: list[Well] = [
        well
        for items in liquid_vols_and_wells.values()
        for entry in items
        if isinstance(entry["well"], (Well, list)) and entry["volume"] != 0.0
        # Ensure "well" is Well or list of Well
        for well in (
            entry["well"] if isinstance(entry["well"], list) else [entry["well"]]
        )
    ]
    if pipette.active_channels == 96:
        wells = [well for well in wells if well.display_name.split(" ")[0] == "A1"]
    find_liquid_height_of_all_wells(ctx, pipette, wells)
    return wells


def load_wells_with_water(
    protocol: ProtocolContext, wells: List[Well], volumes: List[float]
) -> None:
    """Load liquids into wells."""
    water = protocol.define_liquid("Water", display_color="#0000FF")
    for well, volume in zip(wells, volumes):
        well.load_liquid(water, volume)


# CONSTANTS

hs_str = "heaterShakerModuleV1"
mag_str = "magneticBlockV1"
temp_str = "temperature module gen2"
tc_str = "thermocycler module gen2"
abs_mod_str = "absorbanceReaderV1"
liquid_colors = [
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

# Modules with deactivate
ModuleTypes = Union[
    TemperatureModuleContext,
    ThermocyclerContext,
    HeaterShakerContext,
    MagneticModuleContext,
    AbsorbanceReaderContext,
]
# THERMOCYCLER PROFILES


def perform_pcr(
    protocol: ProtocolContext,
    thermocycler: ThermocyclerContext,
    initial_denature_time_sec: int,
    denaturation_time_sec: int,
    anneal_time_sec: int,
    extension_time_sec: int,
    cycle_repetitions: int,
    final_extension_time_min: int,
) -> None:
    """Perform PCR."""
    # Define profiles.
    initial_denaturation_profile: List[ThermocyclerStep] = [
        {"temperature": 98, "hold_time_seconds": initial_denature_time_sec}
    ]
    cycling_profile: List[ThermocyclerStep] = [
        {"temperature": 98, "hold_time_seconds": denaturation_time_sec},
        {"temperature": 60, "hold_time_seconds": anneal_time_sec},
        {"temperature": 72, "hold_time_seconds": extension_time_sec},
    ]
    final_extension_profile: List[ThermocyclerStep] = [
        {"temperature": 72, "hold_time_minutes": final_extension_time_min}
    ]
    protocol.comment(f"Initial Denaturation for {initial_denature_time_sec} seconds.")
    thermocycler.execute_profile(
        steps=initial_denaturation_profile, repetitions=1, block_max_volume=50
    )
    protocol.comment(f"PCR for {cycle_repetitions} cycles.")
    thermocycler.execute_profile(
        steps=cycling_profile, repetitions=cycle_repetitions, block_max_volume=50
    )
    protocol.comment(f"Final Extension profile for {final_extension_time_min} minutes.")
    thermocycler.execute_profile(
        steps=final_extension_profile, repetitions=1, block_max_volume=50
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
 
    protocol.capture_image(filename="start_of_run")
    length = protocol.params.error_capture_duration  # type: ignore[attr-defined]
    heater_shaker_speed = protocol.params.heater_shaker_speed  # type: ignore[attr-defined]
    mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]


    dry_run = False
    TIP_TRASH = False
    res_type = "opentrons_tough_12_reservoir_22ml"

    num_samples = 96
    wash1_vol = 600.0
    wash2_vol = 600.0
    wash3_vol = 600.0
    AL_vol = 230.0
    sample_vol = 180.0
    bind_vol = 320.0
    elution_vol = 100.0

    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"
    res_type = "opentrons_tough_12_reservoir_22ml"
    if not dry_run:
        settling_time = 2.0
        A_lysis_time_1 = 15.0
        A_lysis_time_2 = 10.0
        bind_time = 10.0
        elute_wash_time = 5.0
    else:
        settling_time = (
            elute_wash_time
        ) = A_lysis_time_1 = A_lysis_time_2 = bind_time = 0.25
    PK_vol = bead_vol = 20
    AL_total_vol = AL_vol + PK_vol
    starting_vol = AL_vol + sample_vol
    binding_buffer_vol = bind_vol + bead_vol

    h_s: HeaterShakerContext = protocol.load_module(
        hs_str, "D1"
    )  # type: ignore[assignment]
    temp: TemperatureModuleContext = protocol.load_module(
        temp_str, "D3"
    )  # type: ignore[assignment]
    elutionplate, temp_adapter = load_temp_adapter_and_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", temp, "Elution Plate"
    )
    lid = protocol.load_lid_stack("opentrons_tough_universal_lid", "C3", 2)
    protocol.move_lid(lid, elutionplate, use_gripper=True)
    magnetic_block: MagneticBlockContext = protocol.load_module(
        mag_str, "C1"
    )  # type: ignore[assignment]
    waste_reservoir = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml", "C2", "Liquid Waste"
    )
    waste = waste_reservoir.wells()[0]
    waste_reservoir.load_empty(waste_reservoir.wells())
    protocol.load_trash_bin("A3")
    sample_plate = protocol.load_labware(deepwell_type, "B3", "Sample Plate")

    res1 = protocol.load_labware(res_type, "D2", "Reagent Reservoir 1")
    num_cols = math.ceil(num_samples / 8)
    # Load tips and combine all similar boxes
    tips1000 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", "Tips 1")
    tips1001 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", "Tips 2")
    tips1002 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B1", "Tips 3")

    tips = [
        *tips1000.wells()[num_samples:96],
        *tips1001.wells(),
        *tips1002.wells(),
    ]
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
    """
    Here is where you can define the locations of your reagents.
    """
    binding_buffer = res1.wells()[:2]
    AL = res1.wells()[2]
    wash1 = res1.wells()[3:6]
    wash2 = res1.wells()[6:9]
    wash3 = res1.wells()[9:]

    samples_m = sample_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]
    # Probe wells
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "AL Lysis": [{"well": AL, "volume": AL_vol}],
        "PK": [{"well": AL, "volume": PK_vol}],
        "Beads": [{"well": binding_buffer, "volume": bead_vol}],
        "Binding": [{"well": binding_buffer, "volume": bind_vol}],
        "Wash 1": [{"well": wash1, "volume": wash1_vol}],
        "Wash 2": [{"well": wash2, "volume": wash2_vol}],
        "Wash 3": [{"well": wash3, "volume": wash3_vol}],
        "Samples": [{"well": sample_plate.wells()[:num_samples], "volume": sample_vol}],
        "Elution Buffer": [
            {"well": elutionplate.wells()[:num_samples], "volume": elution_vol}
        ],
    }

    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300

    def tiptrack(tipbox: List[Well]) -> None:
        """Track Tips."""
        global tip1k
        global drop_count
        if tipbox == tips:
            m1000.pick_up_tip(tipbox[int(tip1k)])
            tip1k = tip1k + 8
            if tip1k >= len(tipbox):
                tip1k = 0
        drop_count = drop_count + 8
        if drop_count >= 150:
            drop_count = 0

    def remove_supernatant(vol: float) -> None:
        """Remove supernatants."""
        protocol.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 150
        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        for i, m in enumerate(samples_m):
            m1000.pick_up_tip(tips_sn[8 * i])
            loc = m
            for _ in range(num_trans):
                m1000.move_to(m.center())
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
        move_labware_to_hs(protocol, sample_plate, h_s, h_s)

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
        aspbot = well.bottom().move(types.Point(x=0, y=2, z=1))
        asptop = well.bottom().move(types.Point(x=0, y=-2, z=2.5))
        disbot = well.bottom().move(types.Point(x=0, y=1.5, z=3))
        distop = well.top().move(types.Point(x=0, y=1.5, z=0))

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

    def A_lysis(vol: float, source: Well) -> None:
        """A Lysis."""
        protocol.comment("-----Mixing then transferring AL buffer-----")
        num_transfers = math.ceil(vol / 980)
        tiptrack(tips)
        for i in range(num_cols):
            src = source
            tvol = vol / num_transfers
            for t in range(num_transfers):
                if i == 0 and t == 0:
                    for _ in range(3):
                        m1000.aspirate(tvol, src.bottom(1))
                        m1000.dispense(tvol, src.bottom(4))
                m1000.aspirate(tvol, src.meniscus(z=meniscus_z, target="end"))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume, samples_m[i].top())
                m1000.air_gap(20)

        for i in range(num_cols):
            if i != 0:
                tiptrack(tips)
            mixing(
                samples_m[i], m1000, tvol - 40, reps=10 if not dry_run else 1
            )  # vol is 250 AL + 180 sample
            m1000.dispense(m1000.current_volume, waste)
            m1000.air_gap(20)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        protocol.comment("-----Mixing then Heating AL and Sample-----")

        set_hs_speed(
            protocol, h_s, heater_shaker_speed, A_lysis_time_1, False
        )
        if not dry_run:
            hs_task = h_s.set_target_temperature(55)
            protocol.wait_for_tasks([hs_task])
            protocol.comment("reached 55C")
            timer_task = protocol.create_timer(seconds=A_lysis_time_2 * 60)
            protocol.wait_for_tasks([timer_task])
            protocol.comment("Incubated at 55C for 10 minutes")
            h_s.deactivate_shaker()

    def bind(vol: float) -> None:
        """Bind.

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
        protocol.comment("-----Beginning Bind Steps-----")
        tiptrack(tips)
        for i, well in enumerate(samples_m):
            num_trans = math.ceil(vol / 980)
            vol_per_trans = vol / num_trans
            source = binding_buffer[i // 7]
            if i == 0:
                reps = 6 if not dry_run else 1
            else:
                reps = 1
            protocol.comment("-----Mixing Beads in Reservoir-----")
            bead_mixing(source, m1000, vol_per_trans, reps=reps if not dry_run else 1)
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
                if t < num_trans - 1:
                    m1000.air_gap(20)

        protocol.comment("-----Mixing Beads in Plate-----")
        for i in range(num_cols):
            if i != 0:
                tiptrack(tips)
            mixing(
                samples_m[i], m1000, vol + starting_vol, reps=10 if not dry_run else 1
            )
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        protocol.comment("-----Incubating Beads and Bind on H-S-----")

        speed_val = heater_shaker_speed * 0.9
        set_hs_speed(protocol, h_s, speed_val, bind_time, True)

        # Transfer from H-S plate to Magdeck plate
        move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magnetic_block
        )
        for bindi in np.arange(
            settling_time + 1, 0, -0.5
        ):  # Settling time delay with countdown timer
            protocol.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(vol + starting_vol)

    def wash(vol: float, source: List[Well]) -> None:
        """Wash function."""
        global whichwash  # Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
        if source == wash2:
            whichwash = 2
        if source == wash3:
            whichwash = 3

        protocol.comment("-----Beginning Wash #" + str(whichwash) + "-----")

        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans
        tiptrack(tips)
        for i, m in enumerate(samples_m):
            src = source[i // 4]
            for n in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.transfer_with_liquid_class(
                    water,
                    vol_per_trans,
                    src,
                    m,
                    return_tip=True,
                    group_wells=False,
                    new_tip="never",
                )
        m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        set_hs_speed(
            protocol, h_s, heater_shaker_speed, elute_wash_time, True
        )

        move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magnetic_block
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
        """Elution Function."""
        protocol.comment("-----Beginning Elution Steps-----")
        tiptrack(tips)
        protocol.move_lid(elutionplate, lid, use_gripper=True)
        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            m1000.flow_rate.aspirate = 25
            m1000.aspirate(vol, e.meniscus(z=meniscus_z, target="end"))
            m1000.air_gap(20)
            m1000.dispense(m1000.current_volume, m.top())
        m1000.flow_rate.aspirate = 150
        m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        speed_val = heater_shaker_speed * 1.1
        set_hs_speed(protocol, h_s, speed_val, elute_wash_time, True)

        # Transfer back to magnet
        move_labware_from_hs_to_destination(
            protocol, sample_plate, h_s, magnetic_block
        )

        for elutei in np.arange(settling_time, 0, -0.5):
            protocol.delay(
                minutes=0.5,
                msg="Incubating on MagDeck for " + str(elutei) + " more minutes.",
            )

        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(tips)
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 150
            m1000.transfer_with_liquid_class(
                water, vol, m, e, return_tip=True, group_wells=False, new_tip="never"
            )
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()
        protocol.move_lid(lid, elutionplate, use_gripper=True)
    protocol.move_lid(elutionplate, lid, use_gripper=True)
    h_s.close_labware_latch()
    if not probe_height_bool:
        load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)
    else:
        find_liquid_height_of_loaded_liquids(
            protocol, liquid_vols_and_wells, m1000
        )
    protocol.move_lid(lid, elutionplate, use_gripper=True)

    move_labware_to_hs(protocol, sample_plate, h_s, h_s)
    protocol.capture_image(filename="movement")

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    A_lysis(AL_total_vol, AL)
    bind(binding_buffer_vol)
    wash(wash1_vol, wash1)
    wash(wash2_vol, wash2)
    wash(wash3_vol, wash3)
    if not dry_run:
        drybeads = 10.0  # Number of minutes you want to dry for
    else:
        drybeads = 0.5
    for beaddry in np.arange(drybeads, 0, -0.5):
        protocol.delay(
            minutes=0.5,
            msg="There are " + str(beaddry) + " minutes left in the drying step.",
        )
    elute(elution_vol)

    # Probe wells
    end_wells_with_liquid = [
        waste_reservoir.wells()[0],
    ]
    m1000.reset_tipracks()
    protocol.move_lid(elutionplate, lid, use_gripper=True)
    clean_up_plates(
        protocol, m1000, [res1, elutionplate], waste_reservoir["A1"]
    )
    find_liquid_height_of_all_wells(
        protocol, m1000, end_wells_with_liquid
    )
    protocol.capture_image(filename="end_of_run")

    if deactivate_modules_bool:
        deactivate_modules(protocol)
       
