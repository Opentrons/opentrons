"""Measure Liquid Height."""
from typing import List, Tuple, Optional
from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    Well,
    InstrumentContext,
)
from opentrons.types import Point

###########################################
#  VARIABLES - START
###########################################
# TODO: use runtime-variables instead of constants

VOLUMES = [7, 10, 15, 25, 40, 60, 100, 200]
NUM_TRIALS = 12
DISPENSE_MM_FROM_BOTTOM = 2
LABWARE = "armadillo_96_wellplate_200ul_pcr_full_skirt"

ASPIRATE_MM_FROM_BOTTOM = 5
RESERVOIR = "nest_1_reservoir_195ml"

LIQUID_MOUNT = "right"
LIQUID_TIP_SIZE = 200
LIQUID_PIPETTE_SIZE = 1000

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50

SLOT_LIQUID_TIPRACK = "C3"
SLOT_PROBING_TIPRACK = "D3"
SLOT_LABWARE = "D1"
SLOT_RESERVOIR = "C1"
SLOT_DIAL = "B3"

###########################################
#  VARIABLES - END
###########################################

metadata = {"protocolName": "SIGLER-lld-test-liquid-height"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}

_all_96_well_names = [f"{r}{c + 1}" for c in range(12) for r in "ABCDEFGH"]
_first_row_well_names = [f"A{c + 1}" for c in range(12)]
TEST_WELLS = {
    1: {  # channel count
        "corning_96_wellplate_360ul_flat": _all_96_well_names,
        "armadillo_96_wellplate_200ul_pcr_full_skirt": _all_96_well_names,
    }
}

DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_PORT = None
RUN_ID = ""
FILE_NAME = ""
CSV_HEADER = ["trial", "volume", "height", "tip-z-error", "corrected-height"]
CSV_SEPARATOR = ","


def _setup(
    ctx: ProtocolContext,
) -> Tuple[
    InstrumentContext,
    Labware,
    InstrumentContext,
    Labware,
    Labware,
    Labware,
    Labware,
]:
    global DIAL_PORT, RUN_ID, FILE_NAME
    # TODO: use runtime-variables instead of constants
    ctx.load_trash_bin("A3")

    liquid_rack_name = f"opentrons_flex_96_tiprack_{LIQUID_TIP_SIZE}uL"
    liquid_rack = ctx.load_labware(liquid_rack_name, SLOT_LIQUID_TIPRACK)
    probing_rack_name = f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL"
    probing_rack = ctx.load_labware(probing_rack_name, SLOT_PROBING_TIPRACK)

    liquid_pip_name = f"flex_1channel_{LIQUID_PIPETTE_SIZE}"
    liquid_pipette = ctx.load_instrument(liquid_pip_name, LIQUID_MOUNT)
    probing_pip_name = f"flex_1channel_{PROBING_PIPETTE_SIZE}"
    probing_pipette = ctx.load_instrument(probing_pip_name, PROBING_MOUNT)

    reservoir = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    labware = ctx.load_labware(LABWARE, SLOT_LABWARE)
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
            Mitutoyo_Digimatic_Indicator,
        )

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(
            metadata["protocolName"], RUN_ID, f"{liquid_pip_name}-{liquid_rack_name}"
        )
        _write_line_to_csv(ctx, [RUN_ID])
        _write_line_to_csv(ctx, [liquid_pip_name])
        _write_line_to_csv(ctx, [liquid_rack_name])
        _write_line_to_csv(ctx, [LABWARE])
    return (
        liquid_pipette,
        liquid_rack,
        probing_pipette,
        probing_rack,
        labware,
        reservoir,
        dial,
    )


def _write_line_to_csv(ctx: ProtocolContext, line: List[str]) -> None:
    if ctx.is_simulating():
        return
    from hardware_testing.data import append_data_to_file

    line_str = f"{CSV_SEPARATOR.join(line)}\n"
    append_data_to_file(metadata["protocolName"], RUN_ID, FILE_NAME, line_str)


def _get_test_wells(labware: Labware, channels: int) -> List[Well]:
    return [labware[w] for w in TEST_WELLS[channels][labware.load_name]]


def _get_test_tips(rack: Labware, channels: int) -> List[Well]:
    if channels == 96:
        test_tips = [rack["A1"]]
    elif channels == 8:
        test_tips = rack.rows()[0]
    else:
        test_tips = rack.wells()
    return test_tips


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
    pipette.move_to(target.move(Point(z=10)))
    pipette.move_to(target)
    ctx.delay(seconds=2)
    if ctx.is_simulating():
        return 0.0
    dial_port = DIAL_PORT.read()  # type: ignore[union-attr]
    pipette.move_to(target.move(Point(z=10)))
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
    idx = 0 if not front_channel else 1
    dial_baseline_for_this_channel = DIAL_POS_WITHOUT_TIP[idx]
    assert dial_baseline_for_this_channel is not None
    new_val = _read_dial_indicator(ctx, pipette, dial, front_channel)
    z_error = new_val - dial_baseline_for_this_channel
    # NOTE: dial-indicators are upside-down, so we need to flip the values
    return z_error * -1.0


