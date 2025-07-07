"""inner-well-geometry-creator Protocol."""

from typing import List, Tuple, Optional
from opentrons.protocol_api import ProtocolContext, ParameterContext, InstrumentContext, Well, Labware
from opentrons.types import Point

###########################################
#  VARIABLES - START
###########################################

ASPIRATE_MM_FROM_BOTTOM = 5
DISPENSE_MM_FROM_BOTTOM = 5
RESERVOIR = "nest_1_reservoir_290ml"
STEPS = 18  # optimize later

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

###########################################
#  VARIABLES - END
###########################################

metadata = {
    "protocolName": "inner-well-geometry-creator",
    "author": "ABR"
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

DIAL_PORT = None
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]
RUN_ID = ""
FILE_NAME = ""
CSV_SEPARATOR = ""
CSV_HEADER = ["steps", "volume", "height", "tip-z-error", "cheight"]

def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    from hardware_testing import protocols
    protocols.create_pipette_parameters(parameters)
    #protocols.create_labware_parameters(parameters)
    
    parameters.add_bool(
        display_name="Quick Mode",
        variable_name="quick_mode",
        description="If true, dial indicator is not used and tips are reused.",
        default=True,
    )

    parameters.add_bool(
        display_name="Reservoir Used?",
        variable_name="reservoir_used",
        description="If true, a reservoir is used for liquid pipetting.",
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
            {"display_name": "nest 8", "value": "nest_24_wellplate_10.4ml"},
        ],
        default="corning_24_wellplate_3.4ml_flat",
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
        #change to 8 channel later 
        liquid_pip_name = f"flex_1channel_{LIQUID_PIPETTE_SIZE}"
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
    step_volume = max_volume / STEPS

    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import Mitutoyo_Digimatic_Indicator

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(metadata["protocolName"], RUN_ID, f"{LIQUID_MOUNT}-{liquid_rack.load_name}")
        _write_line_to_csv(ctx, [RUN_ID])
        _write_line_to_csv(ctx, [liquid_pip_name])
        _write_line_to_csv(ctx, [probing_pip_name])
        _write_line_to_csv(ctx, [labware_type])
        _write_line_to_csv(ctx, ["step vol", str(step_volume)])
        _write_line_to_csv(ctx, ["steps", str(STEPS)])
        _write_line_to_csv(ctx, ["depth", str(labware["A1"].depth)])


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


def _get_tip_z_error(ctx: ProtocolContext, pipette: InstrumentContext, dial: Labware, front_channel: bool = False) -> float:
    idx = 0 if not front_channel else 1
    baseline = DIAL_POS_WITHOUT_TIP[idx]
    assert baseline is not None
    new_val = _read_dial_indicator(ctx, pipette, dial, front_channel)
    return (new_val - baseline) * -1.0


def _get_height_of_liquid_in_well(pipette: InstrumentContext, well: Well, simulating: bool) -> float:
    if pipette.detect_liquid_presence(well) and not simulating:
        return pipette.measure_liquid_height(well)
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

    _store_dial_baseline(ctx, probe_pipette, dial)
    volume_dispensed = 0
    _write_line_to_csv(ctx, CSV_HEADER)

    if probe_pipette.has_tip:
        probe_pipette.drop_tip()
    if liq_pipette.has_tip:
        liq_pipette.drop_tip()

    if not quick_mode:
        for step in range(STEPS):
            # Pick up new tips
            probe_pipette.pick_up_tip(probing_rack)
            liq_pipette.pick_up_tip(liquid_rack)

            # Measure tip z error at the start of the step
            tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)

            # Measure source liquid height
            if step == 0:
                src_height = liq_pipette.measure_liquid_height(src_well["A1"])
                height = round(_get_height_of_liquid_in_well(probe_pipette, labware["A1"], ctx.is_simulating()), 5)
                corrected_height = height + tip_z_error
                volume_dispensed = 0
            else:
                aspirate_and_dispense(liq_pipette, src_well, labware, step_volume)
                volume_dispensed = volume_dispensed + step_volume
                height = _get_height_of_liquid_in_well(probe_pipette, labware["A1"], ctx.is_simulating())
                corrected_height = height + tip_z_error
                # Stop if height exceeds well depth
                #ctx.comment("well depth: " + str(labware["A1"].depth))
                #if corrected_height >= labware["A1"].depth:
                    #return

            # Log data
            trial_data = [
                step,
                volume_dispensed,
                height,
                round(tip_z_error, 5),
                corrected_height,

            ]
            _write_line_to_csv(ctx, [str(d) for d in trial_data])

            probe_pipette.drop_tip()
            liq_pipette.drop_tip()

    else:
        probe_pipette.pick_up_tip(probing_rack)
        liq_pipette.pick_up_tip(liquid_rack)
        tip_z_error = round(_get_tip_z_error(ctx, probe_pipette, dial),5)

        for step in range(STEPS):
            if step == 0:
                height = round(_get_height_of_liquid_in_well(probe_pipette, labware["A1"], ctx.is_simulating()), 5)
                corrected_height = height + tip_z_error
                volume_dispensed = 0
            else: 
                aspirate_and_dispense(liq_pipette, src_well, labware, step_volume)
                volume_dispensed = round(volume_dispensed + step_volume, 5)
                height = round(_get_height_of_liquid_in_well(probe_pipette, labware["A1"], ctx.is_simulating()), 5)
                corrected_height = height + tip_z_error
                # Stop if height exceeds well depth
                #if corrected_height < 0 and not step == 0: #theres gotta be a better way to see when the height passes the well depth
                    #return
            trial_data = [
                step,
                volume_dispensed,
                height,
                tip_z_error,
                corrected_height
            ]
            _write_line_to_csv(ctx, [str(d) for d in trial_data])

        liq_pipette.drop_tip()
        probe_pipette.drop_tip()

    if liq_pipette.has_tip:
        liq_pipette.drop_tip()
    if probe_pipette.has_tip:
        probe_pipette.drop_tip()
