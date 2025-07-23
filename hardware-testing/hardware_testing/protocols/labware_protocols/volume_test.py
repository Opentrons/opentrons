"""volume test."""

from typing import List, Tuple, Optional
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Labware,
    LiquidClass,
)
from opentrons.types import Point
from typing import Union
from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError
from opentrons.protocol_engine.types.liquid_level_detection import SimulatedProbeResult


###########################################
#  VARIABLES - START
###########################################

ASPIRATE_MM_FROM_BOTTOM = 5
DISPENSE_MM_FROM_BOTTOM = 5
RESERVOIR = "nest_1_reservoir_195ml"
DEFAULT_STEPS = 18  # change later

LIQUID_MOUNT = "right"
LIQUID_PIPETTE_SIZE = 1000
LIQUID_TIP_SIZE = 1000

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50

SLOT_LIQUID_TIPRACK = ["C3", "C1", "B1"]
SLOT_PROBING_TIPRACK = "D3"
SLOT_LABWARE = "D2"
SLOT_RESERVOIR = "C2"
SLOT_DIAL = "B2"

# below threshold, alpha low. above threshold, alpha high
THRESHOLD = 3.5
# sensitivity values for bottom and top zones:
ALPHA_LOW = 0.8
ALPHA_HIGH = 0.5


###########################################
#  VARIABLES - END
###########################################

metadata = {"protocolName": "volume-test", "author": "ABR"}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

DIAL_PORT = None
DIAL_PORT_NAME = "/dev/ttyUSB0"
DIAL_POS_WITHOUT_TIP: List[Optional[float]] = [None, None]
RUN_ID = ""
FILE_NAME = ""
CSV_SEPARATOR = ""
CSV_HEADER = ["well", "volume", "diff", "cheight"]


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    from hardware_testing import protocols

    protocols.create_pipette_parameters(parameters)

    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[
            {"display_name": "corning 24", "value": "corning_24_wellplate_3.4ml_flat"},
            {"display_name": "axygen", "value": "axygen_96_wellplate_500ul"},
            {"display_name": "smc 384", "value": "smc_384_read_plate"},
            {"display_name": "ibidi", "value": "ibidi_96_square_well_plate_300ul"},
            {"display_name": "nest 24", "value": "nest_24_wellplate_10.4ml"},
            {
                "display_name": "applied24",
                "value": "appliedbiosystemsmicroamp_384_wellplate_40ul",
            },
            {
                "display_name": "opentrons96",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
            {"display_name": "usa 12 22ml", "value": "usascientific_12_reservoir_22ml"},
            {"display_name": "nest 96 2ml", "value": "nest_96_wellplate_2ml_deep"},
        ],
        default="corning_24_wellplate_3.4ml_flat",
    )

    parameters.add_float(
        variable_name="labware_version",
        display_name="Labware Version",
        description="Version of the labware to use.",
        default=3,
        maximum=10,
        minimum=1.0,
    )
    parameters.add_float(
        variable_name="meniscus_submerge_depth",
        display_name="Meniscus Submerge Depth",
        description="Amount of distance tip is below meniscus",
        default=-2,
        minimum=-5,
        maximum=5,
    )

    parameters.add_bool(
        variable_name="handheld_pipette", display_name="handheld pipette", default=False
    )


