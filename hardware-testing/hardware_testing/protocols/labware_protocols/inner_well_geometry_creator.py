"""inner-well-geometry-creator Protocol."""

from typing import List, Tuple, Optional
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
from typing import Union
from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult


###########################################
#  VARIABLES - START
###########################################

ASPIRATE_MM_FROM_BOTTOM = 5
DISPENSE_MM_FROM_BOTTOM = 5
RESERVOIR = "nest_1_reservoir_195ml"
DEFAULT_STEPS = 18  # change later

LIQUID_MOUNT = "right"
LIQUID_PIPETTE_SIZE = 1000
# liquid tip size is a param

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50

SLOT_LIQUID_TIPRACK = "C3"
SLOT_PROBING_TIPRACK = "D3"


SLOT_LABWARE = "D2"
SLOT_RESERVOIR = "C2"
SLOT_DIAL = "B2"

# below threshold, alpha low. above threshold, alpha high
THRESHOLD = 3.5
# sensitivity values for bottom and top zones:
ALPHA_LOW = 0.8
ALPHA_HIGH = 0.5


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
CSV_HEADER = ["step", "step_volume", "total_vol", "tip-z-error", "vol_diff", "cheight", "hdelta"]

def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    from hardware_testing import protocols

    protocols.create_pipette_parameters(parameters)

    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[
            {"display_name": "corning 24", "value": "corning_24_wellplate_3.4ml_flat"},
            {"display_name": "axygen", "value": "axygen_96_wellplate_500ul"},
            {"display_name": "smc 384", "value": "smc_384_read_plate"},
            {"display_name": "ibidi", "value": "ibidi_96_square_well_plate_300ul"},
            {"display_name": "nest 24", "value": "nest_24_wellplate_10.4ml"},
            {"display_name": "usa96deep", "value": "usascientific_96_wellplate_2.4ml_deep"},
            {
                "display_name": "applied24",
                "value": "appliedbiosystemsmicroamp_384_wellplate_40ul",
            },
            {
                "display_name": "opentrons96",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
            {"display_name": "usa 12 22ml", "value": "usascientific_12_reservoir_22ml"},
            {"display_name": "nest 96 2ml", "value": "nest_96_wellplate_2ml_deep"},
        ],
        default="opentrons_96_wellplate_200ul_pcr_full_skirt",
    )

    parameters.add_float(
        variable_name="labware_version",
        display_name="Labware Version",
        description="Version of the labware to use.",
        default=3,
        maximum=10,
        minimum=1.0,
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
        description="specify a first dispense",
        default=50.0,
        maximum=99999.0,
        minimum=1.0,
    )

    parameters.add_float(
        variable_name="neutral_target",
        display_name="Step Height Target",
        description="Specify the desired target step height, i.e 1mm",
        default=1,
        maximum=10,  # clamp this off so that dispense amount equals at least 1ul
        minimum=0.01,
    )

    parameters.add_bool(
        display_name="Quick Mode",
        variable_name="quick_mode",
        description="If true, dial indicator is not used and tips are reused.",
        default=False,
    )

    parameters.add_float(
        variable_name="number_of_steps",
        display_name="Number of Steps",
        description="Number of steps to take in the protocol.",
        default=DEFAULT_STEPS,
        maximum=100.0,
        minimum=1.0,
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
    Labware, 
    bool,
    float,
    bool,
    LiquidClass,
    float,
    float,
    str,
    Labware,
]:

    global DIAL_PORT, RUN_ID, FILE_NAME

    quick_mode = ctx.params.quick_mode  # type: ignore[attr-defined]
    number_of_steps = int(ctx.params.number_of_steps)  # type: ignore[attr-defined]
    dynamic_steps = ctx.params.dynamic_steps  # type: ignore[attr-defined]
    first_dispense = ctx.params.first_dispense  # type: ignore[attr-defined]
    neutral_target = ctx.params.neutral_target  # type: ignore[attr-defined]
    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]
    # reservoir_used = ctx.params.reservoir_used  # type: ignore[attr-defined]

    # pipettes
    liquid_pip_name = f"flex_1channel_{LIQUID_PIPETTE_SIZE}"
    probing_pip_name = f"flex_1channel_{PROBING_PIPETTE_SIZE}"

    # tipracks
    liquid_rack1 = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{liq_tip_size}uL", SLOT_LIQUID_TIPRACK
    )
    liquid_rack2 = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{liq_tip_size}uL", "B1"
    )
    probing_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL", "C1"
    )
    liquid_racks = [liquid_rack1, liquid_rack2]

    # load pipettes w tipracks
    liq_pipette = ctx.load_instrument(
        liquid_pip_name, LIQUID_MOUNT, tip_racks=[liquid_rack1, liquid_rack2]
    )
    probe_pipette = ctx.load_instrument(
        probing_pip_name, PROBING_MOUNT, tip_racks=[probing_rack]
    )

    # load labware + dial
    labware = ctx.load_labware(
        labware_type, SLOT_LABWARE, version=ctx.params.labware_version
    )
    labware.load_empty(labware.wells())
    src = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    # liquid classing

    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ethanol = ctx.get_liquid_class("ethanol_80")
    lm = "liquid-meniscus"

    for rack in liquid_racks:
        props = ethanol.get_for(liq_pipette, rack)
        meniscus_z = -0.5
        props.aspirate.aspirate_position.position_reference = lm
        props.aspirate.aspirate_position.offset.z = meniscus_z
        props.dispense.dispense_position.position_reference = lm
        props.dispense.dispense_position.offset.z = meniscus_z

    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
            Mitutoyo_Digimatic_Indicator,
        )

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(
            metadata["protocolName"], RUN_ID, f"{LIQUID_MOUNT}-{liquid_rack1.load_name}"
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
        liquid_rack1,
        liquid_rack2,
        labware,
        src,
        dial,
        dynamic_steps,
        number_of_steps,
        quick_mode,
        ethanol,
        first_dispense,
        neutral_target,
        labware_type,
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

    formatted_line = [str(item).ljust(25) for item in line]
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
        liquid_rack1,
        liquid_rack2,
        labware,
        src,
        dial,
        dynamic_steps,
        number_of_steps,
        quick_mode,
        ethanol,
        first_dispense,
        neutral_target,
        labware_type,
    ) = _setup(ctx)

    # Constants
    max_volume = labware["A1"].max_volume
    min_step = max(max_volume * 0.005, 5) 
    max_step = min(max_volume * 0.08, 1000)
    tolerance = (
        max_volume / 30
    )  # if the height within tolerance, then protocol can finish.

    # Initialize state
    corrected_height = 0.0
    corrected_heights = []
    tip_z_error = 0.0
    step = 0
    hdelta = 0.0
    height = 0.0
    height_check = 0.0
    vol_diff = 0.0
    step_volume = 0.0
    total_vol = 0.0
    tipcount = 0

    _store_dial_baseline(ctx, probe_pipette, dial)
    _write_line_to_csv(ctx, CSV_HEADER)

    tipcount = 0

    def pick_up_tips() -> None:
        nonlocal tipcount
        if not probe_pipette.has_tip:
            probe_pipette.pick_up_tip()
        if not liq_pipette.has_tip:
            liq_pipette.pick_up_tip()
        tipcount += 1
        

    def drop_tips() -> None:
        if probe_pipette.has_tip:
            probe_pipette.drop_tip()
        if liq_pipette.has_tip:
            liq_pipette.drop_tip()

    # defines alphas for different regions (under/over a threshold)
    def get_alpha_for_height(h: float) -> float:
        return ALPHA_LOW if h < THRESHOLD else ALPHA_HIGH

    # Proportional Controller
    def adaptive_volume_step(
        hdelta: float, height: float, step_volume: float, neutral_target: float
    ) -> float:  # desired steady state height step in mm

        # deadband to avoid unnecessary step volume corrections
        delta_tolerance = neutral_target * 0.2
        lower_bound = neutral_target - delta_tolerance
        upper_bound = neutral_target + delta_tolerance

        alpha = get_alpha_for_height(height)

        if lower_bound <= hdelta <= upper_bound:
            return step_volume

        # increasing
        elif hdelta < lower_bound and hdelta > 0:
            error = neutral_target - hdelta
            new_volume = step_volume * (1 + alpha * error)

        # decreasing
        elif hdelta > upper_bound:
            error = hdelta - neutral_target
            new_volume = step_volume * max(0.2, 1 - alpha * error)

        # hdelta <= 0, most likely a probe error
        else:
            new_volume = step_volume

        new_volume = max(min_step, min(max_step, new_volume))

        return new_volume

    def write_trial_log() -> None:
        trial_data = [
            step,
            round(step_volume, 5),
            round(total_vol, 5),
            round(tip_z_error, 5),
            vol_diff,
            corrected_height,
            hdelta,
        ]
        _write_line_to_csv(ctx, [str(d) for d in trial_data])
    
    def reload_labware() -> None:
        print("reloading labware")
        ctx.move_labware(labware, OFF_DECK, use_gripper=False)
        labware = ctx.load_labware(
            labware_type, SLOT_LABWARE, version=ctx.params.labware_version
        )
        labware.load_empty(labware.wells())
            

    ################ Begin Protocol

    drop_tips()

    total_vol = first_dispense if dynamic_steps else max_volume / number_of_steps
    wells = list(labware.wells_by_name().keys())


    while total_vol < (max_volume - tolerance):
        # initial step, log 0
        if step == 0:
            pick_up_tips()
            tipcount += 1
            tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
            _get_height_of_liquid_in_well(liq_pipette, src["A1"], ctx.is_simulating())
        else:
            if not quick_mode:
                tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
            #todo: make this a function
            if step > len(wells):
                reload_labware()
                step = 1 #reset the step 
            well = wells[step-1]
            print(well)
            total_vol += step_volume
            liq_pipette.transfer_with_liquid_class(
                ethanol,
                total_vol,
                src["A1"],
                labware[well],
                new_tip="never",
                return_tip=False,
            )
        
            height_check = corrected_height

            # probe well
            height = probe_pipette.measure_liquid_height(labware[well])
            corrected_height = height + tip_z_error

            api_vol = labware[well].height_from_volume(step_volume)
            vol_diff = api_vol - corrected_height

            # check if new height greater than old height
            if height_check > corrected_height:
                liq_pipette.drop_tip()
                liq_pipette.pick_up_tip()
                height = probe_pipette.measure_liquid_height(labware[well])
                corrected_height = height + tip_z_error

        # log corrected height
        corrected_heights.append(corrected_height)

        # find hdelta and correct
        if dynamic_steps and len(corrected_heights) > 1:
            hdelta = corrected_heights[-1] - corrected_heights[-2]
            step_volume = adaptive_volume_step(
                hdelta, corrected_height, step_volume, neutral_target
            )

        write_trial_log()
        step += 1

        if not quick_mode:
            drop_tips()
            pick_up_tips()

        print(tipcount)

    drop_tips()
