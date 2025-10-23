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

#----------------------Global Variables----------------------------

LABWARE = "costar_96_wellplate_2200ul"  # change to desired labware

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

#----------------------Global Variables End-------------------------

metadata = {"protocolName": "inner-well-geometry-creator", 
            "author": "Carlos Fernandez-HW TEST ENGINEER"}

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
    liquid_racks: list[Labware]
    liquid_mount: InstrumentContext
    liquid_tip: str


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
    min_step = max(max_volume * 0.01, 1)  # clamped to 1uL
    max_step = max_volume * 0.25

    # liquid
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ethanol = ctx.get_liquid_class(name="ethanol_80")

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

def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    state = _setup(ctx)

    if not ctx.is_simulating():
        from hardware_testing import data

        user_defined_volumes = data.create_folder_for_test_data("user-defined-volumes")
        udv_def_name = f"{RUN_ID}_{state.labware_type}.json"
        file_path = user_defined_volumes / udv_def_name

        with open(file_path, "w") as f:
            json.dump(new_inner_well_json, f, indent=2)

        ctx.pause(f"User Defined Definition file: {file_path}")