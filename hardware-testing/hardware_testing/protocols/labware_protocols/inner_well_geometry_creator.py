"""inner-well-geometry-creator Protocol."""


from typing import List, Optional, Union
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Labware,
)
from opentrons.types import Point
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult
import numpy as np
import json
from opentrons_shared_data.labware.types import LabwareDefinition3, LabwareDefinition2
from dataclasses import dataclass

###########################################
#  GLOBAL VARIABLES - START
###########################################

LABWARE = "nunc_96_wellplate_450ul"

RESERVOIR = "nest_1_reservoir_290ml"

LIQUID_MOUNT = "right"
LIQUID_PIPETTE_SIZE = 1000

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50

SLOT_LIQUID_TIPRACK1 = "C3"
SLOT_LIQUID_TIPRACK2 = "B3"
SLOT_PROBING_TIPRACK = "D3"

SLOT_LABWARE = "D2"
SLOT_RESERVOIR = "C2"
SLOT_DIAL = "B2"


###########################################
#  GLOBAL VARIABLES - END
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
CSV_HEADER = [
    "well",
    "step volume",
    "dispense volume",
    "tip-z-error",
    "height",
    "hdelta",
    "status",
]


@dataclass
class SetupState:
    """Internal components."""

    liq_pipette: InstrumentContext
    probe_pipette: InstrumentContext
    labware: Labware
    src: Labware
    dial: Labware
    first_dispense: float
    target_height: float
    labware_type: str
    wells: list[str]
    max_volume: float
    lower_bound: float
    upper_bound: float
    min_step: float
    max_step: float
    threshold: float
    delta_tolerance: float


@dataclass
class TrialResult:
    """Data that represent the results of each trial."""

    well: str
    step_volume: float
    total_volume: float
    tip_z_error: float
    height: float
    hdelta: float
    status: str


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
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
        default="flex_1channel_50",
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
        default="flex_1channel_1000",
    )

    parameters.add_float(
        display_name="First Dispense",
        variable_name="first_dispense",
        description="Set a starting dispense amount that would reach 2-3mm in the well.",
        default=50.0,
        maximum=99999.0,
        minimum=1.0,
    )

    parameters.add_float(
        variable_name="target_height",
        display_name="Step Height Target",
        description="Specify the desired target step height, i.e 1mm",
        default=1.0,
        maximum=3.0,
        minimum=0.1,
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


def _setup(ctx: ProtocolContext) -> SetupState:
    global DIAL_PORT, RUN_ID, FILE_NAME, LABWARE

    first_dispense = ctx.params.first_dispense  # type: ignore[attr-defined]
    target_height = ctx.params.target_height  # type: ignore[attr-defined]
    labware_type = LABWARE
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]
    left_mount = ctx.params.left_mount  # type: ignore[attr-defined]
    right_mount = ctx.params.right_mount  # type: ignore[attr-defined]

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

    # load pipettes
    probe_pipette = ctx.load_instrument(
        left_mount, PROBING_MOUNT, tip_racks=[probing_rack]
    )
    liq_pipette = ctx.load_instrument(right_mount, LIQUID_MOUNT, tip_racks=liquid_racks)

    # load labware + dial
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    labware.load_empty(labware.wells())
    wells = list(labware.wells_by_name().keys())
    src = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    # below threshold, alpha low. above threshold, alpha high
    threshold = 4.5
    delta_tolerance = 0.2

    # volume deadband for the controller
    max_volume = labware["A1"].max_volume
    lower_bound = target_height - delta_tolerance
    upper_bound = target_height + delta_tolerance

    # volume clamps for the controller
    min_step = max(max_volume * 0.01, 1)  # clamped to 5uL
    max_step = max_volume * 0.25

    # liquid classing
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)

    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
            Mitutoyo_Digimatic_Indicator,
        )

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(metadata["protocolName"], RUN_ID, labware_type)

        _write_line_to_csv(ctx, [RUN_ID])
        _write_line_to_csv(ctx, [right_mount])
        _write_line_to_csv(ctx, [left_mount])
        _write_line_to_csv(ctx, [labware_type])
        _write_line_to_csv(ctx, ["target height", str(target_height)])
        _write_line_to_csv(ctx, ["depth", str(labware["A1"].depth)])
        lpc = str(labware._core.get_calibrated_offset())
        _write_line_to_csv(ctx, ["LPC Offset", labware.load_name, lpc])

    return SetupState(
        liq_pipette=liq_pipette,
        probe_pipette=probe_pipette,
        labware=labware,
        src=src,
        dial=dial,
        first_dispense=first_dispense,
        target_height=target_height,
        labware_type=labware_type,
        wells=wells,
        max_volume=max_volume,
        lower_bound=lower_bound,
        upper_bound=upper_bound,
        min_step=min_step,
        max_step=max_step,
        threshold=threshold,
        delta_tolerance=delta_tolerance,
    )


