"""Inner Well Geometry Validator Protocol.

This protocol should be used to validate inner well geometry definitions of labware.
"""

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    InstrumentContext,
    ParameterContext,
    Well,
    SINGLE,
)
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference,
)
from typing import List, Optional, Union, Tuple
from opentrons.types import Point
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult

###########################################
#  GLOBAL VARIABLES - START
###########################################

LABWARE = "example_labware"  # change to desired labware

SLOT_LIQUID_TIPRACKS = ["D3", "B3"]
SLOT_PROBING_TIPRACK = "D2"
SLOT_LABWARE = "D1"
SLOT_RESERVOIR = "C1"
SLOT_DIAL = "B2"
CSV_SEPARATOR = ""
RUN_ID = ""
FILE_NAME = ""
DIAL_PORT = None
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]

###########################################
#  GLOBAL VARIABLES - END
###########################################

metadata = {"protocolName": "volume-validator", "author": "hovan.ngo@opentrons.com"}
requirements = {"robotType": "Flex", "apiLevel": "2.24"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
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

    parameters.add_int(
        variable_name="n_regions",
        display_name="Number of Regions",
        description="Number of depth intervals to test. ",
        default=3,
        minimum=2,
        maximum=20,
    )

    parameters.add_int(
        variable_name="number_of_trials",
        display_name="trials per region",
        description="Number of trials per region.",
        default=3,
        minimum=1,
        maximum=20,
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
        description="Used to calibrate tip overlap.",
        default=True,
    )


def _setup(
    ctx: ProtocolContext,
) -> Tuple[
    InstrumentContext,
    InstrumentContext,
    Labware,
    Labware,
    List[float],
    Optional[Labware],
    int,
    str,
    List[Labware],
    InstrumentContext,
    str,
    int,
    List[float],
]:
    global DIAL_PORT, RUN_ID, FILE_NAME, LABWARE

    left_mount = ctx.params.left_mount  # type: ignore[attr-defined]
    right_mount = ctx.params.right_mount  # type: ignore[attr-defined]
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]
    n_regions = ctx.params.n_regions  # type: ignore[attr-defined]
    number_of_trials = ctx.params.number_of_trials  # type: ignore[attr-defined]
    dial_indicator_used = ctx.params.dial_indicator_used  # type: ignore[attr-defined]

    labware_type = LABWARE
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    labware.load_empty(labware.wells())

    src = ctx.load_labware("nest_1_reservoir_290ml", SLOT_RESERVOIR)
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ctx.load_trash_bin("A3")

    dial = (
        ctx.load_labware("dial_indicator", SLOT_DIAL) if dial_indicator_used else None
    )

    liquid_racks = [
        ctx.load_labware(f"opentrons_flex_96_tiprack_{liq_tip_size}ul", slot)
        for slot in SLOT_LIQUID_TIPRACKS
    ]
    probe_tip_rack = ctx.load_labware(
        "opentrons_flex_96_tiprack_50ul", SLOT_PROBING_TIPRACK
    )
    probe_pipette = ctx.load_instrument(left_mount, "left", tip_racks=[probe_tip_rack])
    liq_pipette = ctx.load_instrument(right_mount, "right", tip_racks=liquid_racks)
    if liq_pipette.channels == 8:
        liq_pipette.configure_nozzle_layout(
            style=SINGLE, start="H1", tip_racks=liquid_racks
        )

    if not ctx.is_simulating():
        from hardware_testing.data import create_file_name, create_run_id

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

        if dial and DIAL_PORT is None:
            from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
                Mitutoyo_Digimatic_Indicator,
            )

            DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
            DIAL_PORT.connect()

    # Calculate region heights
    max_vol = labware["A1"].max_volume
    max_height = extract_float(labware["A1"].height_from_volume(max_vol))
    if n_regions == 3:
        # special case: 3.0mm, 50%, 100%
        region_heights = [3.0, max_height * 0.5, max_height]
    else:
        segment_vol = max_vol / float(n_regions)
        region_heights = [
            extract_float(labware["A1"].height_from_volume(segment_vol * (i + 1)))
            for i in range(n_regions)
        ]

    expected_heights: List = []
    for height in region_heights:
        expected_heights.extend([height] * number_of_trials)

    return (
        liq_pipette,
        probe_pipette,
        src,
        labware,
        expected_heights,
        dial,
        number_of_trials,
        labware_type,
        liquid_racks,
        right_mount,
        liq_tip_size,
        n_regions,
        region_heights,
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


def extract_float(result: Union[float | SimulatedProbeResult]) -> float:
    """Extract float."""
    if isinstance(result, SimulatedProbeResult):
        return result.net_liquid_exchanged_after_probe
    return float(result)


def _get_height_of_liquid_in_well(
    pipette: InstrumentContext, well: Well, simulating: bool
) -> float:
    """Get height of liquid in well."""
    if not simulating:
        return extract_float(pipette.measure_liquid_height(well))
    else:
        return 0.01


def aspirate_dispense_measure(
    ctx: ProtocolContext,
    volumes_dict: dict,
    labware: Labware,
    src: Labware,
    dial: Optional[Labware],
    probe_pipette: InstrumentContext,
    liq_pipette: InstrumentContext,
    expected_heights: list[float],
    liquid_racks: list[Labware],
    right_mount: InstrumentContext,
    liq_tip_size: str,
) -> list[float]:
    """Aspirate from source, dispense into labware, measure height, and record results."""
    all_corrected_heights: list[float] = []
    num_wells = len(volumes_dict)
    tip_z_error = 0.0
    meniscus_z = -0.5
    dispense_offset = 10

    for trial, (well, vol_list) in enumerate(volumes_dict.items()):
        expected_vol = float(vol_list[0])
        pick_up_tips(probe_pipette, liq_pipette)

        no_more_wells = trial != 0 and trial % num_wells == 0
        if no_more_wells:
            ctx.pause("Dump the labware and replace it.")
            _get_height_of_liquid_in_well(liq_pipette, src["A1"], ctx.is_simulating())

        if dial:
            tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)

        dispense_vol = expected_vol / liq_pipette.active_channels
        expected_height = expected_heights[trial]

        lm = "liquid-meniscus"
        liq_pipette.flow_rate.blow_out = 200 if liq_tip_size == "1000" else 50
        ethanol = ctx.get_liquid_class(name="ethanol_80")
        for rack in liquid_racks:
            ethanol_props = ethanol.get_for(right_mount, rack)
            ethanol_props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
            ethanol_props.aspirate.aspirate_position.offset.z = meniscus_z
            ethanol_props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
            ethanol_props.dispense.dispense_position.offset.z = dispense_offset
            ethanol_props.dispense.flow_rate_by_volume.set_for_all_volumes(50)
            ethanol_props.dispense.submerge.speed = 50
            ethanol_props.dispense.retract.speed = 50
            ethanol_props.dispense.push_out_by_volume.set_for_all_volumes(5)
            ethanol_props.dispense.retract.blowout.flow_rate = (
                liq_pipette.flow_rate.blow_out
            )
            ethanol_props.dispense.retract.blowout.enabled = False
            ethanol_props.dispense.retract.end_position.position_reference = (
                PositionReference.WELL_TOP
            )
            ethanol_props.dispense.retract.end_position.offset.z = 10

        liq_pipette.transfer_with_liquid_class(
            liquid_class=ethanol,
            volume=dispense_vol,
            source=src["A1"],
            dest=labware[well],
            new_tip="never",
            return_tip=False,
        )

        # Touch tip if clearance allows
        if expected_height <= labware["A1"].depth - 4:
            liq_pipette.touch_tip()

        height = _get_height_of_liquid_in_well(
            probe_pipette, labware[well], ctx.is_simulating()
        )
        corrected_height = height + tip_z_error
        all_corrected_heights.append(corrected_height)

        acc = (corrected_height - expected_height) / expected_height * 100
        line_for_csv = [well, expected_vol, corrected_height, expected_height, acc]
        _write_line_to_csv(ctx, line_for_csv)

        drop_tips(probe_pipette, liq_pipette)

    return all_corrected_heights


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
        liquid_racks,
        right_mount,
        liq_tip_size,
        n_regions,
        region_heights,
    ) = _setup(ctx)

    wells = [str(well).split(" ")[0] for well in labware.wells()]
    volumes: dict[str, List[float | SimulatedProbeResult]] = {}

    # mapping expected heights to wells
    for i, height in enumerate(expected_heights):
        well = wells[i % len(wells)]
        volume = labware["A1"].volume_from_height(height)
        volumes.setdefault(well, []).append(volume)

    if dial is not None:
        _store_dial_baseline(ctx, probe_pipette, dial)
    pick_up_tips(probe_pipette, liq_pipette)
    _get_height_of_liquid_in_well(liq_pipette, src["A1"], ctx.is_simulating())
    liq_pipette.blow_out()
    liq_pipette.drop_tip()

    all_corrected_heights = aspirate_dispense_measure(
        ctx,
        volumes,
        labware,
        src,
        dial,
        probe_pipette,
        liq_pipette,
        expected_heights,
        liquid_racks,
        right_mount,
        liq_tip_size,
    )

    region_results: List[str] = []
    region_len = number_of_trials

    if not ctx.is_simulating():
        for i in range(n_regions):
            start = i * region_len
            end = (i + 1) * region_len
            corrected = all_corrected_heights[start:end]
            expected_val = region_heights[i]
            errors = [abs(c - expected_val) for c in corrected]
            avg_error = sum(errors) / len(errors) if errors else 0.0

            # Add corrected heights
            region_results.extend(str(round(c, 3)) for c in corrected)
            # Add expected value
            region_results.append(str(round(expected_val, 3)))
            # Add average error
            region_results.append(str(round(avg_error, 3)))

        from hardware_testing.data import append_data_to_file

        region_headers = []
        for i in range(n_regions):
            for k in range(region_len):
                region_headers.append(f"region{i+1}_trial{k+1}")
            region_headers.append(f"region{i+1}_expected")
            region_headers.append(f"region{i+1}_avg_error")

        header = ["labware_type"] + region_headers
        header_str = ",".join(header) + "\n"
        line = [labware_type] + region_results
        line_str = ",".join(line) + "\n"

        append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, header_str)
        append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)
        ctx.pause(f"{header_str}\n{line_str}")

    drop_tips(probe_pipette, liq_pipette)
