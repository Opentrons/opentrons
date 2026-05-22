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
from abr_testing.data_collection.read_robot_logs import get_logs
import configparser
from pathlib import Path
import json
from abr_testing.automation import slack
from typing import List, Union, Dict, Tuple
from opentrons.hardware_control.modules.types import ThermocyclerStep
from datetime import datetime
import subprocess
import requests
import os

# FUNCTIONS FOR LOADING COMMON CONFIGURATIONS


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


# FUNCTIONS FOR COMMON COMMENTS


def comment_protocol_version(protocol: ProtocolContext, version: str) -> None:
    """Comment version number of protocol."""
    protocol.comment(f"Protocol Version: {version}")


# FUNCTIONS FOR LOADING COMMON PARAMETERS
def create_channel_parameter(parameters: ParameterContext) -> None:
    """Create pipette channel parameter."""
    parameters.add_str(
        variable_name="channels",
        display_name="Number of Pipette Channels",
        choices=[
            {"display_name": "1 Channel", "value": "1channel"},
            {"display_name": "8 Channel", "value": "8channel"},
        ],
        default="8channel",
    )


def create_meniscus_z_parameter(parameters: ParameterContext) -> None:
    """Create meniscus z parameter."""
    # NOTE: meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
        description="Z offset for meniscus height. Default is -1.5mm.",
    )


def create_error_capture_duration_duration(parameters: ParameterContext) -> None:
    """Create error capture duration parameter."""
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )


def create_pipette_parameters(parameters: ParameterContext) -> None:
    """Create parameter for pipettes."""
    # NOTE: Place function inside def add_parameters(parameters) in protocol.
    # NOTE: Copy ctx.params.left_mount, ctx.params.right_mount # type: ignore[attr-defined]
    # to get result
    # Left Mount
    parameters.add_str(
        variable_name="left_mount",
        display_name="Left Mount",
        description="Pipette Type on Left Mount.",
        choices=[
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "96ch 1000ul", "value": "flex_96channel_1000"},
            {"display_name": "None", "value": "none"},
        ],
        default="flex_8channel_1000",
    )
    # Right Mount
    parameters.add_str(
        variable_name="right_mount",
        display_name="Right Mount",
        description="Pipette Type on Right Mount.",
        choices=[
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "None", "value": "none"},
        ],
        default="none",
    )


def create_single_pipette_mount_parameter(parameters: ParameterContext) -> None:
    """Create parameter to specify pipette mount."""
    parameters.add_str(
        variable_name="pipette_mount",
        display_name="Pipette Mount",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="left",
    )


def create_two_pipette_mount_parameters(parameters: ParameterContext) -> None:
    """Create mount parameters for 2 pipettes."""
    parameters.add_str(
        variable_name="pipette_mount_1",
        display_name="Pipette Mount 1",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="left",
    )
    parameters.add_str(
        variable_name="pipette_mount_2",
        display_name="Pipette Mount 2",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="right",
    )


def create_dry_run_parameter(parameters: ParameterContext) -> None:
    """Create dry run parameter."""
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description="If Dry Run is True, skip incubation.",
        default=False,
    )


def create_csv_parameter(parameters: ParameterContext) -> None:
    """Create parameter for sample volume csvs."""
    parameters.add_csv_file(
        variable_name="parameters_csv",
        display_name="Sample CSV",
        description="CSV File for Protocol.",
    )


def create_probe_liquid_height_parameter(parameters: ParameterContext) -> None:
    """Create parameter for probe liquid height."""
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )


def create_disposable_lid_parameter(parameters: ParameterContext) -> None:
    """Create parameter to use/not use disposable lid."""
    parameters.add_bool(
        variable_name="disposable_lid",
        display_name="Disposable Lid",
        description="True means use lid.",
        default=True,
    )


def create_disposable_lid_trash_location(parameters: ParameterContext) -> None:
    """Create a parameter for lid placement after use."""
    parameters.add_bool(
        variable_name="trash_lid",
        display_name="Trash Disposable Lid",
        description="True means trash lid, false means keep on deck.",
        default=True,
    )


def create_tc_lid_deck_riser_parameter(parameters: ParameterContext) -> None:
    """Create parameter for tc lid deck riser."""
    parameters.add_bool(
        variable_name="deck_riser",
        display_name="Deck Riser",
        description="True means use deck riser.",
        default=True,
    )


def create_tip_size_parameter(parameters: ParameterContext) -> None:
    """Create parameter for tip size."""
    parameters.add_str(
        variable_name="tip_size",
        display_name="Tip Size",
        description="Set Tip Size",
        choices=[
            {"display_name": "50 uL", "value": "opentrons_flex_96_tiprack_50ul"},
            {"display_name": "200 µL", "value": "opentrons_flex_96_tiprack_200ul"},
            {"display_name": "1000 µL", "value": "opentrons_flex_96_tiprack_1000ul"},
        ],
        default="opentrons_flex_96_tiprack_50ul",
    )


def create_all_deck_slot_parameters(parameters: ParameterContext) -> None:
    """Create parameters for all deck slots."""
    deck_slots = [f"{letter}{number}" for letter in "ABCD" for number in range(1, 4)]
    for deck_slot in deck_slots:
        parameters.add_bool(
            variable_name=deck_slot, display_name=f"Slot {deck_slot}", default=True
        )
    # WHAT TO COPY PASTE IN PROTOCOL
    # slot_a1 = protocol.params.A1 # type: ignore[attr-defined]
    # slot_a2 = protocol.params.A2 # type: ignore[attr-defined]
    # slot_a3 = protocol.params.A3 # type: ignore[attr-defined]
    # slot_b1 = protocol.params.B1 # type: ignore[attr-defined]
    # slot_b2 = protocol.params.B2 # type: ignore[attr-defined]
    # slot_b3 = protocol.params.B3 # type: ignore[attr-defined]
    # slot_c1 = protocol.params.C1 # type: ignore[attr-defined]
    # slot_c2 = protocol.params.C2 # type: ignore[attr-defined]
    # slot_c3 = protocol.params.C3 # type: ignore[attr-defined]
    # slot_d1 = protocol.params.D1 # type: ignore[attr-defined]
    # slot_d2 = protocol.params.D2 # type: ignore[attr-defined]
    # slot_d3 = protocol.params.D3 # type: ignore[attr-defined]


