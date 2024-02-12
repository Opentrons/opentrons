"""Flex IQ: P1000 Multi 200ul."""
from math import pi, ceil
from typing import List, Optional, Dict, Tuple

from opentrons.protocol_api import ProtocolContext, InstrumentContext, Labware

##############################################
#                EDIT - START                #
##############################################

metadata = {"protocolName": "Flex IQ: P1000 Multi 200ul"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

ALLOW_TEST_PIPETTE_TO_TRANSFER_DILUENT = False
RETURN_TIP = False
DILUENT_WELLS = ["A11", "A12"]

TEST_VOLUME = 200
TEST_PUSH_OUT = 15
TEST_PIPETTE = "flex_8channel_1000"
TEST_TIPS = "opentrons_flex_96_tiprack_200uL"
TEST_SOURCES = [
    {
        "source": "A1",
        "destinations": ["A1", "A2", "A3", "A4", "A5", "A6"],
    },
    {
        "source": "A2",
        "destinations": ["A7", "A8", "A9", "A10", "A11", "A12"],
    },
]

##############################################
#                 EDIT - END                 #
##############################################

SUBMERGE_MM = {
    "aspirate": 3.0,
    "dispense": 1.0,
}
RETRACT_MM = 5.0
MIN_MM_FROM_BOTTOM = 1.0

DILUENT_PUSH_OUT = 15

TOUCH_TIP_SPEED = 30
TOUCH_TIP_DEPTH = -1

DELAY_ASPIRATE = 1.0
DELAY_DISPENSE = 0.5

_DYE_MAP: Dict[str, Dict[str, float]] = {
    "Range-HV": {"min": 200.1, "max": 350},
    "Range-A": {"min": 50, "max": 200},
    "Range-B": {"min": 10, "max": 49.99},
    "Range-C": {"min": 2, "max": 9.999},
    "Range-D": {"min": 1, "max": 1.999},
    "Range-E": {"min": 0.1, "max": 0.99},
}


def _get_dye_type(volume: float) -> str:
    for dye in _DYE_MAP.keys():
        if _DYE_MAP[dye]["min"] <= volume <= _DYE_MAP[dye]["max"]:
            return dye
    raise ValueError(f"volume {volume} is outside of the available dye range")


def _get_diluent_volume() -> float:
    return max(200 - TEST_VOLUME, 0)


SRC_LABWARE_BY_CHANNELS = {
    1: "nest_12_reservoir_15ml",
    8: "nest_12_reservoir_15ml",
    96: "nest_1_reservoir_195ml",
}

MIN_VOL_SRC = {
    "nest_96_wellplate_2ml_deep": 500,
    "nest_12_reservoir_15ml": 3000,
    "nest_1_reservoir_195ml": 30000,
}


class _LiquidHeightInFlatBottomWell:
    def __init__(
        self,
        bottom_diameter: float,
        top_diameter: float,
        height: float,
        resolution_mm: float = 0.1,
    ) -> None:
        self._bottom_radius = bottom_diameter / 2
        self._top_radius = top_diameter / 2
        self._height = height
        self._resolution_mm = resolution_mm

    def _volume_of_frustum(self, surface_height: float, surface_radius: float) -> float:
        """Calculate the volume of a frustum given its height and radii."""
        a = pi * self._bottom_radius * surface_radius
        b = pi * surface_radius**2
        c = pi * self._bottom_radius**2
        return (a + b + c) * (surface_height / 3)

    def height_from_volume(self, volume: float) -> float:
        """Given the volume, compute the height of the liquid in the well."""
        _rad_diff = self._top_radius - self._bottom_radius
        low, high = 0.0, self._height
        while high - low > self._resolution_mm:
            mid = (low + high) / 2
            r_mid = self._bottom_radius + (mid / self._height) * _rad_diff
            if self._volume_of_frustum(mid, r_mid) < volume:
                low = mid
            else:
                high = mid
        return (low + high) / 2

    def volume_from_height(self, height: float) -> float:
        """Given the height, compute the volume of the liquid in the well."""
        _rel_height = height / self._height
        _rad_diff = self._top_radius - self._bottom_radius
        surface_radius = self._bottom_radius + _rad_diff * _rel_height
        return self._volume_of_frustum(height, surface_radius)


LIQUID_HEIGHT_LOOKUP: Dict[str, List[Tuple[float, float]]] = {
    "nest_1_reservoir_195ml": [(0, 0), (195000, 25)],
    "nest_12_reservoir_15ml": [
        (0, 0),
        (3000, 6.0),
        (3500, 7.0),
        (4000, 8.0),
        (5500, 10.5),
        (8000, 14.7),
        (10000, 18.0),
        (12600, 22.5),
        (15000, 26.85),  # full depth of well
    ],
    "nest_96_wellplate_2ml_deep": [
        (0, 0),
        (2000, 38),  # FIXME: create real lookup table
    ],
}


def _convert_ul_in_well_to_height_in_well(load_name: str, ul: float) -> float:
    if load_name in LIQUID_HEIGHT_LOOKUP:
        lookup = LIQUID_HEIGHT_LOOKUP[load_name]
        for i in range(len(lookup) - 1):
            low = lookup[i]
            high = lookup[i + 1]
            if low[0] <= ul <= high[0]:
                ul_scale = (ul - low[0]) / (high[0] - low[0])
                return (ul_scale * (high[1] - low[1])) + low[1]
    elif load_name == "corning_96_wellplate_360ul_flat":
        well = _LiquidHeightInFlatBottomWell(
            bottom_diameter=6.35, top_diameter=6.858, height=10.668
        )
        return well.height_from_volume(ul)
    raise ValueError(f"unable to find height of {ul} ul in {load_name}")


def _build_diluent_info() -> Optional[Tuple[float, Dict[str, List[str]]]]:
    diluent_vol = _get_diluent_volume()
    if diluent_vol <= 0:
        return None
    target_cols = set(
        [int(dst[1:]) for test in TEST_SOURCES for dst in test["destinations"]]
    )
    dest = [f"A{col}" for col in sorted(list(target_cols))]
    num_dest_per_src = ceil(len(dest) / len(DILUENT_WELLS))
    src_to_dest = {
        src: dest[i * num_dest_per_src : i * num_dest_per_src + num_dest_per_src]
        for i, src in enumerate(DILUENT_WELLS)
    }
    return diluent_vol, src_to_dest


def _start_volumes_per_trial(
    volume: float, load_name: str, channels: int, trials: int
) -> List[float]:
    ul_per_aspirate = volume * channels
    ul_per_run = ul_per_aspirate * trials
    ul_at_start = ul_per_run + MIN_VOL_SRC[load_name]
    return [ul_at_start - (ul_per_aspirate * i) for i in range(trials)]


def _end_volumes_per_trial(
    volume: float, load_name: str, channels: int, trials: int
) -> List[float]:
    return [
        ul - (volume * channels)
        for ul in _start_volumes_per_trial(volume, load_name, channels, trials)
    ]


def _dye_start_volumes_per_trial(
    load_name: str, channels: int, trials: int
) -> List[float]:
    return _start_volumes_per_trial(TEST_VOLUME, load_name, channels, trials)


def _diluent_start_volumes_per_trial(load_name: str, trials: int) -> List[float]:
    return _start_volumes_per_trial(_get_diluent_volume(), load_name, 8, trials)


def _assign_starting_volumes_dye(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    reservoir: Labware,
) -> None:
    dye = ctx.define_liquid(
        name=_get_dye_type(TEST_VOLUME),
        description=f"Artel MVS Dye: {_get_dye_type(TEST_VOLUME)}",
        display_color="#FF0000",
    )
    for test in TEST_SOURCES:
        src_ul_per_trial = _dye_start_volumes_per_trial(
            reservoir.load_name, pipette.channels, len(test["destinations"])
        )
        first_trial_ul = src_ul_per_trial[0]
        reservoir[str(test["source"])].load_liquid(dye, first_trial_ul)


def _assign_starting_volumes_diluent(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    reservoir: Labware,
) -> None:
    diluent_info = _build_diluent_info()
    if not diluent_info:
        return
    diluent_vol, src_to_dst = diluent_info
    diluent = ctx.define_liquid(
        name="Diluent",
        description="Diluent",
        display_color="#0000FF",
    )
    for source, destinations in src_to_dst.items():
        src_ul_per_trial = _diluent_start_volumes_per_trial(
            reservoir.load_name, len(destinations)
        )
        if not src_ul_per_trial:
            continue
        first_trial_ul = src_ul_per_trial[0]
        reservoir[source].load_liquid(diluent, first_trial_ul)


def _transfer(
    ctx: ProtocolContext,
    volume: float,
    pipette: InstrumentContext,
    tips: Labware,
    reservoir: Labware,
    plate: Labware,
    source: str,
    destinations: List[str],
    same_tip: bool = False,
    push_out: Optional[float] = None,
    touch_tip: bool = False,
    volume_already_in_plate: float = 0,
) -> None:
    end_volumes = _end_volumes_per_trial(
        volume, reservoir.load_name, pipette.channels, len(destinations)
    )
    src_heights = [
        _convert_ul_in_well_to_height_in_well(reservoir.load_name, ul)
        for ul in end_volumes
    ]
    volume_in_plate = volume + volume_already_in_plate
    dst_height = _convert_ul_in_well_to_height_in_well(plate.load_name, volume_in_plate)
    if same_tip and not pipette.has_tip:
        pipette.configure_for_volume(volume)
        pipette.pick_up_tip()
    for dst_name, height_src in zip(destinations, src_heights):
        # calculate pipetting positions
        aspirate_pos = reservoir[source].bottom(
            max(height_src - SUBMERGE_MM["aspirate"], MIN_MM_FROM_BOTTOM)
        )
        dispense_pos = plate[dst_name].bottom(
            max(dst_height - SUBMERGE_MM["dispense"], MIN_MM_FROM_BOTTOM)
        )
        blow_out_pos = plate[dst_name].bottom(
            max(dst_height + RETRACT_MM, MIN_MM_FROM_BOTTOM)
        )
        # transfer
        if not same_tip:
            pipette.configure_for_volume(volume)
            pipette.pick_up_tip(tips.next_tip(pipette.channels))
        if pipette.current_volume > 0:
            pipette.dispense(pipette.current_volume, reservoir[source].top())
        pipette.aspirate(volume, aspirate_pos)
        ctx.delay(seconds=DELAY_ASPIRATE)
        pipette.dispense(volume, dispense_pos, push_out=push_out)
        ctx.delay(seconds=DELAY_DISPENSE)
        pipette.blow_out(blow_out_pos)
        if touch_tip:
            pipette.touch_tip(speed=TOUCH_TIP_SPEED, v_offset=TOUCH_TIP_DEPTH)
        pipette.aspirate(1, blow_out_pos)  # trailing air-gap to avoid droplets
        if not same_tip:
            if RETURN_TIP:
                pipette.return_tip()
            else:
                pipette.drop_tip()


def _transfer_diluent(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tips: Labware,
    reservoir: Labware,
    plate: Labware,
) -> None:
    diluent_info = _build_diluent_info()
    if not diluent_info:
        return
    diluent_vol, dest_per_src = diluent_info
    pipette.configure_for_volume(diluent_vol)
    pipette.pick_up_tip(tips.next_tip(pipette.channels))
    for src, destinations in dest_per_src.items():
        _transfer(
            ctx,
            diluent_vol,
            pipette,
            tips,
            reservoir,
            plate,
            src,  # type: ignore[arg-type]
            destinations,  # type: ignore[arg-type]
            same_tip=True,
            push_out=DILUENT_PUSH_OUT,
            touch_tip=False,
            volume_already_in_plate=0,
        )
    if RETURN_TIP:
        pipette.return_tip()
    else:
        pipette.drop_tip()


def _transfer_dye(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tips: Labware,
    reservoir: Labware,
    plate: Labware,
) -> None:
    for test in TEST_SOURCES:
        _transfer(
            ctx,
            TEST_VOLUME,
            pipette,
            tips,
            reservoir,
            plate,
            test["source"],  # type: ignore[arg-type]
            test["destinations"],  # type: ignore[arg-type]
            push_out=TEST_PUSH_OUT,
            touch_tip=True,
            volume_already_in_plate=_get_diluent_volume(),
        )


def run(ctx: ProtocolContext) -> None:
    """Run."""
    # the target plate, handle with great care
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D2")

    # dye tips, pipette, and reservoir
    dye_tips = ctx.load_labware(TEST_TIPS, "B2")
    dye_pipette = ctx.load_instrument(TEST_PIPETTE, "left")
    dye_reservoir = ctx.load_labware(
        SRC_LABWARE_BY_CHANNELS[dye_pipette.channels], "C2"
    )
    _assign_starting_volumes_dye(ctx, dye_pipette, dye_reservoir)

    # diluent tips, pipette, and reservoir
    if _get_diluent_volume():
        diluent_tips = ctx.load_labware("opentrons_flex_96_tiprack_200uL", "B3")
        if "8channel_1000" in TEST_PIPETTE and ALLOW_TEST_PIPETTE_TO_TRANSFER_DILUENT:
            diluent_pipette = dye_pipette  # share the 8ch pipette
        else:
            diluent_pipette = ctx.load_instrument("flex_8channel_1000", "right")
        diluent_labware = SRC_LABWARE_BY_CHANNELS[diluent_pipette.channels]
        if dye_reservoir.load_name == diluent_labware:
            reservoir_diluent = dye_reservoir  # share the 12-row reservoir
        else:
            reservoir_diluent = ctx.load_labware(
                SRC_LABWARE_BY_CHANNELS[diluent_pipette.channels], "C3"
            )
        _assign_starting_volumes_diluent(ctx, dye_pipette, reservoir_diluent)

        # transfer diluent
        _transfer_diluent(ctx, diluent_pipette, diluent_tips, reservoir_diluent, plate)

    # transfer dye
    _transfer_dye(ctx, dye_pipette, dye_tips, dye_reservoir, plate)
