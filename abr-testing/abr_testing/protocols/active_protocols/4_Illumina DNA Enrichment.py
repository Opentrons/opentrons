"""Helper functions commonly used in protocols."""

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    InstrumentContext,
    ParameterContext,
    Well,
)
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    ThermocyclerContext,
    TemperatureModuleContext,
    MagneticModuleContext,
    AbsorbanceReaderContext,
)
import json
from typing import List, Union, Dict, Tuple
from opentrons.hardware_control.modules.types import ThermocyclerStep



metadata = {
    "protocolName": "Illumina DNA Enrichment v4 with TC Auto Sealing Lid NOABRFOLDER",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}
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

# SCRIPT SETTINGS
DRYRUN = False  # True = skip incubation times, shorten mix, for testing purposes
USE_GRIPPER = True  # True = Uses Gripper, False = Manual Move
TIP_TRASH = False  # True = Used tips go in Trash, False = Used tips go back into rack
HYBRID_PAUSE = True  # True = sets a pause on the Hybridization


# PROTOCOL SETTINGS
COLUMNS = 4  # 1-4
HYBRIDDECK = True
HYBRIDTIME = 1.6  # Hours


# PROTOCOL BLOCKS
STEP_VOLPOOL = 0
STEP_HYB = 0
STEP_CAPTURE = 1
STEP_WASH = 1
STEP_PCR = 1
STEP_PCRDECK = 1
STEP_CLEANUP = 1


p200_tips = 0
p50_tips = 0
total_waste_volume = 0.0


RUN = 1


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
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
    """Create parameter for dot bottom value."""
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
    """Create parameter to use/not use disposable lid."""
    parameters.add_bool(
        variable_name="disposable_lid",
        display_name="Disposable Lid",
        description="True means use lid.",
        default=True,
    )
    """Create parameter for tc lid deck riser."""
    parameters.add_bool(
        variable_name="deck_riser",
        display_name="Deck Riser",
        description="True means use deck riser.",
        default=True,
    )
    parameters.add_bool(
        variable_name="trash_lid",
        display_name="Trash Disposable Lid",
        description="True means trash lid, false means keep on deck.",
        default=True,
    )
    """Create parameter for deactivating modules at the end fof run."""
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    """Create parameter for probe liquid height."""
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )
     # NOTE: meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
        description="Z offset for meniscus height. Default is -1.5mm.",
    )
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
def load_common_liquid_setup_labware_and_instruments(
    protocol: ProtocolContext,
) -> Tuple[Labware, Labware, InstrumentContext]:
    """Load Commonly used Labware and Instruments."""
    # Tip rack
    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    # Pipette
    p1000 = protocol.load_instrument(
        instrument_name="flex_8channel_1000", mount="left", tip_racks=[tip_rack]
    )
    # Source_reservoir
    source_reservoir = protocol.load_labware("nest_1_reservoir_290ml", "C2")
    protocol.load_trash_bin("A3")
    return source_reservoir, tip_rack, p1000
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



def load_disposable_lids(
    protocol: ProtocolContext,
    num_of_lids: int,
    deck_slot: str,
    deck_riser: bool = False,
) -> Labware:
    """Load Stack of Disposable lids."""
    lid_str = "opentrons_tough_pcr_auto_sealing_lid"
    if deck_riser:
        deck_riser_adapter = protocol.load_adapter(
            "opentrons_flex_deck_riser", deck_slot
        )
        unused_lids = deck_riser_adapter.load_lid_stack(lid_str, num_of_lids)
    else:
        unused_lids = protocol.load_lid_stack(lid_str, deck_slot[0], num_of_lids)
    return unused_lids

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

