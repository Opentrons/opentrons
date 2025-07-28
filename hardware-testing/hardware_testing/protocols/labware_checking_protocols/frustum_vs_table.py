"""Compare Performance of Frustum Definition vs User Defined Volumes."""

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    InstrumentContext,
    ParameterContext,
    LiquidClass,
)
from typing import List, Dict, Optional
from opentrons.types import Point

# SLOTS
SLOT_LIQUID_TIPRACKS = ["C3", "B3", "A2"]
SLOT_PROBING_TIPRACK = "D3"
SLOT_FRUSTUM_LABWARE = "D2"
SLOT_UDV_LABWARE = "D1"
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
        variable_name="labware_version_of_frustum",
        display_name="Labware Version of Frustum",
        maximum=10,
        minimum=1,
        default=3,
    )
    parameters.add_int(
        variable_name="labware_version_of_table",
        display_name="Labware Version of Table",
        maximum=10,
        minimum=1,
        default=4,
    )
    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[
            {"display_name": "corning 24", "value": "corning_24_wellplate_3.4ml_flat"},
            {
                "display_name": "usa96deep",
                "value": "usascientific_96_wellplate_2.4ml_deep",
            },
            {
                "display_name": "opentrons96",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
            {"display_name": "usa 12 22ml", "value": "usascientific_12_reservoir_22ml"},
            {"display_name": "nest 96 2ml", "value": "nest_96_wellplate_2ml_deep"},
            {
                "display_name": "appliedbiosystems 384",
                "value": "appliedbiosystemsmicroamp_384_wellplate_40ul",
            },
            {"display_name": "nest 195 ml", "value": "nest_1_reservoir_195ml"},
        ],
        default="usascientific_96_wellplate_2.4ml_deep",
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
) -> None:
    """Aspirate from source, dispense into labware, measure height, record."""
    i = 0
    for well, vol in volumes_dict.items():
        if len(labware.wells()) == 12 and i == 11:
            ctx.pause("Empty Labware")
            print(f"empty labware at well {well}")
        pick_up_tips(probe_pipette, liq_pipette)
        tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)
        fill_with_manual_pipette = ctx.params.fill_with_manual_pipette  # type: ignore[attr-defined]
        if not fill_with_manual_pipette:
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


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    global DIAL_PORT, RUN_ID, FILE_NAME
    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]
    # LOAD LABWARE AND DIAL
    frustum_version = ctx.params.labware_version_of_frustum  # type: ignore[attr-defined]
    frustum_labware = ctx.load_labware(
        labware_type, SLOT_FRUSTUM_LABWARE, version=frustum_version
    )
    frustum_labware.load_empty(frustum_labware.wells())
    udv_version = ctx.params.labware_version_of_table  # type: ignore[attr-defined]
    udv_labware = ctx.load_labware(labware_type, SLOT_UDV_LABWARE, version=udv_version)
    udv_labware.load_empty(udv_labware.wells())
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
        f"flex_{channel_num}channel_1000", "left", tip_racks=liq_racks
    )
    probe_pipette = ctx.load_instrument(
        "flex_1channel_50", "right", tip_racks=[probe_tip_rack]
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
    num_of_rows = 3
    low_height = 3
    mid_height = frustum_labware["A1"].depth / 2
    high_height = frustum_labware["A1"].depth - 3
    heights = [low_height, mid_height, high_height]
    frustum_volumes = {}
    udv_volumes = {}
    for i in range(num_of_rows):
        try:
            wells_in_row = frustum_labware.rows()[i]
        except IndexError:
            wells_in_row = frustum_labware.rows()[0]
        well_names = [str(well).split(" ")[0] for well in wells_in_row][:6]
        frustum_vol = frustum_labware["A1"].volume_from_height(heights[i])
        ud_vol = udv_labware["A1"].volume_from_height(heights[i])
        for well in well_names:
            frustum_volumes[well] = frustum_vol
            udv_volumes[well] = ud_vol
    # Pick up Tips
    pick_up_tips(probe_pipette, liq_pipette)

    # Find Height of Source Reservoir
    liq_pipette.measure_liquid_height(src["A1"])
    liq_pipette.drop_tip()

    # FRUSTUM DEFINITION
    _write_line_to_csv(
        ctx,
        [
            "FRUSTUM LABWARE",
            f"Labware Version: {frustum_version}",
        ],
    )
    aspirate_dispense_measure(
        ctx,
        frustum_volumes,
        frustum_labware,
        src,
        dial,
        probe_pipette,
        liq_pipette,
        ethanol,
    )

    # USER DEFINED DEFINITION
    _write_line_to_csv(
        ctx,
        [
            "USER DEFINED LABWARE",
            f"Labware Version: {udv_version}",
        ],
    )
    aspirate_dispense_measure(
        ctx, udv_volumes, udv_labware, src, dial, probe_pipette, liq_pipette, ethanol
    )