def _setup(
    ctx: ProtocolContext,
) -> Tuple[
    InstrumentContext, InstrumentContext, Labware, Labware, Labware, LiquidClass, bool
]:

    global DIAL_PORT, RUN_ID, FILE_NAME

    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]

    # pipettes
    liquid_pip_name = f"flex_1channel_{LIQUID_PIPETTE_SIZE}"
    probing_pip_name = f"flex_1channel_{PROBING_PIPETTE_SIZE}"

    # tipracks
    liquid_tip_racks = [
        ctx.load_labware(
            f"opentrons_flex_96_tiprack_{LIQUID_TIP_SIZE}uL", SLOT_LIQUID_TIPRACK[i]
        )
        for i in range(3)
    ]

    probing_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL", SLOT_PROBING_TIPRACK
    )

    # load pipettes w tipracks
    liq_pipette = ctx.load_instrument(
        liquid_pip_name, LIQUID_MOUNT, tip_racks=liquid_tip_racks
    )
    probe_pipette = ctx.load_instrument(
        probing_pip_name, PROBING_MOUNT, tip_racks=[probing_rack]
    )

    # load labware + dial
    labware = ctx.load_labware(
        labware_type, SLOT_LABWARE, version=ctx.params.labware_version
    )
    labware.load_empty(labware.wells())
    src = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    # liquid classing
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ethanol = ctx.get_liquid_class("ethanol_80")
    lm = "liquid-meniscus"
    for liq_rack in liquid_tip_racks:
        props = ethanol.get_for(liq_pipette, liq_rack)
        meniscus_z = ctx.params.meniscus_submerge_depth  # type: ignore[attr-defined]
        props.aspirate.aspirate_position.position_reference = lm
        props.aspirate.aspirate_position.offset.z = meniscus_z
        props.dispense.dispense_position.position_reference = lm
        props.dispense.dispense_position.offset.z = 2
        try:
            props.dispense.dispense_position.offset.x = (labware["A1"].diameter) / 2
        except TypeError:
            props.dispense.dispense_position.offset.x = 0

    handheld_pipette = ctx.params.handheld_pipette  # type: ignore[attr-defined]

    if not ctx.is_simulating() and DIAL_PORT is None:
        from hardware_testing.data import create_file_name, create_run_id
        from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
            Mitutoyo_Digimatic_Indicator,
        )

        DIAL_PORT = Mitutoyo_Digimatic_Indicator(port=DIAL_PORT_NAME)
        DIAL_PORT.connect()
        RUN_ID = create_run_id()
        FILE_NAME = create_file_name(
            metadata["protocolName"],
            RUN_ID,
            f"{LIQUID_MOUNT}-{liquid_racks[0].load_name}",
        )
        _write_line_to_csv(ctx, [RUN_ID])
        _write_line_to_csv(ctx, [liquid_pip_name])
        _write_line_to_csv(ctx, [probing_pip_name])
        _write_line_to_csv(ctx, [labware_type])
        _write_line_to_csv(ctx, ["depth", str(labware["A1"].depth)])
        lpc = str(labware._core.get_calibrated_offset())
        _write_line_to_csv(ctx, ["LPC Offset", labware.load_name, lpc])

    return (liq_pipette, probe_pipette, labware, src, dial, ethanol, handheld_pipette)


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

    formatted_line = [str(item).ljust(30) for item in line]
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


def run(ctx: ProtocolContext) -> None:
    """Protocol entry point."""
    (
        liq_pipette,
        probe_pipette,
        labware,
        src,
        dial,
        ethanol,
        handheld_pipette,
    ) = _setup(ctx)

    # Initialize state
    tip_z_error = 0.0
    height = 0.0
    corrected_height = 0.0
    diff = 0.0

    _store_dial_baseline(ctx, probe_pipette, dial)
    _write_line_to_csv(ctx, CSV_HEADER)

    def pick_up_tips() -> None:
        if not probe_pipette.has_tip:
            probe_pipette.pick_up_tip()
        if not liq_pipette.has_tip:
            liq_pipette.pick_up_tip()

    def drop_tips() -> None:
        if probe_pipette.has_tip:
            probe_pipette.drop_tip()
        if liq_pipette.has_tip:
            liq_pipette.drop_tip()

    def write_trial_log(
        well: str, volume: float, diff: float, corrected_height: float
    ) -> None:
        trial_data = [well, volume, diff, corrected_height]
        _write_line_to_csv(ctx, [str(d) for d in trial_data])

    ################ Begin Protocol

    volumes = [0.5, 1000] * 5
    wells = list(labware.wells_by_name().keys())[: len(volumes)]
    liq_pipette.pick_up_tip()
    liq_pipette.measure_liquid_height(src["A1"])
    liq_pipette.drop_tip()

    for volume, well in zip(volumes, wells):
        if handheld_pipette:
            probe_pipette.pick_up_tip()
        else:
            pick_up_tips()
        tip_z_error = _get_tip_z_error(ctx, probe_pipette, dial)

        if handheld_pipette:
            ctx.pause(f"Fill with {volume}")
        else:
            liq_pipette.transfer_with_liquid_class(
                ethanol,
                volume,
                src["A1"],
                labware[well],
                new_tip="never",
                return_tip=False,
            )
        # probe well
        height = probe_pipette.measure_liquid_height(labware[well])
        corrected_height = height + tip_z_error

        api_vol = labware[well].height_from_volume(volume)
        diff = api_vol - corrected_height

        write_trial_log(well, volume, diff, corrected_height)
        drop_tips()
