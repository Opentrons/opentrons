"""Flex ABR Low Volumes."""
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional, Literal, Tuple, cast, Union, Any

from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.types import OT3Mount
from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    InstrumentContext,
    Labware,
    Well,
    LiquidClass as TransferClass,
)
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons.protocol_api.instrument_context import _DEFAULT_ASPIRATE_CLEARANCE
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.types import Point

from opentrons_shared_data.deck import (
    Z_PREP_OFFSET,
    get_calibration_square_position_in_slot,
)
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference as PosRef,
)
from opentrons_shared_data.pipette.types import LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP


metadata = {"protocolName": "Flex ABR Low Volumes"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]


# NOTE: protocol's goal is to COMPARE the performance of STRATEGIES
class _Strategy(str, Enum):
    DYE_M = "MENISCUS"
    DYE_LLD_M = "LLD-MENISCUS"
    DYE_LLD_TIP_M = "LLD-TIP-MENISCUS"
    DYE_B = "BOTTOM"
    DYE_T = "TOP"
    DILUENT = "DILUENT"
    DYE_SRC = "DYE-SOURCE"

    def includes(self, key: str) -> bool:
        """Includes."""
        return key in self.value


# NOTE: strategies alternate across destination plate rows, so that during
#       runtime strategies are not grouped by time (pipette goes down columns)
TEST_MATRIX: Dict[str, Dict[str, _Strategy]] = {
    "A": {"aspirate": _Strategy.DYE_LLD_TIP_M, "dispense": _Strategy.DYE_M},
    "B": {"aspirate": _Strategy.DYE_M, "dispense": _Strategy.DYE_M},
    "C": {"aspirate": _Strategy.DYE_LLD_M, "dispense": _Strategy.DYE_M},
    "D": {"aspirate": _Strategy.DYE_B, "dispense": _Strategy.DYE_T},
    "E": {"aspirate": _Strategy.DYE_LLD_TIP_M, "dispense": _Strategy.DYE_M},
    "F": {"aspirate": _Strategy.DYE_M, "dispense": _Strategy.DYE_M},
    "G": {"aspirate": _Strategy.DYE_LLD_M, "dispense": _Strategy.DYE_M},
    "H": {"aspirate": _Strategy.DYE_B, "dispense": _Strategy.DYE_B},
}


# FIXME: (sigler) change to "dynamic" after bug in API is fixed
#        where liquid volumes in wells aren't tracked correctly
DEFAULT_TIP_MENISCUS_TARGET: Literal["start", "end", "dynamic"] = "end"

TIP_VOLUME = 50
PIP_VOLUME = 50

DEFAULT_TARGET_BY_PLATE = [0.5, 1.0, 2.0, 5.0]  # maximum 4x plates

DEFAULT_DYE_WELLS = ["A1", "B1", "C1", "D1", "E1", "F1"]

# NOTE: (sigler) do not edit the values below, they are from PRODUCTION
# FIXME: (sigler) figure out where this -1.5 should be defined in production
#        software, and then import it into this protocol
DEFAULT_SUBMERGE_MM = -1.5  # NOTE: defined in hardware-testing + liquid-classes
DEFAULT_WELL_BOTTOM_MM = float(_DEFAULT_ASPIRATE_CLEARANCE)  # 1mm
NON_CONTACT_DISPENSE_MM = float(LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP.z)  # 2mm

# hardcoded distances for when pressure-probing the calibration square
PROBE_START_HEIGHT_ABOVE_EXPECTED_MM = 10.0
PROBE_OVERSHOOT_BELOW_EXPECTED_MM = 5.0

# NOTE: (sigler) disabling formatter here, b/c spatial deck-maps are nice...
# fmt: off
SLOTS: Dict[str, str] = {
    "de_static":    "A1",   "tip_50_1":     "A2",   "tip_50_0": "A3",   "tip_50_2": "A4",
    "trash":        "B1",   "empty":        "B2",   "tip_dilu": "B3",   "tip_50_3": "B4",
    "empty_stack":  "C1",   "empty_dst":    "C2",   "res":      "C3",   "tip_50_4": "C4",
    "stack":        "D1",   "pcr":          "D2",   "dye":      "D3",   "tip_50_5": "D4",
}
# fmt: on

# NOTE: (sigler) do not edit, 200 is from Artel
MVS_TARGET_UL = 200.0
# NOTE: (sigler) do not edit, 250 is from Opentrons HW internal testing
MVS_MAX_UL = 250.0
# alternates (200,100,200,etc.) every column
DILUENT_UL_BY_COLUMN = [MVS_TARGET_UL, MVS_TARGET_UL / 2] * 6

