from dataclasses import dataclass
from enum import Enum
from os import listdir
from typing import List, Dict, Optional, Literal

from opentrons.protocol_api import (
    ProtocolContext,
    Well,
    ParameterContext,
    Labware,
    Liquid,
    InstrumentContext,
)
from opentrons.protocol_api.labware import OutOfTipsError
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons_shared_data.load import get_shared_data_root


metadata = {"protocolName": "LLD ABR 1uL Dynamic-Tracking De-Static Bar"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

# TODO: (sigler) add this to all other protocols
assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]

# FIXME: (sigler) fix bug in API where "dynamic" tracking doesn't track liquid
DEFAULT_TIP_MENISCUS_TARGET: Literal["start", "end", "dynamic"] = "end"

TIP_VOLUME = 50
PIP_VOLUME = 50

MAX_NUMBER_OF_PLATES = 5
DEFAULT_SUBMERGE_MM = -1.5
BOTTOM_MM = 1.5
NON_CONTACT_DISPENSE_MM = 2.0
DEFAULT_TARGET_BY_PLATE = [1.0, 1.2, 1.5, 2.0, 5.0]
DILUENT_PUSH_OUT = 20.0

SLOTS = {
    "trash": "A1",
    "tips_diluent": "A2",
    "tips_50_0": "A3",
    "tips_50_1": "B3",
    "tips_50_2": "C3",
    "tips_50_3": "B2",  # does NOT get swapped out
    "tips_50_4": "A4",  # inaccessible to pipette
    "tips_50_5": "B4",  # inaccessible to pipette
    "tips_50_6": "C4",  # inaccessible to pipette
    "dye_holder": "B1",
    "empty": "C2",  # used for bot rearranging racks and calibrating tip-overlap
    "diluent_reservoir": "C1",
    "done": "D1",
    "src": "D2",
    "dst": "D3",
    "lids": "D4",  # inaccessible to pipette
}


class Strategy(str, Enum):
    M = "MENISCUS"
    LLD_M = "LLD-MENISCUS"
    LLD_TIP_M = "LLD-TIP-MENISCUS"
    B = "BOTTOM"
    T = "TOP"

    def _includes(self, sub_string: str) -> bool:
        return bool(sub_string in self.value)

    def includes_lld(self) -> bool:
        return self._includes("LLD")

    def includes_meniscus(self) -> bool:
        return self._includes("MENISCUS")

    def includes_new_tip(self) -> bool:
        return self._includes("TIP")

    def includes_bottom(self) -> bool:
        return self._includes("BOTTOM")

    def includes_top(self) -> bool:
        return self._includes("TOP")


DILUENT_UL_BY_COLUMN = [200, 100] * 6  # alternates (200,100,200,etc.) every column
TEST_MATRIX: Dict[str, Dict[str, Strategy]] = {
    "A": {"aspirate": Strategy.LLD_TIP_M, "dispense": Strategy.M},
    "B": {"aspirate": Strategy.M, "dispense": Strategy.M},
    "C": {"aspirate": Strategy.LLD_M, "dispense": Strategy.M},
    "D": {"aspirate": Strategy.B, "dispense": Strategy.T},
    "E": {"aspirate": Strategy.LLD_TIP_M, "dispense": Strategy.M},
    "F": {"aspirate": Strategy.M, "dispense": Strategy.M},
    "G": {"aspirate": Strategy.LLD_M, "dispense": Strategy.M},
    "H": {"aspirate": Strategy.B, "dispense": Strategy.B},
}

DEAD_VOL_PER_LABWARE = {
    "nest_12_reservoir_15ml": 3000,
    "nest_96_wellplate_2ml_deep": 30,
    "opentrons_96_wellplate_200ul_pcr_full_skirt": 50,  # TODO: (sigler) reduce this to find actual dead-vol
}

DYE_LABWARE = "nest_96_wellplate_2ml_deep"
SRC_LABWARE = "opentrons_96_wellplate_200ul_pcr_full_skirt"
DST_LABWARE = "stackable_corning_96_wellplate_360ul_flat"
DILUENT_LABWARE = "nest_12_reservoir_15ml"

# NOTE: (sigler) keep this as a custom labware
#       until we have a suitable 
PLATE_LID_LOAD_NAME = "plate_lid"


