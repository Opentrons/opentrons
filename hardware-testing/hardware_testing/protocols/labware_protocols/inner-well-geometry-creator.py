"""Inner Labware Geometry Creator Protocol.

This protocol updates a custom labware definition with its inner labware geometry
through a sequence of aspirating, dispensing, and measuring liquid height.
"""

from typing import List, Optional, Union
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Labware,
    LiquidClass,
    SINGLE,
)
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference,
)
from opentrons.types import Point
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult
import numpy as np
import json
from dataclasses import dataclass, field
from collections import OrderedDict

###########################################
#  GLOBAL VARIABLES - START
###########################################

LABWARE = "example_labware"  # change to desired labware

RESERVOIR = "nest_1_reservoir_290ml"

LIQUID_MOUNT = "right"
LIQUID_PIPETTE_SIZE = 1000

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50

SLOT_LIQUID_TIPRACKS = ["D3", "B3"]
SLOT_PROBING_TIPRACK = "D2"

SLOT_LABWARE = "D1"
SLOT_RESERVOIR = "C1"
SLOT_DIAL = "B2"

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

###########################################
#  GLOBAL VARIABLES - END
###########################################

metadata = {
    "protocolName": "inner-well-geometry-creator",
    "author": "hovan.ngo@opentrons.com",
}
requirements = {"robotType": "Flex", "apiLevel": "2.24"}


@dataclass(frozen=True)
class SetupState:
    """Configure static data for the protocol."""

    liq_pipette: InstrumentContext
    probe_pipette: InstrumentContext
    labware: Labware
    src: Labware
    dial: Optional[Labware]
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
    liquid_racks: list[Labware]
    liquid_mount: InstrumentContext
    liquid_tip: str
    ethanol: LiquidClass


@dataclass(frozen=True)
class TrialResult:
    """Snapshot result of each trial."""

    well: str
    step_volume: float
    dispense_volume: float
    tip_z_error: float
    height: float
    hdelta: float
    status: str


@dataclass
class TrialState:
    """Data that changes per-trial."""

    current_well: str = "none"
    status: str = "pass"
    step_volume: float = 0.0
    dispense_volume: float = 0.0
    hdelta: float = 0.0
    corrected_height: float = 0.0
    tip_z_error: float = 0.0
    corrected_heights: List[float] = field(default_factory=lambda: [0.0])
    results: List[TrialResult] = field(default_factory=list)
    step: int = 0

    def add_result(self) -> None:
        """Adds the current step's results to the results list."""
        self.results.append(
            TrialResult(
                well=self.current_well,
                step_volume=round(self.step_volume, 5),
                dispense_volume=round(self.dispense_volume, 5),
                tip_z_error=round(self.tip_z_error, 5),
                height=round(self.corrected_height, 5),
                hdelta=self.hdelta,
                status=self.status,
            )
        )

    def rollback_last_data_point(self) -> None:
        """Cancels the step that failed to prepare for a retry."""
        self.dispense_volume -= self.step_volume  # rollback dispense volume
        self.corrected_heights.pop()  # rollback corrected heights

    def compute_hdelta(self) -> None:
        """Calculates the change in liquid level."""
        self.hdelta = (
            self.corrected_heights[-1] - self.corrected_heights[-2]
            if len(self.corrected_heights) > 1
            else 0.0
        )


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    parameters.add_str(
        variable_name="left_mount",
        display_name="Left Mount",
        description="Probing Pipette Type on Left Mount.",
        choices=[
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
            {"display_name": "None", "value": "none"},
        ],
        default="flex_1channel_50",
    )

    parameters.add_str(
        variable_name="right_mount",
        display_name="Right Mount",
        description="Liquid Pipette Type on Right Mount.",
        choices=[
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
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
        maximum=10,
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

    parameters.add_bool(
        variable_name="dial_indicator_used",
        display_name="Dial Indicator Use",
        description="Dial Indicator Used.",
        default=True,
    )


def _setup(ctx: ProtocolContext) -> SetupState:
    """Sets up the static data for the protocol."""
    global DIAL_PORT, RUN_ID, FILE_NAME, LABWARE

    first_dispense = ctx.params.first_dispense  # type: ignore[attr-defined]
    target_height = ctx.params.target_height  # type: ignore[attr-defined]
    labware_type = LABWARE
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]
    left_mount = ctx.params.left_mount  # type: ignore[attr-defined]
    right_mount = ctx.params.right_mount  # type: ignore[attr-defined]
    dial_indicator_used = ctx.params.dial_indicator_used  # type: ignore[attr-defined]

    # tipracks
    liquid_racks = [
        ctx.load_labware(f"opentrons_flex_96_tiprack_{liq_tip_size}ul", slot)
        for slot in SLOT_LIQUID_TIPRACKS
    ]
    probing_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL", SLOT_PROBING_TIPRACK
    )

    # load pipettes
    probe_pipette = ctx.load_instrument(
        left_mount, PROBING_MOUNT, tip_racks=[probing_rack]
    )
    if probe_pipette.channels == 8:
        probe_pipette.configure_nozzle_layout(
            style=SINGLE, start="H1", tip_racks=[probing_rack]
        )
    liq_pipette = ctx.load_instrument(right_mount, LIQUID_MOUNT, tip_racks=liquid_racks)
    if liq_pipette.channels == 8:
        liq_pipette.configure_nozzle_layout(
            style=SINGLE, start="H1", tip_racks=liquid_racks
        )

    # load labware + dial
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    labware.load_empty(labware.wells())
    wells = list(labware.wells_by_name().keys())
    src = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")

    dial: Optional[Labware] = None
    if dial_indicator_used:
        dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    # below threshold, alpha low. above threshold, alpha high
    threshold = 4.5
    delta_tolerance = 0.2

    # if within these bounds, then feedback loop doesnt make any changes
    max_volume = labware["A1"].max_volume
    lower_bound = target_height - delta_tolerance
    upper_bound = target_height + delta_tolerance

    # volume clamps for the feedback loop
    min_step = max(max_volume * 0.01, 1)  # the lowest possible step
    max_step = max_volume * 0.25  # the highest possible step

    # liquid
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ethanol = ctx.get_liquid_class(name="ethanol_80")

    if not ctx.is_simulating():
        from hardware_testing.data import create_file_name, create_run_id

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

        if dial is not None:
            from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
                Mitutoyo_Digimatic_Indicator,
            )

            DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
            DIAL_PORT.connect()

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
        liquid_racks=liquid_racks,
        liquid_mount=right_mount,
        liquid_tip=liq_tip_size,
        ethanol=ethanol,
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
    liq_pipette: InstrumentContext, probe_pipette: InstrumentContext
) -> None:
    """Pick up tips."""
    if not probe_pipette.has_tip:
        probe_pipette.pick_up_tip()
    if not liq_pipette.has_tip:
        liq_pipette.pick_up_tip()