DEAD_VOL_PER_LABWARE = {
    "nest_12_reservoir_15ml": 3000,
    "nest_96_wellplate_2ml_deep": 50,
    # TODO: (sigler) reduce this to find actual dead-vol of pcr plate
    "opentrons_96_wellplate_200ul_pcr_full_skirt": 20,
}

DYE_LABWARE = "nest_96_wellplate_2ml_deep"
SRC_LABWARE = "opentrons_96_wellplate_200ul_pcr_full_skirt"
DILUENT_LABWARE = "nest_12_reservoir_15ml"

# FIXME: (sigler) let's add the Artel (aka Corning?) lid ("plate_lid")
#        to shared-data in a separate pull-request, and modify the
#        Corning plate to be stackable with it
DST_LABWARE = "stackable_corning_96_wellplate_360ul_flat"
PLATE_LID_LOAD_NAME = "plate_lid"
DE_STATIC_LOAD_NAME = "de_static_bar"

# global so we don't need to pass it around everywhere
_test_volumes: List[float] = []
_inaccessible_tip_racks: List[Labware] = []
_transfer_class_by_strategy: Dict[Tuple[_Strategy, _Strategy], TransferClass] = {}
_serial_port: Optional[Any] = None


@dataclass
class _Dye:
    name: str
    color: str
    ul: float
    well_name: str

    RANGES = [
        (0.1, 0.99, "E", "#880000"),
        (1.0, 1.99, "D", "#CC0000"),
        (2.0, 9.99, "C", "#FF0000"),
        (10.0, 49.99, "B", "#FF3333"),
        (50.0, 200.0, "A", "#FF6666"),
        (200.1, 250.0, "HV", "#FF9999"),
    ]

    @classmethod
    def name_for_ul(cls, ul: float) -> str:
        """Name of dye for given volume."""
        for lower, upper, name, _ in cls.RANGES:
            if lower <= ul <= upper:
                return name
        raise ValueError(f"ul value {ul} is out of range")


DYES: Dict[str, _Dye] = {
    name: _Dye(name, color, ul=0, well_name="")
    for lower, upper, name, color in _Dye.RANGES
}


def load_liquid_diluent(
    ctx: ProtocolContext,
    diluent_reservoir: Labware,
) -> List[Well]:
    """Load minimum required diluent (includes dead ul) into labware."""
    # DILUENT (or BASELINE)
    total_photo_wells = len(_test_volumes) * ctx.params.columns * 8  # type: ignore[attr-defined]
    total_diluent_needed = MVS_TARGET_UL * total_photo_wells  # worst case is 200uL
    dead_vol_diluent = DEAD_VOL_PER_LABWARE[diluent_reservoir.load_name]
    # NOTE: (sigler) avoid the top of the well by using 90% of the well's capacity
    diluent_well_capacity = (
        diluent_reservoir["A1"].max_volume - dead_vol_diluent
    ) * 0.9
    number_of_wells_needed = int(total_diluent_needed / diluent_well_capacity)
    total_diluent_per_well = (
        total_diluent_needed / number_of_wells_needed
    ) + dead_vol_diluent
    diluent_wells_in_use = diluent_reservoir.wells()[:number_of_wells_needed]
    diluent = ctx.define_liquid("diluent", display_color="#0000FF")
    diluent_reservoir.load_liquid(diluent_wells_in_use, total_diluent_per_well, diluent)
    return diluent_wells_in_use


def load_liquid_red_dye(
    ctx: ProtocolContext,
    deep_well: Labware,
) -> None:
    """Load minimum required dye (includes dead ul) into labware."""
    # NOTE: there could be just 1x dye used for all volumes,
    #       or 5x different dyes. Also, volumes could repeat
    pcr_dead_ul = DEAD_VOL_PER_LABWARE[SRC_LABWARE]
    num_photo_wells = ctx.params.columns * 8  # type: ignore[attr-defined]
    for ul in _test_volumes:
        dye = DYES[_Dye.name_for_ul(ul)]
        column_ul = (num_photo_wells * ul) + (8 * pcr_dead_ul)
        dye.ul += column_ul

    # load the dye
    deep_well_dead_ul = DEAD_VOL_PER_LABWARE[deep_well.load_name]
    for dye in DYES.values():
        if dye.ul > 0:
            deep_well[dye.well_name].load_liquid(
                liquid=ctx.define_liquid(dye.name, dye.name, dye.color),
                volume=dye.ul + deep_well_dead_ul,
            )