def create_dot_bottom_parameter(parameters: ParameterContext) -> None:
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


def create_hs_speed_parameter(parameters: ParameterContext) -> None:
    """Create parameter for max heatershaker speed."""
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
    )


def create_plate_reader_compatible_labware_parameter(
    parameters: ParameterContext,
) -> None:
    """Create parameter for flat bottom plates compatible with plate reader."""
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


def create_tc_compatible_labware_parameter(parameters: ParameterContext) -> None:
    """Create parameter for labware type compatible with thermocycler."""
    parameters.add_str(
        variable_name="labware_tc_compatible",
        display_name="Labware Type for Thermocycler",
        description="labware compatible with thermocycler.",
        default="biorad_96_wellplate_200ul_pcr",
        choices=[
            {
                "display_name": "Armadillo_200ul",
                "value": "armadillo_96_wellplate_200ul_pcr_full_skirt",
            },
            {"display_name": "Bio-Rad_200ul", "value": "biorad_96_wellplate_200ul_pcr"},
            {
                "display_name": "NEST_100ul",
                "value": "nest_96_wellplate_100ul_pcr_full_skirt",
            },
            {
                "display_name": "Opentrons_200ul",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
        ],
    )


def create_deactivate_modules_parameter(parameters: ParameterContext) -> None:
    """Create parameter for deactivating modules at the end fof run."""
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
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


def set_up_slack() -> slack.Slack:
    """Set up slack channel connection."""
    configs_file = "/var/lib/jupyter/notebooks/config.ini"
    configs_file_path = Path(configs_file)
    try:
        configurations = configparser.ConfigParser()
        configurations.read(configs_file_path)
    except configparser.ParsingError as e:
        print(f"Cannot read configuration file\n {e}")
    discovery_file = "/data/ODD/discovery.json"
    try:
        with open(discovery_file, "r") as file:
            discovery_data = json.load(file)
    except FileNotFoundError:
        print(f"ERROR: file not found at {discovery_file}")
        discovery_data = {}
    except json.JSONDecodeError:
        print(f"ERROR: Invalid json format in {discovery_file}")
        discovery_data = {}
    try:
        robot_name = discovery_data["robots"][0]["name"]
    except KeyError:
        print("Can't simulate slack, run on robot")
        robot_name = "test"
    return slack.Slack(
        configuration=configurations,
        channel_name="abr-robot-alerts",
        user_name=robot_name,
    )


def get_current_run_id() -> str:
    """Get current run id."""
    result = subprocess.run(
        "ip route get 1.1.1.1 | awk '{print $7}'",
        shell=True,
        capture_output=True,
        text=True,
    )
    ip = result.stdout.strip()
    try:
        response = requests.get(
            f"http://{ip}:31950/runs", headers={"opentrons-version": "3"}
        )
        run_data = response.json()
        run_list = run_data.get("data", "")
        for run in run_list:
            run_id = run["id"]
            if run["current"]:
                return run_id
        else:
            return ""
    except requests.exceptions.RequestException:
        print(f"Could not connect to robot with IP {ip}")
        return ""


def get_last_image_capture() -> str:
    """Get final photo of run."""
    run_id = get_current_run_id()
    image_storage = f"/data/images/{run_id}"
    all_images = os.listdir(image_storage)
    image_path = os.path.join(image_storage, all_images[-1])
    return image_path


def convert_m3u8_to_mp4(m3u8_pth: str, mp4_pth: str, dur: int = 30) -> None:
    """Convert m3u8 video to mp4 format."""
    subprocess.run(
        f'ffmpeg -i "{m3u8_pth}" -t {dur} -c:v mpeg4 -c:a aac -movflags +faststart "{mp4_pth}" -y',
        shell=True,
        check=True,
    )


def get_livestream_video(length: int) -> str:
    """Get latest livestream video."""
    video_path = "/var/www/localhost/html/stream/hls/stream.m3u8"
    new_video_path = "/data/testing_data/livestream_video.mp4"
    convert_m3u8_to_mp4(video_path, new_video_path, length)
    return new_video_path


def create_robot_log_zip() -> Tuple[str, str]:
    """Create a zip file of logs saved locally on robot."""
    storage_directory = Path("/data/testing_data")
    result = subprocess.run(
        "ip route get 1.1.1.1 | awk '{print $7}'",
        shell=True,
        capture_output=True,
        text=True,
    )
    ip = result.stdout.strip()
    return get_logs(storage_directory, ip), ip


def send_slack_error_message_with_attachments(
    slack_bot: slack.Slack, protocol_name: str, error_str: str, length: int = 30
) -> None:
    """Send error slack message with log files and video clip attached."""
    log_path, ip = create_robot_log_zip()
    video_path = get_livestream_video(length)
    slack_bot.send_error_message(protocol_name, error_str, ip, [log_path, video_path])


def send_slack_message_with_image(slack_bot: slack.Slack, protocol_name: str) -> None:
    """Send run completed message with image."""
    image_path = get_last_image_capture()
    slack_bot.send_run_completed_message(protocol_name, [image_path])


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