def drop_tips(liq_pipette: InstrumentContext, probe_pipette: InstrumentContext) -> None:
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


def generate_frusta(ctx: ProtocolContext, data: List, labware: Labware) -> dict:
    """Read geometry creator results and generate frustum dimensions for the IWG."""
    inner_well_json = labware._core.get_definition()
    depth = inner_well_json["wells"]["A1"]["depth"]
    well_diameter = inner_well_json["wells"]["A1"].get("diameter")
    well_side_length = inner_well_json["wells"]["A1"].get("xDimension")
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
    frustum_side_length = 0.0
    frustum_diameter = 0.0

    for i in range(1, len(data)):
        vol1, h1 = data[i - 1]
        vol2, h2 = data[i]

        delta_volume = vol2 - vol1
        delta_height = h2 - h1
        if delta_height == 0:
            continue

        if geoID == "cuboidalWell":
            if not ctx.is_simulating():
                frustum_side_length = round(np.sqrt(delta_volume / delta_height), 2)
            section = {
                "shape": "cuboidal",
                "bottomXDimension": frustum_side_length,
                "bottomYDimension": frustum_side_length,
                "topXDimension": frustum_side_length,
                "topYDimension": frustum_side_length,
                "topHeight": round(h2, 2),
                "bottomHeight": round(h1, 2),
            }
        elif geoID == "conicalWell":
            if not ctx.is_simulating():
                radius = round(np.sqrt(delta_volume / (np.pi * delta_height)), 2)
                frustum_diameter = 2 * radius
            section = {
                "shape": "conical",
                "bottomDiameter": frustum_diameter,
                "topDiameter": frustum_diameter,
                "topHeight": round(h2, 2),
                "bottomHeight": round(h1, 2),
            }
        else:
            continue

        frusta_data.append(section)

    # Add one more frustum to reach full depth
    if frusta_data:
        last = frusta_data[-1]
        bottom_height = last["topHeight"]

        if geoID == "cuboidalWell":
            final_section = {
                "shape": "cuboidal",
                "topXDimension": well_side_length,
                "topYDimension": well_side_length,
                "bottomXDimension": well_side_length,
                "bottomYDimension": well_side_length,
                "topHeight": depth,
                "bottomHeight": bottom_height,
            }
        elif geoID == "conicalWell":
            final_section = {
                "shape": "conical",
                "topDiameter": well_diameter,
                "bottomDiameter": well_diameter,
                "topHeight": depth,
                "bottomHeight": bottom_height,
            }
        else:
            final_section = {}

        if final_section:
            frusta_data.append(final_section)

        frusta_data.reverse()

    inner_well_json["innerLabwareGeometry"] = {geoID: {"sections": frusta_data}}

    key_order = [
        "ordering",
        "brand",
        "metadata",
        "dimensions",
        "wells",
        "groups",
        "parameters",
        "namespace",
        "version",
        "schemaVersion",
        "cornerOffsetFromSlot",
        "stackingOffsetWithLabware",
        "stackingOffsetWithModule",
        "allowedRoles",
        "gripperOffsets",
        "innerLabwareGeometry",
    ]
    new_iwg = OrderedDict(
        (k, dict(inner_well_json)[k]) for k in key_order if k in inner_well_json
    )

    return new_iwg