def load_all_liquids(
    ctx: ProtocolContext,
    pcr_labware: Optional[Labware],
    dye_labware: Optional[Labware],
    res_labware: Labware,
    stack: List[Labware],
) -> List[Well]:
    """Load starting liquid volumes and/or set wells as empty."""
    if pcr_labware:
        pcr_labware.load_empty(pcr_labware.wells())
    if dye_labware:
        dye_labware.load_empty(dye_labware.wells())
        load_liquid_red_dye(ctx, dye_labware)
    res_labware.load_empty(res_labware.wells())
    diluent_wells_in_use = load_liquid_diluent(ctx, res_labware)
    for labware in stack:
        if labware.load_name == DST_LABWARE:
            labware.load_empty(labware.wells())
    return diluent_wells_in_use


def load_plate_stack(ctx: ProtocolContext) -> List[Labware]:
    """Load a stack of Corning 96-well flat-bottom plates and lids.

    The number of plates is determined by the number of test volumes provided.
    """
    stack: List[Labware] = []
    for i in range(len(_test_volumes)):
        if not len(stack):
            stack.append(ctx.load_labware(PLATE_LID_LOAD_NAME, location=SLOTS["stack"]))
        else:
            stack.append(stack[-1].load_labware(PLATE_LID_LOAD_NAME))
        stack.append(stack[-1].load_labware(DST_LABWARE))
    assert max(_test_volumes) < min(stack[-1]["A1"].max_volume, MVS_MAX_UL)
    return stack


def load_pipettes(
    ctx: ProtocolContext, racks: List[Labware]
) -> Tuple[InstrumentContext, Optional[InstrumentContext]]:
    """Load a P1000M and (optional) P50S."""
    diluent_pipette = ctx.load_instrument(
        instrument_name="flex_8channel_1000",
        mount="right",
        tip_racks=[
            ctx.load_labware(
                load_name="opentrons_flex_96_tiprack_200ul",
                location=SLOTS["tip_dilu"],
            )
        ],
    )
    pipette: Optional[InstrumentContext] = None
    if not ctx.params.baseline:  # type: ignore[attr-defined]
        pipette = ctx.load_instrument(
            instrument_name=f"flex_1channel_{PIP_VOLUME}",
            mount="left",
            tip_racks=racks,
        )
    return diluent_pipette, pipette


def load_tip_racks(ctx: ProtocolContext) -> List[Labware]:
    """Loads all tip-racks on deck, but only returns the accessible ones.

    Inaccessible racks are stored globally for use during pick-up-tip.
    """
    # NOTE: "accessible" racks will be used by the pipette first
    accessible_tip_racks = [
        ctx.load_labware(
            load_name=f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
            location=location,
        )
        for name, location in sorted(SLOTS.items())
        if f"tip_{TIP_VOLUME}_" in name and "4" not in location
    ]
    # NOTE: "inaccessible" racks will be swapped in once the pipette
    #       runs out of tips from its currently assigned tip-racks
    for name, location in sorted(SLOTS.items()):
        if f"tip_{TIP_VOLUME}_" in name and "4" in location:
            # global variable, so we don't need to pass it around everywhere
            _inaccessible_tip_racks.append(
                ctx.load_labware(
                    load_name=f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
                    location=location,
                )
            )
    return accessible_tip_racks


def load_all_non_stacked_labware(
    ctx: ProtocolContext,
) -> Tuple[Labware, Optional[Labware], Optional[Labware]]:
    """This just loads the reservoir, pcr plate, and deep-well."""
    deep_well: Optional[Labware] = None
    pcr_plate: Optional[Labware] = None
    if not ctx.params.baseline:  # type: ignore[attr-defined]
        deep_well = ctx.load_labware(
            load_name=DYE_LABWARE,
            location=SLOTS["dye"],
        )
        pcr_plate = ctx.load_labware(
            load_name=SRC_LABWARE,
            location=SLOTS["pcr"],
        )
        assert max(_test_volumes) < min(pcr_plate["A1"].max_volume, MVS_MAX_UL)
        ctx.load_labware(load_name=DE_STATIC_LOAD_NAME, location=SLOTS["de_static"])
    diluent_reservoir = ctx.load_labware(
        load_name=DILUENT_LABWARE,
        location=SLOTS["res"],
    )
    return diluent_reservoir, deep_well, pcr_plate


def de_static_connect(ctx: ProtocolContext) -> None:
    """Connect over USB to device that can power on/off the de-static bar."""
    if ctx.is_simulating():
        return
    global _serial_port
    assert _serial_port is None
    from serial import Serial  # type: ignore[import]

    _serial_port = Serial(
        port=ctx.params.de_static_port,  # type: ignore[attr-defined]
        baudrate=115200,
    )
    _serial_port.reset_output_buffer()
    _serial_port.reset_input_buffer()
    ack, enabled = de_static_get_status(ctx)
    assert ack
    if enabled:
        ctx.delay(seconds=1)
        ack, enabled = de_static_get_status(ctx)
        assert ack and not enabled


