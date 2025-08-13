"""inner-well-geometry-creator Protocol."""

from typing import List, Tuple, Optional, Union, Dict
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Labware,
    LiquidClass,
    OFF_DECK,
)
from opentrons.types import Point
from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult
import numpy as np
import json
from hardware_testing import data 


###########################################
#  VARIABLES - START
###########################################

ASPIRATE_MM_FROM_BOTTOM = 5
DISPENSE_MM_FROM_BOTTOM = 5
RESERVOIR = "nest_1_reservoir_290ml"
DEFAULT_STEPS = 20  # change later

LIQUID_MOUNT = "right"
LIQUID_PIPETTE_SIZE = 1000
# liquid tip size is a param

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50

SLOT_LIQUID_TIPRACK1 = "C3"
SLOT_LIQUID_TIPRACK2 = "B3"
SLOT_PROBING_TIPRACK = "D3"


SLOT_LABWARE = "D2"
SLOT_RESERVOIR = "C2"
SLOT_DIAL = "B2"


# below threshold, alpha low. above threshold, alpha high
THRESHOLD = 3
# sensitivity values for bottom and top zones:
ALPHA_LOW = 0.2
ALPHA_HIGH = 0.4


###########################################
#  VARIABLES - END
###########################################

metadata = {"protocolName": "inner-well-geometry-creator", "author": "ABR"}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

DIAL_PORT = None
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]
RUN_ID = ""
FILE_NAME = ""
USER_DEFINED_VOLUMES = ""
CSV_SEPARATOR = ""
CSV_HEADER = ["well", "step volume", "dispense volume", "tip-z-error", "height", "hdelta", "status"]

def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    from hardware_testing import protocols

    protocols.create_pipette_parameters(parameters)

    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[
            {"display_name": "eppendorf1000 test", "value": "eppendorf_96_wellplate_1000ul_custom"},
            {"display_name": "opentrons96", "value": "armadillo_96_wellplate_200ul_pcr_full_skirt"},
        ],
        default= "armadillo_96_wellplate_200ul_pcr_full_skirt",
    )

    parameters.add_float(
        variable_name="labware_version",
        display_name="Labware Version",
        description="Version of the labware to use.",
        default=1,
        maximum=10,
        minimum=1.0,
    )

    parameters.add_float(
        display_name="First Dispense",
        variable_name="first_dispense",
        description="Set starting dispense amount",
        default=50.0,
        maximum=99999.0,
        minimum=1.0,
    )

    parameters.add_float(
        variable_name="target_height",
        display_name="Step Height Target",
        description="Specify the desired target step height, i.e 1mm",
        default=1.0,
        maximum=10.0,  # clamp this off so that dispense amount equals at least 1ul
        minimum=0.01,
    )

    parameters.add_str(
        variable_name="liq_tip_size",
        display_name="Liquid Tip Size",
        choices=[
            {"display_name": "1000", "value": "1000"},
            {"display_name": "50", "value": "50"},
        ],
        default="1000",
    )

    parameters.add_str(
        variable_name="liq_mount",
        display_name="Liquid Mount",
        choices=[
            {"display_name": "single channel", "value": "1"},
            {"display_name": "8 channel", "value": "8"},
        ],
        default="1",
    )