@dataclass
class Dye:
    name: str
    min: float
    max: float
    ul: float
    use: int
    c: str
    src: str
    liq: Optional[Liquid]
    w: Optional[Well]


DYE_INFO: List[Dye] = [
    Dye("HV", 200.1, 250.0, 0.0, 0, "#FF9999", "A6", None, None),
    Dye("A", 50.0, 200.0, 0.0, 0, "#FF6666", "A5", None, None),
    Dye("B", 10.0, 49.99, 0.0, 0, "#FF3333", "A4", None, None),
    Dye("C", 2.0, 9.99, 0.0, 0, "#FF0000", "A3", None, None),
    Dye("D", 1.0, 1.99, 0.0, 0, "#CC0000", "A2", None, None),
    Dye("E", 0.1, 0.99, 0.0, 0, "#880000", "A1", None, None),
]

# global variables
_diluent_wells_used: List[Well] = []
_inaccessible_tip_racks: List[Labware] = []


def _get_latest_version(load_name: str) -> int:
    labware_def_location = (
        f"{get_shared_data_root()}/labware/definitions/2/{load_name}/"
    )
    labware_def_latest = sorted(listdir(labware_def_location))[-1]
    return int(labware_def_latest[0])


def _pick_up_tip(ctx: ProtocolContext, pipette: InstrumentContext) -> None:
    global _inaccessible_tip_racks
    try:
        pipette.pick_up_tip()
    except OutOfTipsError:
        _rearrange_tip_racks(ctx, pipette)
        pipette.tip_racks = [tr for tr in _inaccessible_tip_racks]
        # NOTE: clearing the global list of "inaccessible" tip-racks
        #       to prevent accidentally rearranging twice during run
        _inaccessible_tip_racks = []
        pipette.reset_tipracks()
        pipette.pick_up_tip()
    # TODO: (sigler) add tip-overlap calibration here
    #       start with every time for now


def _rearrange_tip_racks(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
) -> None:
    assert len(pipette.tip_racks) >= len(_inaccessible_tip_racks)

    def _rotate_tip_rack_out(
        old_rack: Labware, new_rack: Labware, empty_slot: str
    ) -> None:
        accessible_slot = str(old_rack.parent)  # somewhere pick-up-tip can happen
        inaccessible_slot = str(new_rack.parent)  # staging slot
        ctx.move_labware(old_rack, empty_slot, use_gripper=True)
        ctx.move_labware(new_rack, accessible_slot, use_gripper=True)
        ctx.move_labware(old_rack, inaccessible_slot, use_gripper=True)

    racks_to_remove = pipette.tip_racks[: len(_inaccessible_tip_racks)]
    for old, new in zip(racks_to_remove, _inaccessible_tip_racks):
        _rotate_tip_rack_out(old, new, empty_slot=SLOTS["empty"])


def _spread_diluent_or_baseline(
    multi: InstrumentContext,
    labware: Labware,
    num_cols: int,
    red_dye_ul: float,
    alternate_ul: bool,
    is_init: bool,
) -> None:
    if not multi.has_tip:
        multi.pick_up_tip()
    assert len(_diluent_wells_used) > 0
    diluent_well = _diluent_wells_used[0]
    for i, col in enumerate(labware.columns()[:num_cols]):
        if is_init:
            if alternate_ul:
                diluent_ul = DILUENT_UL_BY_COLUMN[i] - red_dye_ul
            else:
                diluent_ul = 200 - red_dye_ul  # baseline
        else:
            diluent_ul = 200.0 - col[0].current_liquid_volume()
        if diluent_ul > 0.0:
            multi.aspirate(diluent_ul, diluent_well.bottom(BOTTOM_MM))
            # NOTE: (sigler) it is safest to use dynamic tracking during dispense
            #       because we can guarantee that we know the volume of the destination well
            disp_loc = col[0].meniscus(
                target=DEFAULT_TIP_MENISCUS_TARGET, z=NON_CONTACT_DISPENSE_MM
            )
            multi.dispense(diluent_ul, disp_loc, push_out=DILUENT_PUSH_OUT)
            min_diluent_in_well = DEAD_VOL_PER_LABWARE[diluent_well.parent.load_name]
            if diluent_well.current_liquid_volume() < min_diluent_in_well:
                _diluent_wells_used.pop(0)
                diluent_well = _diluent_wells_used[0]