def de_static_get_status(ctx: ProtocolContext) -> Tuple[bool, bool]:
    """Read the de-static bar power supply's current status."""
    if ctx.is_simulating():
        return True, False
    assert _serial_port is not None
    _serial_port.write("?".encode("utf-8"))  # type: ignore[union-attr]
    res = _serial_port.readline()  # type: ignore[union-attr]
    status = res.decode("utf-8").strip().lower()
    ack = bool(status and status in ["on", "off"])
    enabled = bool(status == "on")
    return ack, enabled


def de_static_write_enable_with_retries(ctx: ProtocolContext, retries: int = 3) -> None:
    """Send enable command, retrying if we get unexpected response."""
    if ctx.is_simulating():
        return
    assert _serial_port is not None
    write_delay_seconds = 0.1
    _serial_port.write("enable".encode("utf-8"))  # type: ignore[union-attr]
    ctx.delay(write_delay_seconds)
    ack, enabled = de_static_get_status(ctx)
    if ack and enabled:
        return
    elif not ack or not enabled and retries:
        de_static_write_enable_with_retries(ctx, retries - 1)
    else:
        raise RuntimeError(
            f"unable to enable de-static bar (ack={ack}, enabled={enabled})"
        )


def pick_up_tip_and_manage_racks(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
) -> None:
    """Replace the 1st tip-rack if it's empty and a spare is available, then pick-up-tip."""
    assert not pipette.has_tip
    is_first_rack_empty = not pipette.tip_racks[0].next_tip()
    should_swap = ctx.params.test_gripper or is_first_rack_empty  # type: ignore[attr-defined]
    if should_swap and len(_inaccessible_tip_racks):
        replacement_rack = _inaccessible_tip_racks.pop(0)  # NOTE: pop! (global)
        gripper_rotate_tip_rack_out(ctx, pipette.tip_racks[0], replacement_rack)
        pipette.tip_racks = [replacement_rack] + pipette.tip_racks[1:]
        pipette.reset_tipracks()
    if ctx.params.test_gripper:  # type: ignore[attr-defined]
        return
    pipette.pick_up_tip()
    # NOTE: (sigler) calibrating every low-volume tip, because their alignment
    #        is critical for us to interpret the results of this test
    calibrate_tip_overlap(
        ctx,
        pipette,
        artificial_error=ctx.params.overlap_error,  # type: ignore[attr-defined]
    )
    # NOTE: the test pipette only ever interacts with the PCR plate
    #       as either a destination or source labware, and so by default
    #       we should de-static its tips each time it picks up a new one.
    bar_lw = cast(Labware, ctx.deck[SLOTS["de_static"]])
    bar = bar_lw.wells()[0]
    pipette.move_to(bar.top())
    de_static_write_enable_with_retries(ctx)
    pipette.move_to(bar.bottom())
    pipette.move_to(bar.top())


def gripper_rotate_tip_rack_out(
    ctx: ProtocolContext, old_rack: Labware, new_rack: Labware
) -> None:
    """Use gripper to replace empty tip-rack with one in staging slot."""
    accessible_slot = str(old_rack.parent)  # somewhere pick-up-tip can happen
    inaccessible_slot = str(new_rack.parent)  # staging slot
    ctx.move_labware(old_rack, SLOTS["empty"], use_gripper=True)
    ctx.move_labware(new_rack, accessible_slot, use_gripper=True)
    ctx.move_labware(old_rack, inaccessible_slot, use_gripper=True)


def gripper_move_labware_to_done_slot(
    ctx: ProtocolContext, lw: Labware, stack_done: List[Labware]
) -> None:
    """Move labware to the done slot, regardless of what is already there."""
    done_dst: Union[str, Labware] = (
        stack_done[-1] if len(stack_done) else SLOTS["empty_stack"]
    )
    ctx.move_labware(lw, done_dst, use_gripper=True)
    stack_done.append(lw)  # NOTE: append!


def modify_transfer_class_touch_tip(
    tc: TransferProperties,
    enabled: bool,
    speed: float,
    z_offset: float,
    mm_to_edge: float,
) -> None:
    """Modify properties to enable touch-tip."""
    for asp_or_disp in ["aspirate", "dispense"]:
        attr = getattr(tc, asp_or_disp)
        attr.retract.touch_tip.enabled = enabled
        attr.retract.touch_tip.speed = speed
        attr.retract.touch_tip.z_offset = z_offset
        attr.retract.touch_tip.mm_to_edge = mm_to_edge


