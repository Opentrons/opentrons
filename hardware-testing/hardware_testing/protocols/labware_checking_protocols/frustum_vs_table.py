"""Compare Performance of Frustum Definition vs User Defined Volumes."""

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
SLOT_FRUSTUM_LABWARE = "D2"
SLOT_RESERVOIR = "C2"
SLOT_DIAL = "B2"
CSV_SEPARATOR = ""
RUN_ID = ""
FILE_NAME = ""
DIAL_PORT = None
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]

metadata = {"protocolName": "Compare Labware Definitions"}
requirements = {"robotType": "Flex", "apiLevel": "2.24"}


def _write_line_to_csv(ctx: ProtocolContext, line: List[str]) -> None:
    if ctx.is_simulating():
        return
    from hardware_testing.data import append_data_to_file

    formatted_line = [str(item).ljust(23) for item in line]
    line_str = f"{CSV_SEPARATOR.join(formatted_line)}\n"
    append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)


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
    dial_port = DIAL_PORT.read()  # type: ignore[attr-defined]
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
    tag = f"DIAL-BASELINE-{idx}"
    _write_line_to_csv(ctx, [tag, str(DIAL_POS_WITHOUT_TIP[idx])])


def _get_tip_z_error(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    dial: Labware,
    front_channel: bool = False,
) -> float:
    if not ctx.is_simulating():
        idx = 0 if not front_channel else 1
        baseline = DIAL_POS_WITHOUT_TIP[idx]
        assert baseline is not None
        new_val = _read_dial_indicator(ctx, pipette, dial, front_channel)
        return (new_val - baseline) * -1.0
    else:
        return 0.0


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="number_of_trials",
        display_name="Number of Trials",
        maximum=6,
        minimum=3,
        default=3,
    )
    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[

            {"display_name": "eppendorf1000 test", "value": "eppendorf_96_wellplate_1000ul_custom"},
        ],
        default="eppendorf_96_wellplate_1000ul_custom",
    )
    parameters.add_bool(
        variable_name="fill_with_manual_pipette",
        display_name="Fill with Manual Pipette",
        default=False,
    )