def get_dispense_props(state: SetupState, ts: TrialState) -> None:
    """Assigns the liquid class properties for ethanol dispense."""
    if state.liquid_tip == "1000":
        dispense_offset = ts.corrected_height + state.target_height + 10
        state.liq_pipette.flow_rate.blow_out = 200
    else:
        dispense_offset = ts.corrected_height + state.target_height + 3
        state.liq_pipette.flow_rate.blow_out = 50

    wb = "well-bottom"
    lm = "liquid-meniscus"
    meniscus_z = -0.5

    for rack in state.liquid_racks:
        ethanol_props = state.ethanol.get_for(state.liquid_mount, rack)
        ethanol_props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
        ethanol_props.aspirate.aspirate_position.offset.z = meniscus_z
        ethanol_props.dispense.dispense_position.position_reference = wb  # type: ignore[assignment]
        ethanol_props.dispense.dispense_position.offset.z = dispense_offset
        ethanol_props.dispense.push_out_by_volume.set_for_all_volumes(3.5)
        ethanol_props.dispense.flow_rate_by_volume.set_for_all_volumes(50)
        ethanol_props.dispense.retract.blowout.flow_rate = (
            state.liq_pipette.flow_rate.blow_out
        )
        ethanol_props.dispense.retract.end_position.position_reference = (
            PositionReference.WELL_TOP
        )
        ethanol_props.dispense.retract.end_position.offset.z = 10
        ethanol_props.dispense.retract.blowout.enabled = (
            False  # disabled because it was causing bubbles
        )


def get_alpha_for_height(state: SetupState, ts: TrialState) -> float:
    """Return adaptive proportional factor depending on well size & current height."""
    if state.max_volume >= 100000:
        alpha_low, alpha_high = 0.2, 0.3
    if state.max_volume >= 5000:
        alpha_low, alpha_high = 0.2, 0.35
    elif state.max_volume >= 3000:
        alpha_low, alpha_high = 0.35, 0.6
    elif state.max_volume >= 350:
        alpha_low, alpha_high = 0.5, 0.8
    elif state.max_volume >= 90:
        alpha_low, alpha_high = 0.8, 1.0
    else:
        alpha_low, alpha_high = 0.8, 1.0
    return alpha_low if ts.corrected_height < state.threshold else alpha_high


# Proportional Controller
def adaptive_volume_step(ts: TrialState, state: SetupState) -> float:
    """Return a new step volume based on the hdelta error from target."""
    alpha = get_alpha_for_height(state, ts)

    if state.lower_bound <= ts.hdelta <= state.upper_bound:
        return ts.step_volume

    elif ts.hdelta < state.lower_bound and ts.hdelta > 0:
        error = state.target_height - ts.hdelta
        new_volume = ts.step_volume * min(
            1.5, 1 + alpha * error
        )  # increase clamped to 150% of previous step volume

    elif ts.hdelta > state.upper_bound:
        error = ts.hdelta - state.target_height
        new_volume = ts.step_volume * max(
            0.5, 1 - alpha * error
        )  # decrease clamped to 50% of previous step volume
    else:
        new_volume = ts.step_volume

    new_volume = max(state.min_step, min(state.max_step, new_volume))

    return new_volume


def write_trial_log(ctx: ProtocolContext, ts: TrialState) -> None:
    """Writes the current step's results to the CSV."""
    ts.add_result()
    trial_data = ts.results[-1]
    _write_line_to_csv(ctx, [str(v) for v in vars(trial_data).values()])