def modify_transfer_class_position(
    tc: TransferProperties,
    aspirate: Optional[Tuple[PosRef, float]],
    dispense: Optional[Tuple[PosRef, float]],
) -> None:
    """Modify properties to change tip position."""
    if aspirate:
        tc.aspirate.position_reference = aspirate[0]
        tc.aspirate.offset.z = aspirate[1]
    if dispense:
        tc.dispense.position_reference = dispense[0]
        tc.dispense.offset.z = dispense[1]


def modify_transfer_class_position_meniscus(
    tc: TransferProperties, submerge_depth: float
) -> None:
    """Modify properties to change tip position to be relative to meniscus."""
    modify_transfer_class_position(
        tc,
        aspirate=(PosRef.LIQUID_MENISCUS, submerge_depth),
        dispense=(PosRef.LIQUID_MENISCUS, NON_CONTACT_DISPENSE_MM),
    )


def get_transfer_class_for_strategies(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    strategies: Tuple[_Strategy, _Strategy],
) -> TransferClass:
    """Retrieve transfer-class, given a pipette, params, and a strategy.

    A unique transfer-class is instantiated for each expected strategy pairing.
    The instance is then cached for the next time this function is called.
    """
    if strategies in _transfer_class_by_strategy:
        # already cached it, no need to re-instantiate
        return _transfer_class_by_strategy[strategies]

    # instantiate a new class and cache it for retrieval later
    _transfer_class_by_strategy[strategies] = ctx.define_liquid_class("water")
    tc_editable = _transfer_class_by_strategy[strategies].get_for(
        pipette, pipette.tip_racks[0]
    )
    # NOTE: all low-volumes trials should do a touch-tip, but others can skip
    skip_touch_tip = bool([1 for s in strategies if s == s.DYE_SRC or s == s.DILUENT])
    if not skip_touch_tip:
        modify_transfer_class_touch_tip(
            tc_editable, enabled=True, speed=30.0, z_offset=-1.0, mm_to_edge=1.0
        )
    match strategies:
        # NOTE: (sigler) all dye MENISCI strategies use the same settings
        case (_Strategy.DYE_M, _Strategy.DYE_M):  # noqa: E211
            modify_transfer_class_position_meniscus(
                tc_editable, ctx.params.submerge_depth  # type: ignore[attr-defined]
            )
        case (_Strategy.DYE_LLD_M, _Strategy.DYE_M):  # noqa: E211
            modify_transfer_class_position_meniscus(
                tc_editable, ctx.params.submerge_depth  # type: ignore[attr-defined]
            )
        case (_Strategy.DYE_LLD_TIP_M, _Strategy.DYE_M):  # noqa: E211
            modify_transfer_class_position_meniscus(
                tc_editable, ctx.params.submerge_depth  # type: ignore[attr-defined]
            )
        case (_Strategy.DYE_B, _Strategy.DYE_B):  # noqa: E211
            modify_transfer_class_position(
                tc_editable,
                aspirate=(PosRef.WELL_BOTTOM, ctx.params.well_bottom_mm),  # type: ignore[attr-defined]
                dispense=(PosRef.WELL_BOTTOM, DEFAULT_WELL_BOTTOM_MM),
            )
        case (_Strategy.DYE_B, _Strategy.DYE_T):  # noqa: E211
            modify_transfer_class_position(
                tc_editable,
                aspirate=(PosRef.WELL_BOTTOM, ctx.params.well_bottom_mm),  # type: ignore[attr-defined]
                dispense=(PosRef.WELL_TOP, 0.0),
            )
        case (_Strategy.DYE_SRC, _Strategy.DYE_SRC):  # noqa: E211
            modify_transfer_class_position(
                tc_editable,
                aspirate=(PosRef.LIQUID_MENISCUS, DEFAULT_SUBMERGE_MM),
                dispense=(PosRef.LIQUID_MENISCUS, NON_CONTACT_DISPENSE_MM),
            )
        case (_Strategy.DILUENT, _Strategy.DILUENT):  # noqa: E211
            modify_transfer_class_position(
                tc_editable,
                aspirate=(PosRef.LIQUID_MENISCUS, DEFAULT_SUBMERGE_MM),
                dispense=(PosRef.LIQUID_MENISCUS, NON_CONTACT_DISPENSE_MM),
            )
        case _:
            raise ValueError(
                f"Unexpected strategies: f{strategies[0]} -> {strategies[1]}"
            )

    return _transfer_class_by_strategy[strategies]


