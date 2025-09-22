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
from typing import List, Dict, Optional, Union, Tuple
from opentrons.types import Point
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult

# LABWARE TYPE
LABWARE = "example_labware"  # change to desired labware

# SLOTS
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

metadata = {"protocolName": "volume-validator"}
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
            {"display_name": "None", "value": "none"},
        ],
        default="flex_1channel_50",
    )
    # Right Mount
    parameters.add_str(
        variable_name="right_mount",
        display_name="Right Mount",
        description="Liquid Pipette Type on Right Mount.",
        choices=[
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "None", "value": "none"},
        ],
        default="flex_1channel_1000",
    )

    parameters.add_int(
        variable_name="n_regions",
        display_name="Number of Regions",
        description="Number of depth intervals to test. ",
        default=3,
        minimum=1,
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
    List[Labware],
    InstrumentContext,
    str,
    int,
    List[float],
]:
    global DIAL_PORT, RUN_ID, FILE_NAME, LABWARE

    labware_type = LABWARE

    # LOAD LABWARE AND DIAL
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    number_of_trials = int(2)
    labware.load_empty(labware.wells())
    src = ctx.load_labware("nest_1_reservoir_290ml", SLOT_RESERVOIR)
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ctx.load_trash_bin("A3")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)
    left_mount = ctx.params.left_mount  # type: ignore[attr-defined]
    right_mount = ctx.params.right_mount  # type: ignore[attr-defined]
    liq_tip_size = ctx.params.liq_tip_size  # type: ignore[attr-defined]
    n_regions = ctx.params.n_regions  # type: ignore[attr-defined]
    number_of_trials = ctx.params.number_of_trials  # type: ignore[attr-defined]

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

    depth = labware["A1"].depth

    # Calculate region heights based on n_regions
    region_heights: List[float]
    if n_regions == 3:
        region_heights = [3, depth / 2, depth * 9 / 10]
    else:
        region_heights = [(depth * (i + 1) / n_regions) for i in range(n_regions)]

    if region_heights:
        max_vol = labware["A1"].max_volume
        max_height = extract_float(labware["A1"].height_from_volume(max_vol))
        for i, h in enumerate(region_heights):
            if h > max_height:
                region_heights[
                    i
                ] = max_height  # must be lower than height at max volume
            if h < 1.5:
                region_heights[i] = 1.5  # must be 1.5mm or higher

    expected_heights = []
    for h in region_heights:
        expected_heights.extend([h] * number_of_trials)

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
    volumes_dict: Dict,
    labware: Labware,
    src: Labware,
    dial: Labware,
    probe_pipette: InstrumentContext,
    liq_pipette: InstrumentContext,
    expected_heights: List[float],
    liquid_racks: List[Labware],
    right_mount: InstrumentContext,
    liq_tip_size: str,
) -> List[float]:
    """Aspirate from source, dispense into labware, measure height, record."""
    all_corrected_heights: List[float] = []
    i = 0
    num_of_individual_wells = len(volumes_dict.keys())

    for well, expected_vol in volumes_dict.items():
        expected_vol = expected_vol[0]
        pick_up_tips(probe_pipette, liq_pipette)

        if i != 0 and i % num_of_individual_wells == 0:
            if not ctx.is_simulating():
                ctx.pause("Dump the labware and resume.")
                _get_height_of_liquid_in_well(
                    liq_pipette, src["A1"], ctx.is_simulating()
                )
            else:
                break

        tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
        dispense_vol = float(expected_vol / liq_pipette.active_channels)
        expected_height = expected_heights[i]

        if liq_tip_size == "1000":
            liq_pipette.flow_rate.blow_out = 200
        else:
            liq_pipette.flow_rate.blow_out = 50

        meniscus_z = -0.5
        dispense_offset = 10  # type: ignore [attr-defined]
        ethanol = ctx.get_liquid_class(name="ethanol_80")

        lm = "liquid-meniscus"
        for rack in liquid_racks:
            ethanol_props = ethanol.get_for(right_mount, rack)
            # Aspirate settings
            ethanol_props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
            ethanol_props.aspirate.aspirate_position.offset.z = meniscus_z  # type: ignore[assignment]
            # Dispense settings
            ethanol_props.dispense.dispense_position.offset.z = dispense_offset  # type: ignore [attr-defined]
            ethanol_props.dispense.dispense_position.position_reference = (
                PositionReference.LIQUID_MENISCUS
            )  # type: ignore [attr-defined]
            # Flow rates and speeds (example values, can be parameterized)
            ethanol_props.dispense.flow_rate_by_volume.set_for_all_volumes(50)  # type: ignore [attr-defined]
            ethanol_props.dispense.submerge.speed = 50  # type: ignore [attr-defined]
            ethanol_props.dispense.retract.speed = 50  # type: ignore [attr-defined]
            ethanol_props.dispense.push_out_by_volume.set_for_all_volumes(3.5)  # type: ignore [attr-defined]
            ethanol_props.dispense.retract.blowout.flow_rate = (
                liq_pipette.flow_rate.blow_out
            )  # type: ignore [attr-defined]
            ethanol_props.dispense.retract.blowout.enabled = False  # type: ignore [attr-defined]
            ethanol_props.dispense.retract.end_position.position_reference = (  # type: ignore [attr-defined]
                PositionReference.WELL_TOP
            )  # type: ignore [attr-defined]
            ethanol_props.dispense.retract.end_position.offset.z = 10  # type: ignore [attr-defined]

        liq_pipette.transfer_with_liquid_class(
            liquid_class=ethanol,
            volume=dispense_vol,
            source=src["A1"],
            dest=labware[well],
            new_tip="never",
            return_tip=False,
        )
        if (
            expected_heights[i] <= labware["A1"].depth - 4
        ):  # checks if theres clearance for touch tip
            liq_pipette.touch_tip()

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

    wells = [str(w).split(" ")[0] for w in labware.wells()]
    volumes: dict[str, List[float | SimulatedProbeResult]] = {}
    for i, height in enumerate(expected_heights):
        well = wells[i % len(wells)]
        volume = labware["A1"].volume_from_height(height)
        volumes.setdefault(well, []).append(volume)

    _store_dial_baseline(ctx, probe_pipette, dial)
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

        line = [labware_type] + region_results
        line_str = ",".join(line) + "\n"
        append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)
        ctx.pause(f"Results:\n{line_str}")

    drop_tips(probe_pipette, liq_pipette)
