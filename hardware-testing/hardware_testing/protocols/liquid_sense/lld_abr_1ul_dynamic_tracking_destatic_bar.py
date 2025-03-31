"""LLD ABR 1ul Dynamic Tracking Destatic Bar."""
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional, Literal, Tuple, cast, Union

from opentrons.protocol_api import (
    ProtocolContext,
    Well,
    ParameterContext,
    Labware,
    Liquid,
    InstrumentContext,
)
from opentrons.protocol_api.instrument_context import _DEFAULT_ASPIRATE_CLEARANCE
from opentrons.protocol_api.labware import OutOfTipsError
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

from opentrons_shared_data.pipette.types import LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP


metadata = {"protocolName": "LLD ABR 1uL Dynamic-Tracking De-Static Bar"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

# TODO: (sigler) add this to all other hardware-testing protocols
#       because it is import we internally stay up-to-date with
#       the latest behaviors (even when it's a pain...)
assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]

# FIXME: (sigler) fix bug in API where "dynamic" tracking doesn't track liquid
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

# NOTE: (sigler) disabling formatter here,
#       b/c I like configuring the deck spatially like this
# fmt: off
SLOTS: Dict[str, str] = {
    "trash": "A1",  "tip_dil": "A2",    "tip_50_0": "A3",   "tip_50_4": "A4",
    "dye": "B1",    "tip_50_3": "B2",   "tip_50_1": "B3",   "tip_50_5": "B4",
    "res": "C1",    "empty": "C2",      "tip_50_2": "C3",   "tip_50_6": "C4",
    "done": "D1",   "src": "D2",        "dst": "D3",        "lids": "D4",
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
    M = "MENISCUS"
    LLD_M = "LLD-MENISCUS"
    LLD_TIP_M = "LLD-TIP-MENISCUS"
    B = "BOTTOM"
    T = "TOP"

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

    def includes_bottom(self) -> bool:
        """Include bottom."""
        return self._includes("BOTTOM")

    def includes_top(self) -> bool:
        """Include top."""
        return self._includes("TOP")


# NOTE: (sigler) do not edit, 200 is from Artel
MVS_TARGET_UL = 200.0
# NOTE: (sigler) do not edit, 250 is from Opentrons HW internal testing
MVS_MAX_UL = 250.0
# alternates (200,100,200,etc.) every column
DILUENT_UL_BY_COLUMN = [MVS_TARGET_UL, MVS_TARGET_UL / 2] * 6

TEST_MATRIX: Dict[str, Dict[str, _Strategy]] = {
    "A": {"aspirate": _Strategy.LLD_TIP_M, "dispense": _Strategy.M},
    "B": {"aspirate": _Strategy.M, "dispense": _Strategy.M},
    "C": {"aspirate": _Strategy.LLD_M, "dispense": _Strategy.M},
    "D": {"aspirate": _Strategy.B, "dispense": _Strategy.T},
    "E": {"aspirate": _Strategy.LLD_TIP_M, "dispense": _Strategy.M},
    "F": {"aspirate": _Strategy.M, "dispense": _Strategy.M},
    "G": {"aspirate": _Strategy.LLD_M, "dispense": _Strategy.M},
    "H": {"aspirate": _Strategy.B, "dispense": _Strategy.B},
}

DEAD_VOL_PER_LABWARE = {
    "nest_12_reservoir_15ml": 3000,
    "nest_96_wellplate_2ml_deep": 30,
    # TODO: (sigler) reduce this to find actual dead-vol
    "opentrons_96_wellplate_200ul_pcr_full_skirt": 50,
}

DYE_LABWARE = "nest_96_wellplate_2ml_deep"
SRC_LABWARE = "opentrons_96_wellplate_200ul_pcr_full_skirt"
DILUENT_LABWARE = "nest_12_reservoir_15ml"

# FIXME: (sigler) let's add the Artel (aka Corning?) lid ("plate_lid")
#        to shared-data in a separate pull-request, and modify the
#        Corning plate to be stackable with it
DST_LABWARE = "stackable_corning_96_wellplate_360ul_flat"
PLATE_LID_LOAD_NAME = "plate_lid"


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


def _pick_up_tip_for_dye(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    inaccessible_tip_racks: List[Labware],
) -> List[Labware]:
    """Pick up tips, but only after swapping in new tips if needed."""
    try:
        pipette.pick_up_tip()
    except OutOfTipsError:
        _rearrange_tip_racks(ctx, pipette, inaccessible_tip_racks)
        pipette.tip_racks = [tr for tr in inaccessible_tip_racks]
        # NOTE: clearing and returning the list of "inaccessible" tip-racks
        #       to prevent accidentally rearranging twice during run
        inaccessible_tip_racks = []
        pipette.reset_tipracks()
        pipette.pick_up_tip()
        # TODO: (sigler) add tip-overlap calibration here
        #       start with EVERY tip for now, make it configurable later
    return inaccessible_tip_racks


def _rearrange_tip_racks(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    inaccessible_tip_racks: List[Labware],
) -> None:
    """Swap staging-slot racks with empty on-deck racks.

    NOTE: procedure requires 1x empty deck slot
    """
    assert len(pipette.tip_racks) >= len(inaccessible_tip_racks)

    def _rotate_tip_rack_out(
        old_rack: Labware, new_rack: Labware, empty_slot: str
    ) -> None:
        accessible_slot = str(old_rack.parent)  # somewhere pick-up-tip can happen
        inaccessible_slot = str(new_rack.parent)  # staging slot
        ctx.move_labware(old_rack, empty_slot, use_gripper=True)
        ctx.move_labware(new_rack, accessible_slot, use_gripper=True)
        ctx.move_labware(old_rack, inaccessible_slot, use_gripper=True)

    racks_to_remove = pipette.tip_racks[: len(inaccessible_tip_racks)]
    for old, new in zip(racks_to_remove, inaccessible_tip_racks):
        _rotate_tip_rack_out(old, new, empty_slot=SLOTS["empty"])


def _spread_diluent_or_baseline(
    multi: InstrumentContext,
    labware: Labware,
    diluent_wells_in_use: List[Well],
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
            if not multi.has_tip:
                multi.pick_up_tip()
                # NOTE: LLD the current well whenever the tips are new and dry
                multi.require_liquid_presence(diluent_well)
            # NOTE: diluent can continue with the default submerge depth
            multi.aspirate(
                diluent_ul,
                diluent_well.meniscus(
                    target=DEFAULT_TIP_MENISCUS_TARGET, z=DEFAULT_SUBMERGE_MM
                ),
            )
            # NOTE: (sigler) it is safest to use dynamic tracking during dispense
            #       because we can guarantee that we know the volume of the destination well
            disp_loc = col[0].meniscus(
                target=DEFAULT_TIP_MENISCUS_TARGET, z=NON_CONTACT_DISPENSE_MM
            )
            multi.dispense(diluent_ul, disp_loc, push_out=DILUENT_PUSH_OUT)
            min_diluent_in_well = DEAD_VOL_PER_LABWARE[diluent_well.parent.load_name]
            if diluent_well.current_liquid_volume() < min_diluent_in_well:
                diluent_wells_in_use.pop(0)
                diluent_well = diluent_wells_in_use[0]
                # NOTE: drop-tip when we change source well, so that
                #       we can LLD this new well with dry tips
                multi.return_tip()
    return diluent_wells_in_use


def _spread_init_diluent(
    multi: InstrumentContext,
    labware: Labware,
    diluent_wells_in_use: List[Well],
    test_ul: float,
) -> List[Well]:
    """Spread diluent (minus test ul) across the plate, with varied volumes (by column).

    It is assumed that a second final pass will be ran, to bring each well up to the
    target MVS volume.
    """
    return _spread_diluent_or_baseline(
        multi,
        labware,
        diluent_wells_in_use,
        num_cols=12,
        red_dye_ul=test_ul,
        alternate_ul=True,
        is_init=True,
    )


def _spread_final_diluent(
    multi: InstrumentContext, labware: Labware, diluent_wells_in_use: List[Well]
) -> List[Well]:
    """Spread final diluent volumes, leftover from previous call to _spread_init_diluent."""
    return _spread_diluent_or_baseline(
        multi,
        labware,
        diluent_wells_in_use,
        num_cols=12,
        red_dye_ul=0.0,
        alternate_ul=True,
        is_init=False,
    )


def _spread_baseline(
    multi: InstrumentContext, labware: Labware, diluent_wells_in_use: List[Well]
) -> List[Well]:
    """Spread just baseline (200ul each well)."""
    return _spread_diluent_or_baseline(
        multi,
        labware,
        diluent_wells_in_use,
        num_cols=12,
        red_dye_ul=0.0,
        alternate_ul=False,
        is_init=True,
    )


def _load_liquid_diluent(
    ctx: ProtocolContext, diluent_reservoir: Labware, num_plates: int, num_cols: int
) -> List[Well]:
    # DILUENT (or BASELINE)
    total_photo_wells = num_plates * num_cols * 8
    total_diluent_needed = MVS_TARGET_UL * total_photo_wells  # worst case is 200uL
    dead_vol_diluent = DEAD_VOL_PER_LABWARE[diluent_reservoir.load_name]
    diluent_well_capacity = (
        diluent_reservoir["A1"].max_volume - 1000
    ) - dead_vol_diluent
    number_of_wells_needed = int(total_diluent_needed / diluent_well_capacity)
    total_diluent_per_well = (
        total_diluent_needed / number_of_wells_needed
    ) + dead_vol_diluent
    diluent_wells_in_use = diluent_reservoir.wells()[:number_of_wells_needed]
    diluent = ctx.define_liquid("diluent", display_color="#0000FF")
    diluent_reservoir.load_liquid(diluent_wells_in_use, total_diluent_per_well, diluent)
    return diluent_wells_in_use


def _get_dye_for_volume(volume: float) -> _Dye:
    for dye in DYES:
        if dye.min <= volume <= dye.max:
            return dye
    raise ValueError(f"unexpected volume: {volume}")


def _load_liquid_red_dye(
    ctx: ProtocolContext, dye_holder: Labware, volumes: List[float], num_cols: int
) -> None:
    dead_vol_dye = DEAD_VOL_PER_LABWARE[dye_holder.load_name]

    # initialize defined liquid and well location
    for dye in DYES:
        dye.liq = ctx.define_liquid(dye.name, dye.name, dye.c)
        dye.w = dye_holder[dye.src]

    # NOTE: there could be just 1x dye used for all volumes,
    #       or 5x different dyes. Also, volumes could repeat
    for v in volumes:
        dye = _get_dye_for_volume(v)
        dye.ul += v * num_cols * 8
        dye.use += 1

    # load the dye
    for dye in DYES:
        if dye.ul > 0:
            assert dye.w and dye.liq
            dye.w.load_liquid(dye.liq, dye.ul + dead_vol_dye)


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_bool(
        variable_name="just_baseline", display_name="just_baseline", default=False
    )
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
        variable_name="submerge_depth",
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


def _run_trial(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    trial_ul: float,
    src: Well,
    dst: Well,
    submerge_mm: float,
    well_bottom_mm: float,
    inaccessible_tip_racks: List[Labware],
) -> None:
    assert (
        dst.current_liquid_volume() > 0.0
    ), f"(dst={dst.well_name}) must have diluent already added before adding red dye"
    assert src.current_liquid_volume() >= trial_ul, (
        f"(src={src.well_name}) not enough volume in source "
        f"({src.current_liquid_volume()} ul) to aspirate {trial_ul} ul"
    )

    strategy = TEST_MATRIX[dst.well_name[0]]

    # ASPIRATE location
    if strategy["aspirate"].includes_meniscus():
        src_loc = src.meniscus(target=DEFAULT_TIP_MENISCUS_TARGET, z=submerge_mm)
    elif strategy["aspirate"].includes_bottom():
        src_loc = src.bottom(well_bottom_mm)
    else:
        mode_name = str(strategy["aspirate"].name)
        raise ValueError(f"unexpected mode: {mode_name}")

    # DISPENSE location
    if strategy["dispense"].includes_meniscus():
        dst_loc = dst.meniscus(target=DEFAULT_TIP_MENISCUS_TARGET, z=submerge_mm)
    elif strategy["dispense"].includes_bottom():
        dst_loc = dst.bottom(well_bottom_mm)
    elif strategy["dispense"].includes_top():
        dst_loc = dst.top()
    else:
        mode_name = str(strategy["dispense"].name)
        raise ValueError(f"unexpected mode: {mode_name}")

    # CONFIGURE PIPETTE
    push_out = 3.9 if trial_ul >= 5 else 11.7
    pipette.configure_for_volume(trial_ul)
    _pick_up_tip_for_dye(ctx, pipette, inaccessible_tip_racks)

    # LLD (optional)
    if strategy["aspirate"].includes_lld():
        pipette.require_liquid_presence(src)
        # NOTE: (sigler) we've found that "wet" tips (eg: post-LLD) are
        #       far less reliable at aspirating ~1uL of aqueous solution.
        #       Therefore, we should test both dry and "wet" tips under
        #       identical conditions to gain more insight into what is happening.
        if strategy["aspirate"].includes_new_tip():
            pipette.return_tip()
            _pick_up_tip_for_dye(ctx, pipette, inaccessible_tip_racks)

    # RUN
    pipette.aspirate(trial_ul, src_loc)
    pipette.touch_tip(speed=30)
    pipette.dispense(trial_ul, dst_loc, push_out=push_out)
    pipette.return_tip()


def _setup_liquids(
    ctx: ProtocolContext,
    pcr: Optional[Labware],
    dye: Optional[Labware],
    res: Labware,
    stack: List[Labware],
    volumes: List[float],
    num_columns: int,
) -> List[Well]:
    if pcr:
        pcr.load_empty(pcr.wells())
    if dye:
        dye.load_empty(dye.wells())
        _load_liquid_red_dye(ctx, dye, volumes, num_cols=num_columns)
    res.load_empty(res.wells())
    diluent_wells_in_use = _load_liquid_diluent(
        ctx,
        res,
        num_plates=len(volumes),
        num_cols=num_columns,
    )
    for labware in stack:
        if labware.load_name == DST_LABWARE:
            labware.load_empty(labware.wells())
    return diluent_wells_in_use


def _move_to_done_slot(
    ctx: ProtocolContext, lw: Labware, stack_done: List[Labware]
) -> None:
    """Move labware to the done slot, regardless of what is already there."""
    done_dst: Union[str, Labware] = stack_done[-1] if len(stack_done) else SLOTS["done"]
    ctx.move_labware(lw, done_dst, use_gripper=True)
    stack_done.append(lw)


def _load_plate_stack(ctx: ProtocolContext, volumes: List[float]) -> List[Labware]:
    stack: List[Labware] = []
    for i in range(len(volumes)):
        if not len(stack):
            stack.append(ctx.load_labware(PLATE_LID_LOAD_NAME, location=SLOTS["lids"]))
        else:
            stack.append(stack[-1].load_labware(PLATE_LID_LOAD_NAME))
        stack.append(stack[-1].load_labware(DST_LABWARE))
    assert max(volumes) < min(stack[-1]["A1"].max_volume, MVS_MAX_UL)
    return stack


def _load_all_non_stacked_labware(
    ctx: ProtocolContext, volumes: List[float], just_baseline: bool
) -> Tuple[Labware, Optional[Labware], Optional[Labware]]:
    dye_holder: Optional[Labware] = None
    src_labware: Optional[Labware] = None
    if not just_baseline:
        dye_holder = ctx.load_labware(
            load_name=DYE_LABWARE,
            location=SLOTS["dye"],
        )
        src_labware = ctx.load_labware(
            load_name=SRC_LABWARE,
            location=SLOTS["src"],
        )
        assert max(volumes) < min(src_labware["A1"].max_volume, MVS_MAX_UL)
    diluent_reservoir = ctx.load_labware(
        load_name=DILUENT_LABWARE,
        location=SLOTS["res"],
    )
    return diluent_reservoir, dye_holder, src_labware


def _load_pipettes(
    ctx: ProtocolContext, racks: List[Labware], just_baseline: bool
) -> Tuple[InstrumentContext, Optional[InstrumentContext]]:
    diluent_pipette = ctx.load_instrument(
        instrument_name="flex_8channel_1000",
        mount="right",
        tip_racks=[
            ctx.load_labware(
                load_name="opentrons_flex_96_tiprack_200ul",
                location=SLOTS["tip_dil"],
            )
        ],
    )
    pipette: Optional[InstrumentContext] = None
    if not just_baseline:
        pipette = ctx.load_instrument(
            instrument_name=f"flex_1channel_{PIP_VOLUME}",
            mount="left",
            tip_racks=racks,
        )
    return diluent_pipette, pipette


def _load_tip_racks(ctx: ProtocolContext) -> Tuple[List[Labware], List[Labware]]:
    # NOTE: "accessible" racks will be used by the pipette first
    accessible_tip_racks = [
        ctx.load_labware(
            load_name=f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
            location=location,
        )
        for name, location in SLOTS.items()
        if f"tip_{TIP_VOLUME}_" in name and "4" not in location
    ]
    # NOTE: "inaccessible" racks will be swapped in once the pipette
    #       runs out of tips from its currently assigned tip-racks
    inaccessible_tip_racks: List[Labware] = []
    for name, location in SLOTS.items():
        if f"tip_{TIP_VOLUME}_" in name and "4" in location:
            inaccessible_tip_racks.append(
                ctx.load_labware(
                    load_name=f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
                    location=location,
                )
            )
    return accessible_tip_racks, inaccessible_tip_racks


def run(ctx: ProtocolContext) -> None:
    """Run."""
    # RUNTIME PARAMETERS
    params = _gather_parameters(ctx)

    # TIP-RACKS
    ctx.load_trash_bin(SLOTS["trash"])
    accessible_tip_racks, inaccessible_tip_racks = _load_tip_racks(ctx)

    # PIPETTES
    diluent_pipette, pipette = _load_pipettes(
        ctx, accessible_tip_racks, params.just_baseline  # NOTE: accessible tip-racks
    )

    # LABWARE
    diluent_reservoir, dye_holder, src_labware = _load_all_non_stacked_labware(
        ctx, params.volumes, params.just_baseline
    )

    # STACK of EMPTY PLATES
    stack: List[Labware] = _load_plate_stack(ctx, params.volumes)
    stack_done: List[Labware] = []

    # LIQUIDS
    diluent_wells_in_use = _setup_liquids(
        ctx,
        src_labware,
        dye_holder,
        diluent_reservoir,
        stack,
        volumes=params.volumes,
        num_columns=params.columns,
    )

    # JUST BASELINE
    if params.just_baseline:
        _spread_baseline(diluent_pipette, stack[-1], diluent_wells_in_use)
        if diluent_pipette.has_tip:
            diluent_pipette.return_tip()
        return  # done

    # LOOP through EACH PLATE (aka VOLUME)
    assert pipette and src_labware and dye_holder
    pcr_dead_vol = DEAD_VOL_PER_LABWARE[src_labware.load_name]
    for pcr_col_idx, target_ul in enumerate(params.volumes):

        # MOVE PLATE
        plate = stack.pop()
        lid = stack.pop()
        ctx.move_labware(plate, SLOTS["dst"], use_gripper=True)

        # SPREAD DILUENT
        if target_ul < MVS_TARGET_UL:
            diluent_wells_in_use = _spread_init_diluent(
                diluent_pipette, plate, diluent_wells_in_use, test_ul=target_ul
            )

        # MOVE DYE to PCR PLATE
        # FIXME: replace this with pipette.transfer-liquid, so we don't
        #        need to calculate volumes and stuff
        ul_needed_in_pcr_well = pcr_dead_vol + (target_ul * params.columns)
        dye_transfer_vols = [pipette.max_volume] * int(
            ul_needed_in_pcr_well / pipette.max_volume
        )
        dye_transfer_vols += [ul_needed_in_pcr_well % pipette.max_volume]
        dye = _get_dye_for_volume(target_ul)
        assert dye.w
        _pick_up_tip_for_dye(ctx, pipette, inaccessible_tip_racks)
        for ul in dye_transfer_vols:
            push_out = 3.9 if ul >= 5 else 11.7
            for row in "ABCDEFGH":
                # TODO: (sigler) use multi-channel for this step?
                #       since all uL are the same in this column
                pcr_well = src_labware[f"{row}{pcr_col_idx + 1}"]
                pipette.aspirate(ul, dye.w.bottom(params.well_bottom_mm))
                pipette.dispense(
                    volume=ul,
                    location=pcr_well.meniscus(
                        target=DEFAULT_TIP_MENISCUS_TARGET, z=DEFAULT_SUBMERGE_MM
                    ),
                    push_out=push_out,
                )
        pipette.return_tip()

        # RUN TRIALS at THIS VOLUME
        for row in "ABCDEFGH":
            pcr_well = src_labware[f"{row}{pcr_col_idx + 1}"]
            for col_idx in range(params.columns):
                photo_well = plate[f"{row}{col_idx + 1}"]
                _run_trial(
                    ctx,
                    pipette,
                    target_ul,
                    src=pcr_well,
                    dst=photo_well,
                    submerge_mm=params.submerge_depth,
                    well_bottom_mm=params.well_bottom_mm,
                    inaccessible_tip_racks=inaccessible_tip_racks,
                )

        # ADD REMAINING DILUENT
        diluent_wells_in_use = _spread_final_diluent(
            diluent_pipette, plate, diluent_wells_in_use
        )

        # MOVE to DONE STACK
        _move_to_done_slot(ctx, plate, stack_done)
        _move_to_done_slot(ctx, lid, stack_done)

    if diluent_pipette.has_tip:
        diluent_pipette.return_tip()
    if pipette.has_tip:
        pipette.return_tip()