def transfer_diluent_or_baseline(
    ctx: ProtocolContext,
    multi: InstrumentContext,
    labware: Labware,
    diluent_wells_in_use: List[Well],
    red_dye_ul: float,
) -> List[Well]:
    """Handles the varied logics that dictate how diluent is spread.

    Can fill wells to 200ul for baseline, or that minus the target volume.
    Can also alternate diluent volume across the columns in a first pass,
    and then add the remaining diluent after the test run completes.
    """
    assert len(diluent_wells_in_use) > 0
    assert multi.max_volume >= MVS_TARGET_UL
    diluent_well = diluent_wells_in_use[0]
    wells_have_liquid = False
    for w in labware.wells():
        if cast(float, w.current_liquid_volume()) > 0.0:
            wells_have_liquid = True
    num_cols = 12 if ctx.params.baseline else ctx.params.columns  # type: ignore[attr-defined]
    for i, column in enumerate(labware.columns()[:num_cols]):
        if ctx.params.baseline:  # type: ignore[attr-defined]
            diluent_ul = MVS_TARGET_UL
        elif not wells_have_liquid:
            diluent_ul = DILUENT_UL_BY_COLUMN[i] - red_dye_ul
        else:
            ul_in_well = column[0].current_liquid_volume()
            diluent_ul = MVS_TARGET_UL - cast(float, ul_in_well)
        if diluent_ul <= 0.0:
            continue
        # multi would have dropped tips after emptying the previous diluent well
        if not multi.has_tip:
            multi.pick_up_tip()
            if not ctx.is_simulating():
                # FIXME: (sigler) is it expected that users should not probe during simulation?
                multi.require_liquid_presence(diluent_well)  # NOTE: probe!
        t_cls = get_transfer_class_for_strategies(
            ctx, multi, strategies=(_Strategy.DILUENT, _Strategy.DILUENT)
        )
        multi.transfer_liquid(t_cls, diluent_ul, diluent_well, column, new_tip="never")
        # is this well running low?
        min_diluent_in_well = DEAD_VOL_PER_LABWARE[diluent_well.parent.load_name]
        if diluent_well.current_liquid_volume() < min_diluent_in_well:
            diluent_wells_in_use.pop(0)  # NOTE: pop!
            diluent_well = diluent_wells_in_use[0]
            # NOTE: drop-tip when we change source well, so that
            #       we can LLD this new well with dry tips
            multi.drop_tip()

    # NOTE: don't drop tip, the pipette can keep these tips
    #       until a new source well needs to be probed
    return diluent_wells_in_use


def transfer_dye_to_pcr_column(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    column_idx: int,
) -> None:
    """Transfer dye from its source to a column on the PCR plate."""
    transfer_class = get_transfer_class_for_strategies(
        ctx, pipette, strategies=(_Strategy.DYE_SRC, _Strategy.DYE_SRC)
    )
    target_ul = _test_volumes[column_idx]

    dye = DYES[_Dye.name_for_ul(target_ul)]
    dye_labware = cast(Labware, ctx.deck[SLOTS["dye"]])
    dye_well = dye_labware[dye.well_name]

    pcr_plate = cast(Labware, ctx.deck[SLOTS["pcr"]])
    column = pcr_plate.columns()[column_idx]
    column_ul_per_well = DEAD_VOL_PER_LABWARE[SRC_LABWARE] + (
        target_ul * ctx.params.columns  # type: ignore[attr-defined]
    )

    pick_up_tip_and_manage_racks(ctx, pipette)
    if not ctx.is_simulating():
        # FIXME: (sigler) is it expected that users should not probe during simulation?
        pipette.require_liquid_presence(dye_well)
    pipette.transfer_liquid(
        transfer_class,
        column_ul_per_well,
        source=[dye_well] * len(column),
        dest=column,
        new_tip="never",
    )
    pipette.drop_tip()