def _setup(
    ctx: ProtocolContext,
) -> Tuple[
    InstrumentContext,
    InstrumentContext,
    Labware,
    Labware,
    Labware,
    float,
    LiquidClass,
    float,
    str,
    str,
    list[str],
    Labware,
]:

    global DIAL_PORT, RUN_ID, FILE_NAME

    first_dispense = ctx.params.first_dispense  # type: ignore[attr-defined]
    target_height = ctx.params.target_height  # type: ignore[attr-defined]
    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]
    liq_mount = ctx.params.liq_mount  # type: ignore[attr-defined]

    # pipettes
    liquid_pip_name = f"flex_{liq_mount}channel_{LIQUID_PIPETTE_SIZE}"
    probing_pip_name = f"flex_1channel_{PROBING_PIPETTE_SIZE}"

    # tipracks
    liquid_rack1 = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{liq_tip_size}uL", SLOT_LIQUID_TIPRACK1
    )
    liquid_rack2 = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{liq_tip_size}uL", SLOT_LIQUID_TIPRACK2
    )
    probing_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL", SLOT_PROBING_TIPRACK
    )

    liquid_racks = [liquid_rack1, liquid_rack2]
    # load pipettes w tipracks
    liq_pipette = ctx.load_instrument(
        liquid_pip_name, LIQUID_MOUNT, tip_racks=liquid_racks
    )
    probe_pipette = ctx.load_instrument(
        probing_pip_name, PROBING_MOUNT, tip_racks=[probing_rack]
    )

    # load labware + dial
    labware = ctx.load_labware(
        labware_type, SLOT_LABWARE, version=ctx.params.labware_version
    )
    labware.load_empty(labware.wells())
    wells = list(labware.wells_by_name().keys())
    src = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    # liquid classing
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ethanol = ctx.get_liquid_class("ethanol_80")
    lm = "liquid-meniscus"

    for liquid_rack in liquid_racks:
        props = ethanol.get_for(liq_pipette, liquid_rack)
        meniscus_z = -0.5
        props.aspirate.aspirate_position.position_reference = lm
        props.aspirate.aspirate_position.offset.z = meniscus_z
        #props.dispense.dispense_position.position_reference = lm
        #props.dispense.dispense_position.offset.z = meniscus_z

    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
            Mitutoyo_Digimatic_Indicator,
        )

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(
            metadata["protocolName"], RUN_ID, f"{LIQUID_MOUNT}-{liquid_rack.load_name}"
        )

        # TODO: move the return alpha function here and write to csv 
        #also write the tolerance values, max/min step, etc
        _write_line_to_csv(ctx, [RUN_ID])
        _write_line_to_csv(ctx, [liquid_pip_name])
        _write_line_to_csv(ctx, [probing_pip_name])
        _write_line_to_csv(ctx, [labware_type])
        _write_line_to_csv(ctx, ["target height", str(target_height)])
        _write_line_to_csv(ctx, ["depth", str(labware["A1"].depth)])
        lpc = str(labware._core.get_calibrated_offset())
        _write_line_to_csv(ctx, ["LPC Offset", labware.load_name, lpc])

    return (
        liq_pipette,
        probe_pipette,
        labware,
        src,
        dial,
        ethanol,
        first_dispense,
        target_height,
        labware_type,
        liq_mount,
        wells,
        liquid_racks,
    )


def _read_dial_indicator(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    dial: Labware,
    front_channel: bool = False,
) -> float:
    target = dial["A1"].top()
    if front_channel:
        target = target.move(Point(y=9 * 7))
        if pipette.channels == 96:
            target = target.move(Point(x=9 * -11))
    pipette.move_to(target.move(Point(z=5)))
    pipette.move_to(target)
    ctx.delay(seconds=2)
    if ctx.is_simulating():
        return 0.0
    dial_port = DIAL_PORT.read()  # type: ignore[union-attr]
    pipette.move_to(target.move(Point(z=5)))
    return dial_port


def _store_dial_baseline(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    dial: Labware,
    front_channel: bool = False,
) -> None:
    global DIAL_POS_WITHOUT_TIP
    idx = 0 if not front_channel else 1
    if DIAL_POS_WITHOUT_TIP[idx] is not None:
        return
    DIAL_POS_WITHOUT_TIP[idx] = _read_dial_indicator(ctx, pipette, dial, front_channel)
    tag = f"DIALBASELINE{idx}"
    _write_line_to_csv(ctx, [tag, str(DIAL_POS_WITHOUT_TIP[idx])])


def _write_line_to_csv(ctx: ProtocolContext, line: List[str]) -> None:
    if ctx.is_simulating():
        return
    from hardware_testing.data import append_data_to_file

    formatted_line = [str(item).ljust(23) for item in line]
    line_str = f"{CSV_SEPARATOR.join(formatted_line)}\n"
    append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)


def _get_tip_z_error(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    dial: Labware,
    front_channel: bool = False,
) -> float:
    idx = 0 if not front_channel else 1
    baseline = DIAL_POS_WITHOUT_TIP[idx]
    assert baseline is not None
    new_val = _read_dial_indicator(ctx, pipette, dial, front_channel)
    return (new_val - baseline) * -1.0


def _get_height_of_liquid_in_well(
    pipette: InstrumentContext, well: Well, simulating: bool
) -> float:
    
    def extract_float(result: Union[float | SimulatedProbeResult]) -> float:
        if isinstance(result, SimulatedProbeResult):
            return result.net_liquid_exchanged_after_probe
        return float(result)
    if not simulating:
        return extract_float(pipette.measure_liquid_height(well))
    else:
        return 0.01