# Helper Functions


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


def pick_up_tips(
    probe_pipette: InstrumentContext, liq_pipette: InstrumentContext
) -> None:
    """Pick up tips."""
    if not probe_pipette.has_tip:
        probe_pipette.pick_up_tip()
    if not liq_pipette.has_tip:
        liq_pipette.pick_up_tip()


def drop_tips(probe_pipette: InstrumentContext, liq_pipette: InstrumentContext) -> None:
    """Drop tips."""
    if probe_pipette.has_tip:
        probe_pipette.drop_tip()
    if liq_pipette.has_tip:
        liq_pipette.drop_tip()


def _get_height_of_liquid_in_well(
    pipette: InstrumentContext, well: Well, simulating: bool
) -> float:
    """Get height of liquid in well."""

    def extract_float(result: Union[float | SimulatedProbeResult]) -> float:
        """Extract float."""
        if isinstance(result, SimulatedProbeResult):
            return result.net_liquid_exchanged_after_probe
        return float(result)

    if not simulating:
        return extract_float(pipette.measure_liquid_height(well))
    else:
        return 0.01


def generate_frusta(
    ctx: ProtocolContext, data: List, labware: Labware
) -> LabwareDefinition2 | LabwareDefinition3:
    """Generate Frusta."""
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
                radius = round(np.sqrt(delta_volume / (np.pi * delta_height)), 2)
            diameter = 2 * radius
            section = {
                "shape": geoID[:-4],
                "bottomDiameter": diameter,
                "topDiameter": diameter,
                "topHeight": round(h2, 2),
                "bottomHeight": round(h1, 2),
            }

        frusta_data.append(section)

    # add one more frusta to ensure heights add up to total depth
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
            "bottomHeight": bottom_height,
        }
    elif geoID == "conicalWell":
        final_section = {
            "shape": geoID[:-4],
            "topDiameter": diameter,
            "bottomDiameter": diameter,
            "topHeight": depth,
            "bottomHeight": bottom_height,
        }

    frusta_data.append(final_section)

    inner_well_json["innerLabwareGeometry"] = {geoID: {"sections": frusta_data}}

    return inner_well_json


def get_alpha_for_height(height: float, max_volume: float, threshold: float) -> float:
    """Return adaptive proportional factor depending on well size & current height."""
    if max_volume >= 200000:
        alpha_low, alpha_high = 0.5, 1.5
    elif max_volume >= 2000:
        alpha_low, alpha_high = 0.2, 0.5
    elif max_volume >= 250:
        alpha_low, alpha_high = 0.5, 0.8
    elif max_volume >= 100:
        alpha_low, alpha_high = 0.8, 1.0
    else:
        alpha_low, alpha_high = 1.0, 0.8
    return alpha_low if height < threshold else alpha_high


# Proportional Controller
def adaptive_volume_step(
    hdelta: float, height: float, step_volume: float, state: SetupState
) -> float:
    """Return a new step volume based on the hdelta error from target."""
    alpha = get_alpha_for_height(height, state.max_volume, state.threshold)

    if state.lower_bound <= hdelta <= state.upper_bound:
        return step_volume

    elif hdelta < state.lower_bound and hdelta > 0:
        error = state.target_height - hdelta
        new_volume = step_volume * min(
            1.5, 1 + alpha * error
        )  # increase clamped to 150% of previous step volume

    elif hdelta > state.upper_bound:
        error = hdelta - state.target_height
        new_volume = step_volume * max(
            0.5, 1 - alpha * error
        )  # decrease clamped to 50% of previous step volume
    else:
        new_volume = step_volume

    new_volume = max(state.min_step, min(state.max_step, new_volume))

    return new_volume