def transfer_dye_to_photo_plate(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    src: Well,
    dst: Well,
) -> None:
    """Transfer dye from the PCR plate to the destination photo plate."""
    # lookup plate volume based on which column is the dye source
    trial_ul: float = _test_volumes[int(src.well_name[1:]) - 1]
    assert (
        dst.current_liquid_volume() > 0.0
    ), f"(dst={dst.well_name}) must have diluent already added before adding red dye"
    assert src.current_liquid_volume() >= trial_ul, (
        f"(src={src.well_name}) not enough volume in source "
        f"({src.current_liquid_volume()} ul) to aspirate {trial_ul} ul"
    )

    strategy = TEST_MATRIX[dst.well_name[0]]

    # NEW TIP
    if pipette.has_tip:
        pipette.drop_tip()
    pick_up_tip_and_manage_racks(ctx, pipette)

    # LLD (optional)
    if strategy["aspirate"].includes("LLD"):
        if not ctx.is_simulating():
            # FIXME: (sigler) is it expected that users should not probe during simulation?
            pipette.require_liquid_presence(src)
        # NOTE: (sigler) we've found that "wet" tips (eg: post-LLD) are
        #       far less reliable at aspirating ~1uL of aqueous solution.
        #       Therefore, we should test both dry and "wet" tips under
        #       identical conditions to gain more insight into what is happening.
        if strategy["aspirate"].includes("TIP"):
            pipette.drop_tip()
            pick_up_tip_and_manage_racks(ctx, pipette)

    # RUN
    t_cls = get_transfer_class_for_strategies(
        ctx,
        pipette,
        strategies=(strategy["aspirate"], strategy["dispense"]),
    )
    pipette.transfer_liquid(t_cls, trial_ul, src, dst, new_tip="never")
    pipette.drop_tip()


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_str(
        variable_name="de_static_port",
        display_name="de_static_port",
        default="/dev/ttyUSB0",
        choices=[
            {"display_name": f"/dev/ttyUSB{i}", "value": f"/dev/ttyUSB{i}"}
            for i in range(10)
        ],
    )
    for i, ul in enumerate(DEFAULT_TARGET_BY_PLATE):
        parameters.add_float(
            variable_name=f"volume_{i}",
            display_name=f"volume_{i}",
            default=ul,
            minimum=0.0,
            maximum=50.0,
        )
    for dye, well_name in zip(DYES.values(), DEFAULT_DYE_WELLS):
        parameters.add_str(
            variable_name=f"dye_{dye.name.lower()}_well",
            display_name=f"dye_{dye.name.lower()}_well",
            default=well_name,
            choices=[
                {
                    "display_name": row + str(col),
                    "value": row + str(col),
                }
                for col in range(1, 13)
                for row in "ABCDEFGH"
            ],
        )
    parameters.add_float(
        variable_name="submerge_depth",  # NOTE: (sigler) please keep this NEGATIVE (-)
        display_name="submerge_depth",
        default=DEFAULT_SUBMERGE_MM,
        maximum=0.0,
        minimum=-10.0,
    )
    parameters.add_float(
        variable_name="well_bottom_mm",
        display_name="well_bottom_mm",
        default=DEFAULT_WELL_BOTTOM_MM,
        maximum=10.0,
        minimum=0.0,
    )
    parameters.add_float(
        variable_name="overlap_error",
        display_name="overlap_error",
        default=0.0,
        maximum=2.0,
        minimum=-2.0,
    )
    parameters.add_bool(
        variable_name="baseline", display_name="baseline", default=False
    )
    parameters.add_int(
        variable_name="columns",
        display_name="columns",
        minimum=1,
        maximum=12,
        default=12,  # default to a full plate
    )
    parameters.add_bool(
        variable_name="test_gripper", display_name="test_gripper", default=False
    )


def configure_volumes_and_wells_from_parameters(ctx: ProtocolContext) -> None:
    """Store a few parameter values as global variables."""
    # NOTE: storing dye source locations in the globally stored DYE dict
    for dye_name, dye in DYES.items():
        dye.well_name = getattr(ctx.params, f"dye_{dye_name.lower()}_well")
    if ctx.params.baseline:  # type: ignore[attr-defined]
        _test_volumes.append(0.0)  # NOTE: ignoring volume parameters if just-baseline
    else:
        for i in range(len(DEFAULT_TARGET_BY_PLATE)):
            user_inputted_ul = cast(float, getattr(ctx.params, f"volume_{i}"))
            if user_inputted_ul > 0:
                _test_volumes.append(user_inputted_ul)