def check_hdelta(ctx: ProtocolContext, state: SetupState, ts: TrialState) -> str:
    """Checks if the liquid level was successful in reaching the set target height."""
    if ctx.is_simulating():
        status = "sim"
    else:
        if ts.step == 0:
            if 2.0 < ts.hdelta < 3.0:
                status = "pass"
            else:
                ctx.pause(
                    f"First dispense volume {state.first_dispense}uL too "
                    f"{'low' if ts.hdelta < 2.0 else 'high'}. "
                    f"Height was {ts.corrected_height}mm. Adjust and restart."
                )
                status = "fail"
        else:
            status = (
                "pass" if state.lower_bound < ts.hdelta < state.upper_bound else "fail"
            )
    return status


# Inner Well Geometry Creator
def geometry_creator(
    ctx: ProtocolContext, state: SetupState, ts: TrialState
) -> List[TrialResult]:
    """Run liquid dispense + measure loop and return trial results."""
    # initial protocol steps
    if state.dial is not None:
        _store_dial_baseline(ctx, state.probe_pipette, state.dial)
    _write_line_to_csv(ctx, CSV_HEADER)  # log 0th step as a baseline
    write_trial_log(ctx, ts)
    state.liq_pipette.pick_up_tip()
    _get_height_of_liquid_in_well(
        state.liq_pipette, state.src["A1"], ctx.is_simulating()
    )
    ts.step_volume = state.first_dispense
    final_step = False

    while ts.dispense_volume < state.max_volume:

        ts.current_well = state.wells[ts.step % len(state.wells)]
        drop_tips(state.liq_pipette, state.probe_pipette)

        # check if out of available wells
        no_more_wells = ts.step > 0 and ts.step % len(state.wells) == 0
        if no_more_wells:
            if not ctx.is_simulating():
                ctx.pause("Dump the labware and replace it.")
                _get_height_of_liquid_in_well(
                    state.liq_pipette, state.src["A1"], ctx.is_simulating()
                )
            else:
                break

        # prepare for dispense
        ts.dispense_volume += ts.step_volume
        volume_per_channel = ts.dispense_volume / state.liq_pipette.active_channels
        get_dispense_props(state, ts)

        pick_up_tips(state.liq_pipette, state.probe_pipette)
        if state.dial is not None:
            ts.tip_z_error = _get_tip_z_error(ctx, state.probe_pipette, state.dial)

        state.liq_pipette.transfer_with_liquid_class(
            liquid_class=state.ethanol,
            volume=volume_per_channel,
            source=state.src["A1"],
            dest=state.labware[ts.current_well],
            new_tip="never",
            return_tip=False,
        )

        # Check if there's clearance for touch tip
        if ts.corrected_height + state.target_height <= state.labware["A1"].depth - 4:
            state.liq_pipette.touch_tip()

        # Measure liquid height
        height = _get_height_of_liquid_in_well(
            state.probe_pipette, state.labware[ts.current_well], ctx.is_simulating()
        )
        ts.corrected_height = height + ts.tip_z_error
        ts.corrected_heights.append(ts.corrected_height)

        # Compute change in height from last liquid probe
        ts.compute_hdelta()

        # Check if liquid level is successfully raised by the target height
        ts.status = check_hdelta(ctx, state, ts)

        if ts.status == "fail":
            if ts.step == 0:
                break
            elif final_step:
                ts.status = "pass"
                write_trial_log(ctx, ts)
            else:
                write_trial_log(ctx, ts)
                ts.rollback_last_data_point()
        elif ts.status == "pass":
            write_trial_log(ctx, ts)

        # recalculate step volume for next step
        ts.step_volume = adaptive_volume_step(ts, state)

        # prevent overflow of well
        if ts.step_volume + ts.dispense_volume > state.max_volume:
            ts.step_volume = state.max_volume - ts.dispense_volume
            final_step = True

        ts.step += 1

    drop_tips(state.liq_pipette, state.probe_pipette)
    return ts.results


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    state = _setup(ctx)
    ts = TrialState()
    trial_results = geometry_creator(ctx, state, ts)
    drop_tips(state.liq_pipette, state.probe_pipette)

    # Save results and generate IWG .json
    passed_trials = [trial for trial in trial_results if trial.status == "pass"]
    frusta_data = np.array(
        [(trial.dispense_volume, trial.height) for trial in passed_trials]
    )
    if len(frusta_data) > 1:
        new_inner_well_json = generate_frusta(ctx, frusta_data.tolist(), state.labware)
    else:
        return

    if not ctx.is_simulating():
        from hardware_testing import data

        user_defined_volumes = data.create_folder_for_test_data("user-defined-volumes")
        udv_def_name = f"{RUN_ID}_{state.labware_type}.json"
        file_path = user_defined_volumes / udv_def_name

        with open(file_path, "w") as f:
            json.dump(new_inner_well_json, f, indent=2)

        ctx.pause(f"User Defined Definition file: {file_path}")
