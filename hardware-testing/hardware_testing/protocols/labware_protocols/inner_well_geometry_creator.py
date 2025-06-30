"""Inner Well Geometry Creator Protocol."""

from typing import List, Tuple, Optional
from opentrons.protocol_api import ProtocolContext, ParameterContext, InstrumentContext, Well, Labware
from opentrons.types import Point

###########################################
#  VARIABLES - START
###########################################

ASPIRATE_MM_FROM_BOTTOM = 5
DISPENSE_MM_FROM_BOTTOM = 5
RESERVOIR = "nest_1_reservoir_290ml"
STEPS = 20  # optimize later

LIQUID_MOUNT = "right"
LIQUID_TIP_SIZE = 1000
LIQUID_PIPETTE_SIZE = 1000

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 1000
PROBING_PIPETTE_SIZE = 1000

SLOT_LIQUID_TIPRACK = "C1"
SLOT_PROBING_TIPRACK = "C2"
SLOT_LABWARE = "D3"
SLOT_RESERVOIR = "D1"
SLOT_DIAL = "B2"

###########################################
#  VARIABLES - END
###########################################

metadata = {
    "protocolName": "Inner Well Geometry Creator",
    "author": "ABR"
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

DIAL_PORT = None
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]
RUN_ID = ""
FILE_NAME = ""
CSV_SEPARATOR = ","


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    from hardware_testing import protocols
    protocols.create_labware_parameters(parameters)
    
    parameters.add_bool(
        display_name="Quick Mode",
        variable_name="quick_mode",
        description="If true, dial indicator is not used and tips are reused.",
        default=False,
    )

    parameters.add_bool(
        display_name="Reservoir Used?",
        variable_name="reservoir_used",
        description="If true, a reservoir is used for liquid pipetting.",
        default=False,
    )


def _setup(ctx: ProtocolContext) -> Tuple[
    InstrumentContext,
    InstrumentContext,
    Labware,
    Labware,
    Labware,
    Labware,
    Labware,
    float,
    bool
]:
    global DIAL_PORT, RUN_ID, FILE_NAME

    reservoir_used = ctx.params.reservoir_used  # type: ignore[attr-defined]
    quick_mode = ctx.params.quick_mode  # type: ignore[attr-defined]

    liquid_rack = ctx.load_labware(f"opentrons_flex_96_tiprack_{LIQUID_TIP_SIZE}uL", SLOT_LIQUID_TIPRACK)
    probing_rack = ctx.load_labware(f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL", SLOT_PROBING_TIPRACK)

    if reservoir_used:
        liquid_pip_name = f"flex_8channel_{LIQUID_PIPETTE_SIZE}"
    else:
        liquid_pip_name = f"flex_1channel_{LIQUID_PIPETTE_SIZE}"
    probing_pip_name = f"flex_1channel_{PROBING_PIPETTE_SIZE}"

    liq_pipette = ctx.load_instrument(liquid_pip_name, LIQUID_MOUNT)
    probe_pipette = ctx.load_instrument(probing_pip_name, PROBING_MOUNT)

    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    src_well = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")
    ethanol = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src_well["A1"].load_liquid(ethanol, src_well["A1"].max_volume - 1000)

    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    max_volume = labware["A1"].max_volume

    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import Mitutoyo_Digimatic_Indicator

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(metadata["protocolName"], RUN_ID, f"{LIQUID_MOUNT}-{liquid_rack.load_name}")
        _write_line_to_csv(ctx, [RUN_ID])
        _write_line_to_csv(ctx, [LIQUID_MOUNT])
        _write_line_to_csv(ctx, [liquid_rack.load_name])
        _write_line_to_csv(ctx, [labware_type])
        _write_line_to_csv(ctx, [max_volume / STEPS])
        _write_line_to_csv(ctx, ["depth", str(labware["A1"].depth)])

    step_volume = max_volume / STEPS

    return (
        liq_pipette,
        probe_pipette,
        probing_rack,
        liquid_rack,
        labware,
        src_well,
        dial,
        step_volume,
        quick_mode,
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


def _store_dial_baseline(ctx: ProtocolContext, pipette: InstrumentContext, dial: Labware, front_channel: bool = False) -> None:
    global DIAL_POS_WITHOUT_TIP
    idx = 0 if not front_channel else 1
    if DIAL_POS_WITHOUT_TIP[idx] is not None:
        return
    DIAL_POS_WITHOUT_TIP[idx] = _read_dial_indicator(ctx, pipette, dial, front_channel)
    tag = f"DIAL-BASELINE-{idx}"
    _write_line_to_csv(ctx, [tag, str(DIAL_POS_WITHOUT_TIP[idx])])


def _write_line_to_csv(ctx: ProtocolContext, line: List[str]) -> None:
    if ctx.is_simulating():
        return
    from hardware_testing.data import append_data_to_file
    line_str = f"{CSV_SEPARATOR.join(line)}\n"
    append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)


def _get_tip_z_error(ctx: ProtocolContext, pipette: InstrumentContext, dial: Labware, front_channel: bool = False) -> float:
    idx = 0 if not front_channel else 1
    baseline = DIAL_POS_WITHOUT_TIP[idx]
    assert baseline is not None
    new_val = _read_dial_indicator(ctx, pipette, dial, front_channel)
    return (new_val - baseline) * -1.0


def _get_height_of_liquid_in_well(pipette: InstrumentContext, well: Well, simulating: bool) -> float:
    if pipette.detect_liquid_presence(well) and not simulating:
        return pipette.measure_liquid_height(well) - well.bottom().point.z
    return 0.0


def aspirate_and_dispense(liq_pipette, src_well, labware, step_volume):
    liq_pipette.aspirate(step_volume, src_well["A1"].bottom(ASPIRATE_MM_FROM_BOTTOM))
    liq_pipette.dispense(step_volume, labware["A1"].bottom(DISPENSE_MM_FROM_BOTTOM))


def run(ctx: ProtocolContext) -> None:
    (
        liq_pipette,
        probe_pipette,
        probing_rack,
        liquid_rack,
        labware,
        src_well,
        dial,
        step_volume,
        quick_mode,
    ) = _setup(ctx)

    if not quick_mode:
        for _ in range(STEPS):
            _store_dial_baseline(ctx, probe_pipette, dial)
            probe_pipette.pick_up_tip(probing_rack)
            liq_pipette.pick_up_tip(liquid_rack)
            tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
            height = probe_pipette.measure_liquid_height(labware["A1"])
            corrected_height = height + tip_z_error
            probe_pipette.move_to(labware["A1"].bottom())
            probe_pipette.drop_tip()

            probe_pipette.pick_up_tip(probing_rack)
            aspirate_and_dispense(liq_pipette, src_well, labware, step_volume)
            tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
            probe_pipette.drop_tip()
            liq_pipette.drop_tip()

            probe_pipette.pick_up_tip(probing_rack)
            liq_pipette.pick_up_tip(liquid_rack)
            tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
            _get_height_of_liquid_in_well(probe_pipette, labware["A1"], ctx.is_simulating())
            probe_pipette.drop_tip()
            liq_pipette.drop_tip()
    else:
        probe_pipette.pick_up_tip(probing_rack)
        liq_pipette.pick_up_tip(liquid_rack)
        tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
        for _ in range(STEPS):
            aspirate_and_dispense(liq_pipette, src_well, labware, step_volume)
            _get_height_of_liquid_in_well(liq_pipette, labware["A1"], ctx.is_simulating())

    if liq_pipette.has_tip:
        liq_pipette.drop_tip()
    if probe_pipette.has_tip:
        probe_pipette.drop_tip()