def calibrate_tip_overlap(
    ctx: ProtocolContext, pipette: InstrumentContext, artificial_error: float
) -> None:
    """Calibrate the currently attached tip's overlap with the pipette nozzle.

    This method will run a pressure (LLD) probe onto the calibration square
    of the "empty" deck slot.

    And "artificial_error" can be added to the overlap, allowing operator
    to simulate different tip-overlaps that could happen in the field.
    """
    if ctx.is_simulating():
        return
    api: SyncHardwareAPI = ctx._core.get_hardware()
    pip_mount = OT3Mount.LEFT if pipette.mount == "left" else OT3Mount.RIGHT
    empty_slot_row_idx = "DCBA".index(SLOTS["empty"][0])
    empty_slot_as_int = (empty_slot_row_idx * 3) + int(SLOTS["empty"][1:])
    expected_probe_position = Point(
        *get_calibration_square_position_in_slot(slot=empty_slot_as_int)
    )
    expected_probe_position += expected_probe_position + Point(
        x=Z_PREP_OFFSET.x, y=Z_PREP_OFFSET.y, z=Z_PREP_OFFSET.z
    )

    # RETRACT and move to above the deck slot
    api.retract(pip_mount)
    current_pos = api.gantry_position(pip_mount)
    api.move_to(
        pip_mount,
        Point(
            x=expected_probe_position.x, y=expected_probe_position.y, z=current_pos.z
        ),
    )
    api.move_to(
        pip_mount,
        expected_probe_position + Point(z=PROBE_START_HEIGHT_ABOVE_EXPECTED_MM),
    )

    # PROBE
    probed_deck_z = api.liquid_probe(
        pip_mount,
        PROBE_START_HEIGHT_ABOVE_EXPECTED_MM + PROBE_OVERSHOOT_BELOW_EXPECTED_MM,
    )
    api.retract(pip_mount)

    # MODIFY current tip length
    old_tip_length = api.hardware_pipettes[pip_mount.to_mount()].current_tip_length
    tip_overlap_error_mm = probed_deck_z - expected_probe_position.z
    # NOTE: (sigler) the artificial error is subtracted from the tip "length"
    #       because a more positive (+) overlap would create a shorter tip
    artificial_tip_length_error = artificial_error * -1.0
    new_tip_length = old_tip_length + tip_overlap_error_mm + artificial_tip_length_error
    api.remove_tip(pip_mount)
    api.add_tip(pip_mount, tip_length=new_tip_length)


def run(ctx: ProtocolContext) -> None:
    """Run."""
    configure_volumes_and_wells_from_parameters(ctx)
    de_static_connect(ctx)

    # LABWARE, LIQUIDS, and PIPETTES
    ctx.load_trash_bin(SLOTS["trash"])
    stack: List[Labware] = load_plate_stack(ctx)
    stack_done: List[Labware] = []
    labware_diluent, labware_dye, labware_pcr = load_all_non_stacked_labware(ctx)
    diluent_src_wells = load_all_liquids(
        ctx, labware_pcr, labware_dye, labware_diluent, stack
    )
    tip_racks_accessible = load_tip_racks(ctx)
    diluent_pipette, test_pipette = load_pipettes(
        ctx, tip_racks_accessible  # NOTE: accessible tip-racks
    )

    def _get_next_plate_from_stack() -> Labware:
        _p = stack.pop()  # plate
        assert _p.load_name == DST_LABWARE
        ctx.move_labware(_p, SLOTS["empty_dst"], use_gripper=True)
        return _p

    def _remove_plate_to_other_stack(_p: Labware) -> None:
        _lid = stack.pop()
        assert _lid.load_name == PLATE_LID_LOAD_NAME
        gripper_move_labware_to_done_slot(ctx, _p, stack_done)
        gripper_move_labware_to_done_slot(ctx, _lid, stack_done)

    # JUST BASELINE
    if ctx.params.baseline:  # type: ignore[attr-defined]
        assert not ctx.params.test_gripper, f"test gripper and just baseline?"  # type: ignore[attr-defined]
        plate = _get_next_plate_from_stack()
        transfer_diluent_or_baseline(
            ctx, diluent_pipette, plate, diluent_src_wells, 0.0
        )
        if diluent_pipette.has_tip:
            diluent_pipette.drop_tip()
        _remove_plate_to_other_stack(plate)
        return  # exit

    # FILL EACH PLATES in STACK
    assert test_pipette and labware_pcr and labware_dye
    for i, ul in enumerate(_test_volumes):

        plate = _get_next_plate_from_stack()

        if not ctx.params.test_gripper:  # type: ignore[attr-defined]
            # ADD DILUENT
            if ul < MVS_TARGET_UL:
                diluent_src_wells = transfer_diluent_or_baseline(
                    ctx, diluent_pipette, plate, diluent_src_wells, ul
                )
            # TRANSFER RED-DYE
            transfer_dye_to_pcr_column(ctx, test_pipette, i)
            pcr_column = labware_pcr.columns()[i]
            for pcr_well in pcr_column:
                row_letter = pcr_well.well_name[0]
                photo_row = plate.rows_by_name()[row_letter]
                for photo_well in photo_row[: ctx.params.columns]:  # type: ignore[attr-defined]
                    transfer_dye_to_photo_plate(ctx, test_pipette, pcr_well, photo_well)
            # ADD MORE DILUENT
            diluent_src_wells = transfer_diluent_or_baseline(
                ctx, diluent_pipette, plate, diluent_src_wells, ul
            )

        _remove_plate_to_other_stack(plate)

    # DROP TIPS (just in case)
    if diluent_pipette.has_tip:
        diluent_pipette.drop_tip()
    if test_pipette.has_tip:
        test_pipette.drop_tip()
    if _serial_port is not None:
        _serial_port.close()
