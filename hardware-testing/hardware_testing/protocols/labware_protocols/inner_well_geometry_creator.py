"""inner-well-geometry-creator Protocol."""

from typing import List, Tuple, Optional
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Labware,
    LiquidClass,
)
from opentrons.types import Point
from typing import Union
from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult
import math
from collections import deque

###########################################
#  VARIABLES - START
###########################################

ASPIRATE_MM_FROM_BOTTOM = 5
DISPENSE_MM_FROM_BOTTOM = 5
RESERVOIR = "nest_1_reservoir_195ml"
DEFAULT_STEPS = 18  # change later

LIQUID_MOUNT = "right"
LIQUID_TIP_SIZE = 1000
LIQUID_PIPETTE_SIZE = 1000

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50

SLOT_LIQUID_TIPRACK = "C3"
SLOT_PROBING_TIPRACK = "D3"
SLOT_LABWARE = "D2"
SLOT_RESERVOIR = "C2"
SLOT_DIAL = "B2"

RAMP_FRACTION = 1/3

#below threshold, alpha low. above threshold, alpha high 
THRESHOLD = 3.5

#sensitivity values for bottom and top zones:
ALPHA_LOW = 1      
ALPHA_HIGH = 0.5     

# how many heights included in rolling average 
SMOOTHING_WINDOW = 2

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
CSV_SEPARATOR = ""
CSV_HEADER = ["step", "step_volume", "total_vol", "tip-z-error", "cheight", "smoothed_delta"]


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    from hardware_testing import protocols

    protocols.create_pipette_parameters(parameters)
    parameters.add_bool(
        display_name="Quick Mode",
        variable_name="quick_mode",
        description="If true, dial indicator is not used and tips are reused.",
        default=False,
    )

    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[
            {"display_name": "corning 24", "value": "corning_24_wellplate_3.4ml_flat"},
            {"display_name": "axygen", "value": "axygen_96_wellplate_500ul"},
            {"display_name": "smc 384", "value": "smc_384_read_plate"},
            {"display_name": "ibidi", "value": "ibidi_96_square_well_plate_300ul"},
            {"display_name": "nest 24", "value": "nest_24_wellplate_10.4ml"},
            {"display_name": "applied24", "value": "appliedbiosystemsmicroamp_384_wellplate_40ul"},
            {"display_name": "opentrons96", "value": "opentrons_96_wellplate_200ul_pcr_full_skirt"},
            {"display_name": "usa 12 22ml", "value": "usascientific_12_reservoir_22ml"},
            {"display_name": "nest 96 2ml", "value": "nest_96_wellplate_2ml_deep"},

        ],
        default="corning_24_wellplate_3.4ml_flat",
    )

    parameters.add_float(
        variable_name="number_of_steps",
        display_name="Number of Steps",
        description="Number of steps to take in the protocol.",
        default=DEFAULT_STEPS,
        maximum=100.0,
        minimum=1.0,
    )

    parameters.add_float(
        variable_name="labware_version",
        display_name="Labware Version",
        description="Version of the labware to use.",
        default=3,
        maximum=10,
        minimum=1.0
    )

    parameters.add_bool(
        display_name="Dynamic Steps",
        variable_name="dynamic_steps",
        description="If true, stepvol starts slowly and increases",
        default=False,
    )

    parameters.add_float(
        variable_name="first_dispense",
        display_name="First Dispense Amount",
        description="specify a first dispense to circumvent probing under 3mm",
        default=50.0,
        maximum=99999.0,
        minimum=1.0
    )


