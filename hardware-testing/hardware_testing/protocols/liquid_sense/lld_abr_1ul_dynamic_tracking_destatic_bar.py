"""LLD ABR 1ul Dynamic Tracking Destatic Bar."""
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional, Literal, Tuple, cast, Union

from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    InstrumentContext,
    Labware,
    Well,
    Liquid,
    LiquidClass as TransferClass,
)
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons.protocol_api.instrument_context import _DEFAULT_ASPIRATE_CLEARANCE
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference,
)
from opentrons_shared_data.pipette.types import LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP


metadata = {"protocolName": "LLD ABR 1uL Dynamic-Tracking De-Static Bar"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

# TODO: (sigler) add this to all other hardware-testing protocols
#       because it is import we internally stay up-to-date with
#       the latest behaviors (even when it's a pain...)
assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]

# FIXME: (sigler) change to "dynamic" after bug in API is fixed
#        where liquid volumes in wells aren't tracked correctly
DEFAULT_TIP_MENISCUS_TARGET: Literal["start", "end", "dynamic"] = "end"

TIP_VOLUME = 50
PIP_VOLUME = 50

MAX_NUMBER_OF_PLATES = 5
DEFAULT_TARGET_BY_PLATE = [1.0, 1.2, 1.5, 2.0, 5.0]

# NOTE: (sigler) do not edit the values below, they are from PRODUCTION
# FIXME: (sigler) figure out where this -1.5 should be defined in production
#        software, and then import it into this protocol
DEFAULT_SUBMERGE_MM = -1.5  # NOTE: defined in hardware-testing + liquid-classes
DEFAULT_WELL_BOTTOM_MM = float(_DEFAULT_ASPIRATE_CLEARANCE)
NON_CONTACT_DISPENSE_MM = float(LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP.z)

# NOTE: diluent should always be used with a P1000 (max push-out is 79.9)
DILUENT_PUSH_OUT = 20.0

# NOTE: (sigler) disabling formatter here, b/c spatial deck-maps are nice...
# fmt: off
SLOTS: Dict[str, str] = {
    "tip_50_2":    "A1", "tip_50_1": "A2", "tip_50_0": "A3", "tip_50_3": "A4",
    "empty_stack": "B1", "stack":    "B2", "tip_dilu": "B3", "tip_50_4": "B4",
    "empty_dst":   "C1", "pcr":      "C2", "res":      "C3", "tip_50_5": "C4",
    "trash":       "D1", "dye":      "D2", "empty":    "D3", "tip_50_6": "D4",
}
# fmt: on


@dataclass
class _ProtocolParams:
    just_baseline: bool
    volumes: List[float]
    columns: int
    submerge_depth: float
    well_bottom_mm: float


class _Strategy(str, Enum):
    DYE_M = "MENISCUS"
    DYE_LLD_M = "LLD-MENISCUS"
    DYE_LLD_TIP_M = "LLD-TIP-MENISCUS"
    DYE_B = "BOTTOM"
    DYE_T = "TOP"
    DILUENT = "DILUENT"
    DYE_SRC = "DYE-SOURCE"

    def _includes(self, sub_string: str) -> bool:
        return bool(sub_string in self.value)

    def includes_lld(self) -> bool:
        """Include LLD."""
        return self._includes("LLD")

    def includes_meniscus(self) -> bool:
        """Include Meniscus."""
        return self._includes("MENISCUS")

    def includes_new_tip(self) -> bool:
        """Include new tip."""
        return self._includes("TIP")

    def is_bottom(self) -> bool:
        """Is bottom."""
        return self._includes("BOTTOM")

    def is_top(self) -> bool:
        """Is top."""
        return self._includes("TOP")

    def is_diluent(self) -> bool:
        """Is diluent."""
        return self._includes("DILUENT")

    def is_dye_source(self) -> bool:
        """Is dye source."""
        return self._includes("DYE-SOURCE")


# NOTE: (sigler) do not edit, 200 is from Artel
MVS_TARGET_UL = 200.0
# NOTE: (sigler) do not edit, 250 is from Opentrons HW internal testing
MVS_MAX_UL = 250.0
# alternates (200,100,200,etc.) every column
DILUENT_UL_BY_COLUMN = [MVS_TARGET_UL, MVS_TARGET_UL / 2] * 6

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