def _spread_init_diluent(multi: InstrumentContext, labware: Labware) -> None:
    _spread_diluent_or_baseline(
        multi, labware, num_cols=12, red_dye_ul=0.0, alternate_ul=True, is_init=True
    )


def _spread_final_diluent(multi: InstrumentContext, labware: Labware) -> None:
    _spread_diluent_or_baseline(
        multi, labware, num_cols=12, red_dye_ul=0.0, alternate_ul=True, is_init=False
    )


def _spread_baseline(multi: InstrumentContext, labware: Labware) -> None:
    _spread_diluent_or_baseline(
        multi, labware, num_cols=12, red_dye_ul=0.0, alternate_ul=False, is_init=True
    )


def _load_liquid_diluent(
    ctx: ProtocolContext, diluent_reservoir: Labware, num_plates: int, num_cols: int
) -> None:
    global _diluent_wells_used
    # DILUENT (or BASELINE)
    total_photo_wells = num_plates * num_cols * 8
    total_diluent_needed = 200 * total_photo_wells  # worst case is 200uL
    dead_vol_diluent = DEAD_VOL_PER_LABWARE[diluent_reservoir.load_name]
    diluent_well_capacity = (
        diluent_reservoir["A1"].max_volume - 1000
    ) - dead_vol_diluent
    number_of_wells_needed = int(total_diluent_needed / diluent_well_capacity)
    total_diluent_per_well = (
        total_diluent_needed / number_of_wells_needed
    ) + dead_vol_diluent
    assert len(_diluent_wells_used) == 0
    _diluent_wells_used = diluent_reservoir.wells()[:number_of_wells_needed]
    diluent = ctx.define_liquid("diluent", display_color="#0000FF")
    diluent_reservoir.load_liquid(_diluent_wells_used, total_diluent_per_well, diluent)


def _get_dye_for_volume(volume: float) -> Dye:
    for dye in DYE_INFO:
        if dye.min <= volume <= dye.max:
            return dye
    raise ValueError(f"unexpected volume: {volume}")


def _load_liquid_red_dye(
    ctx: ProtocolContext, dye_holder: Labware, volumes: List[float], num_cols: int
) -> None:
    dead_vol_dye = DEAD_VOL_PER_LABWARE[dye_holder.load_name]

    # initialize defined liquid and well location
    for dye in DYE_INFO:
        dye.liq = ctx.define_liquid(dye.name, dye.name, dye.c)
        dye.w = dye_holder[dye.src]

    # NOTE: there could be just 1x dye used for all volumes,
    #       or 5x different dyes. Also, volumes could repeat
    for v in volumes:
        dye = _get_dye_for_volume(v)
        dye.ul += v * num_cols * 8
        dye.use += 1

    # load the dye
    for dye in DYE_INFO:
        if dye.ul > 0:
            dye.w.load_liquid(dye.liq, dye.ul + dead_vol_dye)


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    for i in range(MAX_NUMBER_OF_PLATES):
        parameters.add_float(
            variable_name=f"volume_{i}",
            display_name=f"volume_{i}",
            default=DEFAULT_TARGET_BY_PLATE[i],
            minimum=0.0,
            maximum=50.0,
        )
    parameters.add_int(
        variable_name="columns_to_test",
        display_name="columns_to_test",
        minimum=1,
        maximum=12,
        default=12,  # default to a full plate
    )
    parameters.add_bool(
        variable_name="is_baseline", display_name="is_baseline", default=False
    )
    for dye in DYE_INFO:
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