def load_hs_adapter_and_labware(
    labware_str: str, heatershaker: HeaterShakerContext, labware_name: str
) -> Tuple[Labware, Labware]:
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


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    protocol.capture_image(filename="start_of_run")
    length = protocol.params.error_capture_duration  # type: ignore[attr-defined]
    heater_shaker_speed = protocol.params.heater_shaker_speed  # type: ignore[attr-defined]
    dot_bottom = protocol.params.dot_bottom  # type: ignore[attr-defined]
    disposable_lid = protocol.params.disposable_lid  # type: ignore[attr-defined]
    deck_riser = protocol.params.deck_riser  # type: ignore[attr-defined]
    trash_lid = protocol.params.trash_lid  # type: ignore[attr-defined]
    probe_liquid_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    global p200_tips
    global p50_tips

    protocol.comment("THIS IS A DRY RUN") if DRYRUN else protocol.comment(
        "THIS IS A REACTION RUN"
    )
    protocol.comment("USED TIPS WILL GO IN TRASH") if TIP_TRASH else protocol.comment(
        "USED TIPS WILL BE RE-RACKED"
    )

    # DECK SETUP AND LABWARE
    # ========== FIRST ROW ===========
    heatershaker: HeaterShakerContext = protocol.load_module(
        hs_str, "1"
    )  # type: ignore[assignment]
    sample_plate_2, hs_adapter = load_hs_adapter_and_labware(
        "nest_96_wellplate_2ml_deep", heatershaker, "Sample Plate 2"
    )
    reservoir = protocol.load_labware("nest_96_wellplate_2ml_deep", "2", "Liquid Waste")
    temp_block: TemperatureModuleContext = protocol.load_module(
        temp_str, "3"
    )  # type: ignore[assignment]
    reagent_plate, temp_adapter = load_temp_adapter_and_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", temp_block, "Reagent Plate"
    )
    # ========== SECOND ROW ==========
    MAG_PLATE_SLOT: MagneticBlockContext = protocol.load_module(
        mag_str, "C1"
    )  # type: ignore[assignment]
    tiprack_200_1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "5")
    tiprack_50_1 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "6")
    # Opentrons tough pcr auto sealing lids
    if disposable_lid:
        unused_lids = load_disposable_lids(protocol, 3, "C4", deck_riser)
    # ========== THIRD ROW ===========
    thermocycler: ThermocyclerContext = protocol.load_module(
        tc_str
    )  # type: ignore[assignment]
    sample_plate_1 = thermocycler.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt"
    )
    tiprack_200_2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "8")
    tiprack_50_2 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "9")
    # ========== FOURTH ROW ==========
    tiprack_200_3 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "11")
    trash_bin = protocol.load_trash_bin("A3")
    lid = protocol.load_lid_stack("opentrons_tough_universal_lid", "B4", 2)
    # reagent
    AMPure = reservoir["A1"]
    SMB = reservoir["A2"]

    EtOH = reservoir["A4"]
    RSB = reservoir["A5"]
    Liquid_trash_well_1 = reservoir["A9"]
    Liquid_trash_well_2 = reservoir["A10"]
    Liquid_trash_well_3 = reservoir["A11"]
    Liquid_trash_well_4 = reservoir["A12"]
    reservoir.load_empty(
        [
            Liquid_trash_well_1,
            Liquid_trash_well_2,
            Liquid_trash_well_3,
            Liquid_trash_well_4,
        ]
    )
    liquid_trash_list = {
        Liquid_trash_well_1: 0.0,
        Liquid_trash_well_2: 0.0,
        Liquid_trash_well_3: 0.0,
        Liquid_trash_well_4: 0.0,
    }

    def trash_liquid(
        protocol: ProtocolContext,
        pipette: InstrumentContext,
        vol_to_trash: float,
        liquid_trash_list: Dict[Well, float],
    ) -> None:
        """Determine which wells to use as liquid waste."""
        remaining_volume = vol_to_trash
        max_capacity = 1200.0  # Maximum capacity of a well in µL
        for well, current_volume in liquid_trash_list.items():
            if remaining_volume <= 0 or pipette.current_volume == 0.0:
                break
            available_capacity = max_capacity - current_volume
            if available_capacity >= 0:
                dispense_volume = min(
                    remaining_volume, available_capacity
                )  # Take the minimum of what's left and available space
                pipette.dispense(dispense_volume, well.top())
                protocol.delay(minutes=0.1)
                pipette.blow_out(well.top())
                pipette.touch_tip(well)

                # Update the tracking dictionary
                liquid_trash_list[well] += dispense_volume
                remaining_volume -= dispense_volume  # Reduce the remaining volume

    # Will Be distributed during the protocol
    EEW_1 = sample_plate_2.wells_by_name()["A9"]
    EEW_2 = sample_plate_2.wells_by_name()["A10"]
    EEW_3 = sample_plate_2.wells_by_name()["A11"]
    EEW_4 = sample_plate_2.wells_by_name()["A12"]

    NHB2 = reagent_plate.wells_by_name()["A1"]
    Panel = reagent_plate.wells_by_name()["A2"]
    EHB2 = reagent_plate.wells_by_name()["A3"]
    Elute = reagent_plate.wells_by_name()["A4"]
    ET2 = reagent_plate.wells_by_name()["A5"]
    PPC = reagent_plate.wells_by_name()["A6"]
    EPM = reagent_plate.wells_by_name()["A7"]

    # pipette
    p1000 = protocol.load_instrument(
        "flex_8channel_1000",
        "left",
        tip_racks=[tiprack_200_1, tiprack_200_2, tiprack_200_3],
    )
    p50 = protocol.load_instrument(
        "flex_8channel_50", "right", tip_racks=[tiprack_50_1, tiprack_50_2]
    )
    reagent_plate.columns()[3]
    # Load liquids and probe
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Reagents": [
            {"well": reagent_plate.columns()[3], "volume": 200.0},
            {"well": reagent_plate.columns()[4], "volume": 15.0},
            {"well": reagent_plate.columns()[5], "volume": 20.0},
            {"well": reagent_plate.columns()[6], "volume": 65.0},
        ],
        "AMPure": [{"well": reservoir.columns()[0], "volume": 120.0}],
        "SMB": [{"well": reservoir.columns()[1], "volume": 750.0}],
        "EtOH": [{"well": reservoir.columns()[3], "volume": 1000.0}],
        "RSB": [{"well": reservoir.columns()[4], "volume": 96.0}],
        "Wash": [
            {"well": sample_plate_2.columns()[8], "volume": 2000.0},
            {"well": sample_plate_2.columns()[9], "volume": 2000.0},
            {"well": sample_plate_2.columns()[10], "volume": 2000.0},
            {"well": sample_plate_2.columns()[11], "volume": 2000.0},
        ],
        "Samples": [{"well": sample_plate_1.wells(), "volume": 150.0}],
    }
    wells_col_1_to_7 = [well for col in sample_plate_2.columns()[:7] for well in col]
    sample_plate_2.load_empty(wells_col_1_to_7)

    protocol.move_lid(lid, reagent_plate, use_gripper=True)
    heatershaker.close_labware_latch()
    thermocycler.open_lid()
    if probe_liquid_height_bool:
        find_liquid_height_of_loaded_liquids(
            protocol, liquid_vols_and_wells, p50
        )
    else:
        load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)
    # tip and sample tracking
    if COLUMNS == 1:
        column_1_list = ["A1"]  # Plate 1
        column_2_list = ["A1"]  # Plate 2
        column_3_list = ["A4"]  # Plate 2
        column_4_list = ["A4"]  # Plate 1
        column_5_list = ["A7"]  # Plate 2
        column_6_list = ["A7"]  # Plate 1
        WASHES = [EEW_1]
    if COLUMNS == 2:
        column_1_list = ["A1", "A2"]  # Plate 1
        column_2_list = ["A1", "A2"]  # Plate 2
        column_3_list = ["A4", "A5"]  # Plate 2
        column_4_list = ["A4", "A5"]  # Plate 1
        column_5_list = ["A7", "A8"]  # Plate 2
        column_6_list = ["A7", "A8"]  # Plate 1
        WASHES = [EEW_1, EEW_2]
    if COLUMNS == 3:
        column_1_list = ["A1", "A2", "A3"]  # Plate 1
        column_2_list = ["A1", "A2", "A3"]  # Plate 2
        column_3_list = ["A4", "A5", "A6"]  # Plate 2
        column_4_list = ["A4", "A5", "A6"]  # Plate 1
        column_5_list = ["A7", "A8", "A9"]  # Plate 2
        column_6_list = ["A7", "A8", "A9"]  # Plate 1
        WASHES = [EEW_1, EEW_2, EEW_3]
    if COLUMNS == 4:
        column_1_list = ["A1", "A2", "A3", "A4"]  # Plate 1
        column_2_list = ["A1", "A2", "A3", "A4"]  # Plate 2
        column_3_list = ["A5", "A6", "A7", "A8"]  # Plate 2
        column_4_list = ["A5", "A6", "A7", "A8"]  # Plate 1
        column_5_list = ["A9", "A10", "A11", "A12"]  # Plate 2
        column_6_list = ["A9", "A10", "A11", "A12"]  # Plate 1
        WASHES = [EEW_1, EEW_2, EEW_3, EEW_4]

    def tipcheck() -> None:
        """Tip tracking function."""
        if p200_tips >= 3 * 12:
            p1000.reset_tipracks()
            p200_tips == 0
        if p50_tips >= 2 * 12:
            p50.reset_tipracks()
            p50_tips == 0

    # commands
    for loop in range(RUN):
        thermocycler.open_lid()
        heatershaker.open_labware_latch()
        if DRYRUN is False:
            if STEP_HYB == 1:
                protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
                tc_block_task = thermocycler.start_set_block_temperature(4)
                tc_lid_task = thermocycler.start_set_lid_temperature(100)
                temp_block_task = temp_block.start_set_temperature(4)
                protocol.wait_for_tasks(
                    [tc_block_task, tc_lid_task, temp_block_task]
                )
            else:
                protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
                tc_block_task = thermocycler.start_set_block_temperature(58)
                tc_lid_task = thermocycler.start_set_lid_temperature(58)
                hs_task = heatershaker.set_target_temperature(58)
                protocol.wait_for_tasks([tc_block_task, tc_lid_task, hs_task])
        heatershaker.close_labware_latch()

        # Sample Plate contains 30ul  of DNA

        if STEP_VOLPOOL == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Quick Vol Pool")
            protocol.comment("==============================================")

        if STEP_HYB == 1:
            protocol.comment("==============================================")
            protocol.comment("--> HYB")
            protocol.comment("==============================================")

            protocol.comment("--> Adding NHB2")
            NHB2Vol = 50
            for loop, X in enumerate(column_1_list):
                p50.pick_up_tip()
                p50.aspirate(
                    NHB2Vol, NHB2.meniscus(z=meniscus_z, target="end")
                )  # original = ()
                p50.dispense(
                    NHB2Vol, sample_plate_1[X].meniscus(z=meniscus_z, target="end")
                )  # original = ()
                p50.touch_tip(sample_plate_1[X])
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("--> Adding Panel")
            PanelVol = 10
            for loop, X in enumerate(column_1_list):
                p50.pick_up_tip()
                p50.aspirate(
                    PanelVol, Panel.meniscus(z=meniscus_z, target="end")
                )  # original = ()
                p50.dispense(
                    PanelVol, sample_plate_1[X].meniscus(z=meniscus_z, target="end")
                )
                p50.touch_tip(sample_plate_1[X])
                # original = ()
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("--> Adding EHB2")
            EHB2Vol = 10
            EHB2MixRep = 10 if DRYRUN is False else 1
            EHB2MixVol = 90
            for loop, X in enumerate(column_1_list):
                p1000.pick_up_tip()
                p1000.aspirate(
                    EHB2Vol, EHB2.meniscus(z=meniscus_z, target="end")
                )  # original = ()
                p1000.dispense(
                    EHB2Vol, sample_plate_1[X].meniscus(z=meniscus_z, target="end")
                )  # original = ()
                p1000.touch_tip(sample_plate_1[X])
                p1000.move_to(
                    sample_plate_1[X].meniscus(z=meniscus_z, target="end")
                )  # original = ()
                p1000.mix(EHB2MixRep, EHB2MixVol)
                # checked
                p1000.touch_tip(sample_plate_1[X])
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p50_tips += 1
                tipcheck()

            if HYBRIDDECK:
                protocol.comment("Hybridize on Deck")
                if disposable_lid:
                    use_disposable_lid_with_tc(
                        protocol, unused_lids, sample_plate_1, thermocycler
                    )
                else:
                    thermocycler.close_lid()
                if DRYRUN is False:
                    profile_TAGSTOP: List[ThermocyclerStep] = [
                        {"temperature": 98, "hold_time_minutes": 5},
                        {"temperature": 97, "hold_time_minutes": 1},
                        {"temperature": 95, "hold_time_minutes": 1},
                        {"temperature": 93, "hold_time_minutes": 1},
                        {"temperature": 91, "hold_time_minutes": 1},
                        {"temperature": 89, "hold_time_minutes": 1},
                        {"temperature": 87, "hold_time_minutes": 1},
                        {"temperature": 85, "hold_time_minutes": 1},
                        {"temperature": 83, "hold_time_minutes": 1},
                        {"temperature": 81, "hold_time_minutes": 1},
                        {"temperature": 79, "hold_time_minutes": 1},
                        {"temperature": 77, "hold_time_minutes": 1},
                        {"temperature": 75, "hold_time_minutes": 1},
                        {"temperature": 73, "hold_time_minutes": 1},
                        {"temperature": 71, "hold_time_minutes": 1},
                        {"temperature": 69, "hold_time_minutes": 1},
                        {"temperature": 67, "hold_time_minutes": 1},
                        {"temperature": 65, "hold_time_minutes": 1},
                        {"temperature": 63, "hold_time_minutes": 1},
                        {"temperature": 62, "hold_time_minutes": HYBRIDTIME * 60},
                    ]
                    thermocycler.execute_profile(
                        steps=profile_TAGSTOP, repetitions=1, block_max_volume=100
                    )
                    thermocycler.set_block_temperature(62)
                    if HYBRID_PAUSE:
                        protocol.comment("HYBRIDIZATION PAUSED")
                    thermocycler.set_block_temperature(10)
                thermocycler.open_lid()
                if disposable_lid:
                    if trash_lid:
                        protocol.move_lid(
                            sample_plate_1, trash_bin, use_gripper=True
                        )
                    else:
                        protocol.move_lid(
                            sample_plate_1, deck_riser, use_gripper=True
                        )
            else:
                protocol.comment("Hybridize off Deck")

        if STEP_CAPTURE == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Capture")
            protocol.comment("==============================================")
            # Standard Setup

            if DRYRUN is False:
                protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
                tc_block_task = thermocycler.start_set_block_temperature(58)
                tc_lid_task = thermocycler.start_set_lid_temperature(58)
                hs_task = heatershaker.set_target_temperature(58)
                protocol.wait_for_tasks([tc_block_task, tc_lid_task, hs_task])

            protocol.comment("--> Transfer Hybridization")
            TransferSup = 100
            for loop, X in enumerate(column_1_list):
                p1000.pick_up_tip()
                p1000.aspirate(
                    TransferSup + 1,
                    sample_plate_1[X].meniscus(z=meniscus_z, target="end"),
                    rate=0.25,
                )
                p1000.dispense(
                    TransferSup + 1,
                    sample_plate_2[column_2_list[loop]].meniscus(
                        z=meniscus_z, target="end"
                    ),
                )
                p1000.touch_tip(sample_plate_2[column_2_list[loop]])
                # checked
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()
            if disposable_lid:
                use_disposable_lid_with_tc(
                    protocol,
                    unused_lids,
                    sample_plate_1,
                    thermocycler,
                )
            else:
                thermocycler.close_lid()

            protocol.comment("--> ADDING SMB")
            SMBVol = 180
            SMBVolTotal = 0.0
            SMBMixRPM = heater_shaker_speed
            SMBMixRep = 5.0 if DRYRUN is False else 0.1  # minutes
            SMBPremix = 3 if DRYRUN is False else 1
            # ==============================
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.mix(SMBPremix, 200, SMB.bottom(z=1))
                p1000.aspirate(
                    SMBVol / 2, SMB.meniscus(z=meniscus_z, target="end"), rate=0.25
                )
                SMBVolTotal += SMBVol / 2
                p1000.dispense(SMBVol / 2, sample_plate_2[X].top(z=-7), rate=0.25)
                p1000.aspirate(
                    SMBVol / 2, SMB.meniscus(z=1, target="end"), rate=0.25
                )
                SMBVolTotal += SMBVol / 2
                p1000.dispense(
                    SMBVol / 2,
                    sample_plate_2[X].meniscus(z=1, target="end"),
                    rate=0.25,
                )
                p1000.default_speed = 5
                p1000.move_to(sample_plate_2[X].bottom(z=5))
                for Mix in range(2):
                    p1000.aspirate(100, rate=0.5)
                    p1000.move_to(sample_plate_2[X].bottom(z=1))
                    p1000.aspirate(80, rate=0.5)
                    p1000.dispense(80, rate=0.5)
                    p1000.move_to(sample_plate_2[X].bottom(z=5))
                    p1000.dispense(100, rate=0.5)
                    Mix += 1
                p1000.blow_out(sample_plate_2[X].top(z=-7))
                p1000.default_speed = 400
                p1000.move_to(sample_plate_2[X].top(z=5))
                p1000.move_to(sample_plate_2[X].top(z=0))
                p1000.move_to(sample_plate_2[X].top(z=5))
                p1000.touch_tip(sample_plate_2[X])
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()
            # ==============================
            set_hs_speed(
                protocol, heatershaker, SMBMixRPM, SMBMixRep, True
            )

            # GRIPPER MOVE sample_plate_2 FROM heatershaker TO MAGPLATE
            move_labware_from_hs_to_destination(
                protocol, sample_plate_2, heatershaker, MAG_PLATE_SLOT
            )

            thermocycler.open_lid()
            if disposable_lid:
                if trash_lid:
                    protocol.move_lid(sample_plate_1, trash_bin, use_gripper=True)
                else:
                    protocol.move_lid(sample_plate_1, "B4", use_gripper=True)

            if DRYRUN is False:
                protocol.delay(minutes=2)

            protocol.comment("==============================================")
            protocol.comment("--> WASH")
            protocol.comment("==============================================")
            # Setting Labware to Resume at Cleanup 1

            protocol.comment("--> Remove SUPERNATANT")
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(4))
                p1000.aspirate(200, rate=0.25)
                trash_liquid(protocol, p1000, 200.0, liquid_trash_list)
                p1000.move_to(sample_plate_2[X].bottom(0.5))
                p1000.aspirate(200, rate=0.25)
                trash_liquid(protocol, p1000, 200.0, liquid_trash_list)
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            # GRIPPER MOVE sample_plate_2 FROM MAGPLATE TO heatershaker
            move_labware_to_hs(
                protocol, sample_plate_2, heatershaker, hs_adapter
            )

            protocol.comment("--> Repeating 6 washes")
            washreps = 6
            washcount = 0
            for wash in range(washreps):
                protocol.comment("--> Adding EEW")
                EEWVol = 200
                for loop, X in enumerate(column_2_list):
                    p1000.pick_up_tip()
                    p1000.aspirate(
                        EEWVol, WASHES[loop].meniscus(z=meniscus_z, target="end")
                    )  # original = ()
                    p1000.dispense(
                        EEWVol, sample_plate_2[X].bottom(z=dot_bottom)
                    )  # original = ()
                    p1000.touch_tip(sample_plate_2[X])
                    p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                    p200_tips += 1
                    tipcheck()
                set_hs_speed(
                    protocol,
                    heatershaker,
                    int(heater_shaker_speed * 0.9),
                    4.0,
                    True,
                )
                heatershaker.open_labware_latch()

                if DRYRUN is False:
                    protocol.delay(seconds=5 * 60)

                # GRIPPER MOVE sample_plate_2 FROM heatershaker TO MAGPLATE
                move_labware_from_hs_to_destination(
                    protocol, sample_plate_2, heatershaker, MAG_PLATE_SLOT
                )

                if DRYRUN is False:
                    protocol.delay(seconds=1 * 60)

                protocol.comment("--> Removing Supernatant")
                RemoveSup = 200
                for loop, X in enumerate(column_2_list):
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_2[X].bottom(z=3.5))
                    p1000.aspirate(RemoveSup - 100, rate=0.25)
                    protocol.delay(minutes=0.1)
                    p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                    p1000.aspirate(100, rate=0.25)
                    trash_liquid(
                        protocol,
                        p1000,
                        float(p1000.current_volume),
                        liquid_trash_list,
                    )
                    p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                    p200_tips += 1
                    tipcheck()

                # ============================================================================================
                # GRIPPER MOVE sample_plate_2 FROM MAGPLATE TO heatershaker
                move_labware_to_hs(
                    protocol, sample_plate_2, heatershaker, hs_adapter
                )
                washcount += 1

            protocol.comment("--> Adding EEW")
            EEWVol = 200
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.aspirate(
                    EEWVol, WASHES[loop].meniscus(z=meniscus_z, target="end")
                )  # original = ()
                p1000.dispense(
                    EEWVol, sample_plate_2[X].bottom(z=dot_bottom)
                )  # original = ()
                p1000.touch_tip(sample_plate_2[X])
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            set_hs_speed(
                protocol, heatershaker, int(heater_shaker_speed * 0.9), 4.0, True
            )

            if DRYRUN is False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Transfer Hybridization")
            TransferSup = 200
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                p1000.aspirate(TransferSup, rate=0.25)
                p1000.dispense(
                    TransferSup, sample_plate_2[column_3_list[loop]].bottom(z=1)
                )
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            if DRYRUN is False:
                protocol.delay(seconds=5 * 60)

            # GRIPPER MOVE sample_plate_2 FROM heatershaker TO MAGPLATE
            move_labware_from_hs_to_destination(
                protocol, sample_plate_2, heatershaker, MAG_PLATE_SLOT
            )
            if DRYRUN is False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            for loop, X in enumerate(column_3_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.move_to(sample_plate_2[X].top(z=0.5))
                trash_liquid(
                    protocol, p1000, float(p1000.current_volume), liquid_trash_list
                )
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            protocol.comment("--> Removing Residual")
            for loop, X in enumerate(column_3_list):
                p50.pick_up_tip()
                p50.move_to(
                    sample_plate_2[X].bottom(z=dot_bottom)
                )  # original = z=0
                p50.aspirate(50, rate=0.25)
                p50.default_speed = 200
                trash_liquid(
                    protocol, p50, float(p50.current_volume), liquid_trash_list
                )
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("==============================================")
            protocol.comment("--> ELUTE")
            protocol.comment("==============================================")

            protocol.comment("--> Adding Elute")
            EluteVol = 23
            protocol.move_lid(reagent_plate, lid, use_gripper=True)
            for loop, X in enumerate(column_3_list):
                p50.pick_up_tip()
                p50.aspirate(
                    EluteVol, Elute.meniscus(z=meniscus_z, target="end")
                )  # original = ()
                p50.dispense(
                    EluteVol, sample_plate_2[X].bottom(z=dot_bottom)
                )  # original = ()
                p50.touch_tip(sample_plate_2[X])
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()
            protocol.move_lid(lid, reagent_plate, use_gripper=True)
            # ============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM MAGPLATE TO heatershaker
            move_labware_to_hs(
                protocol, sample_plate_2, heatershaker, hs_adapter
            )
            # ============================================================================================
            set_hs_speed(
                protocol, heatershaker, int(heater_shaker_speed * 0.9), 2.0, True
            )
            heatershaker.open_labware_latch()

            if DRYRUN is False:
                protocol.delay(minutes=2)

            # ============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM heatershaker TO MAGPLATE
            move_labware_from_hs_to_destination(
                protocol, sample_plate_2, heatershaker, MAG_PLATE_SLOT
            )
            protocol.comment("--> Transfer Elution")
            TransferSup = 21
            for loop, X in enumerate(column_3_list):
                p50.pick_up_tip()
                p50.move_to(sample_plate_2[X].bottom(z=0.5))
                p50.aspirate(TransferSup + 1, rate=0.25)
                p50.dispense(
                    TransferSup + 1, sample_plate_1[column_4_list[loop]].bottom(z=1)
                )
                p50.touch_tip(sample_plate_1[column_4_list[loop]])
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("--> Adding ET2")
            ET2Vol = 4
            ET2MixRep = 10 if DRYRUN is False else 1
            ET2MixVol = 20
            protocol.move_lid(reagent_plate, lid, use_gripper=True)
            for loop, X in enumerate(column_4_list):
                p50.pick_up_tip()
                p50.aspirate(ET2Vol, ET2.bottom(z=dot_bottom))  # original = ()
                p50.dispense(
                    ET2Vol, sample_plate_1[X].bottom(z=dot_bottom)
                )  # original = ()
                p50.touch_tip(sample_plate_1[X])
                p50.move_to(sample_plate_1[X].bottom(z=dot_bottom))  # original = ()
                p50.mix(ET2MixRep, ET2MixVol)
                p50.touch_tip(sample_plate_1[X])
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()
        if STEP_PCR == 1:
            protocol.comment("==============================================")
            protocol.comment("--> AMPLIFICATION")
            protocol.comment("==============================================")

            protocol.comment("--> Adding PPC")
            PPCVol = 5
            for loop, X in enumerate(column_4_list):
                p50.pick_up_tip()
                p50.aspirate(PPCVol, PPC.bottom(z=dot_bottom))  # original = ()
                p50.dispense(
                    PPCVol, sample_plate_1[X].bottom(z=dot_bottom)
                )  # original = ()
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()
            protocol.comment("--> Adding EPM")
            EPMVol = 20
            EPMMixRep = 10 if DRYRUN is False else 1
            EPMMixVol = 45
            for loop, X in enumerate(column_4_list):
                p50.pick_up_tip()
                p50.aspirate(EPMVol, EPM.bottom(z=dot_bottom))  # original = ()
                p50.dispense(
                    EPMVol, sample_plate_1[X].bottom(z=dot_bottom)
                )  # original = ()
                p50.touch_tip(sample_plate_1[X])
                p50.move_to(sample_plate_1[X].bottom(z=dot_bottom))  # original = ()
                p50.mix(EPMMixRep, EPMMixVol)
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()
        protocol.move_lid(lid, reagent_plate, use_gripper=True)
        if DRYRUN is False:
            heatershaker.deactivate_heater()

        if STEP_PCRDECK == 1:
            if DRYRUN is False:
                if DRYRUN is False:
                    if disposable_lid:
                        use_disposable_lid_with_tc(
                            protocol,
                            unused_lids,
                            sample_plate_1,
                            thermocycler,
                        )
                    else:
                        thermocycler.close_lid()
                    profile_PCR_1: List[ThermocyclerStep] = [
                        {"temperature": 98, "hold_time_seconds": 45}
                    ]
                    thermocycler.execute_profile(
                        steps=profile_PCR_1, repetitions=1, block_max_volume=50
                    )
                    profile_PCR_2: List[ThermocyclerStep] = [
                        {"temperature": 98, "hold_time_seconds": 30},
                        {"temperature": 60, "hold_time_seconds": 30},
                        {"temperature": 72, "hold_time_seconds": 30},
                    ]
                    thermocycler.execute_profile(
                        steps=profile_PCR_2, repetitions=12, block_max_volume=50
                    )
                    profile_PCR_3: List[ThermocyclerStep] = [
                        {"temperature": 72, "hold_time_minutes": 1}
                    ]
                    thermocycler.execute_profile(
                        steps=profile_PCR_3, repetitions=1, block_max_volume=50
                    )
                    thermocycler.set_block_temperature(10)

                thermocycler.open_lid()
                if disposable_lid:
                    if trash_lid:
                        protocol.move_lid(
                            sample_plate_1, trash_bin, use_gripper=True
                        )
                    else:
                        protocol.move_lid(sample_plate_1, "B4", use_gripper=True)

        if STEP_CLEANUP == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Cleanup")
            protocol.comment("==============================================")

            # GRIPPER MOVE sample_plate_2 FROM MAGPLATE TO heatershaker
            move_labware_to_hs(
                protocol, sample_plate_2, heatershaker, hs_adapter
            )

            protocol.comment("--> Transfer Elution")
            TransferSup = 45
            for loop, X in enumerate(column_4_list):
                p50.pick_up_tip()
                p50.move_to(sample_plate_1[X].bottom(z=0.5))
                p50.aspirate(TransferSup + 1, rate=0.25)
                p50.dispense(
                    TransferSup + 1, sample_plate_2[column_5_list[loop]].bottom(z=1)
                )
                p50.touch_tip(sample_plate_2[column_5_list[loop]])
                p50.return_tip() if TIP_TRASH is False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("--> ADDING AMPure (0.8x)")
            AMPureVol = 40.5
            AMPureMixRep = 5.0 if DRYRUN is False else 0.1
            AMPurePremix = 3 if DRYRUN is False else 1
            # ========NEW SINGLE TIP DISPENSE===========
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.mix(AMPurePremix, AMPureVol + 10, AMPure.bottom(z=1))
                p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
                p1000.dispense(AMPureVol, sample_plate_2[X].bottom(z=1), rate=0.25)
                p1000.touch_tip(sample_plate_2[X])
                p1000.default_speed = 5
                p1000.move_to(sample_plate_2[X].bottom(z=5))
                for Mix in range(2):
                    p1000.aspirate(60, rate=0.5)
                    p1000.move_to(sample_plate_2[X].bottom(z=1))
                    p1000.aspirate(60, rate=0.5)
                    p1000.dispense(60, rate=0.5)
                    p1000.move_to(sample_plate_2[X].bottom(z=5))
                    p1000.dispense(30, rate=0.5)
                    Mix += 1
                p1000.blow_out(sample_plate_2[X].top(z=2))
                p1000.default_speed = 400
                p1000.move_to(sample_plate_2[X].top(z=5))
                p1000.move_to(sample_plate_2[X].top(z=0))
                p1000.move_to(sample_plate_2[X].top(z=5))
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()
            # ========NEW HS MIX=========================
            set_hs_speed(
                protocol,
                heatershaker,
                int(heater_shaker_speed * 0.9),
                AMPureMixRep,
                True,
            )

            # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
            move_labware_from_hs_to_destination(
                protocol, sample_plate_2, heatershaker, MAG_PLATE_SLOT
            )

            if DRYRUN is False:
                protocol.delay(minutes=4)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_2[X].top(z=2))
                p1000.default_speed = 200
                trash_liquid(
                    protocol, p1000, float(p1000.current_volume), liquid_trash_list
                )
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            for X_times in range(2):
                protocol.comment("--> ETOH Wash")
                ETOHMaxVol = 100
                for loop, X in enumerate(column_5_list):
                    p1000.pick_up_tip()
                    p1000.aspirate(
                        ETOHMaxVol, EtOH.meniscus(z=meniscus_z, target="end")
                    )
                    p1000.move_to(EtOH.top(z=0))
                    p1000.move_to(EtOH.top(z=-5))
                    p1000.move_to(EtOH.top(z=0))
                    p1000.dispense(ETOHMaxVol, sample_plate_2[X].top(z=-2), rate=1)
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.move_to(sample_plate_2[X].top(z=5))
                    p1000.move_to(sample_plate_2[X].top(z=0))
                    p1000.move_to(sample_plate_2[X].top(z=5))
                    p1000.touch_tip(sample_plate_2[X])
                    p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                    p200_tips += 1
                    tipcheck()

                if DRYRUN is False:
                    protocol.delay(minutes=0.5)

                protocol.comment("--> Remove ETOH Wash")
                for loop, X in enumerate(column_5_list):
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_2[X].bottom(z=3.5))
                    p1000.aspirate(RemoveSup - 100, rate=0.25)
                    protocol.delay(minutes=0.1)
                    p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(sample_plate_2[X].top(z=2))
                    p1000.default_speed = 200
                    trash_liquid(
                        protocol,
                        p1000,
                        float(p1000.current_volume),
                        liquid_trash_list,
                    )
                    p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                    p200_tips += 1
                    tipcheck()

            if DRYRUN is False:
                protocol.delay(minutes=2)

            protocol.comment("--> Removing Residual ETOH")
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.move_to(
                    sample_plate_2[X].bottom(z=dot_bottom)
                )  # original = (z=0)
                p1000.aspirate(50, rate=0.25)
                p1000.default_speed = 200
                trash_liquid(
                    protocol, p1000, float(p1000.current_volume), liquid_trash_list
                )
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            if DRYRUN is False:
                protocol.delay(minutes=1)

            # GRIPPER MOVE PLATE FROM MAG PLATE TO HEATER SHAKER
            move_labware_to_hs(
                protocol, sample_plate_2, heatershaker, hs_adapter
            )

            protocol.comment("--> Adding RSB")
            RSBVol = 32
            RSBMixRep = 1.0 if DRYRUN is False else 0.1  # minutes
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.aspirate(RSBVol, RSB.bottom(z=1))
                p1000.dispense(
                    RSBVol, sample_plate_2.wells_by_name()[X].center(), rate=1
                )
                p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=1))
                p1000.aspirate(RSBVol, rate=1)
                p1000.dispense(
                    RSBVol, sample_plate_2.wells_by_name()[X].center(), rate=1
                )
                p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=1))
                p1000.aspirate(RSBVol, rate=1)
                p1000.dispense(
                    RSBVol, sample_plate_2.wells_by_name()[X].center(), rate=1
                )
                p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=1))
                p1000.aspirate(RSBVol, rate=1)
                p1000.dispense(
                    RSBVol, sample_plate_2.wells_by_name()[X].center(), rate=1
                )
                p1000.aspirate(
                    RSBVol, sample_plate_2.wells_by_name()[X].bottom(z=1), rate=1
                )
                p1000.dispense(
                    RSBVol, sample_plate_2.wells_by_name()[X].bottom(z=1), rate=1
                )

                p1000.blow_out(sample_plate_2.wells_by_name()[X].center())
                p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=5))
                p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=0))
                p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=5))
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()
                if DRYRUN is False:
                    set_hs_speed(
                        protocol,
                        heatershaker,
                        int(heater_shaker_speed * 0.8),
                        RSBMixRep,
                        True,
                    )

            # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
            move_labware_from_hs_to_destination(
                protocol, sample_plate_2, heatershaker, MAG_PLATE_SLOT
            )

            if DRYRUN is False:
                protocol.delay(minutes=3)

            protocol.comment("--> Transferring Supernatant")
            TransferSup = 30
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.aspirate(
                    TransferSup + 1,
                    sample_plate_2[X].meniscus(z=meniscus_z, target="end"),
                    rate=0.25,
                )
                p1000.dispense(
                    TransferSup + 1,
                    sample_plate_1[column_6_list[loop]].meniscus(
                        z=meniscus_z, target="end"
                    ),
                )
                p1000.touch_tip(sample_plate_1[column_6_list[loop]])
                p1000.return_tip() if TIP_TRASH is False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()
    liquids_to_probe_at_end = [
        Liquid_trash_well_1,
        Liquid_trash_well_2,
    ]
    protocol.move_lid(reagent_plate, lid, use_gripper=True)
    if probe_liquid_height_bool:
        find_liquid_height_of_all_wells(
            protocol, p50, liquids_to_probe_at_end
        )
    if deactivate_modules_bool:
        deactivate_modules(protocol)

    protocol.capture_image(filename="end_of_run")
    
   