def generate_frusta(ctx, data, labware) -> List[Dict]:
    inner_well_json = labware._core.get_definition()
    depth = inner_well_json["wells"]["A1"]["depth"]
    well_shape = inner_well_json["wells"]["A1"].get("shape")

    if well_shape == "circular":
        geoID = "conicalWell"
    elif well_shape == "rectangular":
        geoID = "cuboidalWell"
    else:
        geoID = "defaultWell"

    for well_name in inner_well_json["wells"]:
        inner_well_json["wells"][well_name]["geometryDefinitionId"] = geoID
    
    frusta_data = []
    radius = 0.0
    side_length = 0.0

    for i in range(1, len(data)):

        vol1, h1 = data[i - 1]
        vol2, h2 = data[i]

        delta_volume = vol2 - vol1
        delta_height = h2 - h1

        if delta_height == 0:
            continue

        if geoID == "cuboidalWell":
            if not ctx.is_simulating():
                side_length = round(np.sqrt(delta_volume / delta_height), 2)
            section = {
                "shape": geoID[:-4], 
                "bottomXDimension": side_length,
                "bottomYDimension": side_length,
                "topXDimension": side_length,
                "topYDimension": side_length,
                "topHeight": round(h2, 2),
                "bottomHeight": round(h1, 2),
            }
        elif geoID == "conicalWell":
            if not ctx.is_simulating():
                radius = round(np.sqrt(delta_volume / (np.pi * delta_height)),2)
            diameter = 2 * radius
            section = {
                "shape": geoID[:-4],  
                "bottomDiameter": diameter,
                "topDiameter": diameter,
                "topHeight": round(h2, 2),
                "bottomHeight": round(h1, 2),
            }

        frusta_data.append(section)

    #add one more frusta to ensure heights add up to total depth
    last = frusta_data[-1]
    bottom_height = last["topHeight"]

    if geoID == "cuboidalWell":
        final_section = {
            "shape": geoID[:-4],
            "topXDimension": side_length,
            "topYDimension": side_length,
            "bottomXDimension": side_length,
            "bottomYDimension": side_length,
            "topHeight": depth,
            "bottomHeight": bottom_height
        }
    elif geoID == "conicalWell":
        final_section = {
            "shape": geoID[:-4],
            "topDiameter": diameter,
            "bottomDiameter": diameter,
            "topHeight": depth,
            "bottomHeight": bottom_height
        }

    frusta_data.append(final_section)

    inner_well_json["innerLabwareGeometry"] = {
        geoID: {
            "sections": frusta_data
        }
    }

    return inner_well_json