def _run_trial(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    trial_ul: float,
    src: Well,
    dst: Well,
    submerge_mm: float,
) -> None:
    assert (
        dst.current_liquid_volume() > 0.0
    ), f"(dst={dst.well_name}) must have diluent already added before adding red dye"
    assert src.current_liquid_volume() >= trial_ul, (
        f"(src={src.well_name}) not enough volume in source "
        f"({src.current_liquid_volume()} ul) to aspirate {trial_ul} ul"
    )

    strategy = TEST_MATRIX[dst.well_name[0]]

    # ASPIRATE + DISPENSE locations
    if strategy["aspirate"].includes_meniscus():
        src_loc = src.meniscus(target=DEFAULT_TIP_MENISCUS_TARGET, z=submerge_mm)
    elif strategy["aspirate"].includes_bottom():
        src_loc = src.bottom(BOTTOM_MM)
    else:
        mode_name = str(strategy["aspirate"].name)
        raise ValueError(f"unexpected mode: {mode_name}")
    if strategy["dispense"].includes_meniscus():
        dst_loc = dst.meniscus(target=DEFAULT_TIP_MENISCUS_TARGET, z=submerge_mm)
    elif strategy["dispense"].includes_bottom():
        dst_loc = dst.bottom(BOTTOM_MM)
    elif strategy["dispense"].includes_top():
        dst_loc = dst.top()
    else:
        mode_name = str(strategy["dispense"].name)
        raise ValueError(f"unexpected mode: {mode_name}")

    push_out = 3.9 if trial_ul >= 5 else 11.7
    pipette.configure_for_volume(trial_ul)
    _pick_up_tip(ctx, pipette)

    # LLD (optional)
    if strategy["aspirate"].includes_lld():
        pipette.require_liquid_presence(src)
        # NOTE: (sigler) we've found that "wet" tips (eg: post-LLD) are
        #       far less reliable at aspirating ~1uL of aqueous solution.
        #       Therefore, we should test both dry and "wet" tips under
        #       identical conditions to gain more insight into what is happening.
        if strategy["aspirate"].includes_new_tip():
            pipette.return_tip()
            _pick_up_tip(ctx, pipette)

    # RUN
    pipette.aspirate(trial_ul, src_loc)
    pipette.touch_tip(speed=30)
    pipette.dispense(trial_ul, dst_loc, push_out=push_out)
    pipette.return_tip()