DEAD_VOL_PER_LABWARE = {
    "nest_12_reservoir_15ml": 3000,
    "nest_96_wellplate_2ml_deep": 50,
    # TODO: (sigler) reduce this to find actual dead-vol of our system
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

# global so we don't need to pass it around everywhere
_inaccessible_tip_racks: List[Labware] = []
_transfer_class_by_strategy: Dict[Tuple[_Strategy, _Strategy], TransferClass] = {}


@dataclass
class _Dye:
    name: str
    min: float
    max: float
    ul: float
    use: int
    c: str
    src: str
    liq: Optional[Liquid]
    w: Optional[Well]


# NOTE: (sigler) do not edit, values are from Artel
# FIXME: (sigler) I think the color display is wrong on the ODD (???)
DYES: List[_Dye] = [
    _Dye("HV", 200.1, 250.0, 0.0, 0, "#FF9999", "A6", None, None),
    _Dye("A", 50.0, 200.0, 0.0, 0, "#FF6666", "A5", None, None),
    _Dye("B", 10.0, 49.99, 0.0, 0, "#FF3333", "A4", None, None),
    _Dye("C", 2.0, 9.99, 0.0, 0, "#FF0000", "A3", None, None),
    _Dye("D", 1.0, 1.99, 0.0, 0, "#CC0000", "A2", None, None),
    _Dye("E", 0.1, 0.99, 0.0, 0, "#880000", "A1", None, None),
]


def _get_dye_for_volume(volume: float) -> _Dye:
    for dye in DYES:
        if dye.min <= volume <= dye.max:
            return dye
    raise ValueError(f"unexpected volume: {volume}")


def _load_liquid_diluent(
    ctx: ProtocolContext, diluent_reservoir: Labware, params: _ProtocolParams
) -> List[Well]:
    # DILUENT (or BASELINE)
    total_photo_wells = len(params.volumes) * params.columns * 8
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


def _load_liquid_red_dye(
    ctx: ProtocolContext, dye_holder: Labware, params: _ProtocolParams
) -> None:
    dead_ul = DEAD_VOL_PER_LABWARE[dye_holder.load_name]

    # initialize defined liquid and well location
    for dye in DYES:
        dye.liq = ctx.define_liquid(dye.name, dye.name, dye.c)
        dye.w = dye_holder[dye.src]

    # NOTE: there could be just 1x dye used for all volumes,
    #       or 5x different dyes. Also, volumes could repeat
    num_photo_wells = params.columns * 8
    for ul in params.volumes:
        dye = _get_dye_for_volume(ul)
        column_ul = (num_photo_wells * ul) + (8 * dead_ul)
        dye.ul += column_ul

    # load the dye
    for dye in DYES:
        if dye.ul > 0:
            assert dye.w and dye.liq
            dye.w.load_liquid(dye.liq, dye.ul + dead_ul)


def _load_all_liquids(
    ctx: ProtocolContext,
    pcr: Optional[Labware],
    dye: Optional[Labware],
    res: Labware,
    stack: List[Labware],
    params: _ProtocolParams,
) -> List[Well]:
    """Load starting liquid volumes and/or set wells as empty."""
    if pcr:
        pcr.load_empty(pcr.wells())
    if dye:
        dye.load_empty(dye.wells())
        _load_liquid_red_dye(ctx, dye, params)
    res.load_empty(res.wells())
    diluent_wells_in_use = _load_liquid_diluent(ctx, res, params)
    for labware in stack:
        if labware.load_name == DST_LABWARE:
            labware.load_empty(labware.wells())
    return diluent_wells_in_use


def _load_plate_stack(ctx: ProtocolContext, params: _ProtocolParams) -> List[Labware]:
    """Load a stack of Corning 96-well flat-bottom plates and lids.

    The number of plates is determined by the number of test volumes provided.
    """
    stack: List[Labware] = []
    for i in range(len(params.volumes)):
        if not len(stack):
            stack.append(ctx.load_labware(PLATE_LID_LOAD_NAME, location=SLOTS["stack"]))
        else:
            stack.append(stack[-1].load_labware(PLATE_LID_LOAD_NAME))
        stack.append(stack[-1].load_labware(DST_LABWARE))
    assert max(params.volumes) < min(stack[-1]["A1"].max_volume, MVS_MAX_UL)
    return stack


def _load_pipettes(
    ctx: ProtocolContext, racks: List[Labware], params: _ProtocolParams
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
    if not params.just_baseline:
        pipette = ctx.load_instrument(
            instrument_name=f"flex_1channel_{PIP_VOLUME}",
            mount="left",
            tip_racks=racks,
        )
    return diluent_pipette, pipette


def _load_tip_racks(ctx: ProtocolContext) -> List[Labware]:
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


def _load_all_non_stacked_labware(
    ctx: ProtocolContext, params: _ProtocolParams
) -> Tuple[Labware, Optional[Labware], Optional[Labware]]:
    """This just loads the reservoir, pcr plate, and deep-well."""
    dye_holder: Optional[Labware] = None
    src_labware: Optional[Labware] = None
    if not params.just_baseline:
        dye_holder = ctx.load_labware(
            load_name=DYE_LABWARE,
            location=SLOTS["dye"],
        )
        src_labware = ctx.load_labware(
            load_name=SRC_LABWARE,
            location=SLOTS["pcr"],
        )
        assert max(params.volumes) < min(src_labware["A1"].max_volume, MVS_MAX_UL)
    diluent_reservoir = ctx.load_labware(
        load_name=DILUENT_LABWARE,
        location=SLOTS["res"],
    )
    return diluent_reservoir, dye_holder, src_labware


def _pick_up_and_manage_dye_tips(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
) -> None:
    """Pick up tips, but only after swapping in new tips if needed."""
    pipette.pick_up_tip()
    # TODO: (sigler) add tip-overlap calibration here
    #       start with EVERY tip for now, make it configurable later
    tip = pipette._last_tip_picked_up_from
    assert tip
    if tip.well_name == "H12" and len(_inaccessible_tip_racks):
        _gripper_rotate_tip_rack_out(ctx, tip.parent, _inaccessible_tip_racks[0])
        pipette.tip_racks = [
            _inaccessible_tip_racks[0] if rack == tip.parent else rack
            for rack in pipette.tip_racks
        ]
        pipette.reset_tipracks()
        # NOTE: removing rack from global list of still available
        _inaccessible_tip_racks.pop(0)


def _gripper_rotate_tip_rack_out(
    ctx: ProtocolContext, old_rack: Labware, new_rack: Labware
) -> None:
    accessible_slot = str(old_rack.parent)  # somewhere pick-up-tip can happen
    inaccessible_slot = str(new_rack.parent)  # staging slot
    ctx.move_labware(old_rack, SLOTS["empty"], use_gripper=True)
    ctx.move_labware(new_rack, accessible_slot, use_gripper=True)
    ctx.move_labware(old_rack, inaccessible_slot, use_gripper=True)


def _modify_transfer_class_touch_tip(
    tc: TransferProperties,
    enabled: bool,
    speed: float,
    z_offset: float,
    mm_to_edge: float,
) -> None:
    for asp_or_disp in ["aspirate", "dispense"]:
        attr = getattr(tc, asp_or_disp)
        attr.retract.touch_tip.enabled = enabled
        attr.retract.touch_tip.speed = speed
        attr.retract.touch_tip.z_offset = z_offset
        attr.retract.touch_tip.mm_to_edge = mm_to_edge


def _modify_transfer_class_position(
    tc: TransferProperties,
    aspirate: Optional[Tuple[PositionReference, float]],
    dispense: Optional[Tuple[PositionReference, float]],
) -> None:
    if aspirate:
        tc.aspirate.position_reference = aspirate[0]
        tc.aspirate.offset.z = aspirate[1]
    if dispense:
        tc.dispense.position_reference = dispense[0]
        tc.dispense.offset.z = dispense[1]


def _modify_transfer_class_position_meniscus(
    tc: TransferProperties, submerge_depth: float
) -> None:
    _modify_transfer_class_position(
        tc,
        aspirate=(PositionReference.LIQUID_MENISCUS, submerge_depth),
        dispense=(PositionReference.LIQUID_MENISCUS, NON_CONTACT_DISPENSE_MM),
    )


def _get_transfer_class_for_strategies(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    params: _ProtocolParams,
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
    skip_touch_tip = bool(
        [1 for s in strategies if s.is_dye_source() or s.is_diluent()]
    )
    if not skip_touch_tip:
        _modify_transfer_class_touch_tip(
            tc_editable, enabled=True, speed=30.0, z_offset=-1.0, mm_to_edge=1.0
        )
    match strategies:
        # NOTE: (sigler) all dye MENISCI strategies use the same settings
        case (_Strategy.DYE_M, _Strategy.DYE_M):  # noqa: E211
            _modify_transfer_class_position_meniscus(tc_editable, params.submerge_depth)
        case (_Strategy.DYE_LLD_M, _Strategy.DYE_M):  # noqa: E211
            _modify_transfer_class_position_meniscus(tc_editable, params.submerge_depth)
        case (_Strategy.DYE_LLD_TIP_M, _Strategy.DYE_M):  # noqa: E211
            _modify_transfer_class_position_meniscus(tc_editable, params.submerge_depth)
        case (_Strategy.DYE_B, _Strategy.DYE_B):  # noqa: E211
            _modify_transfer_class_position(
                tc_editable,
                aspirate=(PositionReference.WELL_BOTTOM, params.well_bottom_mm),
                dispense=(PositionReference.WELL_BOTTOM, DEFAULT_WELL_BOTTOM_MM),
            )
        case (_Strategy.DYE_B, _Strategy.DYE_T):  # noqa: E211
            _modify_transfer_class_position(
                tc_editable,
                aspirate=(PositionReference.WELL_BOTTOM, params.well_bottom_mm),
                dispense=(PositionReference.WELL_TOP, 0.0),
            )
        case (_Strategy.DYE_SRC, _Strategy.DYE_SRC):  # noqa: E211
            _modify_transfer_class_position(
                tc_editable,
                aspirate=(PositionReference.LIQUID_MENISCUS, DEFAULT_SUBMERGE_MM),
                dispense=(PositionReference.LIQUID_MENISCUS, NON_CONTACT_DISPENSE_MM),
            )
        case (_Strategy.DILUENT, _Strategy.DILUENT):  # noqa: E211
            _modify_transfer_class_position(
                tc_editable,
                aspirate=(PositionReference.LIQUID_MENISCUS, DEFAULT_SUBMERGE_MM),
                dispense=(PositionReference.LIQUID_MENISCUS, NON_CONTACT_DISPENSE_MM),
            )
        case _:
            raise ValueError(
                f"Unexpected strategies: f{strategies[0]} -> {strategies[1]}"
            )

    return _transfer_class_by_strategy[strategies]


def _diluent_or_baseline_pipetting(
    ctx: ProtocolContext,
    multi: InstrumentContext,
    labware: Labware,
    diluent_wells_in_use: List[Well],
    params: _ProtocolParams,
    num_cols: int,
    red_dye_ul: float,
    alternate_ul: bool,
    is_init: bool,
) -> List[Well]:
    """Handles the varied logics that dictate how diluent is spread.

    Can fill wells to 200ul for baseline, or that minus the target volume.
    Can also alternate diluent volume across the columns in a first pass,
    and then add the remaining diluent after the test run completes.
    """
    assert len(diluent_wells_in_use) > 0
    assert multi.max_volume >= MVS_TARGET_UL
    diluent_well = diluent_wells_in_use[0]
    assert red_dye_ul < MVS_TARGET_UL
    for i, col in enumerate(labware.columns()[:num_cols]):
        if is_init:
            if alternate_ul:
                diluent_ul = DILUENT_UL_BY_COLUMN[i] - red_dye_ul
            else:
                diluent_ul = MVS_TARGET_UL - red_dye_ul  # baseline
        else:
            diluent_ul = MVS_TARGET_UL - cast(float, col[0].current_liquid_volume())
        if diluent_ul > 0.0:
            # multi would have dropped tips after emptying the previous diluent well
            if not multi.has_tip:
                multi.pick_up_tip()
                if not ctx.is_simulating():
                    multi.require_liquid_presence(diluent_well)
            t_cls = _get_transfer_class_for_strategies(
                ctx, multi, params, strategies=(_Strategy.DILUENT, _Strategy.DILUENT)
            )
            multi.transfer_liquid(t_cls, diluent_ul, diluent_well, col, new_tip="never")
            # pop diluent well off globally tracked list once it's too empty
            min_diluent_in_well = DEAD_VOL_PER_LABWARE[diluent_well.parent.load_name]
            if diluent_well.current_liquid_volume() < min_diluent_in_well:
                diluent_wells_in_use.pop(0)
                diluent_well = diluent_wells_in_use[0]
                # NOTE: drop-tip when we change source well, so that
                #       we can LLD this new well with dry tips
                multi.drop_tip()

    # NOTE: don't drop tip, the pipette can keep these tips
    #       until a new source well needs to be probed
    return diluent_wells_in_use


def _diluent_for_empty_plate(
    ctx: ProtocolContext,
    multi: InstrumentContext,
    labware: Labware,
    diluent_wells_in_use: List[Well],
    params: _ProtocolParams,
    test_ul: float,
) -> List[Well]:
    """Spread diluent (minus test ul) across the plate, with varied volumes (by column).

    It is assumed that a second final pass will be ran, to bring each well up to the
    target MVS volume.
    """
    return _diluent_or_baseline_pipetting(
        ctx,
        multi,
        labware,
        diluent_wells_in_use,
        params,
        num_cols=params.columns,
        red_dye_ul=test_ul,
        alternate_ul=True,
        is_init=True,
    )


def _diluent_for_full_plate(
    ctx: ProtocolContext,
    multi: InstrumentContext,
    labware: Labware,
    diluent_wells_in_use: List[Well],
    params: _ProtocolParams,
) -> List[Well]:
    """Spread final diluent volumes, leftover from previous call to _spread_init_diluent."""
    return _diluent_or_baseline_pipetting(
        ctx,
        multi,
        labware,
        diluent_wells_in_use,
        params,
        num_cols=params.columns,
        red_dye_ul=0.0,
        alternate_ul=True,
        is_init=False,
    )


def _just_baseline(
    ctx: ProtocolContext,
    multi: InstrumentContext,
    labware: Labware,
    diluent_wells_in_use: List[Well],
    params: _ProtocolParams,
) -> None:
    """Spread just baseline (200ul each well)."""
    _diluent_or_baseline_pipetting(
        ctx,
        multi,
        labware,
        diluent_wells_in_use,
        params,
        num_cols=12,
        red_dye_ul=0.0,
        alternate_ul=False,
        is_init=True,
    )
    if multi.has_tip:
        multi.drop_tip()


def _gripper_move_labware_to_done_slot(
    ctx: ProtocolContext, lw: Labware, stack_done: List[Labware]
) -> None:
    """Move labware to the done slot, regardless of what is already there."""
    done_dst: Union[str, Labware] = (
        stack_done[-1] if len(stack_done) else SLOTS["empty_stack"]
    )
    ctx.move_labware(lw, done_dst, use_gripper=True)
    stack_done.append(lw)


def _dye_move_to_pcr_column(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    column_idx: int,
    params: _ProtocolParams,
) -> None:
    transfer_class = _get_transfer_class_for_strategies(
        ctx, pipette, params, strategies=(_Strategy.DYE_SRC, _Strategy.DYE_SRC)
    )
    target_ul = params.volumes[column_idx]
    dye = _get_dye_for_volume(target_ul)
    assert dye.w
    src_labware = cast(Labware, ctx.deck[SLOTS["pcr"]])
    column = src_labware.columns()[column_idx]
    column_ul_per_well = DEAD_VOL_PER_LABWARE[SRC_LABWARE] + (
        target_ul * params.columns
    )

    _pick_up_and_manage_dye_tips(ctx, pipette)
    if not ctx.is_simulating():
        pipette.require_liquid_presence(dye.w)
    pipette.transfer_liquid(
        transfer_class,
        column_ul_per_well,
        source=[dye.w] * len(column),
        dest=column,
        new_tip="never",
    )
    pipette.drop_tip()


def _run_trial(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    src: Well,
    dst: Well,
    params: _ProtocolParams,
) -> None:
    # lookup plate volume based on which column is the dye source
    trial_ul: float = params.volumes[int(src.well_name[1:]) - 1]
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
    _pick_up_and_manage_dye_tips(ctx, pipette)

    # LLD (optional)
    if strategy["aspirate"].includes_lld():
        if not ctx.is_simulating():
            pipette.require_liquid_presence(src)
        # NOTE: (sigler) we've found that "wet" tips (eg: post-LLD) are
        #       far less reliable at aspirating ~1uL of aqueous solution.
        #       Therefore, we should test both dry and "wet" tips under
        #       identical conditions to gain more insight into what is happening.
        if strategy["aspirate"].includes_new_tip():
            pipette.drop_tip()
            _pick_up_and_manage_dye_tips(ctx, pipette)

    # RUN
    t_cls = _get_transfer_class_for_strategies(
        ctx, pipette, params, strategies=(strategy["aspirate"], strategy["dispense"])
    )
    pipette.transfer_liquid(t_cls, trial_ul, src, dst, new_tip="never")
    pipette.drop_tip()


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_bool(
        variable_name="just_baseline", display_name="just_baseline", default=False
    )
    assert "96" in DST_LABWARE
    parameters.add_int(
        variable_name="columns_to_test",
        display_name="columns_to_test",
        minimum=1,
        maximum=12,
        default=12,  # default to a full plate
    )
    for i in range(MAX_NUMBER_OF_PLATES):
        parameters.add_float(
            variable_name=f"volume_{i}",
            display_name=f"volume_{i}",
            default=DEFAULT_TARGET_BY_PLATE[i],
            minimum=0.0,
            maximum=50.0,
        )
    for dye in DYES:
        parameters.add_str(
            variable_name=f"dye_{dye.name.lower()}_well",
            display_name=f"dye_{dye.name.lower()}_well",
            default=dye.src,
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


def _gather_parameters(ctx: ProtocolContext) -> _ProtocolParams:
    # NOTE: storing dye source locations in the globally stored DYE dict
    for dye in DYES:
        dye.src = getattr(ctx.params, f"dye_{dye.name.lower()}_well")
    just_baseline = ctx.params.just_baseline  # type: ignore[attr-defined]
    if just_baseline:
        volumes = [0.0]
    else:
        volumes = [
            float(getattr(ctx.params, f"volume_{i}"))
            for i in range(MAX_NUMBER_OF_PLATES)
            if getattr(ctx.params, f"volume_{i}") > 0
        ]
    return _ProtocolParams(
        just_baseline=just_baseline,
        volumes=volumes,
        columns=ctx.params.columns_to_test,  # type: ignore[attr-defined]
        submerge_depth=ctx.params.submerge_depth,  # type: ignore[attr-defined]
        well_bottom_mm=ctx.params.well_bottom_mm,  # type: ignore[attr-defined]
    )


def run(ctx: ProtocolContext) -> None:
    """Run."""
    params = _gather_parameters(ctx)

    # LABWARE, LIQUIDS, and PIPETTES
    ctx.load_trash_bin(SLOTS["trash"])
    stack: List[Labware] = _load_plate_stack(ctx, params)
    stack_done: List[Labware] = []
    labware_diluent, labware_dye, labware_pcr = _load_all_non_stacked_labware(
        ctx, params
    )
    diluent_src_wells = _load_all_liquids(
        ctx, labware_pcr, labware_dye, labware_diluent, stack, params
    )
    tip_racks_accessible = _load_tip_racks(ctx)
    diluent_pipette, test_pipette = _load_pipettes(
        ctx, tip_racks_accessible, params  # NOTE: accessible tip-racks
    )

    # JUST BASELINE
    if params.just_baseline:
        _just_baseline(ctx, diluent_pipette, stack[-1], diluent_src_wells, params)
        return  # exit

    # FILL EACH PLATES in STACK
    assert test_pipette and labware_pcr and labware_dye
    for i, ul in enumerate(params.volumes):

        # MOVE PLATE and ADD DILUENT
        plate = stack.pop()
        lid = stack.pop()
        ctx.move_labware(plate, SLOTS["empty_dst"], use_gripper=True)
        if ul < MVS_TARGET_UL:
            diluent_src_wells = _diluent_for_empty_plate(
                ctx, diluent_pipette, plate, diluent_src_wells, params, test_ul=ul
            )

        # TRANSFER RED-DYE
        _dye_move_to_pcr_column(ctx, test_pipette, i, params)
        pcr_column = labware_pcr.columns()[i]
        for pcr_well in pcr_column:
            row_letter = pcr_well.well_name[0]
            photo_row = plate.rows_by_name()[row_letter]
            for photo_well in photo_row[: params.columns]:
                _run_trial(ctx, test_pipette, pcr_well, photo_well, params)

        # ADD MORE DILUENT and RE-STACK
        diluent_src_wells = _diluent_for_full_plate(
            ctx, diluent_pipette, plate, diluent_src_wells, params
        )
        _gripper_move_labware_to_done_slot(ctx, plate, stack_done)
        _gripper_move_labware_to_done_slot(ctx, lid, stack_done)

    # DROP TIPS (just in case)
    if diluent_pipette.has_tip:
        diluent_pipette.drop_tip()
    if test_pipette.has_tip:
        test_pipette.drop_tip()