def aspirate_dispense_measure(
    ctx: ProtocolContext,
    volumes_dict: Dict,
    labware: Labware,
    src: Labware,
    dial: Labware,
    probe_pipette: InstrumentContext,
    liq_pipette: InstrumentContext,
    ethanol: LiquidClass,
) -> Labware:
    """Aspirate from source, dispense into labware, measure height, record."""
    i = 0
    labware_type = labware.load_name
    num_of_individual_wells = len(volumes_dict.keys())
    if num_of_individual_wells == 1:
        for vol_list in volumes_dict.values():
            well = "A1"
            for vol in vol_list:
                pick_up_tips(probe_pipette, liq_pipette)
                tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
                fill_with_manual_pipette = ctx.params.fill_with_manual_pipette  # type: ignore[attr-defined]
                if not fill_with_manual_pipette:
                    # Find Height of Source Reservoir
                    liq_pipette.measure_liquid_height(src["A1"])
                    liq_pipette.blow_out()
                    liq_pipette.transfer_with_liquid_class(
                        ethanol,
                        vol if liq_pipette.channels == 1 else vol / 8,
                        src["A1"],
                        labware[well],
                        new_tip="never",
                        return_tip=False,
                    )
                else:
                    ctx.pause(f"Fill {well} with {vol}")
                height = probe_pipette.measure_liquid_height(labware[well])
                corrected_height = height + tip_z_error
                expected_height = labware[well].height_from_volume(vol)
                acc = (corrected_height - expected_height) / expected_height * 100
                line_for_csv = [
                    well,
                    vol,
                    corrected_height,
                    expected_height,
                    acc,
                ]
                _write_line_to_csv(ctx, line_for_csv)
                drop_tips(probe_pipette, liq_pipette)
                ctx.move_labware(labware, OFF_DECK, use_gripper=False)
                labware = ctx.load_labware(labware_type, SLOT_FRUSTUM_LABWARE)
                labware.load_empty(labware.wells())
                i += 1
    else:
        # Inspect volumes_dict
        for well, vol in volumes_dict.items():
            vol = vol[0]
            pick_up_tips(probe_pipette, liq_pipette)
            tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
            fill_with_manual_pipette = ctx.params.fill_with_manual_pipette  # type: ignore[attr-defined]
            if not fill_with_manual_pipette:
                # Find Height of Source Reservoir
                liq_pipette.measure_liquid_height(src["A1"])
                liq_pipette.blow_out()
                print(vol)
                liq_pipette.transfer_with_liquid_class(
                    ethanol,
                    vol if liq_pipette.channels == 1 else vol / 8,
                    src["A1"],
                    labware[well],
                    new_tip="never",
                    return_tip=False,
                )
            else:
                ctx.pause(f"Fill {well} with {vol}")
            height = probe_pipette.measure_liquid_height(labware[well])
            corrected_height = height + tip_z_error
            expected_height = labware[well].height_from_volume(vol)
            acc = (corrected_height - expected_height) / expected_height * 100
            line_for_csv = [
                well,
                vol,
                corrected_height,
                expected_height,
                acc,
            ]
            _write_line_to_csv(ctx, line_for_csv)
            drop_tips(probe_pipette, liq_pipette)
            i += 1
    return labware


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    global DIAL_PORT, RUN_ID, FILE_NAME
    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]

    # LOAD FRUSTUM LABWARE AND DIAL
    frustum_labware = ctx.load_labware(labware_type, SLOT_FRUSTUM_LABWARE)
    number_of_trials = ctx.params.number_of_trials  # type: ignore[attr-defined]
    frustum_labware.load_empty(frustum_labware.wells())
    src = ctx.load_labware("nest_1_reservoir_290ml", SLOT_RESERVOIR)
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ctx.load_trash_bin("A3")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    # LOAD TIP RACKS AND PIPETTES
    if frustum_labware["A1"].max_volume < 100:
        liq_rack_vol = 50
    else:
        liq_rack_vol = 1000

    liq_tip_racks = [
        ctx.load_labware(f"opentrons_flex_96_tiprack_{liq_rack_vol}ul", slot)
        for slot in SLOT_LIQUID_TIPRACKS
    ]
    probe_tip_rack = ctx.load_labware(
        "opentrons_flex_96_tiprack_50ul", SLOT_PROBING_TIPRACK
    )
    if frustum_labware["A1"].max_volume > 500:
        liq_racks = liq_tip_racks
    else:
        liq_racks = liq_tip_racks[:1]
    if len(frustum_labware.wells()) <= 12:
        channel_num = 8
    else:
        channel_num = 1
    liq_pipette = ctx.load_instrument(
        f"flex_{channel_num}channel_1000", "right", tip_racks=liq_racks
    )
    probe_pipette = ctx.load_instrument(
        "flex_1channel_50", "left", tip_racks=[probe_tip_rack]
    )

    # Assign ethanol liquid class behavior
    ethanol = ctx.get_liquid_class("ethanol_80")
    lm = "liquid-meniscus"
    for liquid_rack in liq_racks:
        props = ethanol.get_for(liq_pipette, liquid_rack)
        meniscus_z = -0.5
        props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
        props.aspirate.aspirate_position.offset.z = meniscus_z
        props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
        props.dispense.dispense_position.offset.z = meniscus_z

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
        _store_dial_baseline(ctx, probe_pipette, dial)
        heading_for_csv = [
            "Well",
            "Volume (ul)",
            "Height (mm)",
            "Expected Height",
            "Frustum Acc (%)",
        ]
        _write_line_to_csv(ctx, heading_for_csv)

    # Find expected heights for each labware definition
    combined_heights = (
        [3] * number_of_trials  # low height
        + [frustum_labware["A1"].depth / 2] * number_of_trials  # mid height
        + [frustum_labware["A1"].depth - 7] * number_of_trials  # high hight
    )
    frustum_volumes: Dict[str, List[Any]] = {}
    udv_volumes: Dict[str, List[Any]] = {}
    wells_list = frustum_labware.wells()
    wells_cycled = cycle(wells_list)
    for height in combined_heights:
        well = str(next(wells_cycled)).split(" ")[0]
        frustum_vol = frustum_labware["A1"].volume_from_height(height)
        if well not in frustum_volumes:
            frustum_volumes[well] = []
        frustum_volumes[well].append(frustum_vol)
    # Pick up Tips
    pick_up_tips(probe_pipette, liq_pipette)

    # FRUSTUM DEFINITION
    _write_line_to_csv(
        ctx,
        [
            "FRUSTUM LABWARE",
        ],
    )
    frustum_labware = aspirate_dispense_measure(
        ctx,
        frustum_volumes,
        frustum_labware,
        src,
        dial,
        probe_pipette,
        liq_pipette,
        ethanol,
    )

    drop_tips(probe_pipette, liq_pipette)

    ctx.move_labware(frustum_labware, OFF_DECK, use_gripper=False)
    udv_labware_type = labware_type
    udv_labware = ctx.load_labware(udv_labware_type, SLOT_FRUSTUM_LABWARE)
    udv_labware.load_empty(udv_labware.wells())

    wells_cycled = cycle(wells_list)
    for height in combined_heights:
        well = str(next(wells_cycled)).split(" ")[0]
        udv_volume = udv_labware["A1"].volume_from_height(height)
        if well not in udv_volumes:
            udv_volumes[well] = []
        udv_volumes[well].append(udv_volume)
    pick_up_tips(probe_pipette, liq_pipette)
    # USER DEFINED DEFINITION
    _write_line_to_csv(
        ctx,
        [
            "USER DEFINED LABWARE",
        ],
    )
    aspirate_dispense_measure(
        ctx, udv_volumes, udv_labware, src, dial, probe_pipette, liq_pipette, ethanol
    )
