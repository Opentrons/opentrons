"""Volume Validator Protocol."""

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    InstrumentContext,
    ParameterContext,
    Well,
)
from typing import List, Dict, Optional, Union, Tuple
from opentrons.types import Point
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult

# LABWARE TYPE
LABWARE = "nunc_384_wellplate_100ul" # change to desired labware

# SLOTS
SLOT_LIQUID_TIPRACKS = ["C3", "B3", "A2"]
SLOT_PROBING_TIPRACK = "D3"
SLOT_LABWARE = "D2"
SLOT_RESERVOIR = "C2"
SLOT_DIAL = "B2"
CSV_SEPARATOR = ""
RUN_ID = ""
FILE_NAME = ""
DIAL_PORT = None
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]

metadata = {"protocolName": "volume-validator"}
requirements = {"robotType": "Flex", "apiLevel": "2.24"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
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
    List[float],
    Labware,
    int,
    str,
]:
    global DIAL_PORT, RUN_ID, FILE_NAME, LABWARE 
    labware_type = LABWARE  

    # LOAD LABWARE AND DIAL
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    number_of_trials = int(3)
    labware.load_empty(labware.wells())
    src = ctx.load_labware("nest_1_reservoir_290ml", SLOT_RESERVOIR)
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ctx.load_trash_bin("A3")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)
    left_mount = ctx.params.left_mount  # type: ignore[attr-defined]
    right_mount = ctx.params.right_mount  # type: ignore[attr-defined]
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]

    liq_tip_racks = [
        ctx.load_labware(f"opentrons_flex_96_tiprack_{liq_tip_size}ul", slot)
        for slot in SLOT_LIQUID_TIPRACKS
    ]
    probe_tip_rack = ctx.load_labware(
        "opentrons_flex_96_tiprack_50ul", SLOT_PROBING_TIPRACK
    )
    if labware["A1"].max_volume > 500:
        liq_racks = liq_tip_racks
    else:
        liq_racks = liq_tip_racks[:1]

    probe_pipette = ctx.load_instrument(left_mount, "left", tip_racks=[probe_tip_rack])
    liq_pipette = ctx.load_instrument(right_mount, "right", tip_racks=liq_racks)

    # Connect dial indicator and create data sheet

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
        _write_line_to_csv(ctx, [labware_type])
        heading_for_csv = [
            "Well",
            "Volume (ul)",
            "Height (mm)",
            "Expected Height",
            "Error %",
        ]
        _write_line_to_csv(ctx, heading_for_csv)

    # Find expected heights for each labware definition
    depth = labware["A1"].depth

    low_height = 3
    middle_height = depth / 2
    high_height = depth - 3

    expected_heights = (
        [low_height] * number_of_trials  # low height
        + [middle_height] * number_of_trials  # mid height
        + [high_height] * number_of_trials  # high height
    )

    return (
        liq_pipette,
        probe_pipette,
        src,
        labware,
        expected_heights,
        dial,
        number_of_trials,
        labware_type,
    )


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
    tag = f"DIAL-BASELINE-{idx}"
    _write_line_to_csv(ctx, [tag, str(DIAL_POS_WITHOUT_TIP[idx])])


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


def _write_line_to_csv(ctx: ProtocolContext, line: List[str]) -> None:
    if ctx.is_simulating():
        return
    from hardware_testing.data import append_data_to_file

    formatted_line = [str(item).ljust(23) for item in line]
    line_str = f"{CSV_SEPARATOR.join(formatted_line)}\n"
    append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)


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


def aspirate_dispense_measure(
    ctx: ProtocolContext,
    volumes_dict: Dict,
    labware: Labware,
    src: Labware,
    dial: Labware,
    probe_pipette: InstrumentContext,
    liq_pipette: InstrumentContext,
    expected_heights: List[float],
) -> List[float]:
    """Aspirate from source, dispense into labware, measure height, record."""
    all_corrected_heights: List[float] = []
    i = 0
    num_of_individual_wells = len(volumes_dict.keys())

    for well, expected_vol in volumes_dict.items():
        expected_vol = expected_vol[0]
        pick_up_tips(probe_pipette, liq_pipette)

        if i != 0 and i % num_of_individual_wells == 0:
            ctx.pause("Dump the labware and resume.")
            _get_height_of_liquid_in_well(liq_pipette, src["A1"], ctx.is_simulating())

        tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)

        dispense_vol = float(expected_vol / liq_pipette.channels)

        expected_height = expected_heights[i]
        liq_pipette.flow_rate.dispense = min(max(dispense_vol / 10, 100), 25)
        liq_pipette.flow_rate.blow_out = 1000
        if len(list(labware.wells_by_name().keys())) <= 96:
            dispense_loc = labware[well].bottom(z=expected_height + 8)
        else:
            dispense_loc = labware[well].bottom(z=expected_height + 1.5)

        liq_pipette.transfer(
            dispense_vol * 1.033,
            src["A1"].meniscus(z=-2, target="end"),
            dispense_loc,
            new_tip="never",
            return_tip=False,
            blow_out=False,
            blowout_location="destination well",
            air_gap=15,
        )
        liq_pipette.blow_out(dispense_loc.move(Point(z=3)))

        height = _get_height_of_liquid_in_well(
            probe_pipette, labware[well], ctx.is_simulating()
        )
        corrected_height = height + tip_z_error
        all_corrected_heights.append(corrected_height)
        acc = (corrected_height - expected_height) / expected_height * 100
        line_for_csv = [
            well,
            expected_vol,
            corrected_height,
            expected_height,
            acc,
        ]
        i += 1
        _write_line_to_csv(ctx, line_for_csv)
        drop_tips(probe_pipette, liq_pipette)
    return all_corrected_heights


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    (
        liq_pipette,
        probe_pipette,
        src,
        labware,
        expected_heights,
        dial,
        number_of_trials,
        labware_type,
    ) = _setup(ctx)

    wells = [str(w).split(" ")[0] for w in labware.wells()]
    volumes: dict[str, List[float | SimulatedProbeResult]] = {}
    for i, height in enumerate(expected_heights):
        well = wells[i % len(wells)]
        volume = labware["A1"].volume_from_height(height)
        volumes.setdefault(well, []).append(volume)

    _store_dial_baseline(ctx, probe_pipette, dial)
    # Pick up Tips
    pick_up_tips(probe_pipette, liq_pipette)
    _get_height_of_liquid_in_well(liq_pipette, src["A1"], ctx.is_simulating())
    liq_pipette.blow_out()

    all_corrected_heights = aspirate_dispense_measure(
        ctx,
        volumes,
        labware,
        src,
        dial,
        probe_pipette,
        liq_pipette,
        expected_heights,
    )

    region_names = ["low", "middle", "high"]
    region_heights = list(dict.fromkeys(expected_heights))
    region_results = []

    region_len = number_of_trials
    if not ctx.is_simulating():
        for i, region in enumerate(region_names):
            start = i * region_len
            end = (i + 1) * region_len
            corrected = all_corrected_heights[start:end]
            expected_val = region_heights[i]
            errors = [abs(c - expected_val) for c in corrected]
            avg_error = sum(errors) / len(errors) if errors else 0.0
            region_results.extend(
                [str(round(c, 3)) for c in corrected]
                + [str(round(expected_val, 3))]
                + [str(round(avg_error, 3))]
            )

        from hardware_testing.data import append_data_to_file

        line = [labware_type] + region_results
        line_str = ",".join(line) + "\n"
        append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)
        ctx.pause(f"Results: {line_str}")

    drop_tips(probe_pipette, liq_pipette)


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