def run(ctx: ProtocolContext) -> None:
    # RUNTIME PARAMETERS
    is_baseline = ctx.params.is_baseline  # type: ignore[attr-defined]
    volume_list = [0.0]
    if not is_baseline:
        volume_list = [
            getattr(ctx.params, f"volume_{i}")
            for i in range(MAX_NUMBER_OF_PLATES)
            if getattr(ctx.params, f"volume_{i}") > 0
        ]
    for dye in DYE_INFO:
        dye.src = getattr(ctx.params, f"dye_{dye.name.lower()}_well")
    columns_to_test = ctx.params.columns_to_test  # type: ignore[attr-defined]
    submerge_depth = ctx.params.submerge_depth  # type: ignore[attr-defined]

    # TIP-RACKS
    ctx.load_trash_bin(SLOTS["trash"])
    # NOTE: "accessible" racks will be used by the pipette first
    accessible_tip_racks = [
        ctx.load_labware(
            load_name=f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
            location=location,
        )
        for name, location in SLOTS.items()
        if f"tips_{TIP_VOLUME}_" in name and "4" not in location
    ]
    # NOTE: keeping "inaccessible" tip-racks in a global list
    #       so that they can be swapped in by the pick-up-tip function
    #       at any time.
    for name, location in SLOTS.items():
        if f"tips_{TIP_VOLUME}_" in name and "4" in location:
            _inaccessible_tip_racks.append(
                ctx.load_labware(
                    load_name=f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
                    location=location,
                )
            )

    # PIPETTES
    diluent_pipette = ctx.load_instrument(
        instrument_name="flex_8channel_1000",
        mount="right",
        tip_racks=[
            ctx.load_labware(
                load_name="opentrons_flex_96_tiprack_200ul",
                location=SLOTS["tips_diluent"],
            )
        ],
    )
    pipette: Optional[InstrumentContext] = None
    if not is_baseline:
        pipette = ctx.load_instrument(
            instrument_name=f"flex_1channel_{PIP_VOLUME}",
            mount="left",
            tip_racks=accessible_tip_racks,
        )

    # LABWARE
    dye_holder: Optional[Labware] = None
    src_labware: Optional[Labware] = None
    if not is_baseline:
        dye_holder = ctx.load_labware(
            load_name=DYE_LABWARE,
            location=SLOTS["dye_holder"],
            version=_get_latest_version(DYE_LABWARE),
        )
        src_labware = ctx.load_labware(
            load_name=SRC_LABWARE,
            location=SLOTS["src"],
            version=_get_latest_version(SRC_LABWARE),
        )
    diluent_reservoir = ctx.load_labware(
        load_name=DILUENT_LABWARE,
        location=SLOTS["diluent_reservoir"],
        version=_get_latest_version(DILUENT_LABWARE),
    )

    # STACK of EMPTY PLATES
    stack: List[Labware] = []
    stack_done: List[Labware] = []
    for i in range(len(volume_list)):
        if not len(stack):
            stack.append(ctx.load_labware(PLATE_LID_LOAD_NAME, location=SLOTS["lids"]))
        else:
            stack.append(stack[-1].load_labware(PLATE_LID_LOAD_NAME))
        stack.append(stack[-1].load_labware(DST_LABWARE))

    def _move_to_done_slot(lw: Labware) -> None:
        """Move labware to the done slot, regardless of what is already there."""
        done_dst = stack_done[-1] if len(stack_done) else SLOTS["done"]
        ctx.move_labware(lw, done_dst, use_gripper=True)
        stack_done.append(lw)

    # LIQUIDS
    if not is_baseline:
        src_labware.load_empty(src_labware.wells())
        dye_holder.load_empty(dye_holder.wells())
        _load_liquid_red_dye(
            ctx, dye_holder, volumes=volume_list, num_cols=columns_to_test
        )
    diluent_reservoir.load_empty(diluent_reservoir.wells())
    _load_liquid_diluent(
        ctx,
        diluent_reservoir,
        num_plates=len(volume_list),
        num_cols=columns_to_test,
    )
    for labware in stack:
        if labware.load_name == DST_LABWARE:
            labware.load_empty(labware.wells())

    if is_baseline:
        _spread_baseline(diluent_pipette, stack[-1])
        if diluent_pipette.has_tip:
            diluent_pipette.return_tip()

    # LOOP through EACH PLATE (aka VOLUME)
    pcr_dead_vol = DEAD_VOL_PER_LABWARE[src_labware.load_name]
    for pcr_col_idx, target_ul in enumerate(volume_list):

        # MOVE PLATE
        plate = stack.pop()
        lid = stack.pop()
        ctx.move_labware(plate, SLOTS["dst"], use_gripper=True)

        # DILUENT
        _spread_init_diluent(diluent_pipette, plate)

        # MOVE DYE to PCR COLUMN
        ul_needed_in_pcr_well = pcr_dead_vol + (target_ul * columns_to_test)
        dye_transfer_vols = [pipette.max_volume] * int(
            ul_needed_in_pcr_well / pipette.max_volume
        )
        dye_transfer_vols += [ul_needed_in_pcr_well % pipette.max_volume]
        dye = _get_dye_for_volume(target_ul)
        _pick_up_tip(ctx, pipette)
        for ul in dye_transfer_vols:
            push_out = 3.9 if ul >= 5 else 11.7
            for row in "ABCDEFGH":
                # TODO: (sigler) use multi-channel for this step?
                #       since all uL are the same in this column
                pcr_well = src_labware[f"{row}{pcr_col_idx + 1}"]
                pipette.aspirate(ul, dye.w.bottom(BOTTOM_MM))
                pipette.dispense(
                    volume=ul,
                    location=pcr_well.meniscus(
                        target=DEFAULT_TIP_MENISCUS_TARGET, z=NON_CONTACT_DISPENSE_MM
                    ),
                    push_out=push_out,
                )
        pipette.return_tip()

        # RUN TRIALS
        for row in "ABCDEFGH":
            pcr_well = src_labware[f"{row}{pcr_col_idx + 1}"]
            for col_idx in range(columns_to_test):
                photo_well = plate[f"{row}{col_idx + 1}"]
                _run_trial(
                    ctx,
                    pipette,
                    target_ul,
                    src=pcr_well,
                    dst=photo_well,
                    submerge_mm=submerge_depth,
                )

        # REMAINING 100ul of DILUENT
        _spread_final_diluent(diluent_pipette, plate)

        # MOVE to DONE stack
        _move_to_done_slot(plate)
        _move_to_done_slot(lid)

    if diluent_pipette.has_tip:
        diluent_pipette.return_tip()