# Inner Well Geometry Creator
def geometry_creator(ctx: ProtocolContext, state: SetupState) -> List[TrialResult]:
    """Run liquid dispense + measure loop and return trial results."""
    liq_pipette, probe_pipette, labware, src, wells, max_volume = (
        state.liq_pipette,
        state.probe_pipette,
        state.labware,
        state.src,
        state.wells,
        state.max_volume,
    )

    # Initialize local state
    corrected_height = 0.0
    corrected_heights = [0.0]
    tip_z_error = 0.0
    step = 0
    hdelta = 0.0
    height = 0.0
    step_volume = 0.0
    dispense_volume = 0.0
    status = "pass"
    current_well = "none"
    udv_table: List[TrialResult] = []

    # Stops the protocol once the dispensed volume reaches a certain point
    if max_volume > 100000:
        margin = max_volume * 0.33
    else:
        margin = max_volume * 0.15

    _store_dial_baseline(ctx, probe_pipette, state.dial)
    _write_line_to_csv(ctx, CSV_HEADER)

    def write_trial_log(udv_table: List[TrialResult]) -> None:
        trial_data = TrialResult(
            well=current_well,
            step_volume=round(step_volume, 5),
            total_volume=round(dispense_volume, 5),
            tip_z_error=round(tip_z_error, 5),
            height=round(corrected_height, 5),
            hdelta=hdelta,
            status=status,
        )
        udv_table.append(trial_data)
        _write_line_to_csv(
            ctx,
            [
                trial_data.well,
                str(trial_data.step_volume),
                str(trial_data.total_volume),
                str(trial_data.tip_z_error),
                str(trial_data.height),
                str(trial_data.hdelta),
                trial_data.status,
            ],
        )

    # initial protocol steps
    write_trial_log(udv_table)
    liq_pipette.pick_up_tip()
    _get_height_of_liquid_in_well(liq_pipette, src["A1"], ctx.is_simulating())
    step_volume = state.first_dispense

    while dispense_volume < (max_volume - margin):

        drop_tips(probe_pipette, liq_pipette)
        pick_up_tips(probe_pipette, liq_pipette)

        current_well = wells[step % len(wells)]
        # check if out of wells
        if step > 0 and step % len(wells) == 0:
            if not ctx.is_simulating():
                ctx.pause("Reload the labware.")
                _get_height_of_liquid_in_well(
                    liq_pipette, src["A1"], ctx.is_simulating()
                )
            else:
                break

        tip_z_error = _get_tip_z_error(ctx, probe_pipette, state.dial)

        # Dispense
        dispense_volume += step_volume
        liq_pipette.flow_rate.dispense = 50
        dispense_loc = labware[current_well].bottom(z=max(corrected_height + 3.5, 3))
        liq_pipette.transfer(
            (dispense_volume / liq_pipette.channels) * 1.033,
            src["A1"].meniscus(z=-2, target="end"),
            dispense_loc,
            new_tip="never",
            return_tip=False,
            blow_out=False,
            blowout_location="destination well",
            air_gap=5,
        )
        liq_pipette.flow_rate.blow_out = 500
        liq_pipette.blow_out(dispense_loc.move(Point(z=5)))
        liq_pipette.blow_out(dispense_loc.move(Point(z=10)))
        

        # Measure liquid height
        height = _get_height_of_liquid_in_well(
            probe_pipette, labware[current_well], ctx.is_simulating()
        )
        corrected_height = height + tip_z_error
        corrected_heights.append(corrected_height)

        # Compute hdelta
        hdelta = (
            corrected_heights[-1] - corrected_heights[-2]
            if len(corrected_heights) > 1
            else 0.0
        )

        # Check for bad hdelta
        if not ctx.is_simulating():
            if step == 0:
                if hdelta < 2.0:
                    ctx.pause(
                        f"First dispense volume {state.first_dispense}uL too low. Height was {hdelta}mm. Adjust and restart."
                    )
                    raise Exception("Liquid height out of range")
                elif hdelta > 3.0:
                    ctx.pause(
                        f"First dispense volume {state.first_dispense}uL too high. Height was {hdelta}mm. Adjust and restart."
                    )
                    raise Exception("Liquid height out of range")
                else:
                    status = "pass"
                    write_trial_log(udv_table)
            else:
                if hdelta <= state.lower_bound or hdelta >= state.upper_bound:
                    if dispense_volume != max_volume:
                        status = "fail"
                        write_trial_log(udv_table)
                        dispense_volume -= step_volume  # rollback dispense volume
                        corrected_heights.pop()  # rollback corrected heights
                    else:
                        status = "pass"
                        write_trial_log(udv_table)
                else:
                    status = "pass"
                    write_trial_log(udv_table)
        else:
            write_trial_log(udv_table)

        # recalculate step volume for next step
        step_volume = adaptive_volume_step(hdelta, corrected_height, step_volume, state)

        step += 1

    drop_tips(probe_pipette, liq_pipette)
    return udv_table


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    state = _setup(ctx)
    udv_table = geometry_creator(ctx, state)

    # Save results
    passed_trials = [trial for trial in udv_table if trial.status == "pass"]
    frusta_data = np.array(
        [(trial.total_volume, trial.height) for trial in passed_trials]
    )
    new_inner_well_json = generate_frusta(ctx, frusta_data.tolist(), state.labware)
    if not ctx.is_simulating():
        from hardware_testing import data

        user_defined_volumes = data.create_folder_for_test_data("user-defined-volumes")
        udv_def_name = f"{RUN_ID}_{state.labware_type}.json"
        file_path = user_defined_volumes / udv_def_name

        with open(file_path, "w") as f:
            json.dump(new_inner_well_json, f, indent=2)

        ctx.pause(f"User Defined Definition file: {file_path}")