def run(ctx: ProtocolContext) -> None:
    """Protocol entry point."""
    (
        liq_pipette,
        probe_pipette,
        labware,
        src,
        dial,
        ethanol,
        first_dispense,
        target_height,
        labware_type,
        liq_mount,
        wells,
        liquid_racks
    ) = _setup(ctx)

    # Constants
    max_volume = labware["A1"].max_volume

    #these are all magic numbers
    min_step = max(max_volume * 0.01, 5) #clamped to 5uL
    max_step = max_volume * 0.25

    # Initialize state
    corrected_height = 0.0
    corrected_heights = [0.0]
    tip_z_error = 0.0
    step = 0
    hdelta = 0.0
    height = 0.0
    step_volume = 0.0
    dispense_volume = 0.0
    current_well = "none"
    udv_table = []
    delta_tolerance = target_height * 0.15
    status = "pass"

    _store_dial_baseline(ctx, probe_pipette, dial)
    _write_line_to_csv(ctx, CSV_HEADER)

    def pick_up_tips() -> None:
        if not probe_pipette.has_tip:
            probe_pipette.pick_up_tip()
        if not liq_pipette.has_tip:
            liq_pipette.pick_up_tip()

    def drop_tips() -> None:
        if probe_pipette.has_tip:
            probe_pipette.drop_tip()
        if liq_pipette.has_tip:
            liq_pipette.drop_tip()

    # TODO: return alpha value pairs based on the labware volume and expected step volume increment. 
    def get_alpha_for_height(h: float) -> float:
        return ALPHA_LOW if h < THRESHOLD else ALPHA_HIGH

    # Proportional Controller
    # TODO: take in smoothed heights as inputs
    def adaptive_volume_step(
        hdelta: float, height: float, step_volume: float, target_height: float
    ) -> float:  # desired steady state height step in mm
        nonlocal delta_tolerance

        # deadband to avoid unnecessary step volume corrections
        lower_bound = target_height - delta_tolerance
        upper_bound = target_height + delta_tolerance

        alpha = get_alpha_for_height(height)

        if lower_bound <= hdelta <= upper_bound:
            return step_volume
        
        elif hdelta < lower_bound and hdelta > 0:
            error = target_height - hdelta
            new_volume = step_volume * min(1.5, 1 + alpha * error) # increase clamped to 50% of previous volume 
        
        elif hdelta > upper_bound:
            error = hdelta - target_height
            new_volume = step_volume * max(0.5, 1 - alpha * error) # decrease clamped to 50% of previous volume 
        else:
            new_volume = step_volume

        new_volume = max(min_step, min(max_step, new_volume))

        return new_volume

    def write_trial_log() -> None:
        nonlocal udv_table
        trial_data = [
            current_well,
            round(step_volume, 5),
            round(dispense_volume, 5),
            round(tip_z_error, 5),
            round(corrected_height, 5),
            hdelta,
            status
        ]
        udv_table.append(trial_data)
        _write_line_to_csv(ctx, [str(d) for d in trial_data])
    
    def reload_labware() -> None:
        nonlocal labware, labware_type
        print("reloading labware")
        ctx.move_labware(labware, OFF_DECK, use_gripper=False)
        labware = ctx.load_labware(
            labware_type, SLOT_LABWARE, version=ctx.params.labware_version
        )
        labware.load_empty(labware.wells())

    ################ Begin Protocol
    
    num_wells = len(wells)
    write_trial_log()

    # probe source well
    liq_pipette.pick_up_tip()
    _get_height_of_liquid_in_well(liq_pipette, src["A1"], ctx.is_simulating()) 

    #TODO: check if first dispense under 2.5mm 
    step_volume = first_dispense

    while dispense_volume < max_volume:
        drop_tips()
        pick_up_tips()

        current_well = wells[step % num_wells]

        # check if out of wells
        if step > 0 and step % num_wells == 0:
            reload_labware()

        tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)

        # Prevent overflow before dispensing
        if (dispense_volume + step_volume) > max_volume:
            step_volume = max_volume - dispense_volume

        # Dispense
        dispense_volume += step_volume

        liq_pipette.transfer_with_liquid_class(
            ethanol,
            dispense_volume if liq_mount == "1" else dispense_volume / 8,
            src["A1"],
            labware[current_well],
            new_tip="never",
            return_tip=False,
        )

        # Measure liquid height
        height = _get_height_of_liquid_in_well(
            probe_pipette, labware[current_well], ctx.is_simulating()
        )
        corrected_height = height + tip_z_error
        corrected_heights.append(corrected_height)

        # Compute hdelta
        hdelta = (
            corrected_heights[-1] - corrected_heights[-2]
            if len(corrected_heights) > 1 else 0.0
        )

        # Check for bad hdelta
        if step > 0 and not ctx.is_simulating():
            if hdelta < (target_height - delta_tolerance) or hdelta > (target_height + delta_tolerance):
                # Rollback both height & volume
                corrected_heights.pop()
                status = "fail"
                write_trial_log() #log failure
                dispense_volume -= step_volume

                # Recalculate step volume for next well based on last hdelta
                step_volume = adaptive_volume_step(hdelta, corrected_height, step_volume, target_height)

                step += 1
                continue 

        status = "pass"
        write_trial_log()

        # Recalculate step_volume for the next iteration
        step_volume = adaptive_volume_step(hdelta, corrected_height, step_volume, target_height)

        step += 1

    drop_tips()


    #create labware def 
    udv_data = np.array([(trial[2], trial[4]) for trial in udv_table])  # dispense_vol, corrected_height
    new_inner_well_json = generate_frusta(ctx, udv_data, labware)

    user_defined_volumes = data.create_folder_for_test_data("user-defined-volumes")
    udv_def_name = f"{RUN_ID}_{labware_type}"
    file_path = user_defined_volumes / udv_def_name

    with open(file_path, "w") as f:
        json.dump(new_inner_well_json, f, indent=2)



    

    