def _setup(
    ctx: ProtocolContext,
) -> Tuple[
    InstrumentContext,
    InstrumentContext,
    Labware,
    Labware,
    Labware,
    Labware,
    Labware,
    bool,
    float,
    bool,
    LiquidClass,
    float,
    float
]:     

    global DIAL_PORT, RUN_ID, FILE_NAME

    #reservoir_used = ctx.params.reservoir_used  # type: ignore[attr-defined]
    quick_mode = ctx.params.quick_mode  # type: ignore[attr-defined]
    number_of_steps = int(ctx.params.number_of_steps)  # type: ignore[attr-defined]
    dynamic_steps = ctx.params.dynamic_steps  # type: ignore[attr-defined]
    first_dispense = ctx.params.first_dispense # type: ignore[attr-defined]

    liquid_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{LIQUID_TIP_SIZE}uL", SLOT_LIQUID_TIPRACK
    )
    probing_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL", SLOT_PROBING_TIPRACK
    )

    liquid_pip_name = f"flex_1channel_{LIQUID_PIPETTE_SIZE}"
    probing_pip_name = f"flex_1channel_{PROBING_PIPETTE_SIZE}"

    liq_pipette = ctx.load_instrument(
        liquid_pip_name, LIQUID_MOUNT, tip_racks=[liquid_rack]
    )
    probe_pipette = ctx.load_instrument(probing_pip_name, PROBING_MOUNT)

    ethanol = ctx.get_liquid_class("ethanol_80")
    lm = "liquid-meniscus"
    props = ethanol.get_for(liq_pipette, liquid_rack)
    meniscus_z = -0.5
    props.aspirate.aspirate_position.position_reference = lm
    props.aspirate.aspirate_position.offset.z = meniscus_z
    props.dispense.dispense_position.position_reference = lm
    props.dispense.dispense_position.offset.z = meniscus_z

    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]
    labware = ctx.load_labware(labware_type, SLOT_LABWARE, version=ctx.params.labware_version)
    src = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")

    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    labware.load_empty(labware.wells())
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    max_volume = labware["A1"].max_volume


    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import Mitutoyo_Digimatic_Indicator

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(
            metadata["protocolName"], RUN_ID, f"{LIQUID_MOUNT}-{liquid_rack.load_name}"
        )
        _write_line_to_csv(ctx, [RUN_ID])
        _write_line_to_csv(ctx, [liquid_pip_name])
        _write_line_to_csv(ctx, [probing_pip_name])
        _write_line_to_csv(ctx, [labware_type])
        _write_line_to_csv(ctx, ["steps", str(number_of_steps)])
        _write_line_to_csv(ctx, ["depth", str(labware["A1"].depth)])
        lpc = str(labware._core.get_calibrated_offset())
        _write_line_to_csv(ctx, ["LPC Offset", labware.load_name, lpc])

    return (
        liq_pipette,
        probe_pipette,
        probing_rack,
        liquid_rack,
        labware,
        src,
        dial,
        dynamic_steps,
        number_of_steps,
        quick_mode,
        ethanol,
        max_volume,
        first_dispense,
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

    # Format each field to a fixed width for even spacing (e.g., 15 chars)
    formatted_line = [str(item).ljust(15) for item in line]
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

    try:
        if pipette.detect_liquid_presence(well) and not simulating:
            return extract_float(pipette.measure_liquid_height(well))
    except PipetteLiquidNotFoundError:
        if not simulating:
            return extract_float(pipette.measure_liquid_height(well))
        else:
            return 0.01
    return 0.01


def run(ctx: ProtocolContext) -> None:
    """Protocol entry point."""
    (
        liq_pipette,
        probe_pipette,
        probing_rack,
        liquid_rack,
        labware,
        src,
        dial,
        dynamic_steps,
        number_of_steps,
        quick_mode,
        ethanol,
        max_volume,
        first_dispense,
    ) = _setup(ctx)

    # Constants
    min_step = max_volume * 0.005
    max_step = max_volume * 0.05
    tolerance = max_volume / 25 
    neutral_threshold = 1.0  # target hdelta

    # State
    volume_dispensed = 0.0
    dispense_volume = 0.0
    height = 0.0
    corrected_height = 0.0
    cheight_list = [0.0]
    tip_z_error = 0.0
    step = 0
    delta_history = deque(maxlen=SMOOTHING_WINDOW)

    # Store baseline and header
    _store_dial_baseline(ctx, probe_pipette, dial)
    _write_line_to_csv(ctx, CSV_HEADER)

    # ------------------ Helpers ------------------ #

    def pick_up_tips() -> None:
        if not probe_pipette.has_tip:
            probe_pipette.pick_up_tip(probing_rack)
        if not liq_pipette.has_tip:
            liq_pipette.pick_up_tip(liquid_rack)

    def drop_tips() -> None:
        if probe_pipette.has_tip:
            probe_pipette.drop_tip()
        if liq_pipette.has_tip:
            liq_pipette.drop_tip()

    def get_alpha_for_height(h: float) -> float:
        return ALPHA_LOW if h < THRESHOLD else ALPHA_HIGH

    def adaptive_volume_step(hdelta: float, h: float) -> float:
        alpha = get_alpha_for_height(h)
        delta_history.append(abs(hdelta))
        smoothed_delta = sum(delta_history) / len(delta_history)
        if smoothed_delta < neutral_threshold:
            step_v = max_step * math.exp(-alpha * smoothed_delta)
        else:
            step_v = min_step * math.exp(-alpha * smoothed_delta)
        return max(min_step, min(max_step, step_v))

    def write_trial_log() -> None:
        trial_data = [
            step,
            round(dispense_volume, 5),
            round(volume_dispensed, 5),
            round(tip_z_error, 5),
            round(corrected_height, 5),
            round(sum(delta_history) / len(delta_history), 5),
        ]
        _write_line_to_csv(ctx, [str(d) for d in trial_data])

    # ------------------ Begin Protocol ------------------ #

    drop_tips()

    step_volume = first_dispense if dynamic_steps else max_volume / number_of_steps

    while volume_dispensed < (max_volume - tolerance):
        if step == 0:
            pick_up_tips()
            tip_z_error = round(_get_tip_z_error(ctx, probe_pipette, dial), 5)
            height = _get_height_of_liquid_in_well(liq_pipette, src["A1"], ctx.is_simulating())
            corrected_height = height + tip_z_error
            cheight_list = [corrected_height]
        else:
            if not quick_mode:
                tip_z_error = round(_get_tip_z_error(ctx, probe_pipette, dial), 5)
            dispense_volume = step_volume #dispenses first_dispense initially
            liq_pipette.transfer_with_liquid_class(
                ethanol,
                dispense_volume,
                src["A1"],
                labware["A1"],
                new_tip="never",
                return_tip=False,
            )
            volume_dispensed += dispense_volume

            height = round(
                _get_height_of_liquid_in_well(probe_pipette, labware["A1"], ctx.is_simulating()), 5
            )
            corrected_height = height + tip_z_error
            cheight_list.append(corrected_height)

            if dynamic_steps and len(cheight_list) >= 2:
                hdelta = cheight_list[-1] - cheight_list[-2]
                step_volume = adaptive_volume_step(hdelta, corrected_height)

        write_trial_log()
        step += 1

        if not quick_mode:
            drop_tips()
            pick_up_tips()

    drop_tips()