def _get_height_of_liquid_in_well(
    pipette: InstrumentContext,
    well: Well,
) -> float:
    return pipette.measure_liquid_height(well) - well.bottom().point.z


def _test_for_finding_liquid_height(
    ctx: ProtocolContext,
    volume: float,
    liquid_pipette: InstrumentContext,
    probing_pipette: InstrumentContext,
    dial: Labware,
    liquid_tips: List[Well],
    probing_tips: List[Well],
    src_well: Well,
    wells: List[Well],
) -> None:
    assert len(liquid_tips) == len(
        probing_tips
    ), f"{len(liquid_tips)},{len(probing_tips)}"
    assert len(liquid_tips) == len(wells), f"{len(liquid_tips)},{len(wells)}"
    trial_counter = 0
    _store_dial_baseline(ctx, probing_pipette, dial)
    _write_line_to_csv(ctx, CSV_HEADER)
    all_corrected_heights: List[float] = []

    for liq_tip, probe_tip, well in zip(liquid_tips, probing_tips, wells):
        trial_counter += 1
        # pickup probing tip, then measure Z-error
        probing_pipette.pick_up_tip(probe_tip)
        tip_z_error = _get_tip_z_error(ctx, probing_pipette, dial)
        # pickup liquid tip, then immediately transfer liquid
        liquid_pipette.pick_up_tip(liq_tip)
        liquid_pipette.flow_rate.aspirate = min(volume, 10)
        liquid_pipette.flow_rate.dispense = min(liquid_pipette.flow_rate.aspirate, 50)
        liquid_pipette.flow_rate.blow_out = 100
        liquid_pipette.aspirate(volume, src_well.bottom(ASPIRATE_MM_FROM_BOTTOM))
        if volume <= 195:
            liquid_pipette.aspirate(5, src_well.top(2))
            liquid_pipette.dispense(5, well.top(5))
        liquid_pipette.dispense(volume, well.bottom(DISPENSE_MM_FROM_BOTTOM))
        ctx.delay(seconds=1.5)
        liquid_pipette.move_to(well.top())
        ctx.delay(seconds=1.5)
        liquid_pipette.blow_out(well.top())
        ctx.delay(seconds=1.5)
        liquid_pipette.prepare_to_aspirate()
        # get height of liquid
        height = _get_height_of_liquid_in_well(probing_pipette, well)
        corrected_height = height + tip_z_error
        all_corrected_heights.append(corrected_height)
        # drop all tips
        liquid_pipette.drop_tip()
        probing_pipette.drop_tip()
        # save data
        trial_data = [trial_counter, volume, height, tip_z_error, corrected_height]
        _write_line_to_csv(ctx, [str(d) for d in trial_data])

    avg = sum(all_corrected_heights) / len(all_corrected_heights)
    error_mm = (max(all_corrected_heights) - min(all_corrected_heights)) * 0.5
    error_percent = error_mm / avg if avg else 0.0
    _write_line_to_csv(ctx, ["average", str(round(avg, 3))])
    _write_line_to_csv(ctx, ["error (mm)", str(round(error_mm, 3))])
    _write_line_to_csv(ctx, ["error (%)", str(round(error_percent * 100, 1))])


def run(ctx: ProtocolContext) -> None:
    """Run."""
    liq_pipette, liq_rack, probe_pipette, probe_rack, labware, reservoir, dial = _setup(
        ctx
    )
    test_wells = _get_test_wells(labware, channels=1)
    test_tips_liquid = _get_test_tips(liq_rack, channels=1)
    test_tips_probe = _get_test_tips(probe_rack, channels=1)
    stuff_lengths = len(test_tips_liquid), len(test_tips_probe), len(test_wells)
    assert min(stuff_lengths) >= NUM_TRIALS * len(VOLUMES), f"{stuff_lengths}"
    for _vol in VOLUMES:
        _test_for_finding_liquid_height(
            ctx,
            _vol,
            liq_pipette,
            probe_pipette,
            dial,
            liquid_tips=test_tips_liquid[:NUM_TRIALS],
            probing_tips=test_tips_probe[:NUM_TRIALS],
            src_well=reservoir["A1"],
            wells=test_wells[:NUM_TRIALS],
        )
        test_wells = test_wells[NUM_TRIALS:]
        test_tips_liquid = test_tips_liquid[NUM_TRIALS:]
        test_tips_probe = test_tips_probe[NUM_TRIALS:]
