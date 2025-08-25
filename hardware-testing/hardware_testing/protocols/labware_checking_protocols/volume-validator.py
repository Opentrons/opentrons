"""Volume Validator Protocol"""

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    InstrumentContext,
    ParameterContext,
    LiquidClass,
    OFF_DECK,
)
from itertools import cycle
from typing import List, Dict, Optional, Any
from opentrons.types import Point


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

    parameters.add_int(
        variable_name="number_of_trials",
        display_name="Number of Trials",
        maximum=6,
        minimum=1,
        default=3,
    )
    
    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[
            {
                "display_name": "dorf150yellow",
                "value": "eppendorf_96_wellplate_150ul_custom",
            },
            {
                "display_name": "dorf250",
                "value": "eppendorf_96_wellplate_250ul_custom",
            },
            {
                "display_name": "dorf384yellow",
                "value": "eppendorf_384_wellplate_45ul_custom",
            },
            {
                "display_name": "dorf500",
                "value": "eppendorf_96_wellplate_500ul_custom",
            },
            {
                "display_name": "dorf1000",
                "value": "eppendorf_96_wellplate_1000ul_custom",
            },

        ],
        default="eppendorf_96_wellplate_1000ul_custom",
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

def _write_line_to_csv(ctx: ProtocolContext, line: List[str]) -> None:
    if ctx.is_simulating():
        return
    from hardware_testing.data import append_data_to_file

    formatted_line = [str(item).ljust(23) for item in line]
    line_str = f"{CSV_SEPARATOR.join(formatted_line)}\n"
    append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)


def aspirate_dispense_measure(
    ctx: ProtocolContext,
    volumes_dict: Dict,
    labware: Labware,
    src: Labware,
    dial: Labware,
    probe_pipette: InstrumentContext,
    liq_pipette: InstrumentContext,
    #ethanol: LiquidClass,
) -> Labware:
    """Aspirate from source, dispense into labware, measure height, record."""
    all_corrected_heights: List[float] = []
    i = 0
    num_of_individual_wells = len(volumes_dict.keys())
   
    for well, expected_vol in volumes_dict.items():
        expected_vol = expected_vol[0]
        pick_up_tips(probe_pipette, liq_pipette)

        if i != 0 and i % num_of_individual_wells == 0:
            ctx.pause("Dump the labware and resume.")
            liq_pipette.measure_liquid_height(src["A1"])

        tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
    
        #liq_pipette.transfer_with_liquid_class(
        #    ethanol,
        #    expected_vol / liq_pipette.channels,
        #    src["A1"],
        #    labware[well],
        #    new_tip="never",
        #    return_tip=False,
        #)

        expected_height = labware[well].height_from_volume(expected_vol)
        dispense_loc = labware[well].bottom(z= expected_height + 2.5)
        liq_pipette.flow_rate.dispense = min(labware["A1"].max_volume/ 20, 400) #change later 
        liq_pipette.transfer(
            (expected_vol / liq_pipette.channels) * 1.033,
            src["A1"].meniscus(z=-2, target="end"),
            dispense_loc,
            new_tip="never",
            return_tip=False,
            blow_out = True,
            blowout_location="destination well",
            air_gap=5,
        )

        height = probe_pipette.measure_liquid_height(labware[well])
        corrected_height = height + tip_z_error
        all_corrected_heights.append(corrected_height)
        expected_height = labware[well].height_from_volume(expected_vol)
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
    global DIAL_PORT, RUN_ID, FILE_NAME
    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]

    # LOAD FRUSTUM LABWARE AND DIAL
    labware = ctx.load_labware(labware_type, SLOT_LABWARE)
    number_of_trials = ctx.params.number_of_trials  # type: ignore[attr-defined]
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
    liq_pipette = ctx.load_instrument(
        right_mount, "right", tip_racks=liq_racks
    )
    probe_pipette = ctx.load_instrument(
        left_mount, "left", tip_racks=[probe_tip_rack]
    )

    # Assign ethanol liquid class behavior
    #ethanol = ctx.get_liquid_class("ethanol_80")
    #lm = "liquid-meniscus"
    #for liquid_rack in liq_racks:
    #    props = ethanol.get_for(liq_pipette, liquid_rack)
    #    meniscus_z = -0.5
    #    props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
    #    props.aspirate.aspirate_position.offset.z = meniscus_z
    #    props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
    #    props.dispense.dispense_position.offset.z = meniscus_z

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

    combined_heights = (
        [low_height] * number_of_trials  # low height
        + [middle_height] * number_of_trials  # mid height
        + [high_height] * number_of_trials  # high height
    )
    wells = [str(w).split(" ")[0] for w in labware.wells()]
    volumes = {}
    for i, height in enumerate(combined_heights):
        well = wells[i % len(wells)]
        volumes.setdefault(well, []).append(labware["A1"].volume_from_height(height))

    _store_dial_baseline(ctx, probe_pipette, dial)
    # Pick up Tips
    pick_up_tips(probe_pipette, liq_pipette)
    liq_pipette.measure_liquid_height(src["A1"])
    liq_pipette.blow_out()

    all_corrected_heights = aspirate_dispense_measure(
        ctx,
        volumes,
        labware,
        src,
        dial,
        probe_pipette, 
        liq_pipette,
        #ethanol,
    )

    region_names = ["low", "middle", "high"]
    region_heights = [low_height, middle_height, high_height]
    region_results = []

    region_len = number_of_trials
    if not ctx.is_simulating():
        for i, region in enumerate(region_names):
            start = i * region_len
            end = (i + 1) * region_len
            corrected = all_corrected_heights[start:end]
            expected_val = labware["A1"].height_from_volume(
                labware["A1"].volume_from_height(region_heights[i])
            )
            errors = [abs(c - expected_val) for c in corrected]
            avg_error = sum(errors) / len(errors) if errors else 0.0
            region_results.extend(
                [str(round(c, 3)) for c in corrected] +
                [str(round(expected_val, 3))] +
                [str(round(avg_error, 3))]
            )

        from hardware_testing.data import append_data_to_file

        line = [labware_type] + region_results
        line_str = ",".join(line) + "\n"
        append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)


    drop_tips(probe_pipette, liq_pipette)

